"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const appError_1 = __importDefault(require("../utils/appError"));
const logger_1 = require("../utils/logger");
/**
 * Middleware xác thực JWT
 */
const authenticate = (req, res, next) => {
    try {
        // Lấy token từ header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        }
        if (!token) {
            throw new appError_1.default('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        // Xác thực token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        // Lưu thông tin user vào request với đúng kiểu dữ liệu
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            isAdmin: decoded.isAdmin || false
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new appError_1.default('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new appError_1.default('Token không hợp lệ. Vui lòng đăng nhập lại.', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        logger_1.logger.error('Lỗi xác thực:', error);
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Middleware kiểm tra quyền truy cập dựa trên vai trò
 * @param roles - Danh sách các vai trò được phép truy cập
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new appError_1.default('Bạn chưa đăng nhập', http_status_codes_1.StatusCodes.UNAUTHORIZED);
            }
            if (!roles.includes(req.user.role)) {
                throw new appError_1.default('Bạn không có quyền thực hiện hành động này', http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.restrictTo = restrictTo;
exports.default = {
    authenticate: exports.authenticate,
    restrictTo: exports.restrictTo,
};
