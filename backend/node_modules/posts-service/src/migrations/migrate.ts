import * as path from 'path';
import * as fs from 'fs';
import Knex from 'knex';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Knex with configuration
const knex = Knex.knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'baomoi'
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, '.')
  }
});

async function runMigrations() {
  try {
    // Đọc tất cả các file migration từ thư mục hiện tại
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts') && file !== 'migrate.ts')
      .sort();

    console.log('Found migrations:', files);

    // Tạo bảng migrations nếu chưa tồn tại
    await knex.schema.hasTable('knex_migrations').then(async (exists: boolean) => {
      if (!exists) {
        await knex.migrate.latest();
      }
    });

    // Thực thi từng migration
    for (const file of files) {
      console.log(`\nRunning migration: ${file}`);
      const migration = require(`./${file}`);
      await migration.up(knex);
      console.log(`✓ ${file} completed`);
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
