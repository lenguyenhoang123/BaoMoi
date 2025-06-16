import api from './api';

/**
 * Thông tin đăng nhập
 * @property {string} email - Địa chỉ email dùng để đăng nhập
 * @property {string} password - Mật khẩu tài khoản
 * @property {boolean} [rememberMe] - Có lưu đăng nhập hay không
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Dữ liệu đăng ký tài khoản
 * @property {string} email - Email dùng để đăng ký (bắt buộc)
 * @property {string} password - Mật khẩu (tối thiểu 6 ký tự)
 * @property {string} full_name - Họ và tên đầy đủ (bắt buộc)
 * @property {string} [phone] - Số điện thoại di động (tùy chọn)
 */
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

/**
 * Thông tin người dùng
 * @property {string} id - ID duy nhất của người dùng
 * @property {string} email - Địa chỉ email
 * @property {string} full_name - Họ và tên đầy đủ
 * @property {string} [phone] - Số điện thoại
 * @property {string} role - Vai trò người dùng (user, admin, editor,...)
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Phản hồi từ API khi đăng nhập
 * @property {boolean} success - Trạng thái thực hiện
 * @property {User} [data] - Thông tin người dùng (định dạng mới)
 * @property {User} [user] - Thông tin người dùng (định dạng cũ)
 * @property {string} token - Token xác thực
 * @property {string} [message] - Thông báo từ server
 */
export interface LoginResponse {
  success: boolean;
  data?: User;
  user?: User; // Để tương thích với cả hai định dạng API
  token: string;
  message?: string;
}

/**
 * Phản hồi từ API khi đăng ký
 * @property {boolean} success - Trạng thái thực hiện
 * @property {User} user - Thông tin người dùng đã đăng ký
 * @property {boolean} requiresVerification - Yêu cầu xác thực email không
 * @property {string} [message] - Thông báo từ server
 */
export interface RegisterResponse {
  success: boolean;
  user: User;
  requiresVerification: boolean;
  message?: string;
}

export const authService = {
  /**
   * Đăng nhập người dùng
   * @param credentials Thông tin đăng nhập
   * @returns Thông tin người dùng và token
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      if (!response.data || !response.data.token) {
        throw new Error('Đăng nhập thất bại: Không nhận được token từ máy chủ');
      }
      
      // Lưu token vào storage
      const storage = credentials.rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', response.data.token);
      
      console.log('Đăng nhập thành công, token đã lưu vào', 
        credentials.rememberMe ? 'localStorage' : 'sessionStorage');
      
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        message: 'Đăng nhập thành công'
      };
    } catch (error: any) {
      console.error('Lỗi khi đăng nhập:', error);
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  },

  /**
   * Đăng ký tài khoản mới
   * @param userData Thông tin đăng ký
   * @returns Thông tin người dùng đã đăng ký
   */
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
      // Chỉ gửi các trường cần thiết
      const { email, password, full_name, phone } = userData;
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
        ...(phone && { phone }) // Chỉ thêm phone nếu có giá trị
      });
      
      if (!response.data) {
        throw new Error('Không nhận được phản hồi từ máy chủ');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi đăng ký:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            'Đăng ký thất bại. Vui lòng thử lại.';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error('Đã xảy ra lỗi khi gửi yêu cầu đăng ký.');
      }
    }
  },

  /**
   * Đăng xuất
   */
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      throw error;
    }
  },

  /**
   * Làm mới token
   */
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi làm mới token:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getCurrentUser: async (): Promise<{
    success: boolean;
    data?: User;
    user?: User;
    message?: string;
    error?: any;
  }> => {
    try {
      // Lấy token từ localStorage hoặc sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        console.log('Không tìm thấy token trong storage');
        return { success: false, message: 'No token found' };
      }
      
      console.log('Lấy thông tin người dùng với token:', token.substring(0, 10) + '...');
      
      const response = await api.get('/auth/me');
      
      if (!response.data) {
        console.error('Không nhận được dữ liệu người dùng');
        return { success: false, message: 'No user data found' };
      }
      
      console.log('Thông tin người dùng:', response.data);
      
      return {
        success: true,
        user: response.data,
        message: 'Lấy thông tin người dùng thành công'
      };
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin người dùng:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Xóa token nếu không hợp lệ
      if (error.response?.status === 401) {
        console.log('Xóa token do lỗi 401');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy thông tin người dùng',
        error: error.response?.data?.error || error.message
      } as const;
    }
  },

  /**
   * Gửi yêu cầu đặt lại mật khẩu
   * @param email Email người dùng
   */
  forgotPassword: async (email: string) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu đặt lại mật khẩu:', error);
      throw error;
    }
  },

  /**
   * Đặt lại mật khẩu
   * @param token Token đặt lại mật khẩu
   * @param newPassword Mật khẩu mới
   */
  resetPassword: async (token: string, newPassword: string) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { newPassword });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi đặt lại mật khẩu:', error);
      throw error;
    }
  },
  
  /**
   * Gửi lại mã OTP xác thực
   * @param email Email cần gửi lại OTP
   */
  resendOtp: async (data: { email: string }) => {
    try {
      const response = await api.post('/auth/resend-otp', { email: data.email });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi gửi lại OTP:', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          'Không thể gửi lại mã xác thực. Vui lòng thử lại.';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error('Đã xảy ra lỗi khi gửi yêu cầu gửi lại mã xác thực.');
      }
    }
  }
};

export default authService;
