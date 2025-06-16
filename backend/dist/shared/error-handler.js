"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.errorHandler = exports.notFoundHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("./logger"));
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Không tìm thấy ${req.originalUrl}`, 404);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const errorHandler = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    const errorResponse = {
        status: err.status,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
    // Log lỗi
    logger_1.default.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.error(err.stack);
    }
    // Trả về lỗi cho client
    res.status(err.statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
//# sourceMappingURL=error-handler.js.map