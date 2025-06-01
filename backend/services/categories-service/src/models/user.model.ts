import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'user';
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'email_verified' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public full_name!: string;
  public role!: 'admin' | 'user';
  public is_active!: boolean;
  public email_verified!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

// Tạo các mối quan hệ nếu cần
// Ví dụ: User.hasMany(Post, { foreignKey: 'user_id' });

export default User;
