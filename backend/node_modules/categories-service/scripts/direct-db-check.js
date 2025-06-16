// Sử dụng dotenv để đọc biến môi trường từ file .env
require('dotenv').config({ path: '.env' });

const { Sequelize } = require('sequelize');

// Cấu hình kết nối database từ biến môi trường
const DB_CONFIG = {
  database: process.env.DB_NAME || 'categories_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: console.log
};

console.log('Đang kết nối đến database với cấu hình:', {
  database: DB_CONFIG.database,
  username: DB_CONFIG.username,
  host: DB_CONFIG.host,
  port: DB_CONFIG.port
});

const sequelize = new Sequelize(DB_CONFIG);

async function checkDatabase() {
  try {
    // Kiểm tra kết nối
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');

    // Kiểm tra xem bảng categories có tồn tại không
    const [tableExists] = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories')"
    );
    
    if (!tableExists[0].exists) {
      console.error('❌ Bảng categories không tồn tại trong cơ sở dữ liệu!');
      return;
    }

    console.log('✅ Bảng categories tồn tại');

    // Kiểm tra cấu trúc bảng
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Các cột trong bảng categories:');
    console.table(columns);

    // Kiểm tra xem cột is_active có tồn tại không
    const hasIsActive = columns.some(col => col.column_name === 'is_active');
    console.log('\n🔍 Có cột is_active:', hasIsActive ? '✅ Có' : '❌ Không');

    // Nếu chưa có cột is_active, thêm vào
    if (!hasIsActive) {
      console.log('\n➕ Đang thêm cột is_active vào bảng categories...');
      try {
        await sequelize.query(`
          ALTER TABLE categories 
          ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
        `);
        console.log('✅ Đã thêm cột is_active thành công!');
      } catch (error) {
        console.error('❌ Lỗi khi thêm cột is_active:', error);
      }
    }

    // Đếm số lượng bản ghi
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM categories');
    console.log('\n📊 Số lượng danh mục:', count[0].count);

    // Hiển thị 5 bản ghi đầu tiên
    const [categories] = await sequelize.query('SELECT * FROM categories LIMIT 5');
    console.log('\n📝 5 danh mục đầu tiên:');
    console.table(categories);

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:', error);
  } finally {
    // Đóng kết nối
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Đã đóng kết nối database.');
    }
  }
}

// Chạy hàm kiểm tra
checkDatabase();
