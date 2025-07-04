/**
 * @swagger
 * components:
 *   schemas:
 *     # Schema cho yêu cầu đăng nhập
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: password123
 *
 *     # Schema cho yêu cầu đăng ký
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: password123
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: Nguyễn Văn A
 *         phone:
 *           type: string
 *           pattern: '^[0-9]{10,11}$'
 *           example: '0987654321'
 *
 *     # Schema cho yêu cầu xác thực email
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         otp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           example: "123456"
 *
 *     # Schema cho yêu cầu gửi lại OTP
 *     ResendOtpRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Đăng nhập thành công
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 60d21b4667d0d8992e610c85
 *                 name:
 *                   type: string
 *                   example: Nguyễn Văn A
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: user@example.com
 *                 role:
 *                   type: string
 *                   enum: [user, admin, moderator]
 *                   example: user
 *             accessToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             refreshToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Thông tin đăng nhập không chính xác
 *         error:
 *           type: string
 *           example: Invalid email or password
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               msg:
 *                 type: string
 *                 example: Email không hợp lệ
 *               param:
 *                 type: string
 *                 example: email
 *               location:
 *                 type: string
 *                 example: body
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Dữ liệu không hợp lệ
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ValidationErrorItem'
 *
 *     ValidationErrorItem:
 *       type: object
 *       properties:
 *         msg:
 *           type: string
 *           example: Email không hợp lệ
 *         param:
 *           type: string
 *           example: email
 *         location:
 *           type: string
 *           example: body
 */
