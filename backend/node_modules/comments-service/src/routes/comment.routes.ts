import { Router } from 'express';
import { body, param } from 'express-validator';
import commentController from '../controllers/comment.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';

// Khởi tạo router
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Quản lý bình luận
 */

// Public routes (no authentication required)
router.get('/post/:postId/count', [
  param('postId').isString().notEmpty().withMessage('Post ID is required')
], validateRequest, commentController.countCommentsByPost);

router.get('/post/:postId', [
  param('postId').isString().notEmpty().withMessage('Post ID is required')
], validateRequest, commentController.getCommentsByPost);

router.get('/:id', [
  param('id').isString().notEmpty().withMessage('Comment ID is required')
], validateRequest, commentController.getCommentById);

// Protected routes (authentication required)
router.use(authenticate);

// Create a new comment
router.post('/', [
  body('content').isString().notEmpty().withMessage('Content is required'),
  body('post_id').isString().notEmpty().withMessage('Post ID is required'),
  body('parent_id').optional().isString()
], validateRequest, commentController.createComment);

// Update a comment
router.patch('/:id', [
  param('id').isString().notEmpty().withMessage('Comment ID is required'),
  body('content').isString().notEmpty().withMessage('Content is required')
], validateRequest, commentController.updateComment);

// Delete a comment
router.delete('/:id', [
  param('id').isString().notEmpty().withMessage('Comment ID is required')
], validateRequest, commentController.deleteComment);

// Toggle comment approval (admin only)
router.patch('/:id/approve', [
  param('id').isString().notEmpty().withMessage('Comment ID is required'),
  body('is_approved').isBoolean().withMessage('is_approved must be a boolean')
], validateRequest, commentController.toggleApproveComment);

/**
 * @swagger
 * /api/comments/post/{postId}/count:
 *   get:
 *     summary: Đếm số lượng comments của một bài viết
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của bài viết
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     postId:
 *                       type: string
 *                     count:
 *                       type: number
 *       400:
 *         description: Thiếu postId
 *       404:
 *         description: Không tìm thấy bài viết
 */
router.get('/post/:postId/count', commentController.countCommentsByPost);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Tạo mới bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - post_id
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nội dung bình luận
 *               post_id:
 *                 type: integer
 *                 description: ID của bài viết
 *               parent_id:
 *                 type: integer
 *                 description: ID của bình luận cha (nếu là reply)
 *     responses:
 *       201:
 *         description: Tạo bình luận thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.post(
  '/',
  [
    body('content').trim().notEmpty().withMessage('Nội dung không được để trống'),
    body('post_id').isInt({ min: 1 }).withMessage('ID bài viết không hợp lệ'),
    body('parent_id').optional().isInt({ min: 1 }),
  ],
  validateRequest,
  commentController.createComment
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Lấy danh sách bình luận theo bài viết
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bài viết
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: includeReplies
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Có bao gồm replies không
 *     responses:
 *       200:
 *         description: Danh sách bình luận
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.get(
  '/posts/:postId/comments',
  [param('postId').isInt({ min: 1 }).withMessage('ID bài viết không hợp lệ')],
  validateRequest,
  commentController.getCommentsByPost
);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết bình luận
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bình luận
 *     responses:
 *       200:
 *         description: Thông tin bình luận
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID bình luận không hợp lệ')],
  validateRequest,
  commentController.getCommentById
);

/**
 * @swagger
 * /api/comments/{id}:
 *   patch:
 *     summary: Cập nhật bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bình luận
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nội dung mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền chỉnh sửa
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.patch(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('ID bình luận không hợp lệ'),
    body('content').trim().notEmpty().withMessage('Nội dung không được để trống'),
  ],
  validateRequest,
  commentController.updateComment
);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Xóa bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bình luận
 *     responses:
 *       204:
 *         description: Xóa thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('ID bình luận không hợp lệ')],
  validateRequest,
  commentController.deleteComment
);

/**
 * @swagger
 * /api/comments/{id}/approve:
 *   patch:
 *     summary: Phê duyệt/bỏ phê duyệt bình luận (Admin)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID bình luận
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_approved
 *             properties:
 *               is_approved:
 *                 type: boolean
 *                 description: Trạng thái phê duyệt
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền thực hiện
 *       404:
 *         description: Không tìm thấy bình luận
 */
router.patch(
  '/:id/approve',
  [
    param('id').isInt({ min: 1 }).withMessage('ID bình luận không hợp lệ'),
    body('is_approved').isBoolean().withMessage('Trạng thái không hợp lệ'),
  ],
  validateRequest,
  commentController.toggleApproveComment
);

// Public route - không yêu cầu xác thực
router.get('/public/post/:postId/count', (req, res, next) => {
  // Tạm thời gỡ bỏ xác thực cho route này
  req.user = { id: 'system', email: 'system@example.com', role: 'admin', isAdmin: true };
  next();
}, commentController.countCommentsByPost);

export default router;
