import { Response, NextFunction, RequestHandler, Request } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserAttributes } from '../models/user.model';
import { authConfig } from '../config/auth.config';
import { logger } from '../utils/logger';
import { ITokenPayload } from '../interfaces/auth.interface';

// Extend the Express Request type with our custom properties
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserAttributes;
  }
}

// Create a custom request type that includes our user property
interface IAuthRequest extends Request {
  user?: UserAttributes;
}

/**
 * Middleware xác thực người dùng qua JWT
 */
export const authMiddleware: RequestHandler = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Lấy token từ header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Không có token xác thực'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Xác thực token
    const decoded = jwt.verify(token, authConfig.jwt.secret) as ITokenPayload;
    
    // Tìm người dùng trong database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
      return;
    }
    
    // Kiểm tra tài khoản có bị vô hiệu hóa không
    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa'
      });
      return;
    }
    
    // Gán thông tin người dùng vào request
    // Chỉ gán các trường cần thiết để tránh lỗi tuần tự hóa
    const userData = user.get({ plain: true });
    req.user = {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      is_active: userData.is_active,
      email_verified: userData.email_verified,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    } as any;
    
    next();
  } catch (error) {
    logger.error('Error verifying token:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// Export các middleware dưới dạng object để có thể import theo tên
export const auth = {
  auth: authMiddleware,
} as const;

// Export riêng lẻ để dễ import
export const authenticateToken = authMiddleware;
