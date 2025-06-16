const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Lấy thông tin kết nối từ biến môi trường
const pool = new Pool({
  host: process.env.CATEGORIES_DB_HOST || 'localhost',
  port: process.env.CATEGORIES_DB_PORT || 5432,
  database: process.env.CATEGORIES_DB_NAME || 'categories_db',
  user: process.env.CATEGORIES_DB_USER || 'postgres',
  password: process.env.CATEGORIES_DB_PASSWORD || '123',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Kết nối đến database:', {
      host: process.env.CATEGORIES_DB_HOST || 'localhost',
      port: process.env.CATEGORIES_DB_PORT || 5432,
      database: process.env.CATEGORIES_DB_NAME || 'categories_db',
      user: process.env.CATEGORIES_DB_USER || 'postgres',
      ssl: process.env.NODE_ENV === 'production'
    });
    
    console.log('🔍 Đang kết nối đến database...');
    await client.query('BEGIN');

    console.log('🔄 Đang xóa dữ liệu cũ...');
    
    // Tắt ràng buộc khóa ngoại tạm thời
    await client.query('SET session_replication_role = \'replica\'');
    
    // Xóa các bảng
    await client.query('DROP TABLE IF EXISTS categories CASCADE');
    await client.query('DROP TABLE IF EXISTS "SequelizeMeta" CASCADE');
    
    // Bật lại ràng buộc khóa ngoại
    await client.query('SET session_replication_role = \'origin\'');
    
    // Chạy file init.sql để tạo lại cấu trúc bảng
    console.log('🔄 Đang tạo lại cấu trúc bảng...');
    const initSql = require('fs').readFileSync(
      path.join(__dirname, 'init.sql'), 
      'utf8'
    );
    await client.query(initSql);
    
    await client.query('COMMIT');
    console.log('✅ Đã đặt lại database thành công!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi đặt lại database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm reset
resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  });
