import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, ValidationChain, Result, ValidationError } from 'express-validator';
import { logger } from '../utils/logger';

interface ValidationErrorResponse {
  param?: string;
  msg: string;
  value?: any;
}

/**
 * Middleware xử lý lỗi validation
 */
export const validateRequest: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors: Result<ValidationError> = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation error:', { errors: errors.array() });
    
    const errorResponse = errors.array().map((err: ValidationError): ValidationErrorResponse => ({
      ...(err.type === 'field' && { param: err.path }),
      msg: err.msg,
      ...(err.type === 'field' && { value: (err as any).value })
    }));
    
    res.status(400).json({
      success: false,
      message: 'Lỗi xác thực dữ liệu',
      errors: errorResponse
    });
    return;
  }
  
  next();
};

/**
 * Hàm tạo middleware validate với các rules tùy chỉnh
 */
export const validate = (validations: ValidationChain[]): RequestHandler[] => {
  return [
    ...validations,
    validateRequest as unknown as RequestHandler
  ];
};

export default validateRequest;
