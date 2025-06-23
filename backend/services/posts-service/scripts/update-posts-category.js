const { Pool } = require('pg');
require('dotenv').config();

async function updatePostsCategory() {
  const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'posts_db',
    password: process.env.POSTGRES_PASSWORD || '123',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  const client = await pool.connect();
  
  try {
    // Lấy danh sách các danh mục
    const categories = await client.query('SELECT id, name FROM categories');
    
    if (categories.rows.length === 0) {
      console.log('Không tìm thấy danh mục nào. Vui lòng đảm bảo đã có dữ liệu danh mục.');
      return;
    }

    console.log('Danh sách các danh mục:');
    categories.rows.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    // Lấy danh sách bài viết
    const posts = await client.query('SELECT id, title FROM posts WHERE category_id IS NULL');
    
    if (posts.rows.length === 0) {
      console.log('Không có bài viết nào cần cập nhật category_id');
      return;
    }

    console.log('\nĐang cập nhật category_id cho các bài viết...');
    
    // Cập nhật category_id cho từng bài viết
    for (const post of posts.rows) {
      // Chọn ngẫu nhiên một danh mục
      const randomCategory = categories.rows[Math.floor(Math.random() * categories.rows.length)];
      
      await client.query(
        'UPDATE posts SET category_id = $1, updated_at = NOW() WHERE id = $2',
        [randomCategory.id, post.id]
      );
      
      console.log(`Đã cập nhật bài viết "${post.title}" với danh mục "${randomCategory.name}"`);
    }
    
    console.log('\nĐã cập nhật xong tất cả bài viết!');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật bài viết:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updatePostsCategory();
