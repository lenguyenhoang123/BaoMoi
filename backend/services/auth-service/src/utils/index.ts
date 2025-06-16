// Export logger
import logger from './logger';

export { logger };

export * from './error-handler';

export * from './types';

// Re-export các kiểu dữ liệu chung
export * from './types/env';

// Export các kiểu dữ liệu thông dụng
export type { Request, Response, NextFunction } from 'express';

// Export các hàm tiện ích
export const isProduction = process.env.NODE_ENV === 'production';

// Khai báo biến toàn cục
declare global {
  namespace NodeJS {
    interface Global {
      __rootdir__: string;
    }
  }
}

// Khởi tạo biến toàn cục
const __rootdir = process.cwd();
const globalObj = global as unknown as { __rootdir__: string };
globalObj.__rootdir__ = __rootdir;
