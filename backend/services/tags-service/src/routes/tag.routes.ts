import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { validateRequest, createTagValidation, updateTagValidation, tagQueryValidation } from '../middlewares/validateRequest.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { errorHandler } from '../utils/apiError';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Lấy danh sách thẻ với phân trang và lọc
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Số lượng bản ghi mỗi trang
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Từ khóa tìm kiếm (theo tên hoặc mô tả)
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200: { description: Danh sách thẻ }
 *       500: { description: Lỗi server }
 */
router.get(
  '/',
  validateRequest(tagQueryValidation()),
  errorHandler,
  tagController.getAllTags
);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết thẻ theo ID
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID của thẻ
 *     responses:
 *       200: { description: Thông tin chi tiết thẻ }
 *       404: { description: Không tìm thấy thẻ }
 *       500: { description: Lỗi server }
 */
router.get(
  '/:id(\\d+)',
  errorHandler,
  tagController.getTagById
);

/**
 * @swagger
 * /slug/{slug}:
 *   get:
 *     summary: Lấy thông tin chi tiết thẻ theo slug
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: Slug của thẻ
 *     responses:
 *       200: { description: Thông tin chi tiết thẻ }
 *       404: { description: Không tìm thấy thẻ }
 *       500: { description: Lỗi server }
 */
router.get(
  '/slug/:slug',
  errorHandler,
  tagController.getTagBySlug
);

// Protected routes (require authentication)
router.use(authenticate);

// Admin-only routes
router.use(authorize(['admin', 'editor']));

/**
 * @swagger
 * /:
 *   post:
 *     summary: Tạo mới một thẻ (Admin/Editor)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTagInput'
 *     responses:
 *       201: { description: Thẻ đã được tạo thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       401: { description: Chưa xác thực }
 *       403: { description: Không có quyền truy cập }
 *       500: { description: Lỗi server }
 */
router.post(
  '/',
  validateRequest(createTagValidation()),
  errorHandler,
  tagController.createTag
);

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Cập nhật thông tin thẻ (Admin/Editor)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID của thẻ cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTagInput'
 *     responses:
 *       200: { description: Thông tin thẻ đã được cập nhật }
 *       400: { description: Dữ liệu không hợp lệ }
 *       401: { description: Chưa xác thực }
 *       403: { description: Không có quyền truy cập }
 *       404: { description: Không tìm thấy thẻ }
 *       500: { description: Lỗi server }
 */
router.put(
  '/:id(\\d+)',
  validateRequest(updateTagValidation()),
  errorHandler,
  tagController.updateTag
);

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Xóa một thẻ (Admin/Editor)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: ID của thẻ cần xóa
 *     responses:
 *       200: { description: Xóa thẻ thành công }
 *       400: { description: Không thể xóa thẻ đang được sử dụng }
 *       401: { description: Chưa xác thực }
 *       403: { description: Không có quyền truy cập }
 *       404: { description: Không tìm thấy thẻ }
 *       500: { description: Lỗi server }
 */
router.delete(
  '/:id(\\d+)',
  errorHandler,
  tagController.deleteTag
);

export default router;
