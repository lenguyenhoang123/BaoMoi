const { Pool } = require('pg');
require('dotenv').config();

async function resetMigrations() {
  const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'posts_db',
    password: process.env.POSTGRES_PASSWORD || '123',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  const client = await pool.connect();
  
  try {
    await client.query('DROP TABLE IF EXISTS knex_migrations');
    await client.query('DROP TABLE IF EXISTS knex_migrations_lock');
    console.log('Đã xóa bảng knex_migrations và knex_migrations_lock');
  } catch (error) {
    console.error('Lỗi khi xóa bảng migrations:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetMigrations();
