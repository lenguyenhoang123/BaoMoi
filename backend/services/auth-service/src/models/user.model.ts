import { DataTypes, Model, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { sequelize } from '../config/database';
import { UserAttributes, UserCreationAttributes, UserRole } from './user.types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string; // Sử dụng string cho UUID
  public email!: string;
  public password!: string;
  public full_name!: string;
  public role!: UserRole;
  public is_active!: boolean;
  public email_verified!: boolean;
  public email_verification_token?: string | null;
  public email_verification_expires?: Date | null;
  public last_login?: Date;
  public login_attempts!: number;
  public lock_until!: Date | null;
  public reset_password_token?: string | null;
  public reset_password_expires?: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public deleted_at?: Date | null;

  // Lấy tên bảng
  public static getTableName(): string {
    return 'users';
  }

  // Định nghĩa các scopes
  public static scopes = {
    withPassword: {
      attributes: { include: ['password'] }
    }
  };

  // Không còn cần resetAutoIncrement khi sử dụng UUID

  // Các phương thức helper
  public isLocked(): boolean {
    return !!(this.lock_until && this.lock_until > new Date());
  }

  public incrementLoginAttempts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const loginAttempts = this.login_attempts + 1;
      let lockUntil: Date | null = null;
      
      if (loginAttempts >= 5) { // Sau 5 lần đăng nhập thất bại
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa 15 phút
      }
      
      this.update({
        login_attempts: loginAttempts,
        lock_until: lockUntil
      })
      .then(() => resolve())
      .catch(err => reject(err));
    });
  }
}

// Định nghĩa schema cho model User
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      allowNull: false,
    },
    // username field has been removed
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/ // Basic phone number validation
      }
    },

    login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lock_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      defaultValue: 'user',
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_expires'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    scopes: {
      // Các scopes có thể được định nghĩa ở đây
      defaultScope: {
        attributes: { include: ['reset_password_token', 'reset_password_expires', 'email_verification_token', 'email_verification_expires'] }
      },
      all: {
        // Tất cả các trường
      }
    }
  }
);

// Hàm khởi tạo model
export function initUserModel(sequelizeInstance: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user',
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      login_attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      lock_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reset_password_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email_verification_expires: {
        type: DataTypes.DATE,
        allowNull: true,
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
      sequelize: sequelizeInstance,
      tableName: 'users',
      timestamps: true,
      underscored: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  return User;
}

// Re-export types for backward compatibility
export { User };
export type { UserAttributes, UserCreationAttributes } from './user.types';
export default User;
