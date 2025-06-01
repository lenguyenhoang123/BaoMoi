import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import type { UserAttributes } from '../models/user.model.js';
import User from '../models/user.model.js';

// Kiểu dữ liệu cho User
// Mở rộng interface Request của Express
declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
    }
  }
}

/**
 * Middleware xác thực JWT
 */
export const authenticateJWT: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    
    // Lấy thông tin user từ database
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    
    // Gán user vào request để sử dụng ở các middleware tiếp theo
    req.user = user.get({ plain: true });
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired'));
    }
    next(error);
  }
};

/**
 * Middleware kiểm tra quyền admin
 */
/**
 * Middleware kiểm tra quyền admin
 */
export const adminOnly: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
};
