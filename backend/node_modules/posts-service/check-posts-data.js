const { Pool } = require('pg');
require('dotenv').config();

// Cấu hình kết nối database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'posts_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkPostsData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Đang kiểm tra dữ liệu trong bảng posts...');
    
    // Đếm tổng số bài viết
    const countResult = await client.query('SELECT COUNT(*) as total FROM posts');
    console.log(`📊 Tổng số bài viết: ${countResult.rows[0].total}`);
    
    // Lấy 5 bài viết gần nhất
    const result = await client.query(
      'SELECT id, title, status, created_at, image_url FROM posts ORDER BY created_at DESC LIMIT 5'
    );
    
    if (result.rows.length === 0) {
      console.log('ℹ️ Không tìm thấy bài viết nào trong bảng posts');
      return;
    }
    
    console.log('\n📝 5 bài viết mới nhất:');
    console.log('----------------------------------------');
    
    result.rows.forEach((post, index) => {
      console.log(`#${index + 1} ID: ${post.id}`);
      console.log(`   Tiêu đề: ${post.title}`);
      console.log(`   Trạng thái: ${post.status}`);
      console.log(`   Ngày tạo: ${post.created_at}`);
      console.log(`   Ảnh đại diện: ${post.image_url || 'Không có'}`);
      console.log('----------------------------------------');
    });
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm kiểm tra
checkPostsData();
