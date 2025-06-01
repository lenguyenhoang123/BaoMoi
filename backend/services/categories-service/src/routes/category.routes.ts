import { Router, Request, Response, NextFunction } from 'express';
import { CategoryController } from '../controllers/category.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { body } from 'express-validator';

// Import the UserAttributes interface
import { UserAttributes } from '../models/user.model.js';

// Mở rộng kiểu Request của Express để bao gồm thuộc tính user
declare module 'express' {
  interface Request {
    user?: UserAttributes;
  }
}

const router = Router();

// Quy tắc kiểm tra dữ liệu
// Middleware tự động tạo slug nếu chưa có
const autoGenerateSlug = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body.name && !req.body.slug) {
    // Chuyển đổi tiếng Việt có dấu sang không dấu
    const slug = req.body.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Xóa các ký tự đặc biệt
      .replace(/[\s_]+/g, '-') // Thay thế khoảng trắng và gạch dưới bằng dấu gạch ngang
      .replace(/[-\s]+$/g, ''); // Xóa dấu gạch ngang ở cuối chuỗi
    
    req.body.slug = slug;
  }
  next();
};

// Validation rules
const createCategoryValidation = [
  body('name')
    .notEmpty().withMessage('Tên danh mục là bắt buộc')
    .isString().withMessage('Tên danh mục phải là chuỗi')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Tên danh mục phải từ 2 đến 100 ký tự'),
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
    .isLength({ max: 120 }).withMessage('Slug không được vượt quá 120 ký tự'),
];

const updateCategoryValidation = [
  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/).withMessage('Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
    .isLength({ max: 120 }).withMessage('Slug không được vượt quá 120 ký tự'),
];

// ====================
// Public routes
// ====================

// Lấy tất cả danh mục
router.get('/', CategoryController.getAllCategories);

// Lấy danh mục theo ID
router.get('/:id', CategoryController.getCategoryById);

// ====================
// Protected routes (Yêu cầu xác thực)
// ====================

// Tạo mới danh mục
router.post('/', 
  authenticateJWT, // Middleware xác thực JWT
  autoGenerateSlug, // Tự động tạo slug nếu chưa có
  validate(createCategoryValidation), // Middleware validate dữ liệu
  CategoryController.createCategory // Controller xử lý chính
);

router.put('/:id', 
  (req: Request, res: Response, next: NextFunction) => {
    return (authenticateJWT as any)(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    return (validate(updateCategoryValidation) as any)(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    return (CategoryController.updateCategory as any)(req, res).catch(next);
  }
);

router.delete('/:id', 
  (req: Request, res: Response, next: NextFunction) => {
    return (authenticateJWT as any)(req, res, next);
  },
  (req: Request, res: Response, next: NextFunction) => {
    return (CategoryController.deleteCategory as any)(req, res).catch(next);
  }
);

export default router;
