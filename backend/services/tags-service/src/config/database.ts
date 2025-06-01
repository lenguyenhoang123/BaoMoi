import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './logger';

// Tải biến môi trường từ file .env trong thư mục service
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath, override: true });

// Log thông tin cấu hình
console.log('Environment variables:', {
  DB_USER: process.env['DB_USER'],
  DB_HOST: process.env['DB_HOST'],
  DB_NAME: process.env['DB_NAME'],
  DB_PORT: process.env['DB_PORT']
});

const dbConfig: PoolConfig = {
  user: process.env['DB_USER'] || 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  database: process.env['DB_NAME'] || 'tags_db',
  password: process.env['DB_PASSWORD'] || '123',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Số lượng client tối đa trong pool
  idleTimeoutMillis: 30000, // Thời gian tối đa một client được phép không hoạt động trước khi bị đóng (ms)
  connectionTimeoutMillis: 2000, // Thời gian chờ khi kết nối một client mới (ms)
};

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool(dbConfig);
    this.setupEventListeners();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private setupEventListeners(): void {
    this.pool.on('connect', () => {
      logger.info('Kết nối đến cơ sở dữ liệu thành công');
    });

    this.pool.on('error', (err: Error) => {
      logger.error('Lỗi không mong muốn trên client không hoạt động', err);
      process.exit(-1);
    });
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Thực thi câu truy vấn', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Lỗi thực thi câu truy vấn', { error, text });
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool has been closed');
  }

  public getPool(): Pool {
    return this.pool;
  }
}

export const db = Database.getInstance();
