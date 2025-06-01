require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'tags_db',
  password: '123',  // Sử dụng mật khẩu 123
  port: 5432,
};

console.log('Đang kết nối đến database với cấu hình:', {
  ...dbConfig,
  password: '***' // Ẩn mật khẩu trong log
});

const pool = new Pool(dbConfig);

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Kiểm tra kết nối database...');
    await client.query('SELECT NOW()');
    console.log('✅ Kết nối database thành công');

    // Kiểm tra bảng tags
    console.log('\n🔍 Kiểm tra bảng tags...');
    const tagsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tags'
      );
    `);
    
    if (tagsTable.rows[0].exists) {
      console.log('✅ Bảng tags tồn tại');
      
      // Đếm số lượng tags
      const countResult = await client.query('SELECT COUNT(*) FROM tags');
      console.log(`📊 Số lượng tags: ${countResult.rows[0].count}`);
      
      // Hiển thị 5 tags đầu tiên
      const tags = await client.query('SELECT * FROM tags LIMIT 5');
      console.log('\n📋 Danh sách tags (tối đa 5 bản ghi):');
      console.table(tags.rows);
    } else {
      console.log('❌ Bảng tags không tồn tại');
      console.log('\nℹ️ Chạy file init.sql để tạo bảng và dữ liệu mẫu:');
      console.log('   psql -U postgres -d tags_db -f scripts/init.sql');
    }
    
    // Kiểm tra bảng post_tags
    console.log('\n🔍 Kiểm tra bảng post_tags...');
    const postTagsTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_tags'
      );
    `);
    
    console.log(postTagsTable.rows[0].exists 
      ? '✅ Bảng post_tags tồn tại' 
      : '❌ Bảng post_tags không tồn tại');
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:');
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy kiểm tra
checkDatabase().catch(console.error);
