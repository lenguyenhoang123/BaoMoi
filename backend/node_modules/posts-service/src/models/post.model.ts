import { PoolClient, QueryResult } from 'pg';
import db from '../config/database';
import logger from '../utils/logger';

export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PostType {
  id: string;                    // ID duy nhất của bài viết (UUID)
  title: string;                 // Tiêu đề bài viết
  slug: string;                  // Đường dẫn thân thiện SEO
  content: string;               // Nội dung chính của bài viết
  status: string;                // Trạng thái: 'draft' | 'published' | 'archived'
  category_id?: string | null;    // ID của danh mục (liên kết với Categories Service)
  category?: CategoryType | null; // Thông tin đầy đủ của danh mục (khi join với bảng categories)
  created_at: Date;              // Thời điểm tạo bài viết
  updated_at: Date;              // Thời điểm cập nhật gần nhất
  image_url?: string | null;      // Đường dẫn ảnh đại diện (có thể null)
  tags?: string[];               // Danh sách các tag liên quan

  // Các phương thức
  save?(): Promise<PostType>;     // Lưu bài viết mới
  update?(data: Partial<Omit<PostType, 'id' | 'created_at' | 'updated_at'>>): Promise<PostType>; // Cập nhật thông tin bài viết
  delete?(): Promise<boolean>;    // Xóa bài viết
  getCategory?(): Promise<CategoryType | null>; // Lấy thông tin chi tiết của danh mục
}

export interface FindAllOptions {
  limit?: number;   // Số lượng bản ghi tối đa trả về
  offset?: number;  // Vị trí bắt đầu lấy dữ liệu (dùng cho phân trang)
  status?: string;  // Lọc theo trạng thái bài viết
}

class Post {
  /**
   * Lấy tất cả bài viết có phân trang
   * @param options - Các tùy chọn phân trang
   * @returns Promise chứa mảng các bài viết
   */
  /**
   * Lấy danh sách bài viết với phân trang và lọc
   * @param options - Các tùy chọn tìm kiếm và phân trang
   * @returns Promise chứa thông tin phân trang và danh sách bài viết
   */
  static async findAll({ 
    limit = 10, 
    offset = 0, 
    status 
  }: FindAllOptions = {}): Promise<{
    posts: PostType[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Đảm bảo limit và offset là số dương
      const safeLimit = Math.max(1, limit);
      const safeOffset = Math.max(0, offset);
      
      // Xây dựng query với parameterized values
      const queryParams: (string | number)[] = [safeLimit, safeOffset];
      const whereClause = status ? 'WHERE status = $3' : '';
      
      if (status) {
        queryParams.push(status);
      }
      
      // Sử dụng COUNT(*) OVER() để lấy tổng số bản ghi trong một lần query
      const query = `
        SELECT 
          id, title, content, created_at, updated_at, 
          slug, status, image_url, tags,
          COUNT(*) OVER() as total_count
        FROM posts 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`;

      const result = await db.query<PostType & { total_count: number }>(query, queryParams);
      
      // Nếu không có kết quả, trả về mảng rỗng với total = 0
      if (result.rows.length === 0) {
        return {
          posts: [],
          total: 0,
          page: Math.floor(safeOffset / safeLimit) + 1,
          totalPages: 0
        };
      }
      
      // Lấy tổng số bản ghi từ kết quả trả về
      const total = parseInt(result.rows[0].total_count.toString());
      const currentPage = Math.floor(safeOffset / safeLimit) + 1;
      const totalPages = Math.ceil(total / safeLimit);
      
      // Loại bỏ trường total_count khỏi kết quả trả về
      const posts = result.rows.map(({ total_count, ...post }) => post);
      
      return {
        posts,
        total,
        page: currentPage,
        totalPages
      };
    } catch (error) {
      logger.error('Error in Post.findAll:', error);
      throw error;
    }
  }

  /**
   * Tìm bài viết theo ID
   * @param id - ID của bài viết
   * @returns Promise chứa thông tin bài viết hoặc null nếu không tìm thấy
   */
  static async findById(id: string): Promise<PostType | null> {
    try {
      const query = 'SELECT * FROM posts WHERE id = $1';
      const result = await db.query<PostType>(query, [id]);
      
      if (!result.rows[0]) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Lỗi khi tìm bài viết theo ID:', error);
      throw error;
    }
  }
  
  /**
   * Lấy thông tin chi tiết của danh mục cho bài viết
   * @returns Promise chứa thông tin danh mục hoặc null nếu không có
   */
  // Phương thức này đã được di chuyển sang CategoryService
  // Để lấy thông tin category, sử dụng CategoryService.getCategoryById(categoryId)

  /**
   * Tạo bài viết mới
   * @param data - Dữ liệu bài viết mới
   * @returns Promise chứa thông tin bài viết đã tạo
   */
  static async create(data: Omit<PostType, 'id' | 'created_at' | 'updated_at'>): Promise<PostType> {
    const { title, slug, content, status, image_url, tags } = data;
    const query = `
      INSERT INTO posts(title, slug, content, status, image_url, tags, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const result = await db.query<PostType>(query, [
      title,
      slug,
      content,
      status || 'draft',
      image_url,
      tags ? `{${tags.join(',')}}` : null
    ]);

    return result.rows[0];
  }

  /**
   * Cập nhật bài viết
   * @param id - ID của bài viết cần cập nhật
   * @param data - Đối tượng chứa các trường cần cập nhật
   * @returns Promise chứa thông tin bài viết đã cập nhật hoặc null nếu không tìm thấy
   */
  static async update(id: string, data: Partial<Omit<PostType, 'id' | 'created_at' | 'updated_at'>>): Promise<PostType | null> {
    try {
      const { title, slug, content, status, image_url, tags } = data;
      const updates: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramIndex = 1;

      if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (slug !== undefined) {
        updates.push(`slug = $${paramIndex++}`);
        values.push(slug);
      }
      if (content !== undefined) {
        updates.push(`content = $${paramIndex++}`);
        values.push(content);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (image_url !== undefined) {
        updates.push(`image_url = $${paramIndex++}`);
        values.push(image_url);
      }
      if (tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(`{${tags.join(',')}}`);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      // Thêm updated_at
      updates.push(`updated_at = NOW()`);
      
      // Thêm id vào cuối mảng values
      values.push(id);
      const whereClause = `WHERE id = $${paramIndex}`;

      const query = `
        UPDATE posts 
        SET ${updates.join(', ')}
        ${whereClause}
        RETURNING *
      `;

      const result = await db.query<PostType>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error in Post.update:', error);
      throw error;
    }
  }

  /**
   * Xóa bài viết
   * @param id - ID của bài viết cần xóa
   * @returns Promise chứa kết quả xóa
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM posts WHERE id = $1';
      const result = await db.query<PostType>(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error in Post.delete:', error);
      throw error;
    }
  }
}

export default Post;
