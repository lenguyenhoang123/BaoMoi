import { StatusCodes } from 'http-status-codes';

/**
 * Lớp lỗi API kế thừa từ Error
 */
class ApiError extends Error {
  statusCode: number;

  /**
   * Tạo một lỗi API mới
   * @param message - Thông báo lỗi
   * @param statusCode - Mã trạng thái HTTP (mặc định: 500 Internal Server Error)
   */
  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';

    // Bảo toàn stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Tạo lỗi Bad Request (400)
   */
  static badRequest(message: string = 'Bad Request'): ApiError {
    return new ApiError(message, StatusCodes.BAD_REQUEST);
  }

  /**
   * Tạo lỗi Unauthorized (401)
   */
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, StatusCodes.UNAUTHORIZED);
  }

  /**
   * Tạo lỗi Forbidden (403)
   */
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, StatusCodes.FORBIDDEN);
  }

  /**
   * Tạo lỗi Not Found (404)
   */
  static notFound(message: string = 'Not Found'): ApiError {
    return new ApiError(message, StatusCodes.NOT_FOUND);
  }

  /**
   * Tạo lỗi Conflict (409)
   */
  static conflict(message: string = 'Conflict'): ApiError {
    return new ApiError(message, StatusCodes.CONFLICT);
  }
}

export default ApiError;
