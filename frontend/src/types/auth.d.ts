// Định nghĩa kiểu dữ liệu cho xác thực người dùng
declare namespace Auth {
  // Thông tin người dùng
  interface User {
    id: string;
    email: string;
    username?: string;
    name?: string;
    avatar?: string;
    role?: string;
    [key: string]: any; // Cho phép thêm các trường khác nếu cần
  }

  // Thông tin đăng nhập
  interface Credentials {
    username: string;
    password: string;
    rememberMe?: boolean;
  }

  // Dữ liệu đăng ký
  interface RegisterData {
    email: string;
    password: string;
    confirmPassword?: string; // Chỉ cần thiết ở phía frontend
    full_name: string; // Tên đầy đủ của người dùng
    otp?: string; // Mã OTP xác thực (tùy chọn)
    [key: string]: any; // Cho phép thêm các trường khác nếu cần
  }

  // Phản hồi từ API
  interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    token?: string;
    user?: User;
    chiTiet?: string; // Thông tin chi tiết (thường dùng trong response tiếng Việt)
    errors?: Record<string, string[]>;
    requiresVerification?: boolean; // Có cần xác thực OTP không
    [key: string]: any; // Cho phép thêm các trường khác
  }

  // Phản hồi đăng ký
  interface RegisterResponse extends ApiResponse {
    requiresVerification: boolean; // Có cần xác thực OTP không
    user?: User;
    token?: string;
  }

  // Phản hồi đăng nhập
  interface LoginResponse extends ApiResponse {
    thanhCong?: boolean; // Trạng thái thành công (tiếng Việt)
    chiTiet?: string;    // Thông tin chi tiết (tiếng Việt)
    user?: User;
    token?: string;
    data?: {
      user?: User;
      token?: string;
      [key: string]: any;
    };
    [key: string]: any; // Cho phép thêm các trường khác
  }

  // Phản hồi thông tin người dùng
  interface ProfileResponse extends ApiResponse {
    data?: {
      user: User;
    };
  }
}

export type { Auth };

// Định nghĩa global để có thể sử dụng ở mọi nơi
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // Thêm các thuộc tính tùy chỉnh nếu cần
    }
  }
}
