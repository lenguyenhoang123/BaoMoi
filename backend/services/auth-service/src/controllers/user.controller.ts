import { Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';
import { IAuthRequest } from '../interfaces/auth.interface';

export class UserController {
  /**
   * Lấy danh sách người dùng (phân trang, tìm kiếm)
   */
  public static async getAllUsers(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: { [key: string]: any } = {};
      if (search) {
        whereClause[Op.or] = [
          { email: { [Op.like]: `%${search}%` } },
          { full_name: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin người dùng theo ID
   */
  public static async getUserById(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy thông tin người dùng hiện tại
   */
  public static async getCurrentUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng',
        });
      }

      // Lấy thông tin đầy đủ từ database
      const userData = await User.findByPk(user.id, {
        attributes: { exclude: ['password'] },
      });

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      return res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tạo người dùng mới (admin)
   */
  public static async createUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, password, full_name, role = 'user' } = req.body;

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng',
        });
      }

      // Tạo người dùng mới
      const user = await User.create({
        email,
        password,
        full_name,
        role,
        is_active: true,
        email_verified: true, // Admin tạo thì mặc định đã xác thực email
      });

      // Loại bỏ password trước khi trả về
      const userJson = user.toJSON();
      if ('password' in userJson) {
        delete userJson.password;
      }

      return res.status(201).json({
        success: true,
        data: userJson,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cập nhật thông tin người dùng
   */
  public static async updateUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { email, full_name, role } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      // Cập nhật thông tin
      if (email) user.email = email;
      if (full_name) user.full_name = full_name;
      if (role) user.role = role;

      await user.save();

      // Loại bỏ password trước khi trả về
      const userJson = user.toJSON();
      if ('password' in userJson) {
        delete userJson.password;
      }

      return res.status(200).json({
        success: true,
        data: userJson,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xóa người dùng
   */
  public static async deleteUser(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      // Không cho xóa chính mình
      if (req.user && req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa tài khoản của chính bạn',
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      await user.destroy();

      return res.status(200).json({
        success: true,
        message: 'Xóa người dùng thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đổi mật khẩu
   */
  public static async changePassword(req: IAuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy thông tin xác thực',
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      // Kiểm tra mật khẩu hiện tại
      const isPasswordValid = await user.authenticate(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng',
        });
      }

      // Cập nhật mật khẩu mới
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
