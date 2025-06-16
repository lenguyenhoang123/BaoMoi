"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCommentId = exports.validateUpdateComment = exports.validateComment = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware kiểm tra dữ liệu bình luận
 */
exports.validateComment = [
    // Kiểm tra nội dung bình luận
    (0, express_validator_1.body)('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung không được để trống')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Nội dung phải từ 1 đến 1000 ký tự'),
    // Kiểm tra post_id
    (0, express_validator_1.body)('post_id')
        .notEmpty()
        .withMessage('ID bài viết là bắt buộc')
        .isInt({ min: 1 })
        .withMessage('ID bài viết phải là số nguyên dương')
        .toInt(),
    // Kiểm tra parent_id (tùy chọn)
    (0, express_validator_1.body)('parent_id').optional().isInt({ min: 1 }).withMessage('ID bình luận cha phải là số nguyên dương').toInt(),
    // Kiểm tra user_id (từ token)
    (0, express_validator_1.body)('user_id')
        .optional() // Thường lấy từ token
        .isInt({ min: 1 })
        .withMessage('ID người dùng không hợp lệ')
        .toInt(),
];
/**
 * Middleware kiểm tra dữ liệu cập nhật bình luận
 */
exports.validateUpdateComment = [
    // Chỉ kiểm tra nội dung khi cập nhật
    (0, express_validator_1.body)('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung không được để trống')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Nội dung phải từ 1 đến 1000 ký tự'),
];
/**
 * Middleware kiểm tra ID bình luận trong URL
 */
exports.validateCommentId = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('ID bình luận không hợp lệ').toInt(),
];
exports.default = {
    validateComment: exports.validateComment,
    validateUpdateComment: exports.validateUpdateComment,
    validateCommentId: exports.validateCommentId,
};
