import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { logger } from './logger.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run SQL migrations to set up the database tables
 * @returns {Promise<void>}
 */
async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Check if categories table exists
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'categories'
        );
      `);

      const tableExists = tableCheckResult.rows[0].exists;
      
      if (!tableExists) {
        // Read and execute the schema SQL file
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSQL);
        logger.info('Database schema created successfully');
      } else {
        logger.info('Database tables already exist, skipping schema creation');
      }
      
      // Run any pending migrations
      const migrationsPath = path.join(__dirname, '../../database/migrations');
      if (fs.existsSync(migrationsPath)) {
        const migrationFiles = fs.readdirSync(migrationsPath)
          .filter(file => file.endsWith('.sql'))
          .sort();
        
        for (const file of migrationFiles) {
          const migrationSQL = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
          await client.query(migrationSQL);
          logger.info(`Applied migration: ${file}`);
        }
      }
      
      logger.info('Database migrations completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  }
}

export default runMigrations;
