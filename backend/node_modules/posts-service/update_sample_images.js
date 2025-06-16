const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

// Danh sách các ảnh mẫu từ Unsplash
const sampleImages = [
  'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542831371-29b3fdf49113?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80'
];

async function updateSampleImages() {
  const client = await pool.connect();
  try {
    console.log('🔄 Đang cập nhật ảnh mẫu cho các bài viết...');
    
    // Lấy danh sách tất cả bài viết
    const getPostsQuery = 'SELECT id FROM posts ORDER BY created_at';
    const postsResult = await client.query(getPostsQuery);
    
    if (postsResult.rows.length === 0) {
      console.log('Không tìm thấy bài viết nào để cập nhật.');
      return;
    }
    
    console.log(`Tìm thấy ${postsResult.rows.length} bài viết để cập nhật.`);
    
    // Cập nhật ảnh cho từng bài viết
    for (let i = 0; i < postsResult.rows.length; i++) {
      const postId = postsResult.rows[i].id;
      const imageUrl = sampleImages[i % sampleImages.length]; // Lặp lại danh sách ảnh nếu cần
      
      const updateQuery = 'UPDATE posts SET image_url = $1 WHERE id = $2';
      await client.query(updateQuery, [imageUrl, postId]);
      
      if ((i + 1) % 10 === 0 || i === postsResult.rows.length - 1) {
        console.log(`Đã cập nhật ${i + 1}/${postsResult.rows.length} bài viết...`);
      }
    }
    
    console.log('✅ Đã cập nhật ảnh mẫu thành công!');
    
    // Hiển thị kết quả
    const result = await client.query('SELECT id, title, image_url FROM posts LIMIT 3');
    console.log('\nKết quả cập nhật (3 bản ghi đầu tiên):');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật ảnh mẫu:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm cập nhật ảnh mẫu
updateSampleImages();
