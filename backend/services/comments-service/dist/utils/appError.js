"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Lớp lỗi tùy chỉnh cho ứng dụng
 */
class AppError extends Error {
    /**
     * Tạo một lỗi ứng dụng mới
     * @param message - Thông báo lỗi
     * @param statusCode - Mã trạng thái HTTP (mặc định: 500)
     * @param details - Thông tin chi tiết về lỗi (tùy chọn)
     */
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;
        // Bảo toàn stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = AppError;
