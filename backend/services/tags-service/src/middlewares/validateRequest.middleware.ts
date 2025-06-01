import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, query } from 'express-validator';
import { ApiError } from '../utils/apiError';

// Định nghĩa interface cho thông tin người dùng
interface UserPayload {
  id: number;
  email: string;
  role: string;
}

// Mở rộng kiểu Request của Express để bao gồm thuộc tính user
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserPayload;
  }
}

/**
 * Xác thực request dựa trên các quy tắc kiểm tra được cung cấp
 * @param validations Mảng các quy tắc kiểm tra
 * @returns Hàm middleware
 */

export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Chạy tất cả các quy tắc kiểm tra trên đối tượng request
      // Sử dụng type assertion để bỏ qua kiểm tra kiểu của TypeScript
      // vì chúng ta biết request sẽ được xử lý đúng bởi express-validator
      await Promise.all(validations.map(validation => validation.run(req as any)));

      // Lấy các lỗi kiểm tra - express-validator lưu chúng trong đối tượng request
      const errors = validationResult(req as any);
      if (errors.isEmpty()) {
        return next();
      }

      const errorMessages: Record<string, string> = {};
      errors.array().forEach((error: { param?: string; msg: string }) => {
        if (error.param) {
          errorMessages[error.param] = error.msg;
        }
      });

      throw new ApiError(400, 'Validation failed', true, errorMessages);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Tạo chuỗi kiểm tra cho các tham số phân trang
 * @returns Mảng các quy tắc kiểm tra
 */
export const paginationValidation = (): ValidationChain[] => {
  return [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    query('sortBy').optional().isString().trim().notEmpty().withMessage('Sort by field cannot be empty'),
    query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be either ASC or DESC'),
  ];
};

/**
 * Tạo chuỗi kiểm tra cho việc tạo thẻ mới
 * @returns Mảng các quy tắc kiểm tra
 */
export const createTagValidation = (): ValidationChain[] => {
  return [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('slug')
      .trim()
      .notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be a valid URL-friendly string'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
    body('is_active')
      .optional()
      .isBoolean().withMessage('is_active must be a boolean')
      .toBoolean(),
    
    body('created_by')
      .optional()
      .isInt({ min: 1 }).withMessage('Created by must be a positive integer')
      .toInt(),
  ];
};

/**
 * Tạo chuỗi kiểm tra cho việc cập nhật thẻ
 * @returns Mảng các quy tắc kiểm tra
 */
export const updateTagValidation = (): ValidationChain[] => {
  return [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('slug')
      .optional()
      .trim()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must be a valid URL-friendly string'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
    body('is_active')
      .optional()
      .isBoolean().withMessage('is_active must be a boolean')
      .toBoolean(),
    
    body('updated_by')
      .optional()
      .isInt({ min: 1 }).withMessage('Updated by must be a positive integer')
      .toInt(),
  ];
};

/**
 * Tạo chuỗi kiểm tra cho các tham số truy vấn thẻ
 * @returns Mảng các quy tắc kiểm tra
 */
export const tagQueryValidation = (): ValidationChain[] => {
  return [
    ...paginationValidation(),
    query('search').optional().trim().isString().withMessage('Search must be a string'),
    query('is_active')
      .optional()
      .isIn(['true', 'false', '0', '1', 0, 1, true, false])
      .withMessage('is_active must be a boolean value')
      .toBoolean(),
  ];
};
