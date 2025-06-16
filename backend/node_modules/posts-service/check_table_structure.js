const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function checkTableStructure() {
  const client = await pool.connect();
  try {
    console.log('🔍 Đang kiểm tra cấu trúc bảng posts...\n');
    
    // Lấy thông tin cột của bảng posts
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        udt_name
      FROM information_schema.columns 
      WHERE table_name = 'posts'
      ORDER BY ordinal_position;
    `;
    
    // Lấy thông tin ràng buộc (constraints)
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'posts';
    `;
    
    // Lấy thông tin chỉ mục (indexes)
    const indexesQuery = `
      SELECT 
        indexname, 
        indexdef
      FROM pg_indexes
      WHERE tablename = 'posts';
    `;
    
    // Thực thi các truy vấn
    const columnsResult = await client.query(columnsQuery);
    const constraintsResult = await client.query(constraintsQuery);
    const indexesResult = await client.query(indexesQuery);
    
    // Hiển thị kết quả
    console.log('📋 CẤU TRÚC BẢNG POSTS');
    console.log('====================\n');
    
    console.log('📌 CÁC CỘT TRONG BẢNG:');
    console.table(columnsResult.rows);
    
    console.log('\n🔒 RÀNG BUỘC (CONSTRAINTS):');
    if (constraintsResult.rows.length > 0) {
      console.table(constraintsResult.rows);
    } else {
      console.log('Không tìm thấy ràng buộc nào.');
    }
    
    console.log('\n🔍 CHỈ MỤC (INDEXES):');
    if (indexesResult.rows.length > 0) {
      indexesResult.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.indexname}`);
        console.log(`   ${row.indexdef}`);
      });
    } else {
      console.log('Không tìm thấy chỉ mục nào.');
    }
    
    // Kiểm tra dữ liệu mẫu
    const sampleDataQuery = 'SELECT * FROM posts LIMIT 3;';
    const sampleDataResult = await client.query(sampleDataQuery);
    
    console.log('\n📊 DỮ LIỆU MẪU (3 bản ghi đầu tiên):');
    if (sampleDataResult.rows.length > 0) {
      console.table(sampleDataResult.rows);
    } else {
      console.log('Không có dữ liệu trong bảng.');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra cấu trúc bảng:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Chạy hàm kiểm tra
checkTableStructure();
