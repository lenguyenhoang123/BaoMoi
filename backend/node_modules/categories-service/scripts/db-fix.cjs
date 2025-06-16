// Simple script to check and fix database schema
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'categories_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkAndFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if categories table exists
    const tableRes = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories')"
    );
    
    if (!tableRes.rows[0].exists) {
      console.error('❌ Error: Categories table does not exist!');
      return;
    }
    
    console.log('✅ Categories table exists');
    
    // Check if is_active column exists
    const columnRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='categories' AND column_name='is_active'
    `);
    
    const hasIsActive = columnRes.rows.length > 0;
    console.log(`📊 is_active column exists: ${hasIsActive ? '✅ Yes' : '❌ No'}`);
    
    // Add is_active column if it doesn't exist
    if (!hasIsActive) {
      console.log('➕ Adding is_active column...');
      await client.query(`
        ALTER TABLE categories 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('✅ Added is_active column successfully');
    }
    
    // Show current schema
    const schemaRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current categories table schema:');
    console.table(schemaRes.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the function
checkAndFix();
