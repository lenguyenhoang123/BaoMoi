import { Sequelize } from 'sequelize';
import { sequelize } from '../config/database';
import { initUserModel } from './user.model';

// Khởi tạo models
const UserModel = initUserModel(sequelize);

// Định nghĩa kiểu cho DB interface
interface DB {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  User: typeof UserModel;
}

// Khởi tạo đối tượng DB
const db: DB = {
  sequelize,
  Sequelize,
  User: UserModel
};

// Khởi tạo các mối quan hệ nếu có
Object.values(db)
  .filter((model: any) => typeof model.associate === 'function')
  .forEach((model: any) => model.associate(db));

export default db;
