// Simple script to run the migration
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'baomoi',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if tags column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'tags';
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length === 0) {
      // Add the tags column
      await client.query(`
        ALTER TABLE posts 
        ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[]
      `);
      console.log('✅ Added tags column to posts table');
    } else {
      console.log('ℹ️ Tags column already exists in posts table');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
