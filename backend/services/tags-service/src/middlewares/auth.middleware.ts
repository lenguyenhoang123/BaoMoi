import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';
import { ApiError } from '../utils/apiError';

// Mở rộng kiểu Request của Express để bao gồm thông tin người dùng
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware kiểm tra xem người dùng đã xác thực chưa
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Lấy token từ tiêu đề Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    // Xác minh token
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      logger.error('JWT_SECRET is not defined');
      throw new ApiError(500, 'Server configuration error');
    }

    // Xác minh và giải mã token
    jwt.verify(token, secret, (err: any, user: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw new ApiError(401, 'Token expired');
        } else if (err.name === 'JsonWebTokenError') {
          throw new ApiError(401, 'Invalid token');
        } else {
          throw new ApiError(401, 'Authentication failed');
        }
      }

      // Gắn thông tin người dùng vào đối tượng request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware kiểm tra xem người dùng có vai trò được yêu cầu không
 * @param roles Mảng các vai trò được phép
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Nếu không chỉ định vai trò, cho phép truy cập
      if (roles.length === 0) {
        return next();
      }

      // Kiểm tra xem người dùng có vai trò được yêu cầu không
      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware kiểm tra xem người dùng là chủ sở hữu tài nguyên hay là admin
 * @param idParam Tên tham số chứa ID tài nguyên (mặc định: 'id')
 */
export const isOwnerOrAdmin = (idParam = 'id') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Cho phép admin truy cập mọi tài nguyên
      if (req.user.role === 'admin') {
        return next();
      }

      // Kiểm tra xem người dùng có phải là chủ sở hữu tài nguyên không
      const resourceId = parseInt(req.params[idParam] as string, 10);
      if (req.user.id !== resourceId) {
        throw new ApiError(403, 'Not authorized to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
