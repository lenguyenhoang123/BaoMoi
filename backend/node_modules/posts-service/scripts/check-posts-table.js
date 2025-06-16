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
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(query);
    console.log('Các cột trong bảng posts:');
    console.table(result.rows);
  } catch (error) {
    console.error('Lỗi khi kiểm tra bảng:', error);
  } finally {
    await pool.end();
  }
}

checkTable();
