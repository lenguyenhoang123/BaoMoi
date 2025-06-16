import { Pool, PoolConfig, QueryResult, QueryResultRow, QueryResultBase } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';
import { DatabaseError } from 'pg-protocol';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Interface cho cấu hình kết nối database
interface IDatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Cấu hình kết nối database
const dbConfig: IDatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'comments_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Số lượng kết nối tối đa trong pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10), // Thời gian chờ tối đa khi kết nối nhàn rỗi
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10), // Thời gian chờ kết nối
};

// Tạo mới pool kết nối
const pool = new Pool(dbConfig);

/**
 * Kiểm tra kết nối đến database
 */
const testConnection = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as now');
    logger.info(`Kết nối database thành công: ${res.rows[0].now}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    logger.error('Lỗi kết nối database:', { error: errorMessage });
    throw new Error('Không thể kết nối đến database');
  } finally {
    client.release();
  }
};

/**
 * Khởi tạo các bảng trong database
 */
const initDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    // Bắt đầu transaction
    await client.query('BEGIN');

    // Tạo bảng comments nếu chưa tồn tại
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        parent_id INTEGER,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      );
    `);

    // Tạo các index để tối ưu hiệu năng truy vấn
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved)');

    // Commit transaction
    await client.query('COMMIT');
    logger.info('Khởi tạo database thành công');
  } catch (error: unknown) {
    // Rollback nếu có lỗi
    await client.query('ROLLBACK');
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    logger.error('Lỗi khi khởi tạo database:', { error: errorMessage });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Hàm thực thi câu truy vấn SQL với kiểu dữ liệu generic
 * @param text - Câu truy vấn SQL
 * @param params - Các tham số cho câu truy vấn
 * @returns Kết quả truy vấn
 */
const query = async <T extends QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>> => {
  const start = Date.now();

  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    // Log câu query (chỉ trong môi trường development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Executed query', {
        text,
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }

    return res;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    logger.error('Query error', {
      text,
      params,
      error: errorMessage,
    });

    if (error instanceof Error) {
      // Thêm thông tin về lỗi database nếu có
      if ('code' in error && typeof error.code === 'string') {
        (error as any).code = error.code; // Thêm type assertion
      }
      if ('constraint' in error && typeof error.constraint === 'string') {
        (error as any).constraint = error.constraint; // Thêm type assertion
      }
    }

    throw error;
  }
};

// Xử lý sự kiện lỗi từ pool
pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', { error: err.message });
  process.exit(-1);
});

// Xử lý tắt ứng dụng
export const closePool = async (): Promise<void> => {
  logger.info('Closing database connection pool...');
  await pool.end();
  logger.info('Database connection pool closed');
};

export { pool, testConnection, initDatabase, query };
