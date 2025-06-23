const { Pool } = require('pg');
require('dotenv').config();

async function checkPosts() {
  const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'posts_db',
    password: process.env.POSTGRES_PASSWORD || '123',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT p.id, p.title, p.slug, p.status, p.created_at, p.category_id, c.name as category_name 
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    console.log('=== DANH SÁCH BÀI VIẾT ===');
    result.rows.forEach((post, index) => {
      console.log(`\nBài ${index + 1}:`);
      console.log(`- Tiêu đề: ${post.title}`);
      console.log(`- Slug: ${post.slug}`);
      console.log(`- Trạng thái: ${post.status}`);
      console.log(`- Danh mục: ${post.category_name || 'Chưa có'} (ID: ${post.category_id || 'null'})`);
      console.log(`- Ngày tạo: ${post.created_at}`);
      console.log(`- ID: ${post.id}`);
    });
    console.log(`\nTổng số bài viết: ${result.rows.length}`);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPosts();
