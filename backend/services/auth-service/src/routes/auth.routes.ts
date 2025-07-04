import { Router } from 'express';
import { body, query } from 'express-validator';
import AuthController from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate-request.middleware';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// =============================================
// ========== AUTHENTICATION ENDPOINTS =========
// =============================================

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     VerifyEmailRequest:
 *       type: object
 *       required: [email, otp]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         otp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           example: '123456'
 *     AuthResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *         error:
 *           type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth Service]
 *     summary: Xác thực email bằng mã OTP
 *     description: |
 *       API xác thực email bằng mã OTP đã gửi đến email đăng ký.
 *       Mã OTP có hiệu lực trong vòng 10 phút.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: '123456'
 *     responses:
 *       '200':
 *         description: Xác thực email thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       '400':
 *         description: Dữ liệu không hợp lệ hoặc OTP không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags: [Auth Service]
 *     summary: Xác thực email bằng token
 *     description: Xác thực địa chỉ email bằng token từ liên kết trong email
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token xác thực email
 *     responses:
 *       '200':
 *         description: Xác thực email thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email đã được xác thực thành công
 *       '400':
 *         description: Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có đúng 6 chữ số'),
    validateRequest
  ],
  AuthController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth Service]
 *     summary: Gửi lại mã OTP xác thực
 *     description: |
 *       Gửi lại mã OTP xác thực đến email đăng ký.
 *       Mỗi mã OTP chỉ có hiệu lực trong 10 phút.
 *       Giới hạn 3 lần gửi lại trong vòng 1 giờ.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendOtpRequest'
 *     responses:
 *       '200':
 *         description: Gửi lại mã OTP thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Mã OTP mới đã được gửi đến email của bạn
 *       '400':
 *         description: Email không hợp lệ hoặc đã được xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '429':
 *         description: Quá số lần gửi lại OTP cho phép
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/resend-otp',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    validateRequest
  ],
  AuthController.resendOtp
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đăng ký tài khoản mới
 *     description: |
 *       Tạo tài khoản người dùng mới và gửi mã OTP xác thực qua email.
 *       Mã OTP sẽ hết hạn sau 10 phút.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công, vui lòng kiểm tra email để xác thực
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng ký thành công, vui lòng kiểm tra email để xác thực
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc email đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Email không hợp lệ')
      .isLength({ max: 100 })
      .withMessage('Email không được vượt quá 100 ký tự')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6, max: 100 })
      .withMessage('Mật khẩu phải có từ 6 đến 100 ký tự'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Tên là bắt buộc')
      .isLength({ max: 100 })
      .withMessage('Tên không được vượt quá 100 ký tự'),
    body('phone')
      .optional({ nullable: true })
      .isMobilePhone('vi-VN')
      .withMessage('Số điện thoại không hợp lệ'),
    validateRequest
  ],
  AuthController.register
);

/**

 * /auth/login:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đăng nhập tài khoản
 *     description: Xác thực thông tin đăng nhập và trả về access token nếu thành công
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Thông tin đăng nhập không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Sai thông tin đăng nhập hoặc tài khoản chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
    validateRequest
  ],
  AuthController.login
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth Service]
 *     summary: Lấy thông tin người dùng hiện tại
 *     description: Trả về thông tin của người dùng đang đăng nhập
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', auth.auth, AuthController.getCurrentUser);

/**

 * /auth/change-password:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đổi mật khẩu
 *     description: Đổi mật khẩu cho tài khoản hiện tại
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu hiện tại không đúng hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/change-password',
  [
    auth.auth,
    body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    validateRequest
  ],
  AuthController.changePassword
);

/**

 * /auth/forgot-password:
 *   post:
 *     tags: [Auth Service]
 *     summary: Yêu cầu đặt lại mật khẩu
 *     description: Gửi email chứa liên kết đặt lại mật khẩu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Đã gửi email đặt lại mật khẩu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Vui lòng kiểm tra email để đặt lại mật khẩu
 *       404:
 *         description: Không tìm thấy tài khoản với email này
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    validateRequest
  ],
  AuthController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đặt lại mật khẩu mới
 *     description: Đặt lại mật khẩu mới bằng token từ email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token từ email đặt lại mật khẩu
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đặt lại mật khẩu thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token là bắt buộc'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    validateRequest
  ],
  AuthController.resetPassword
);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     tags: [Auth Service]
 *     summary: Xác thực email bằng token
 *     description: Xác thực địa chỉ email bằng token từ liên kết trong email
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token xác thực email
 *     responses:
 *       200:
 *         description: Xác thực email thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xác thực email thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/verify-email',
  [
    query('token').notEmpty().withMessage('Token là bắt buộc'),
    validateRequest
  ],
  AuthController.verifyEmail
);

/**

 * /auth/resend-verification-email:
 *   post:
 *     tags: [Auth Service]
 *     summary: Gửi lại email xác thực
 *     description: Gửi lại email chứa liên kết xác thực
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Đã gửi lại email xác thực
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đã gửi lại email xác thực, vui lòng kiểm tra hộp thư
 *       400:
 *         description: Email đã được xác thực hoặc không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/resend-verification-email',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    validateRequest
  ],
  AuthController.resendVerificationEmail
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags: [Auth Service]
 *     summary: Làm mới access token
 *     description: |
 *       Tạo mới access token từ refresh token.
 *       Refresh token có thời hạn 7 ngày.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token đã được cấp khi đăng nhập
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Làm mới token thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Refresh token không hợp lệ hoặc thiếu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Refresh token hết hạn hoặc không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token là bắt buộc'),
    validateRequest
  ],
  AuthController.refreshToken
);

/**

 * /auth/logout:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đăng xuất
 *     description: Đăng xuất tài khoản và vô hiệu hóa token hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng xuất thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', auth.auth, AuthController.logout);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đăng nhập tài khoản
 *     description: Đăng nhập bằng email và mật khẩu
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Email hoặc mật khẩu không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
    validateRequest
  ],
  AuthController.login
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth Service]
 *     summary: Đổi mật khẩu
 *     description: Đổi mật khẩu cho tài khoản đang đăng nhập
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu hiện tại
 *                 example: "oldPassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới (tối thiểu 6 ký tự)
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đổi mật khẩu thành công"
 *       400:
 *         description: Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/change-password',
  [
    auth.auth,
    body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    validateRequest
  ],
  AuthController.changePassword
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth Service]
 *     summary: Yêu cầu đặt lại mật khẩu
 *     description: Gửi email chứa liên kết đặt lại mật khẩu
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email đã đăng ký
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email đặt lại mật khẩu đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn"
 *       400:
 *         description: Email không tồn tại hoặc có lỗi xảy ra
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    validateRequest
  ],
  AuthController.forgotPassword
);

/**
 * @swagger
 * /auth/resend-verification-email:
 *   post:
 *     tags: [Auth Service]
 *     summary: Gửi lại email xác thực
 *     description: Gửi lại email xác thực cho tài khoản chưa được xác thực
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email cần gửi lại xác thực
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Email xác thực đã được gửi lại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Email xác thực đã được gửi đến địa chỉ email của bạn"
 *       400:
 *         description: Email không tồn tại hoặc đã được xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/resend-verification-email',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    validateRequest
  ],
  AuthController.resendVerificationEmail
);

export default router;
