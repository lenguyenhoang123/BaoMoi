import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/user.model';
import authService from '../services/auth.service';
import logger from '../utils/logger';
import type { IRegisterRequest } from '../interfaces/auth.interface';

// Biểu thức chính quy kiểm tra định dạng email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthController {
  /**
   * Lấy thông tin người dùng đang đăng nhập
   * @returns Thông tin người dùng nếu thành công
   */
  public static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Không có thông tin xác thực' });
      }

      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }
      });

      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xử lý yêu cầu đăng xuất
   * @returns Thông báo đăng xuất thành công
   */
  public static async logout(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Có thể thêm logic vô hiệu hóa token tại đây nếu cần
      return res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xác thực email bằng mã OTP
   */
  public static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email và mã OTP là bắt buộc'
        });
      }

      const result = await authService.verifyEmail(email, otp);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gửi lại mã OTP xác thực email
   */
  public static async resendOtp(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email là bắt buộc'
        });
      }

      const result = await authService.resendOtp(email);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng ký tài khoản mới
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      logger.info(`🔵 [REGISTER] Nhận yêu cầu đăng ký mới: ${JSON.stringify({ body: req.body })}`);

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn(`🔴 [REGISTER] Lỗi validate dữ liệu: ${JSON.stringify({ errors: errors.array() })}`);
        return res.status(400).json({
          success: false,
          message: 'Lỗi xác thực dữ liệu',
          errors: errors.array()
        });
      }

      const { email, password, full_name, otp } = req.body as IRegisterRequest;

      // Kiểm tra định dạng email
      if (!EMAIL_REGEX.test(email)) {
        logger.warn(`🔴 [REGISTER] Định dạng email không hợp lệ: ${email}`);
        return res.status(400).json({
          success: false,
          message: 'Định dạng email không hợp lệ'
        });
      }

      // Kiểm tra độ mạnh mật khẩu
      if (password.length < 6) {
        logger.warn('🔴 [REGISTER] Mật khẩu quá ngắn');
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }

      // Nếu có OTP, thực hiện xác thực
      if (otp) {
        try {
          const result = await authService.verifyEmail(email, otp);

          // Nếu xác thực thành công, đăng nhập luôn cho user
          return res.status(200).json({
            success: true,
            message: 'Xác thực và đăng ký tài khoản thành công!',
            user: result.user,
            token: result.token
          });
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
          });
        }
      }

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        logger.warn(`🔴 [REGISTER] Email đã được đăng ký: ${email}`);
        return res.status(400).json({
          success: false,
          message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.'
        });
      }

      // Nếu không có OTP, gửi mã xác thực
      try {
        // Chỉ sử dụng các trường bắt buộc
        await authService.register({
          email,
          password,
          full_name: full_name || email.split('@')[0]
        });

        logger.info(`🟢 [REGISTER] Đăng ký thành công, yêu cầu xác thực email: ${email}`);
        return res.status(201).json({
          success: true,
          message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
          requiresVerification: true
        });
      } catch (error: any) {
        logger.error(`🔴 [REGISTER] Lỗi khi đăng ký: ${error.message || error}`);

        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            success: false,
            message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.'
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      logger.error(`🔴 [REGISTER] Lỗi không mong muốn trong quá trình đăng ký: ${error instanceof Error ? error.message : String(error)}`);
      next(error);
    }
  }

  /**
   * Đăng nhập
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email và mật khẩu là bắt buộc'
        });
      }

      // Kiểm tra định dạng email
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng email không hợp lệ'
        });
      }

      // Gọi service đăng nhập
      const result = await authService.login(email, password);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quên mật khẩu
   */
  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email là bắt buộc'
        });
      }

      const result = await authService.forgotPassword(email);

      // Trả về kết quả từ service
      const statusCode = result.success ? 200 : 400;
      return res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đặt lại mật khẩu
   */
  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token và mật khẩu mới là bắt buộc'
        });
      }

      const result = await authService.resetPassword(token, newPassword);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xác thực email bằng token
   */
  public static async verifyEmailByToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token xác thực là bắt buộc'
        });
      }

      const result = await authService.verifyEmailByToken(token as string);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gửi lại email xác thực
   */
  public static async resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email là bắt buộc'
        });
      }

      const success = await authService.resendVerificationEmail(email);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư đến của bạn.'
      });
    } catch (error) {
      logger.error(`Lỗi trong quá trình gửi lại email xác thực: ${error instanceof Error ? error.message : String(error)}`);
      next(error);
    }
  }

  /**
   * Đổi mật khẩu
   */
  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng'
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
        });
      }

      const success = await authService.changePassword(userId, currentPassword, newPassword);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Làm mới token
   */
  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token là bắt buộc'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      if (!result) {
        return res.status(401).json({
          success: false,
          message: 'Không thể làm mới token. Vui lòng đăng nhập lại.'
        });
      }

      return res.status(200).json({
        success: true,
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
