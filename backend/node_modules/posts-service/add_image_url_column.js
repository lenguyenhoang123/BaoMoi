const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function addImageUrlColumn() {
  const client = await pool.connect();
  try {
    console.log('Đang kiểm tra và thêm cột image_url vào bảng posts...');
    
    // Kiểm tra xem cột đã tồn tại chưa
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'image_url';
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length === 0) {
      // Nếu cột chưa tồn tại, thêm mới
      const alterQuery = `
        ALTER TABLE posts 
        ADD COLUMN image_url TEXT;
        
        COMMENT ON COLUMN posts.image_url IS 'URL của ảnh đại diện bài viết';
      `;
      
      await client.query(alterQuery);
      console.log('✅ Đã thêm thành công cột image_url vào bảng posts');
    } else {
      console.log('ℹ️ Cột image_url đã tồn tại trong bảng posts');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi thêm cột image_url:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addImageUrlColumn();
