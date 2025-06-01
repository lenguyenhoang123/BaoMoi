"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
const appError_1 = __importDefault(require("../utils/appError"));
/**
 * Chuyển đổi lỗi validation sang định dạng chuẩn
 */
function formatValidationErrors(errors) {
    return errors.map(err => ({
        param: 'param' in err ? String(err.param) : 'unknown',
        message: 'msg' in err ? String(err.msg) : 'Validation error',
        value: 'value' in err ? err.value : undefined,
        location: 'location' in err ? String(err.location) : 'unknown'
    }));
}
/**
 * Middleware xử lý lỗi validation từ express-validator
 */
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = formatValidationErrors(errors.array());
        throw new appError_1.default('Dữ liệu không hợp lệ', http_status_codes_1.StatusCodes.BAD_REQUEST, errorMessages);
    }
    next();
};
exports.validateRequest = validateRequest;
/**
 * Hàm tạo middleware validate dựa trên các rules đã định nghĩa
 */
const validate = (validations) => {
    return async (req, res, next) => {
        try {
            // Chạy tất cả các validation
            await Promise.all(validations.map(validation => validation.run(req)));
            // Kiểm tra lỗi
            const errors = (0, express_validator_1.validationResult)(req);
            if (errors.isEmpty()) {
                return next();
            }
            // Xử lý lỗi
            const errorMessages = formatValidationErrors(errors.array());
            throw new appError_1.default('Dữ liệu không hợp lệ', http_status_codes_1.StatusCodes.BAD_REQUEST, errorMessages);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
