import { AppError as AppErrorType } from '../types';

export class AppError extends Error implements AppErrorType {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: number;

  constructor(message: string, statusCode: number, code?: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    // Ghi lại stack trace, loại bỏ constructor call khỏi stack
    Error.captureStackTrace(this, this.constructor);
  }

  // Các phương thức factory cho các lỗi thông dụng
  // Lỗi yêu cầu không hợp lệ (400)
  static badRequest(message: string, code?: number): AppError {
    return new AppError(message, 400, code);
  }

  // Lỗi chưa xác thực (401)
  static unauthorized(message = 'Bạn không có quyền thực hiện hành động này', code?: number): AppError {
    return new AppError(message, 401, code);
  }

  // Lỗi từ chối truy cập (403)
  static forbidden(message = 'Bạn không có quyền thực hiện hành động này', code?: number): AppError {
    return new AppError(message, 403, code);
  }

  // Lỗi không tìm thấy (404)
  static notFound(resource = 'Tài nguyên'): AppError {
    return new AppError(`${resource} not found`, 404);
  }

  // Lỗi xung đột (409)
  static conflict(message: string, code?: number): AppError {
    return new AppError(message, 409, code);
  }

  // Lỗi validate dữ liệu (422)
  static validationError(message: string, code?: number): AppError {
    return new AppError(message, 422, code);
  }

  // Lỗi máy chủ nội bộ (500)
  static internalError(message = 'Lỗi máy chủ nội bộ', code?: number): AppError {
    return new AppError(message, 500, code);
  }
}

export default AppError;
