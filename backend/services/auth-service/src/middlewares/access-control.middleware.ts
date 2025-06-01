import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware yêu cầu quyền admin
 */
export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Truy cập bị từ chối: Người dùng không có quyền admin`);
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này',
    });
  }
  next();
};

/**
 * Middleware yêu cầu một trong các vai trò được chỉ định
 * @param roles Danh sách các vai trò được phép truy cập
 */
export const requireRole = (roles: string[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`Truy cập bị từ chối: Người dùng không có quyền truy cập`);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập tài nguyên này',
      });
    }
    next();
  };
};

/**
 * Middleware yêu cầu quyền sở hữu hoặc quyền admin
 * @param paramName Tên tham số chứa ID của tài nguyên (mặc định: 'id')
 */
export const requireOwnershipOrAdmin = (paramName: string = 'id'): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Nếu là admin, cho phép truy cập
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Kiểm tra quyền sở hữu
    const resourceId = req.params[paramName];
    if (req.user && req.user.id === resourceId) {
      return next();
    }

    logger.warn(`Truy cập bị từ chối: Không có quyền truy cập tài nguyên`);
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này',
    });
  };
};
