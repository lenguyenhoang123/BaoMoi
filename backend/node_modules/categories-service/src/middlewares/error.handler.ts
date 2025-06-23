import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend the Error type to include our custom properties
interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
  code?: string;
  parent?: {
    code?: string;
    detail?: string;
    hint?: string;
  };
}

/**
 * Format error response consistently
 */
const formatErrorResponse = (
  err: Error, 
  statusCode: number, 
  req: Request,
  requestId?: string
) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const response: any = {
    success: false,
    message: err.message || 'Đã xảy ra lỗi không mong muốn',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId: requestId || req.headers['x-request-id'] || '',
  };

  // Add additional error details in development
  if (isDev) {
    response.stack = err.stack;
    if (err instanceof ValidationError && (err as any).errors) {
      response.errors = (err as any).errors;
    }
    if (err.name === 'SequelizeError' && (err as any).parent) {
      response.databaseError = {
        code: (err as any).parent?.code,
        detail: (err as any).parent?.detail,
        hint: (err as any).parent?.hint,
      };
    }
  }

  return response;
};

/**
 * Log error details with request context
 */
const logError = (err: AppError, req: Request) => {
  const logData: any = {
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || '',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
    },
  };

  // Add request details if available
  if (Object.keys(req.params).length) logData.params = req.params;
  if (Object.keys(req.query).length) logData.query = req.query;
  if (req.body && Object.keys(req.body).length) logData.body = req.body;
  if (req.headers.authorization) {
    logData.auth = { hasAuth: true };
  }

  // Log with appropriate level
  const isClientError = err.statusCode && err.statusCode >= 400 && err.statusCode < 500;
  if (err instanceof UnauthorizedError || isClientError) {
    logger.warn('Request validation/authentication error', logData);
  } else {
    logger.error('Server error occurred', logData);
  }
};

// Custom error interface that extends the built-in Error
interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
  code?: string;
  parent?: {
    code?: string;
    detail?: string;
    hint?: string;
  };
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error with request context
  logError(err, req);

  // Helper function to handle error responses
  const handleError = (error: AppError, defaultStatusCode: number) => {
    const statusCode = error.statusCode || defaultStatusCode;
    return res.status(statusCode).json(formatErrorResponse(error, statusCode, req));
  };

  // Handle different error types
  if (err instanceof ValidationError) {
    return handleError(err, 400);
  }

  if (err instanceof NotFoundError) {
    return handleError(err, 404);
  }

  if (err instanceof UnauthorizedError) {
    return handleError(err, 401);
  }

  if (err instanceof ForbiddenError) {
    return handleError(err, 403);
  }

  // Handle unexpected errors
  const statusCode = err.statusCode || 500;
  
  // Log lỗi không mong muốn
  logger.error('Unhandled error:', {
    error: err,
    statusCode,
    url: req.originalUrl,
    method: req.method
  });
  
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
