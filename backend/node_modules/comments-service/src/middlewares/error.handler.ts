import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';
import AppError from '../utils/appError';

/**
 * Middleware xử lý lỗi toàn cục
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Log lỗi
  logger.error(`[ERROR] ${err.stack}`);

  // Xử lý lỗi AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Xử lý lỗi validation
  if (err.name === 'ValidationError') {
    // @ts-ignore
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join('. ');
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: `Validation error: ${message}`,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Xử lý lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      message: 'Invalid token. Please log in again!',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      message: 'Your token has expired! Please log in again.',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Xử lý lỗi database
  if (err.name === 'SequelizeUniqueConstraintError') {
    // @ts-ignore
    const message = `Duplicate field value: ${Object.values(err.fields).join(', ')}`;
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: `Database error: ${message}`,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Xử lý lỗi không xác định
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware xử lý route không tồn tại
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
};
