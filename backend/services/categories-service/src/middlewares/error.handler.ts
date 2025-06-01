import { Request, Response } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response) => {
  // Log lỗi
  logger.error('Error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Xử lý các loại lỗi đã định nghĩa
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Xử lý lỗi không mong muốn
  const statusCode = 'statusCode' in err ? (err as any).statusCode : 500;
  
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server`,
  });
};
