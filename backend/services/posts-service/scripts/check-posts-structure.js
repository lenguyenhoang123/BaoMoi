const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'posts_db',
  password: process.env.POSTGRES_PASSWORD || '123',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

async function checkTable() {
  try {
    // Lấy danh sách các cột
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position;
    `;
    
    const columns = await pool.query(columnsQuery);
    
    console.log('CẤU TRÚC BẢNG posts');
    console.log('===================');
    
    for (const row of columns.rows) {
      console.log(`${row.column_name.padEnd(20)} | ${row.data_type.padEnd(20)} | ${row.is_nullable} | ${row.column_default || 'NULL'}`);
    }
    
    // Kiểm tra các ràng buộc
    const constraintsQuery = `
      SELECT conname, conkey, confrelid, confkey
      FROM pg_constraint
      WHERE conrelid = 'posts'::regclass;
    `;
    
    const constraints = await pool.query(constraintsQuery);
    
    if (constraints.rows.length > 0) {
      console.log('\nRÀNG BUỘC:');
      console.log('=========');
      console.table(constraints.rows);
    }
    
  } catch (error) {
    console.error('Lỗi khi kiểm tra cấu trúc bảng:', error);
  } finally {
    await pool.end();
  }
}

checkTable();
