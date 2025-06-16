import { Model, DataTypes, ModelStatic } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { PostCategory } from './post-category.model';

export interface CategoryAttributes {
  id: string;  // Sử dụng string cho UUID
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;  // Sử dụng string | null cho UUID
  is_active?: boolean; // Made optional to handle missing database column
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

// Định nghĩa các phương thức tùy chỉnh cho instance
interface ICategoryMethods {
  addPost: (postId: string) => Promise<void>;        // Thêm bài viết vào danh mục
  removePost: (postId: string) => Promise<void>;     // Xóa bài viết khỏi danh mục
  hasPost: (postId: string) => Promise<boolean>;     // Kiểm tra bài viết có trong danh mục
  getPosts: (options?: any) => Promise<any[]>;       // Lấy danh sách bài viết
}

// Mở rộng kiểu Model của Sequelize với các phương thức tùy chỉnh
type CategoryModelType = Model<CategoryAttributes> & ICategoryMethods;

// Interface cho instance của Category
export interface ICategoryInstance extends CategoryModelType, CategoryAttributes {
  // Các quan hệ
  parent?: ICategoryInstance;          // Danh mục cha
  children?: ICategoryInstance[];      // Danh sách danh mục con
  posts?: any[];                       // Danh sách bài viết thuộc danh mục
}

// Interface cho Model Category
export interface ICategoryModel extends ModelStatic<ICategoryInstance> {
  associate?: (models: any) => void;   // Phương thức thiết lập quan hệ
  // Thêm các phương thức tĩnh tại đây nếu cần
}

// Định nghĩa model Category
const Category = sequelize.define<ICategoryInstance>(
  'Category',
  {
    id: {
      type: DataTypes.UUID,            // Kiểu dữ liệu UUID
      defaultValue: DataTypes.UUIDV4,   // Tự động tạo UUID mới
      primaryKey: true,                // Khóa chính
    },
    name: {
      type: DataTypes.STRING(100),     // Tên danh mục
      allowNull: false,                // Không được để trống
      unique: true,                    // Duy nhất
    },
    slug: {
      type: DataTypes.STRING(100),     // Đường dẫn thân thiện SEO
      allowNull: false,                // Không được để trống
      unique: true,                    // Duy nhất
    },
    description: {
      type: DataTypes.TEXT,            // Mô tả chi tiết
      allowNull: true,                 // Có thể để trống
    },
    parent_id: {
      type: DataTypes.UUID,            // ID danh mục cha
      allowNull: true,                 // Có thể là danh mục gốc
      references: {
        model: 'categories',           // Tham chiếu đến bảng categories
        key: 'id',                     // Tham chiếu đến cột id
      },
      onUpdate: 'CASCADE',            // Cập nhật tự động
      onDelete: 'SET NULL',            // Xóa tự động
    },
    is_active: {
      type: DataTypes.BOOLEAN,         // Trạng thái hoạt động
      allowNull: false,                // Không được để trống
      defaultValue: true,              // Mặc định là đang hoạt động
    },
    created_at: {
      type: DataTypes.DATE,            // Ngày tạo
      allowNull: false,                // Không được để trống
      defaultValue: DataTypes.NOW,      // Mặc định là thời gian hiện tại
    },
    updated_at: {
      type: DataTypes.DATE,            // Ngày cập nhật
      allowNull: false,                // Không được để trống
      defaultValue: DataTypes.NOW,      // Mặc định là thời gian hiện tại
    },
    // Tạm thời comment lại deleted_at vì không cần cho soft delete
    // deleted_at: {
    //   type: DataTypes.DATE,            // Ngày xóa (soft delete)
    //   allowNull: true,                 // Có thể để trống
    // },
  },
  {
    tableName: 'categories',           // Tên bảng trong CSDL
    underscored: true,                 // Sử dụng dạng snake_case
    paranoid: false,                   // Tắt soft delete tạm thời
    timestamps: true,                  // Tự động thêm timestamps
    createdAt: 'created_at',           // Tên cột ngày tạo
    updatedAt: 'updated_at',           // Tên cột ngày cập nhật
    // deletedAt: 'deleted_at',        // Tạm thời bỏ deletedAt
    // Bỏ defaultScope để không tự động thêm điều kiện is_active
    scopes: {
      active: {                        // Scope để lấy bản ghi đang hoạt động
        where: { is_active: true }
      },
      withInactive: {                   // Scope để lấy cả bản ghi không hoạt động
        where: {}
      },
    },
  }
) as unknown as ICategoryModel;  // Ép kiểu về ICategoryModel

// Thêm phương thức thêm bài viết vào danh mục
const addPost = async function(this: ICategoryInstance, postId: string): Promise<void> {
  await (this as any).addPost(postId);
};

// Thêm phương thức xóa bài viết khỏi danh mục
const removePost = async function(this: ICategoryInstance, postId: string): Promise<void> {
  await (this as any).removePost(postId);
};

// Thêm phương thức kiểm tra bài viết có trong danh mục
const hasPost = async function(this: ICategoryInstance, postId: string): Promise<boolean> {
  const posts = await (this as any).getPosts({
    where: { id: postId },
  });
  return posts.length > 0;
};

// Gán các phương thức vào prototype của Model
Object.assign(Category.prototype, {
  addPost,
  removePost,
  hasPost,
});

// Define associations
// Định nghĩa các quan hệ của model
Category.associate = (models: any) => {
  // Quan hệ một-nhiều: Một danh mục có nhiều bài viết
  Category.belongsToMany(models.Post, {
    through: PostCategory, // Sử dụng bảng trung gian
    foreignKey: 'category_id', // Khóa ngoại trong bảng trung gian
    otherKey: 'post_id', // Khóa ngoại của bảng Post trong bảng trung gian
    as: 'posts', // Tên của mối quan hệ
  });

  // Quan hệ một-nhiều tự thân: Một danh mục có nhiều danh mục con
  Category.hasMany(models.Category, {
    as: 'children',
    foreignKey: 'parent_id',
    sourceKey: 'id',
  });

  // Quan hệ một-một: Mỗi danh mục con thuộc về một danh mục cha
  Category.belongsTo(models.Category, {
    as: 'parent',
    foreignKey: 'parent_id',
    targetKey: 'id',
  });
};

export { Category };
