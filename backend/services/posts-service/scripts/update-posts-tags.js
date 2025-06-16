const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

// Cập nhật tất cả bài viết để đổi cấu trúc tags
async function updatePostsTags() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Lấy tất cả bài viết
    const result = await client.query('SELECT id, tags FROM posts');
    
    console.log(`Tìm thấy ${result.rows.length} bài viết để cập nhật`);
    
    // Cập nhật từng bài viết
    for (const row of result.rows) {
      // Chuyển đổi cấu trúc tags từ [{id, name}] sang [name]
      const oldTags = row.tags || [];
      const newTags = oldTags.map(tag => typeof tag === 'object' ? tag.name : tag);
      
      // Cập nhật lại bài viết
      await client.query(
        'UPDATE posts SET tags = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(newTags), row.id]
      );
      
      console.log(`✅ Đã cập nhật bài viết ${row.id}`);
    }
    
    await client.query('COMMIT');
    console.log('\n🎉 Đã cập nhật tất cả tags thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Lỗi khi cập nhật tags:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm cập nhật
console.log('🔄 Đang cập nhật cấu trúc tags...\n');
updatePostsTags();
