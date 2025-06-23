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
    const result = await client.query('SELECT id, title, slug, status, created_at FROM posts ORDER BY created_at DESC');
    console.log('Danh sách bài viết:');
    console.table(result.rows);
    console.log(`Tổng số bài viết: ${result.rows.length}`);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPosts();
