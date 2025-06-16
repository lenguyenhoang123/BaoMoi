import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import AppError from '../utils/appError';
import { logger } from '../utils/logger';
import axios from 'axios';

// Import the extended User type
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      avatar_url?: string | null;
      role: string;
      isAdmin: boolean;
    }
  }
}

// Định nghĩa interface cho payload của JWT
export interface JwtPayload {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Middleware xác thực JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lấy token từ header
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', StatusCodes.UNAUTHORIZED);
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as JwtPayload;

    // Lưu thông tin user vào request với đúng kiểu dữ liệu
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.full_name || 'Ẩn danh',
      avatar_url: decoded.avatar_url || null,
      role: decoded.role,
      isAdmin: decoded.isAdmin || false
    };

    // Nếu không có thông tin avatar, thử lấy từ Auth Service
    if (!decoded.avatar_url && process.env.AUTH_SERVICE_URL) {
      try {
        const authResponse = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/users/${decoded.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (authResponse.data?.data) {
          const userData = authResponse.data.data;
          if (req.user) {
            req.user.avatar_url = userData.avatar || req.user.avatar_url;
          }
        }
      } catch (error) {
        logger.error('Failed to fetch user details from Auth Service:', error);
        // Tiếp tục với dữ liệu hiện có nếu không thể lấy từ Auth Service
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', StatusCodes.UNAUTHORIZED));
    } else if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Token không hợp lệ. Vui lòng đăng nhập lại.', StatusCodes.UNAUTHORIZED));
    }

    logger.error('Lỗi xác thực:', error);
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền truy cập dựa trên vai trò
 * @param roles - Danh sách các vai trò được phép truy cập
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Bạn chưa đăng nhập', StatusCodes.UNAUTHORIZED);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Bạn không có quyền thực hiện hành động này', StatusCodes.FORBIDDEN);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  authenticate,
  restrictTo,
};
