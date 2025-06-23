const { Client } = require('pg');
require('dotenv').config();

async function cleanMigrations() {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '123',
    database: process.env.POSTGRES_DB || 'posts_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Drop the migrations table
    await client.query('DROP TABLE IF EXISTS knex_migrations CASCADE');
    await client.query('DROP TABLE IF EXISTS knex_migrations_lock CASCADE');
    
    console.log('Successfully cleaned up migrations');
  } catch (error) {
    console.error('Error cleaning migrations:', error);
  } finally {
    await client.end();
  }
}

cleanMigrations();
