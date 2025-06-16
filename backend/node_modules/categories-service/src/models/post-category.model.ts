import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize';

export interface PostCategoryAttributes {
  post_id: string;
  category_id: string;
  created_at?: Date;
}

export class PostCategory extends Model<PostCategoryAttributes> implements PostCategoryAttributes {
  public post_id!: string;
  public category_id!: string;
  public created_at?: Date;
}

PostCategory.init(
  {
    post_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    category_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'post_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
  }
);

export default PostCategory;
