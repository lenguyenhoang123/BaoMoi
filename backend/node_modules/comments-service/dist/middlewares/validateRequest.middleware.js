"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const apiError_1 = __importDefault(require("../utils/apiError"));
/**
 * Middleware để xác thực dữ liệu đầu vào dựa trên các quy tắc đã định nghĩa
 * Nếu có lỗi, ném ra lỗi ApiError với thông tin chi tiết
 */
const validateRequest = (validations) => {
    return async (req, res, next) => {
        // Thực thi tất cả các validation
        await Promise.all(validations.map(validation => validation.run(req)));
        // Lấy kết quả validation
        const errors = (0, express_validator_1.validationResult)(req);
        // Nếu có lỗi, trả về lỗi 400 với thông tin chi tiết
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => ({
                field: typeof err === 'object' ? err.param || 'unknown' : 'unknown',
                message: typeof err === 'object' ? err.msg || 'Validation error' : 'Validation error',
                value: typeof err === 'object' ? err.value : undefined,
            }));
            const error = new apiError_1.default('Dữ liệu không hợp lệ', http_status_codes_1.StatusCodes.BAD_REQUEST);
            error.errors = errorMessages;
            next(error);
            return;
        }
        // Nếu không có lỗi, chuyển sang middleware tiếp theo
        next();
    };
};
exports.validateRequest = validateRequest;
/**
 * Middleware để xử lý lỗi validation từ express-validator
 * Nên được đặt sau các middleware validation
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: typeof err === 'object' ? err.param || 'unknown' : 'unknown',
            message: typeof err === 'object' ? err.msg || 'Validation error' : 'Validation error',
            value: typeof err === 'object' ? err.value : undefined,
        }));
        const error = new apiError_1.default('Dữ liệu không hợp lệ', http_status_codes_1.StatusCodes.BAD_REQUEST);
        error.errors = errorMessages;
        next(error);
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.default = {
    validateRequest: exports.validateRequest,
    handleValidationErrors: exports.handleValidationErrors,
};
