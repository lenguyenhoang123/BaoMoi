"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
/**
 * Lớp lỗi API kế thừa từ Error
 */
class ApiError extends Error {
    /**
     * Tạo một lỗi API mới
     * @param message - Thông báo lỗi
     * @param statusCode - Mã trạng thái HTTP (mặc định: 500 Internal Server Error)
     */
    constructor(message, statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) {
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
    static badRequest(message = 'Bad Request') {
        return new ApiError(message, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    /**
     * Tạo lỗi Unauthorized (401)
     */
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(message, http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
    /**
     * Tạo lỗi Forbidden (403)
     */
    static forbidden(message = 'Forbidden') {
        return new ApiError(message, http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    /**
     * Tạo lỗi Not Found (404)
     */
    static notFound(message = 'Not Found') {
        return new ApiError(message, http_status_codes_1.StatusCodes.NOT_FOUND);
    }
    /**
     * Tạo lỗi Conflict (409)
     */
    static conflict(message = 'Conflict') {
        return new ApiError(message, http_status_codes_1.StatusCodes.CONFLICT);
    }
}
exports.default = ApiError;
