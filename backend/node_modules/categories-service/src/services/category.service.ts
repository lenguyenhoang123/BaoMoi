import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Category, CategoryAttributes } from '../models/category.model';
import { NotFoundError } from '../utils/errors';

/**
 * Tạo chuỗi slug từ một chuỗi bất kỳ
 * @param str - Chuỗi đầu vào cần chuyển đổi
 * @returns Chuỗi slug đã được định dạng
 */
const generateSlug = (str: string): string => {
  if (!str) return '';
  // Chuyển đổi tiếng Việt có dấu sang không dấu
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Chuyển thành chữ thường, xóa ký tự đặc biệt, thay thế khoảng trắng bằng dấu gạch ngang
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[-\s]+$/g, '');
};

/**
 * Định nghĩa cấu trúc dữ liệu đơn giản hóa cho danh mục
 * Sử dụng cho việc trả về dữ liệu từ API
 */
export interface SimpleCategory {
  id: string;                    // ID của danh mục
  name: string;                  // Tên danh mục
  slug: string;                  // Đường dẫn thân thiện SEO
  description: string | null;    // Mô tả
  parent_id: string | null;      // ID danh mục cha (nếu có)
  is_active?: boolean;           // Trạng thái hoạt động
  created_at: Date;              // Ngày tạo
  updated_at: Date;              // Ngày cập nhật
  deleted_at: Date | null;       // Ngày xóa (soft delete)
  parent?: SimpleCategory | null; // Thông tin danh mục cha
  children?: SimpleCategory[];   // Danh sách danh mục con
}

/**
 * Định nghĩa các kiểu dữ liệu tùy chỉnh
 * Sử dụng cho việc kiểm tra kiểu dữ liệu đầu vào
 */
type CategoryCreateInput = Omit<CategoryAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  is_active?: boolean;
};

type CategoryUpdateInput = Partial<CategoryCreateInput>;

/**
 * Lớp ngoại lệ cho lỗi yêu cầu không hợp lệ
 * Kế thừa từ Error mặc định của JavaScript
 */
class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Lớp dịch vụ xử lý các thao tác liên quan đến danh mục
 * Bao gồm: thêm, sửa, xóa, tìm kiếm danh mục
 */
