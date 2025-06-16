const { Pool } = require('pg');

// Cấu hình kết nối database - Hãy điền thông tin chính xác
const dbConfig = {
  user: 'postgres',        // Tên người dùng PostgreSQL
  host: 'localhost',     // Địa chỉ máy chủ
  database: 'posts_db',  // Tên database
  password: '123',       // Mật khẩu
  port: 5432,           // Cổng kết nối
};

console.log('Đang kết nối đến database với cấu hình:', {
  ...dbConfig,
  password: '***' // Ẩn mật khẩu khi log
});

const pool = new Pool(dbConfig);

// Kiểm tra kết nối
pool.on('error', (err) => {
  console.error('Lỗi kết nối database:', err.message);
  console.log('Vui lòng kiểm tra lại thông tin kết nối trong file script');
  process.exit(1);
});

async function checkTagsColumn() {
  const client = await pool.connect();
  try {
    // Kiểm tra xem cột tags đã tồn tại chưa
    const checkQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'tags';
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ Cột tags đã tồn tại trong bảng posts:');
      console.log(result.rows[0]);
      
      // Kiểm tra dữ liệu mẫu
      const sampleQuery = 'SELECT id, tags FROM posts LIMIT 5;';
      const sampleResult = await client.query(sampleQuery);
      console.log('\nDữ liệu mẫu (5 bản ghi đầu tiên):');
      console.table(sampleResult.rows);
    } else {
      console.log('❌ Cột tags chưa tồn tại trong bảng posts');
      
      // Tạo cột nếu chưa tồn tại
      console.log('\nĐang thêm cột tags vào bảng posts...');
      const alterQuery = `
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS tags TEXT;
        
        CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts (tags);
      `;
      
      await client.query(alterQuery);
      console.log('✅ Đã thêm cột tags vào bảng posts');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra cột tags:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm kiểm tra
checkTagsColumn();
