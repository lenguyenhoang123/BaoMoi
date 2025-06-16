import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import AppError from '../utils/appError';

// Định nghĩa kiểu dữ liệu cho lỗi validation
interface IValidationError {
  param: string;
  message: string;
  value?: any;
  location?: string;
}

// Kiểu dữ liệu đơn giản cho lỗi validation
interface SimpleValidationError {
  param: string;
  msg: string;
  value?: any;
  location?: string;
}

/**
 * Chuyển đổi lỗi validation sang định dạng chuẩn
 */
function formatValidationErrors(errors: any[]): IValidationError[] {
  return errors.map(err => ({
    param: 'param' in err ? String(err.param) : 'unknown',
    message: 'msg' in err ? String(err.msg) : 'Validation error',
    value: 'value' in err ? err.value : undefined,
    location: 'location' in err ? String(err.location) : 'unknown'
  }));
}

/**
 * Middleware xử lý lỗi validation từ express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = formatValidationErrors(errors.array());
    throw new AppError('Dữ liệu không hợp lệ', StatusCodes.BAD_REQUEST, errorMessages);
  }
  
  next();
};

/**
 * Hàm tạo middleware validate dựa trên các rules đã định nghĩa
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Chạy tất cả các validation
      await Promise.all(validations.map(validation => validation.run(req)));
      
      // Kiểm tra lỗi
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }
      
      // Xử lý lỗi
      const errorMessages = formatValidationErrors(errors.array());
      throw new AppError('Dữ liệu không hợp lệ', StatusCodes.BAD_REQUEST, errorMessages);
    } catch (error) {
      next(error);
    }
  };
};
