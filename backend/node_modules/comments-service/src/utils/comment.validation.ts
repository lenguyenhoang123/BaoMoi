import { body, param, ValidationChain } from 'express-validator';
import { RequestHandler } from 'express';

/**
 * Middleware kiểm tra dữ liệu bình luận
 */
export const validateComment: (ValidationChain | RequestHandler)[] = [
  // Kiểm tra nội dung bình luận
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nội dung không được để trống')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Nội dung phải từ 1 đến 1000 ký tự'),

  // Kiểm tra post_id
  body('post_id')
    .notEmpty()
    .withMessage('ID bài viết là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID bài viết phải là số nguyên dương')
    .toInt(),

  // Kiểm tra parent_id (tùy chọn)
  body('parent_id').optional().isInt({ min: 1 }).withMessage('ID bình luận cha phải là số nguyên dương').toInt(),

  // Kiểm tra user_id (từ token)
  body('user_id')
    .optional() // Thường lấy từ token
    .isInt({ min: 1 })
    .withMessage('ID người dùng không hợp lệ')
    .toInt(),
];

/**
 * Middleware kiểm tra dữ liệu cập nhật bình luận
 */
export const validateUpdateComment: (ValidationChain | RequestHandler)[] = [
  // Chỉ kiểm tra nội dung khi cập nhật
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nội dung không được để trống')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Nội dung phải từ 1 đến 1000 ký tự'),
];

/**
 * Middleware kiểm tra ID bình luận trong URL
 */
export const validateCommentId: (ValidationChain | RequestHandler)[] = [
  param('id').isInt({ min: 1 }).withMessage('ID bình luận không hợp lệ').toInt(),
];

export default {
  validateComment,
  validateUpdateComment,
  validateCommentId,
};
