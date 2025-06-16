/**
 * Lớp lỗi tùy chỉnh cho ứng dụng
 */
class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  details?: any;

  /**
   * Tạo một lỗi ứng dụng mới
   * @param message - Thông báo lỗi
   * @param statusCode - Mã trạng thái HTTP (mặc định: 500)
   * @param details - Thông tin chi tiết về lỗi (tùy chọn)
   */
  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    // Bảo toàn stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
