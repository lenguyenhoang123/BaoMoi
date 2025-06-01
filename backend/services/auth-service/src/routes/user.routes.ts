import { Router } from 'express';
import { body } from 'express-validator';
import UserController from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate-request.middleware';

// Định nghĩa các hằng số cho validation messages
const VALIDATION_MESSAGES = {
  PASSWORD: {
    REQUIRED: 'Mật khẩu là bắt buộc',
    MIN_LENGTH: 'Mật khẩu phải có ít nhất 6 ký tự',
  },
  EMAIL: {
    VALID: 'Vui lòng nhập địa chỉ email hợp lệ',
    REQUIRED: 'Email là bắt buộc',
  },
  FULL_NAME: 'Họ và tên là bắt buộc',
  ROLE: 'Vai trò không hợp lệ',
  CURRENT_PASSWORD: 'Mật khẩu hiện tại là bắt buộc',
};

const router = Router();

// Tất cả các route đều yêu cầu xác thực
router.use(authenticateToken);

// Lấy thông tin người dùng hiện tại
router.get('/me', UserController.getCurrentUser);

// Đổi mật khẩu
router.patch(
  '/change-password',
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.CURRENT_PASSWORD),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage(VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH)
  ]),
  UserController.changePassword
);

// Các route yêu cầu quyền admin
router.use(requireAdmin);

// Lấy danh sách người dùng (phân trang, tìm kiếm)
router.get('/', UserController.getAllUsers);

// Lấy thông tin người dùng theo ID (chỉ admin hoặc chính user đó)
router.get('/:id', authenticateToken, (req, res, next) => {
  // Nếu là admin hoặc là chính user đó
  if (req.user && (req.user.role === 'admin' || req.user.id === req.params.id)) {
    return UserController.getUserById(req, res, next);
  }
  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền xem thông tin người dùng này',
  });
});

// Tạo người dùng mới (admin)
router.post(
  '/',
  validate([
    body('email')
      .isEmail()
      .withMessage(VALIDATION_MESSAGES.EMAIL.VALID)
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.EMAIL.REQUIRED),
    body('password')
      .isLength({ min: 6 })
      .withMessage(VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH)
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.PASSWORD.REQUIRED),
    body('fullName')
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.FULL_NAME),
    body('role')
      .isIn(['user', 'admin', 'moderator'])
      .withMessage(VALIDATION_MESSAGES.ROLE)
  ]),
  UserController.createUser
);

// Cập nhật thông tin người dùng (admin)
router.patch(
  '/:id',
  validate([
    body('email')
      .optional()
      .isEmail()
      .withMessage(VALIDATION_MESSAGES.EMAIL.VALID),
    body('fullName')
      .optional()
      .notEmpty()
      .withMessage(VALIDATION_MESSAGES.FULL_NAME),
    body('role')
      .optional()
      .isIn(['user', 'admin', 'moderator'])
      .withMessage(VALIDATION_MESSAGES.ROLE),
  ]),
  UserController.updateUser
);

// Xóa người dùng (admin)
router.delete('/:id', UserController.deleteUser);

export default router;
