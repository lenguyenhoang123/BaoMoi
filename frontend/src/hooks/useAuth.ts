import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoginCredentials, RegisterData, User, authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  getCurrentUser: () => Promise<User>;
  updateUser: (userData: Partial<User>) => void;
  error: string | null;
  clearError: () => void;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Xóa tất cả dữ liệu xác thực
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }, []);

  // Khởi tạo auth state từ storage
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (storedToken) {
        try {
          // Kiểm tra token và lấy thông tin user
          const response = await authService.getCurrentUser();
          
          if (response && response.success && response.user) {
            setUser(response.user);
            setToken(storedToken);
          } else {
            console.error('Không thể lấy thông tin người dùng:', response?.message);
            clearAuthData();
          }
        } catch (err) {
          console.error('Token không hợp lệ, xóa token cũ:', err);
          clearAuthData();
        }
      }
    } catch (err) {
      console.error('Lỗi khi khởi tạo xác thực:', err);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData]);

  // Khởi tạo khi component mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Xử lý đăng nhập
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Bắt đầu quá trình đăng nhập...');
      const response = await authService.login(credentials);
      console.log('Phản hồi từ authService.login:', response);
      
      if (response && response.success) {
        // Kiểm tra cả response.data và response.data.user (tùy thuộc vào cấu trúc trả về)
        const userData = response.data || response.user || null;
        
        if (!userData) {
          console.warn('Không nhận được thông tin người dùng từ phản hồi, thử lấy lại...');
          // Thử lấy lại thông tin người dùng nếu không có trong phản hồi
          const userResponse = await authService.getCurrentUser();
          if (userResponse && userResponse.success && (userResponse.data || userResponse.user)) {
            const user = userResponse.data || userResponse.user;
            if (user) {
              setUser(user);
              // Lưu token từ response đăng nhập ban đầu
              setToken(response.token);
              console.log('Đã cập nhật thông tin người dùng từ getCurrentUser');
            } else {
              throw new Error('Không tìm thấy thông tin người dùng');
            }
          } else {
            throw new Error(userResponse?.message || 'Không thể lấy thông tin người dùng');
          }
        } else {
          setUser(userData);
          setToken(response.token);
          console.log('Đã cập nhật thông tin người dùng từ phản hồi đăng nhập');
        }
        
        // Lưu token vào storage tương ứng
        const storage = credentials.rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', response.token);
        
        console.log('Đăng nhập thành công, đang chuyển hướng...');
        // Chuyển hướng về trang chủ
        router.push('/');
        router.refresh(); // Làm mới dữ liệu
      } else {
        throw new Error(response?.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      console.error('Lỗi khi đăng nhập:', err);
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng ký
  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.register(data);
      
      if (response.success && !response.requiresVerification) {
        // Nếu không cần xác thực email, tự động đăng nhập
        await login({
          email: data.email,
          password: data.password,
          rememberMe: true
        });
      }
      
      return {
        requiresVerification: response.requiresVerification || false,
        message: response.message
      };
    } catch (err: any) {
      console.error('Lỗi khi đăng ký:', err);
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng xuất
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      // Xóa thông tin đăng nhập
      setUser(null);
      setToken(null);
      clearAuthData();
      
      // Chuyển hướng về trang xác thực email
      router.push('/auth/verify-email');
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
      setError('Đã xảy ra lỗi khi đăng xuất');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Làm mới token
  const refreshToken = async (): Promise<string | null> => {
    try {
      const { token: newToken } = await authService.refreshToken();
      
      if (newToken) {
        // Cập nhật token trong storage
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('token', newToken);
        setToken(newToken);
        return newToken;
      }
      
      return null;
    } catch (error) {
      console.error('Lỗi khi làm mới token:', error);
      await logout();
      return null;
    }
  };

  // Lấy thông tin user hiện tại
  const getCurrentUser = async (): Promise<User> => {
    try {
      const response = await authService.getCurrentUser();
      
      if (!response || !response.success || !response.user) {
        throw new Error(response?.message || 'Không thể lấy thông tin người dùng');
      }
      
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      await logout();
      throw error;
    }
  };

  // Cập nhật thông tin user
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Xóa lỗi
  const clearError = () => {
    setError(null);
  };

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    updateUser,
    error,
    clearError,
  };
};
