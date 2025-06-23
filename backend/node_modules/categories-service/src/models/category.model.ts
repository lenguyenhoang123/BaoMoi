import { Model, DataTypes, ModelStatic } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { PostCategory } from './post-category.model';

/**
 * Định nghĩa các thuộc tính của danh mục
 * Sử dụng cho việc khai báo kiểu dữ liệu
 */

export interface CategoryAttributes {
  id: string;                  // Định danh duy nhất của danh mục (UUID)
  name: string;                // Tên hiển thị của danh mục
  slug: string;                // Đường dẫn thân thiện SEO
  description: string | null;  // Mô tả chi tiết về danh mục
  parent_id: string | null;    // ID của danh mục cha (nếu có)
  is_active?: boolean;         // Trạng thái hoạt động của danh mục
  created_at: Date;            // Thời điểm tạo
  updated_at: Date;            // Thời điểm cập nhật gần nhất
  deleted_at?: Date | null;    // Thời điểm xóa mềm (nếu có)
}

/**
 * Định nghĩa các phương thức tùy chỉnh cho instance của Category
 * Các phương thức này sẽ được thêm vào prototype của model
 */
interface ICategoryMethods {
  /** Thêm một bài viết vào danh mục */
  addPost: (postId: string) => Promise<void>;
  /** Xóa một bài viết khỏi danh mục */
  removePost: (postId: string) => Promise<void>;
  /** Kiểm tra xem bài viết có thuộc danh mục không */
  hasPost: (postId: string) => Promise<boolean>;
  /** Lấy danh sách bài viết thuộc danh mục */
  getPosts: (options?: any) => Promise<any[]>;
}

/**
 * Kết hợp kiểu Model của Sequelize với các phương thức tùy chỉnh
 * Tạo ra kiểu dữ liệu đầy đủ cho model Category
 */
type CategoryModelType = Model<CategoryAttributes> & ICategoryMethods;

/**
 * Interface đại diện cho một instance của Category
 * Kế thừa cả thuộc tính và phương thức từ các interface khác
 */
export interface ICategoryInstance extends CategoryModelType, CategoryAttributes {
  /** Danh mục cha (nếu có) */
  parent?: ICategoryInstance;
  /** Danh sách các danh mục con */
  children?: ICategoryInstance[];
  /** Danh sách bài viết thuộc danh mục */
  posts?: any[];
}

/**
 * Interface đại diện cho Model Category
 * Mở rộng từ ModelStatic của Sequelize với các phương thức tĩnh
 */
export interface ICategoryModel extends ModelStatic<ICategoryInstance> {
  /**
   * Phương thức thiết lập các quan hệ với các model khác
   * @param models - Đối tượng chứa tất cả các model đã được định nghĩa
   */
  associate?: (models: any) => void;
  
  // Có thể thêm các phương thức tĩnh khác tại đây khi cần
}

/**
 * Định nghĩa model Category trong cơ sở dữ liệu
 * Sử dụng Sequelize để ánh xạ các trường dữ liệu
 */
const Category = sequelize.define<ICategoryInstance>(
  'Category',
  {
    /**
     * Định danh duy nhất của danh mục
     * Sử dụng kiểu UUID để đảm bảo tính duy nhất toàn cục
     */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    /**
     * Tên hiển thị của danh mục
     * @example "Thời sự", "Thể thao", "Giải trí"
     */
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Tên hiển thị của danh mục (duy nhất)'
    },
    
    /**
     * Đường dẫn thân thiện SEO của danh mục
     * @example "thoi-su", "the-thao", "giai-tri"
     */
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Đường dẫn thân thiện SEO (duy nhất)'
    },
    
    /**
     * Mô tả chi tiết về danh mục
     * Có thể chứa HTML hoặc văn bản thuần
     */
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả chi tiết về danh mục'
    },
    
    /**
     * ID của danh mục cha (nếu có)
     * Sử dụng để xây dựng cây danh mục đa cấp
     */
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID của danh mục cha (nếu có)'
    },
    
    /**
     * Trạng thái hoạt động của danh mục
     * - true: Đang hoạt động
     * - false: Đã vô hiệu hóa
     */
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Trạng thái hoạt động của danh mục'
    },
    
    /**
     * Thời điểm tạo danh mục
     * Được tự động cập nhật khi tạo mới
     */
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Thời điểm tạo danh mục'
    },
    
    /**
     * Thời điểm cập nhật danh mục gần nhất
     * Được tự động cập nhật khi có thay đổi
     */
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Thời điểm cập nhật gần nhất'
    },
    // Tạm thời comment lại deleted_at vì không cần cho soft delete
    // deleted_at: {
    //   type: DataTypes.DATE,            // Ngày xóa (soft delete)
    //   allowNull: true,                 // Có thể để trống
    // },
  },
  {
    /** Tên bảng trong cơ sở dữ liệu */
    tableName: 'categories',
    
    /** Sử dụng dạng snake_case cho tên cột */
    underscored: true,
    
    /** Tạm thời tắt tính năng xóa mềm */
    paranoid: false,
    
    /** Tự động quản lý các trường thời gian */
    timestamps: true,
    
    /** Tên cột lưu thời gian tạo */
    createdAt: 'created_at',
    
    /** Tên cột lưu thời gian cập nhật */
    updatedAt: 'updated_at',
    
    // Có thể bật xóa mềm bằng cách bỏ comment dòng dưới
    // deletedAt: 'deleted_at',
    
    /**
     * Các scope định nghĩa sẵn cho model
     * Giúp tái sử dụng các điều kiện truy vấn thông dụng
     */
    scopes: {
      /** Lấy chỉ các danh mục đang hoạt động */
      active: {
        where: { is_active: true }
      },
      
      /** Lấy tất cả danh mục, bao gồm cả không hoạt động */
      withInactive: {
        where: {}
      },
      
      // Có thể thêm các scope khác khi cần
    },
  }
) as unknown as ICategoryModel;  // Ép kiểu về ICategoryModel

