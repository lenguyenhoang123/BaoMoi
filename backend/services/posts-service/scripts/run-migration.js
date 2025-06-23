const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Cấu hình kết nối database
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Đang tạo bảng post_tags...');
    
    await client.query('BEGIN');
    
    // Kiểm tra xem bảng đã tồn tại chưa
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'post_tags'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('ℹ️ Bảng post_tags đã tồn tại, bỏ qua...');
      await client.query('ROLLBACK');
      return;
    }
    
    // Tạo bảng post_tags
    await client.query(`
      CREATE TABLE post_tags (
        post_id INT NOT NULL,
        tag_id INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, tag_id),
        CONSTRAINT fk_post
          FOREIGN KEY (post_id) 
          REFERENCES posts(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_tag
          FOREIGN KEY (tag_id) 
          REFERENCES tags(id)
          ON DELETE CASCADE
      );
    `);
    
    await client.query('COMMIT');
    console.log('✅ Đã tạo bảng post_tags thành công');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi tạo bảng post_tags:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy migration
runMigration()
  .then(() => {
    console.log('✅ Migration hoàn tất');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Lỗi khi chạy migration:', error);
    process.exit(1);
  });
