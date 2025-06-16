import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.types';

// Simple interface for authenticated user data
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware kiểm tra quyền truy cập dựa trên vai trò người dùng
 * @param allowedRoles Danh sách các vai trò được phép truy cập
 */
export const requireRole = (allowedRoles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Nếu không có yêu cầu vai trò cụ thể, cho phép tất cả người dùng đã xác thực
    if (allowedRoles.length === 0) {
      return next();
    }
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Vui lòng đăng nhập để thực hiện thao tác này',
      });
    }

    // Kiểm tra quyền truy cập
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Bạn không có quyền truy cập tài nguyên này',
      });
    }

    next();
  };
};

// Middleware kiểm tra quyền admin
export const requireAdmin = requireRole(['admin']);

// Middleware kiểm tra quyền admin hoặc moderator
export const requireAdminOrModerator = requireRole(['admin', 'moderator']);

// Middleware kiểm tra quyền user thông thường
export const requireUser = requireRole(['user', 'moderator', 'admin']);
