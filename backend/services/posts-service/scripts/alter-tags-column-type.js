const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function alterTagsColumnType() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Tạo cột tạm thời
    console.log('🔄 Đang tạo cột tạm thời...');
    await client.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS tags_temp TEXT;
    `);
    
    // 2. Copy dữ liệu từ cột cũ sang cột mới
    console.log('🔄 Đang chuyển đổi dữ liệu...');
    await client.query(`
      UPDATE posts 
      SET tags_temp = 
        CASE 
          WHEN jsonb_typeof(tags) = 'array' THEN 
            (SELECT string_agg(value->>'name', ', ')
             FROM jsonb_array_elements(tags) as value)
          ELSE tags::TEXT 
        END;
    `);
    
    // 3. Xóa cột cũ
    console.log('🔄 Đang xóa cột cũ...');
    await client.query(`
      ALTER TABLE posts 
      DROP COLUMN tags;
    `);
    
    // 4. Đổi tên cột tạm thành tên cũ
    console.log('🔄 Đang đổi tên cột...');
    await client.query(`
      ALTER TABLE posts 
      RENAME COLUMN tags_temp TO tags;
    `);
    
    await client.query('COMMIT');
    console.log('\n✅ Đã đổi kiểu dữ liệu cột tags thành TEXT thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Lỗi khi đổi kiểu dữ liệu cột tags:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm thay đổi kiểu dữ liệu
console.log('🔄 Đang bắt đầu thay đổi kiểu dữ liệu cột tags...\n');
alterTagsColumnType();
