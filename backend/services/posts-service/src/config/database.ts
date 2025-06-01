import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../utils/logger';

// Tải các biến môi trường
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface DatabaseConfig {
  isConnected: boolean;
  init(): Promise<void>;
  initPostgreSQL(): Promise<Pool | null>;
  query<T extends QueryResultRow>(
    text: string, 
    params?: any[], 
    callback?: (err: Error, result: QueryResult<T>) => void
  ): Promise<QueryResult<T>>;
  getClient(): Promise<PoolClient>;
  end(): Promise<void>;
}

let pool: Pool | null = null;

const config: DatabaseConfig = {
  isConnected: false,
  
  async init(): Promise<void> {
    await this.initPostgreSQL();
  },
  
  async initPostgreSQL(): Promise<Pool | null> {
    if (pool) {
      return pool;
    }

    const poolConfig = {
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'posts_db',
      password: process.env.POSTGRES_PASSWORD || '123',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

    try {
      logger.info('PostgreSQL Database configuration:', poolConfig);
      
      pool = new Pool(poolConfig);
      
      // Kiểm tra kết nối
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isConnected = true;
      logger.info('Successfully connected to PostgreSQL database');
      return pool;
    } catch (error) {
      logger.error('Error connecting to PostgreSQL:', error);
      throw error;
    }
  },

  async query<T extends QueryResultRow>(
    text: string, 
    params: any[] = [], 
    callback?: (err: Error, result: QueryResult<T>) => void
  ): Promise<QueryResult<T>> {
    try {
      if (!pool) {
        await this.initPostgreSQL();
      }
      
      if (!pool) {
        throw new Error('Database connection not initialized');
      }

      const start = Date.now();
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', { 
        text, 
        duration, 
        rows: res.rowCount 
      });
      
      if (callback) {
        callback(null as unknown as Error, res);
      }
      
      return res;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error executing query:', { 
        query: text, 
        error: errorMessage 
      });
      
      if (callback) {
        const err = error instanceof Error ? error : new Error(errorMessage);
        callback(err, {} as QueryResult<T>);
      }
      
      throw error;
    }
  },

  async getClient(): Promise<PoolClient> {
    if (!pool) {
      await this.initPostgreSQL();
    }
    
    if (!pool) {
      throw new Error('Database connection not initialized');
    }
    
    return await pool.connect();
  },

  async end(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
      this.isConnected = false;
      logger.info('Database connection pool has been closed');
    }
  }
};

// Khởi tạo cơ sở dữ liệu
config.init().catch(error => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
});

export default config;
