import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../utils/apiError';

// Định nghĩa kiểu cho lỗi validation
interface ValidationErrorItem {
  field?: string;
  message: string;
  value?: any;
}

/**
 * Middleware để xác thực dữ liệu đầu vào dựa trên các quy tắc đã định nghĩa
 * Nếu có lỗi, ném ra lỗi ApiError với thông tin chi tiết
 */
export const validateRequest = (validations: ValidationChain[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Thực thi tất cả các validation
    await Promise.all(validations.map(validation => validation.run(req)));

    // Lấy kết quả validation
    const errors = validationResult(req);

    // Nếu có lỗi, trả về lỗi 400 với thông tin chi tiết
    if (!errors.isEmpty()) {
      const errorMessages: ValidationErrorItem[] = errors.array().map(err => ({
        field: typeof err === 'object' ? (err as any).param || 'unknown' : 'unknown',
        message: typeof err === 'object' ? (err as any).msg || 'Validation error' : 'Validation error',
        value: typeof err === 'object' ? (err as any).value : undefined,
      }));

      const error = new ApiError('Dữ liệu không hợp lệ', StatusCodes.BAD_REQUEST);
      (error as any).errors = errorMessages;
      next(error);
      return;
    }

    // Nếu không có lỗi, chuyển sang middleware tiếp theo
    next();
  };
};

/**
 * Middleware để xử lý lỗi validation từ express-validator
 * Nên được đặt sau các middleware validation
 */
export const handleValidationErrors: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages: ValidationErrorItem[] = errors.array().map(err => ({
      field: typeof err === 'object' ? (err as any).param || 'unknown' : 'unknown',
      message: typeof err === 'object' ? (err as any).msg || 'Validation error' : 'Validation error',
      value: typeof err === 'object' ? (err as any).value : undefined,
    }));

    const error = new ApiError('Dữ liệu không hợp lệ', StatusCodes.BAD_REQUEST);
    (error as any).errors = errorMessages;
    next(error);
    return;
  }

  next();
};

export default {
  validateRequest,
  handleValidationErrors,
};
