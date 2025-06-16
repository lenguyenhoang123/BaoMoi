import { Sequelize } from 'sequelize';
import config from './config.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Log thông tin kết nối
console.log('Đang kết nối đến database với cấu hình:', {
  database: dbConfig.database,
  username: dbConfig.username,
  host: dbConfig.host,
  dialect: dbConfig.dialect
});

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    // Cấu hình pool cho kết nối
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Cấu hình chung cho các model
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,  // Sử dụng soft delete
    },
    // Cấu hình bổ sung
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    // Thời gian chờ kết nối
    retry: {
      max: 3,          // Số lần thử lại tối đa
      timeout: 30000    // Thời gian chờ tối đa cho mỗi lần thử (ms)
    }
  }
);

// Kiểm tra kết nối
async function testConnection() {
  try {
    console.log('Đang thử kết nối đến database...');
    console.log('Thông tin kết nối:', {
      database: dbConfig.database,
      username: dbConfig.username,
      host: dbConfig.host,
      port: 5432 // Mặc định cổng PostgreSQL
    });
    
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');
    
    // Kiểm tra bảng categories có tồn tại không
    const queryResult = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories')",
      { type: 'SELECT' }
    );
    
    // Ép kiểu kết quả về dạng đúng
    const exists = (queryResult[0] as any)?.exists ?? false;
    console.log('Bảng categories tồn tại:', exists);
    
  } catch (error: unknown) {
    console.error('❌ Lỗi kết nối database:');
    
    if (error instanceof Error) {
      console.error('Thông báo lỗi:', error.message);
      
      // Kiểm tra nếu error có thuộc tính 'original'
      if ('original' in error) {
        console.error('Lỗi gốc:', (error as any).original);
      }
      
      // Kiểm tra nếu error có thuộc tính 'parent'
      if ('parent' in error) {
        console.error('Lỗi từ driver:', (error as any).parent);
      }
    } else {
      console.error('Lỗi không xác định:', error);
    }
    
    // Thoát ứng dụng nếu không kết nối được database
    process.exit(1);
  }
}

testConnection();

export { sequelize };
export default sequelize;
