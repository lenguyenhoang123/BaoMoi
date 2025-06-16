const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

const samplePosts = [
  {
    title: 'Hướng dẫn lập trình Node.js cơ bản',
    slug: 'huong-dan-lap-trinh-nodejs-co-ban',
    content: 'Node.js là một nền tảng chạy JavaScript phía server...',
    status: 'published',
    tags: JSON.stringify([{ id: '1', name: 'Node.js' }, { id: '2', name: 'Lập trình' }])
  },
  {
    title: 'Cách sử dụng Docker cho dự án Node.js',
    slug: 'su-dung-docker-cho-nodejs',
    content: 'Docker giúp đóng gói ứng dụng và các thành phần phụ thuộc...',
    status: 'published',
    tags: JSON.stringify([{ id: '3', name: 'Docker' }, { id: '2', name: 'Lập trình' }]),
  },
  {
    title: 'Giới thiệu về React Hooks',
    slug: 'gioi-thieu-react-hooks',
    content: 'React Hooks giúp sử dụng state và các tính năng khác của React...',
    status: 'published',
    tags: JSON.stringify([{ id: '4', name: 'React' }, { id: '5', name: 'Frontend' }]),
  },
  {
    title: 'Làm việc với PostgreSQL trong Node.js',
    slug: 'lam-viec-voi-postgresql-nodejs',
    content: 'Hướng dẫn chi tiết cách kết nối và làm việc với PostgreSQL...',
    status: 'draft',
    tags: JSON.stringify([{ id: '6', name: 'PostgreSQL' }, { id: '2', name: 'Lập trình' }])
  },
  {
    title: 'Xây dựng RESTful API với Express.js',
    slug: 'xay-dung-restful-api-expressjs',
    content: 'Hướng dẫn từ A đến Z cách xây dựng một RESTful API hoàn chỉnh...',
    status: 'published',
    tags: JSON.stringify([
      { id: '7', name: 'API' }, 
      { id: '8', name: 'Express.js' },
      { id: '2', name: 'Lập trình' }
    ]),
  }
];

async function seedPosts() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Xóa dữ liệu cũ nếu có
    await client.query('TRUNCATE TABLE posts CASCADE');
    
    // Thêm dữ liệu mẫu
    for (const post of samplePosts) {
      const query = `
        INSERT INTO posts (
          id, title, slug, content, status, tags,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, title, slug, status;
      `;
      
      const values = [
        uuidv4(),
        post.title,
        post.slug,
        post.content,
        post.status,
        post.tags
      ];
      
      const result = await client.query(query, values);
      console.log('✅ Đã thêm bài viết:', result.rows[0].title);
    }
    
    await client.query('COMMIT');
    console.log('\n🎉 Đã thêm dữ liệu mẫu thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Lỗi khi thêm dữ liệu mẫu:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm seed
console.log('🔄 Đang thêm dữ liệu mẫu vào bảng posts...\n');
seedPosts();
