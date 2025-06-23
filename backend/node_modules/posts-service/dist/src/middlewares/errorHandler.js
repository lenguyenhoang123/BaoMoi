"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("../utils/appError"));
const logger_1 = __importDefault(require("../utils/logger"));
// Xử lý lỗi CastError (ID không hợp lệ)
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new appError_1.default(message, 400);
};
// Xử lý lỗi trường trùng lặp
const handleDuplicateFieldsDB = (err) => {
    const value = err.detail.match(/\(([^)]+)\)/)[1];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new appError_1.default(message, 400);
};
// Xử lý lỗi validate
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new appError_1.default(message, 400);
};
// Xử lý lỗi JWT
const handleJWTError = () => new appError_1.default('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new appError_1.default('Your token has expired! Please log in again.', 401);
// Gửi lỗi trong môi trường phát triển
const sendErrorDev = (err, req, res) => {
    // API
    if (req.originalUrl?.startsWith?.('/api')) {
        res.status(err.statusCode || 500).json({
            status: err.status || 'error',
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    else {
        // Rendered website
        console.error('ERROR 💥', err);
        res.status(err.statusCode || 500).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
    }
};
// Gửi lỗi trong môi trường sản phẩm
const sendErrorProd = (err, req, res) => {
    // API
    if (req.originalUrl?.startsWith?.('/api')) {
        // Lỗi hoạt động, đã được kiểm soát: gửi thông báo cho client
        if (err.isOperational) {
            res.status(err.statusCode || 500).json({
                status: err.status || 'error',
                message: err.message,
            });
            return;
        }
        // Programming or other unknown error: don't leak error details
        // 1) Log error
        console.error('ERROR 💥', err);
        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
        return;
    }
    // Rendered website
    if (err.isOperational) {
        res.status(err.statusCode || 500).render('error', {
            title: 'Something went wrong!',
            msg: err.message,
        });
        return;
    }
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    res.status(500).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.',
    });
};
// Middleware xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // Ghi log lỗi cho môi trường phát triển
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.error(`[${err.name}] ${err.message}${err.stack ? `\n${err.stack}` : ''}`);
    }
    // Handle specific error types
    if (err.name === 'CastError')
        err = handleCastErrorDB(err);
    if (err.code === '23505')
        err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError')
        err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError')
        err = handleJWTError();
    if (err.name === 'TokenExpiredError')
        err = handleJWTExpiredError();
    // 1) Log error
    if (process.env.NODE_ENV === 'development') {
        console.error('Error 💥', err);
    }
    else if (process.env.NODE_ENV === 'production') {
        logger_1.default.error(`[${err.name}] ${err.message}${err.stack ? `\n${err.stack}` : ''}`);
    }
    // 2) Gửi phản hồi lỗi
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;
        // Handle specific error types
        if (err.name === 'CastError')
            error = handleCastErrorDB(error);
        if (err.code === 11000)
            error = handleDuplicateFieldsDB(error);
        if (err.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (err.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (err.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        sendErrorProd(error, req, res);
    }
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map