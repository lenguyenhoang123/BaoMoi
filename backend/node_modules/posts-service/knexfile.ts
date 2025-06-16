require('ts-node/register');
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '123',
      database: process.env.POSTGRES_DB || 'posts_db',
    },
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/seeds',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './src/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './src/seeds',
    },
  },
};