/**
 * Thêm một bài viết vào danh mục hiện tại
 * @param this - Instance của Category
 * @param postId - ID của bài viết cần thêm
 * @throws {Error} Nếu có lỗi khi thêm bài viết
 */
async function addPost(this: ICategoryInstance, postId: string): Promise<void> {
  await (this as any).addPost(postId);
};

/**
 * Xóa một bài viết khỏi danh mục hiện tại
 * @param this - Instance của Category
 * @param postId - ID của bài viết cần xóa
 * @throws {Error} Nếu có lỗi khi xóa bài viết
 */
async function removePost(this: ICategoryInstance, postId: string): Promise<void> {
  await (this as any).removePost(postId);
};

/**
 * Kiểm tra xem một bài viết có thuộc danh mục hiện tại không
 * @param this - Instance của Category
 * @param postId - ID của bài viết cần kiểm tra
 * @returns Promise<boolean> - Trả về true nếu bài viết thuộc danh mục
 * @throws {Error} Nếu có lỗi khi kiểm tra
 */
async function hasPost(this: ICategoryInstance, postId: string): Promise<boolean> {
  const posts = await (this as any).getPosts({
    where: { id: postId },
  });
  return posts.length > 0;
};

/**
 * Gán các phương thức tùy chỉnh vào prototype của Model
 * Giúp tất cả các instance của Category đều có các phương thức này
 */
Object.assign(Category.prototype, {
  addPost,
  removePost,
  hasPost,
});

/**
 * Thiết lập các mối quan hệ giữa các model
 * @param models - Đối tượng chứa tất cả các model đã được định nghĩa
 */
Category.associate = (models: any) => {
  /**
   * Quan hệ nhiều-nhiều với Post thông qua bảng trung gian PostCategory
   * Một danh mục có thể chứa nhiều bài viết
   * Một bài viết có thể thuộc nhiều danh mục
   */
  Category.belongsToMany(models.Post, {
    through: PostCategory,        // Sử dụng bảng trung gian PostCategory
    foreignKey: 'category_id',    // Khóa ngoại trỏ đến Category
    otherKey: 'post_id',         // Khóa ngoại trỏ đến Post
    as: 'posts',                 // Tên quan hệ, sử dụng khi eager loading
    onDelete: 'CASCADE',         // Xóa các bản ghi liên quan khi xóa danh mục
    onUpdate: 'CASCADE'          // Cập nhật các bản ghi liên quan khi cập nhật danh mục
  });

  /**
   * Quan hệ một-nhiều tự thân: Một danh mục có nhiều danh mục con
   * Sử dụng để xây dựng cây danh mục đa cấp
   */
  Category.hasMany(models.Category, {
    as: 'children',             // Tên quan hệ khi lấy danh sách con
    foreignKey: 'parent_id',     // Trường lưu khóa ngoại
    sourceKey: 'id',            // Trường khóa chính của model hiện tại
    onDelete: 'SET NULL',       // Không xóa các danh mục con khi xóa danh mục cha
    onUpdate: 'CASCADE'         // Cập nhật các bản ghi con khi cập nhật danh mục cha
  });

  /**
   * Quan hệ nhiều-một tự thân: Mỗi danh mục con thuộc về một danh mục cha
   * Ngược lại của quan hệ hasMany ở trên
   */
  Category.belongsTo(models.Category, {
    as: 'parent',              // Tên quan hệ khi lấy danh mục cha
    foreignKey: 'parent_id',    // Trường lưu khóa ngoại
    targetKey: 'id',           // Trường khóa chính của model đích
    onDelete: 'SET NULL',      // Không xóa danh mục cha khi xóa danh mục con
    onUpdate: 'CASCADE'        // Cập nhật khóa ngoại khi khóa chính của danh mục cha thay đổi
  });
};

export { Category };
