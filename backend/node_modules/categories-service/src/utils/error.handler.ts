import { Response } from 'express';
import { logger } from './logger.js';

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  code?: number;
  errors?: any[];
  isOperational?: boolean;
}

/**
 * Xử lý lỗi và gửi phản hồi về client
 * @param res - Đối tượng Response từ Express
 * @param error - Lỗi cần xử lý
 */
export const handleError = (res: Response, error: unknown) => {
  // Log lỗi ra console
  logger.error('Error occurred:', error);
  
  // Khởi tạo đối tượng lỗi mặc định
  const err: AppError = error instanceof Error ? error : new Error('An unknown error occurred');
  
  // Xác định status code và thông báo lỗi
  err.statusCode = (error as AppError).statusCode || 500;
  err.status = (error as AppError).status || 'error';
  
  // Nếu là lỗi validation của Sequelize
  if ((error as any).name === 'SequelizeValidationError' || (error as any).name === 'SequelizeUniqueConstraintError') {
    err.statusCode = 400;
    err.message = 'Validation Error';
    err.errors = (error as any).errors?.map((e: any) => ({
      field: e.path,
      message: e.message
    }));
  }
  
  // Nếu là lỗi không tìm thấy tài nguyên
  if ((error as any).code === 'P2025' || (error as any).name === 'NotFoundError') {
    err.statusCode = 404;
    err.message = 'Resource not found';
  }
  
  // Gửi phản hồi lỗi về client
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Tạo lỗi mới với status code tùy chỉnh
 * @param message - Thông báo lỗi
 * @param statusCode - Mã trạng thái HTTP (mặc định: 500)
 * @returns Đối tượng lỗi
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  error.isOperational = true;
  
  // Lưu lại stack trace
  Error.captureStackTrace(error, createError);
  
  return error;
};

/**
 * Middleware xử lý lỗi cho Express
 */
export const globalErrorHandler = (err: AppError, _req: any, res: Response, _next: any) => {
  handleError(res, err);
};
