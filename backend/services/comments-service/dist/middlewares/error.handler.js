"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../utils/logger");
const appError_1 = __importDefault(require("../utils/appError"));
/**
 * Middleware xử lý lỗi toàn cục
 */
const errorHandler = (err, req, res, next) => {
    // Log lỗi
    logger_1.logger.error(`[ERROR] ${err.stack}`);
    // Xử lý lỗi AppError
    if (err instanceof appError_1.default) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    // Xử lý lỗi validation
    if (err.name === 'ValidationError') {
        // @ts-ignore
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join('. ');
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: `Validation error: ${message}`,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    // Xử lý lỗi JWT
    if (err.name === 'JsonWebTokenError') {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Invalid token. Please log in again!',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            message: 'Your token has expired! Please log in again.',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    // Xử lý lỗi database
    if (err.name === 'SequelizeUniqueConstraintError') {
        // @ts-ignore
        const message = `Duplicate field value: ${Object.values(err.fields).join(', ')}`;
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: `Database error: ${message}`,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        });
        return;
    }
    // Xử lý lỗi không xác định
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Something went wrong!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
/**
 * Middleware xử lý route không tồn tại
 */
const notFoundHandler = (req, res, next) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
};
exports.notFoundHandler = notFoundHandler;
