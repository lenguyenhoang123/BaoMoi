import { Response } from 'express';

/**
 * Lớp lỗi tùy chỉnh cho các lỗi API
 */
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[] | Record<string, any>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[] | Record<string, any>,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (errors) {
      this.errors = errors;
    }

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Middleware xử lý lỗi
 */
export const errorHandler = (err: any, _req: any, res: Response, _next: any) => {
  // Mặc định là lỗi 500 (Máy chủ nội bộ) nếu không có mã trạng thái
  const statusCode = err.statusCode || 500;
  
  // Ghi log lỗi để debug
  console.error('Error:', {
    message: err.message,
    stack: process.env['NODE_ENV'] === 'development' ? err.stack : {},
    errors: err.errors,
  });

  // Trong môi trường production, không tiết lộ chi tiết lỗi
  const response: any = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  // Bao gồm các lỗi kiểm tra nếu có
  if (err.errors && err.errors.length > 0) {
    response.errors = err.errors;
  }

  // Bao gồm stack trace trong môi trường development
  if (process.env['NODE_ENV'] === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Bắt lỗi 404 và chuyển tiếp tới bộ xử lý lỗi
 */
export const notFoundHandler = (req: any, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
};

/**
 * Xử lý lỗi 404 cho các route API
 */
export const apiNotFoundHandler = (req: any, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
};
