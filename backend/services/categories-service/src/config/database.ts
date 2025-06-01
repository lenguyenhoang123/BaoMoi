import { Pool, PoolClient, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// Định nghĩa interface cho cấu hình database
interface DatabaseConfig extends PoolConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
  ssl: boolean | { rejectUnauthorized: boolean };
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  application_name: string;
  log?: (message: string) => void;
}

// Cấu hình kết nối database
const dbConfig: DatabaseConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'categories_db',
  password: process.env.DB_PASSWORD || '123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_POOL || '10'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000'),
  application_name: 'categories-service',
  log: (message: string) => logger.debug(`[POSTGRES] ${message}`)
};

// Tạo một instance mới của pool kết nối
const pool = new Pool(dbConfig);

// Lấy một client từ pool kết nối
const getClient = async (): Promise<PoolClient> => {
  try {
    const client = await pool.connect();
    logger.debug('Successfully connected to database');
    return client;
  } catch (error) {
    const err = error as Error;
    logger.error('❌ Failed to connect to database:', {
      message: err.message,
      stack: err.stack
    });
    throw error;
  }
};

// Kiểm tra kết nối database
const testConnection = async (): Promise<void> => {
  let client: PoolClient | null = null;
  try {
    client = await getClient();
    const res = await client.query('SELECT NOW() as now');
    logger.info('✅ Database connection successful', {
      timestamp: res.rows[0].now,
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      maxConnections: dbConfig.max
    });
  } catch (error) {
    const err = error as Error;
    logger.error('❌ Database connection failed:', {
      message: err.message,
      stack: err.stack,
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user
    });
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Kiểm tra kết nối khi khởi động nếu không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
  testConnection().catch(err => {
    logger.error('Failed to test database connection:', err);
    process.exit(1);
  });
}

// Export pool and utility functions
export {
  pool,
  getClient,
  testConnection
};

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient,
  testConnection,
  pool
};