export class CategoryService {
  /**
   * Lấy danh sách tất cả danh mục
   * @param includeInactive - Có bao gồm danh mục không hoạt động không
   * @returns Mảng các danh mục đã được định dạng
   * @throws {Error} Nếu có lỗi khi truy vấn dữ liệu
   */
  static async getAllCategories(includeInactive = false): Promise<SimpleCategory[]> {
    try {
      console.log('Bắt đầu lấy danh sách danh mục, includeInactive:', includeInactive);
      
      // Tạo options cho câu truy vấn
      const options: any = {
        raw: true,
        nest: true,
        attributes: {
          exclude: [] // Bao gồm tất cả các trường
        },
        // Thêm điều kiện để không lấy các bản ghi đã bị xóa mềm
        paranoid: true
      };
      
      // Chỉ áp dụng scope 'active' nếu không bao gồm danh mục không hoạt động
      if (!includeInactive) {
        options.where = {
          ...options.where,
          is_active: true
        };
      }
      
      console.log('Options truy vấn:', JSON.stringify(options, null, 2));
      
      // Thực hiện truy vấn
      const categories = await Category.unscoped().findAll(options) as unknown as (SimpleCategory & { parent_id?: string })[];
      
      console.log(`Đã lấy được ${categories.length} danh mục từ cơ sở dữ liệu`);
      
      // Nếu cần lọc bỏ các danh mục không hoạt động, thực hiện trong bộ nhớ
      // Vì is_active là tùy chọn, chúng ta xem undefined là true để tương thích ngược
      let filteredCategories = categories;
      if (!includeInactive) {
        filteredCategories = categories.filter(category => category.is_active !== false);
      }
      
      // Tạo bản đồ để lưu trữ danh mục theo ID
      const categoryMap = new Map<string, SimpleCategory>();
      const result: SimpleCategory[] = [];

      // Lần lặp đầu tiên: Tạo tất cả các danh mục chưa có danh sách con
      for (const category of filteredCategories) {
        const simpleCategory: SimpleCategory = {
          ...(category as unknown as SimpleCategory),
          children: []  // Khởi tạo mảng rỗng cho danh sách con
        };
        
        // Lưu vào bản đồ để dễ dàng tra cứu sau này
        categoryMap.set(simpleCategory.id, simpleCategory);
        
        // Nếu là danh mục gốc (không có parent_id), thêm vào kết quả
        if (!simpleCategory.parent_id) {
          result.push(simpleCategory);
        }
      }

      // Lần lặp thứ hai: Gán danh mục con vào danh mục cha tương ứng
      for (const category of filteredCategories) {
        const parentId = category.parent_id;
        if (parentId && categoryMap.has(parentId)) {
          const parent = categoryMap.get(parentId)!;
          const child = categoryMap.get(category.id);
          if (child) {
            parent.children = parent.children || [];
            parent.children.push(child);
          }
        }
      }
      return result;
    } catch (error) {
      console.error('Lỗi trong getAllCategories:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một danh mục theo ID
   * @param id - ID của danh mục cần lấy
   * @returns Thông tin chi tiết danh mục
   * @throws {NotFoundError} Nếu không tìm thấy danh mục
   * @throws {Error} Nếu có lỗi khi truy vấn dữ liệu
   */
  // Kiểm tra UUID hợp lệ
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static async getCategoryById(id: string): Promise<SimpleCategory> {
    if (!id || !CategoryService.isValidUUID(id)) {
      console.error(`Lỗi: ID danh mục không hợp lệ: ${id}`);
      throw new BadRequestError('ID danh mục không hợp lệ');
    }
    
    console.log(`Bắt đầu lấy thông tin danh mục có ID: ${id}`);
    
    try {
      // Tạo options cho câu truy vấn
      const options: any = {
        where: { id },
        raw: true,    // Trả về dữ liệu thô
        nest: true,   // Lồng các mối quan hệ
        rejectOnEmpty: false, // Không ném lỗi khi không tìm thấy
        paranoid: true, // Không lấy các bản ghi đã bị xóa mềm
        attributes: {
          exclude: [] // Bao gồm tất cả các trường
        }
      };
      
      console.log('Options truy vấn:', JSON.stringify(options, null, 2));
      
      // Thực hiện truy vấn
      const category = await Category.unscoped().findOne(options) as unknown as (SimpleCategory & { parent_id?: string }) | null;

      if (!category) {
        console.error(`Không tìm thấy danh mục với ID: ${id}`);
        throw new NotFoundError('Không tìm thấy danh mục');
      }
      
      console.log('Đã tìm thấy danh mục:', JSON.stringify(category, null, 2));
      
      // Lấy thông tin danh mục cha nếu có
      let parent: SimpleCategory | undefined;
      if (category.parent_id) {
        const parentCategory = await Category.findByPk(category.parent_id, {
          raw: true,
          nest: true,
          attributes: {
            exclude: ['is_active'] // Loại bỏ trường is_active
          }
        });
        
        if (parentCategory) {
          parent = {
            id: parentCategory.id,
            name: parentCategory.name,
            slug: parentCategory.slug,
            description: parentCategory.description,
            parent_id: parentCategory.parent_id || null,
            created_at: parentCategory.created_at,
            updated_at: parentCategory.updated_at,
            deleted_at: parentCategory.deleted_at || null
          };
        }
      }
      
      // Tạo kết quả trả về
      const result: SimpleCategory = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id || null,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
        deleted_at: category.deleted_at || null,
        parent: parent,
        children: []
      };

      return result;
    } catch (error) {
      console.error('Lỗi trong getCategoryById:', error);
      throw error;
    }
  }

  /**
   * Tạo mới một danh mục
   * @param data - Dữ liệu để tạo danh mục mới
   * @returns Thông tin danh mục đã tạo
   * @throws {BadRequestError} Nếu dữ liệu không hợp lệ
   * @throws {Error} Nếu có lỗi khi tạo danh mục
   */
  static async createCategory(data: CategoryCreateInput): Promise<SimpleCategory> {
    try {
      console.log('Bắt đầu tạo mới danh mục với dữ liệu:', data);
      
      // Kiểm tra các trường bắt buộc
      if (!data.name) {
        throw new BadRequestError('Tên danh mục là bắt buộc');
      }
      
      // Tạo slug tự động từ tên nếu không được cung cấp
      const slug = data.slug || generateSlug(data.name);
      const now = new Date();
      
      // Kiểm tra trùng lặp tên hoặc slug
      const existingCategory = await Category.unscoped().findOne({
        where: {
          [Op.or]: [
            { name: data.name },
            { slug: slug }
          ]
        },
        paranoid: false // Kiểm tra cả các bản ghi đã xóa mềm
      });

      if (existingCategory) {
        if (existingCategory.name === data.name) {
          throw new BadRequestError('Tên danh mục đã tồn tại');
        }
        if (existingCategory.slug === slug) {
          throw new BadRequestError('Đường dẫn (slug) đã tồn tại');
        }
      }

      // Tạo đối tượng category với tất cả các trường bắt buộc
      const categoryData: any = {
        id: uuidv4(),
        name: data.name,
        slug: slug,
        description: data.description ?? null,
        parent_id: data.parent_id ?? null,
        is_active: data.is_active ?? true,
        created_at: now,
        updated_at: now,
        deleted_at: null
      };

      // Tạo mới danh mục
      const newCategory = await Category.create(categoryData);

      // Lấy lại thông tin đầy đủ của danh mục vừa tạo
      const createdCategory = await Category.findByPk(newCategory.id, {
        raw: true,
        nest: true,
        attributes: {
          exclude: []
        }
      });

      if (!createdCategory) {
        throw new Error('Không thể lấy thông tin danh mục vừa tạo');
      }

      console.log('Tạo mới danh mục thành công:', createdCategory);
      return createdCategory as unknown as SimpleCategory;
      
    } catch (error) {
      console.error('Lỗi khi tạo mới danh mục:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin một danh mục
   * @param id - ID của danh mục cần cập nhật
   * @param data - Dữ liệu cập nhật
   * @returns Thông tin danh mục đã cập nhật
   * @throws {NotFoundError} Nếu không tìm thấy danh mục
   * @throws {BadRequestError} Nếu slug mới đã tồn tại
   * @throws {Error} Nếu có lỗi khi cập nhật
   */
  static async updateCategory(
    id: string,
    data: CategoryUpdateInput
  ): Promise<SimpleCategory> {
    try {
      // Kiểm tra danh mục tồn tại
      const category = await Category.findByPk(id);
      if (!category) {
        throw new NotFoundError('Không tìm thấy danh mục');
      }

      // Nếu có thay đổi slug, kiểm tra slug mới có trùng không
      if (data.slug && data.slug !== category.slug) {
        const existing = await Category.findOne({ where: { slug: data.slug } });
        if (existing) {
          throw new BadRequestError('Slug đã tồn tại');
        }
      }

      // Cập nhật thông tin
      await category.update({
        ...data,
        updated_at: new Date()  // Cập nhật thời gian chỉnh sửa
      });

      // Lấy lại thông tin đã cập nhật để trả về
      return this.getCategoryById(id);
    } catch (error) {
      console.error('Lỗi trong updateCategory:', error);
      throw error;
    }
  }

  /**
   * Xóa mềm một danh mục (đánh dấu đã xóa thay vì xóa cứng)
   * @param id - ID của danh mục cần xóa
   * @throws {NotFoundError} Nếu không tìm thấy danh mục
   * @throws {Error} Nếu có lỗi khi xóa
   */
  static async deleteCategory(id: string): Promise<void> {
    // Tìm danh mục theo ID
    const category = await Category.findByPk(id);
    
    // Kiểm tra danh mục tồn tại
    if (!category) {
      throw new NotFoundError('Không tìm thấy danh mục');
    }

    // Thực hiện xóa mềm (soft delete)
    await category.destroy();
  }

  /**
   * Tìm kiếm danh mục theo từ khóa
   * @param query - Từ khóa tìm kiếm (tên, slug hoặc mô tả)
   * @param includeInactive - Có bao gồm danh mục không hoạt động không
   * @returns Mảng các danh mục phù hợp với từ khóa
   * @throws {Error} Nếu có lỗi khi tìm kiếm
   */
  static async searchCategories(
    query: string,
    includeInactive: boolean = false
  ): Promise<SimpleCategory[]> {
    // Điều kiện tìm kiếm
    const where: any = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },           // Tìm theo tên (không phân biệt hoa thường)
        { slug: { [Op.iLike]: `%${query}%` } },           // Tìm theo đường dẫn (slug)
        { description: { [Op.iLike]: `%${query}%` } }     // Tìm theo nội dung mô tả
      ]
    };

    // Nếu không bao gồm danh mục không hoạt động
    if (!includeInactive) {
      where.is_active = true;  // Chỉ lấy danh mục đang hoạt động
    }

    try {
      // Thực hiện tìm kiếm trong database
      const categories = await Category.findAll({
        where,                      // Điều kiện tìm kiếm
        raw: true,                  // Trả về dữ liệu thô
        nest: true,                 // Lồng các mối quan hệ
        attributes: {
          exclude: []                 // Bao gồm tất cả các trường
        }
      });

      // Ép kiểu và trả về kết quả
      return categories as unknown as SimpleCategory[];
    } catch (error) {
      console.error('Lỗi trong searchCategories:', error);
      throw error;
    }
  }
}

export default CategoryService;
