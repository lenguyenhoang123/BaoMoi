import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import config from './config'; // Using CommonJS import

// Đảm bảo đã tải biến môi trường trước khi import config
const AUTH_ENV_PATH = path.join(__dirname, '../../.env');
dotenv.config({ path: AUTH_ENV_PATH });
console.log(`[DATABASE] Đang tải cấu hình database từ: ${AUTH_ENV_PATH}`);

// Log database configuration for debugging
console.log('🔵 [DATABASE] Đang cấu hình kết nối database với thông số:', {
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  username: config.db.username,
  password: config.db.password ? '***' : 'undefined',
  nodeEnv: process.env.NODE_ENV || 'development',
  envFile: AUTH_ENV_PATH
});

// Database configuration
const dbConfig = {
  database: config.db.database,
  username: config.db.username,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres' as const,
  logging: (sql: string, timing?: number) => {
    if (config.db.logging) {
      console.log(`[SQL] ${sql} ${timing ? `- ${timing}ms` : ''}`);
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 5,
    timeout: 30000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  },
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
} as const;

// Initialize Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database as string,
  dbConfig.username as string,
  dbConfig.password as string,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions,
    retry: dbConfig.retry
  }
);

// Function to test the database connection
export async function testConnection() {
  try {
    console.log('🟡 [DATABASE] Testing database connection...');
    await sequelize.authenticate();
    console.log('🟢 [DATABASE] Connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ [DATABASE] Unable to connect to the database:', {
      error: error instanceof Error ? error.message : error,
      code: (error as any).code,
      original: (error as any).original?.message
    });
    throw error;
  }
}

export { sequelize, Sequelize };
