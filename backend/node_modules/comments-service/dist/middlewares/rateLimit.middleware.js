"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.defaultRateLimiter = exports.rateLimiter = void 0;
const http_status_codes_1 = require("http-status-codes");
const appError_1 = __importDefault(require("../utils/appError"));
const logger_1 = require("../utils/logger");
// Lưu trữ các request đang chờ xử lý
const requestStore = new Map();
/**
 * Middleware giới hạn số lượng request từ một IP trong một khoảng thời gian
 * @param options - Cấu hình rate limiting
 */
const rateLimiter = (options) => {
    return (req, res, next) => {
        // Bỏ qua rate limiting cho một số route hoặc IP nhất định (ví dụ: localhost)
        if (options.skip && options.skip(req)) {
            return next();
        }
        const clientIp = req.ip || req.connection.remoteAddress || '';
        const currentTime = Date.now();
        const windowStart = currentTime - options.windowMs;
        // Lọc các request cũ hơn cửa sổ thời gian
        const recentRequests = Array.from(requestStore.entries())
            .filter(([_, timestamp]) => timestamp > windowStart)
            .map(([ip]) => ip);
        // Đếm số lượng request từ IP hiện tại trong cửa sổ thời gian
        const requestCount = recentRequests.filter(ip => ip === clientIp).length;
        // Nếu vượt quá giới hạn, trả về lỗi
        if (requestCount >= options.max) {
            logger_1.logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
            return next(new appError_1.default(options.message || 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.', http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS));
        }
        // Lưu lại thời gian request hiện tại
        requestStore.set(clientIp, currentTime);
        // Xóa các request cũ hơn 1 giờ để tránh rò rỉ bộ nhớ
        const oneHourAgo = Date.now() - 3600000;
        for (const [ip, timestamp] of requestStore.entries()) {
            if (timestamp < oneHourAgo) {
                requestStore.delete(ip);
            }
        }
        // Thiết lập các header thông báo về rate limiting
        res.set({
            'X-RateLimit-Limit': options.max.toString(),
            'X-RateLimit-Remaining': (options.max - requestCount - 1).toString(),
            'X-RateLimit-Reset': new Date(currentTime + options.windowMs).toISOString(),
        });
        next();
    };
};
exports.rateLimiter = rateLimiter;
/**
 * Cấu hình mặc định cho rate limiting
 */
exports.defaultRateLimiter = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Giới hạn mỗi IP 100 request mỗi cửa sổ thời gian
    message: 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.',
    // Bỏ qua rate limiting cho localhost
    skip: req => {
        const ip = req.ip || req.connection.remoteAddress || '';
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    },
});
/**
 * Cấu hình rate limiting nghiêm ngặt hơn cho các endpoint đăng nhập
 */
exports.authRateLimiter = (0, exports.rateLimiter)({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 5, // Giới hạn 5 lần thử đăng nhập mỗi giờ
    message: 'Quá nhiều lần thử đăng nhập không thành công. Vui lòng thử lại sau 1 giờ.',
});
exports.default = {
    rateLimiter: exports.rateLimiter,
    defaultRateLimiter: exports.defaultRateLimiter,
    authRateLimiter: exports.authRateLimiter,
};
