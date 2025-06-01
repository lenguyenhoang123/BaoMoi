'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/api';

// Định nghĩa lại kiểu User để phù hợp với dự án
export interface User {
  id: string | number;
  username: string;
  email?: string;
  full_name: string;
  avatar?: string;
  role?: string;
  email_verified?: boolean;
  phone?: string;
  [key: string]: any; // Cho phép thêm các trường khác nếu cần
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User>; // Cập nhật kiểu trả về thành Promise<User>
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Hàm tải thông tin người dùng
  const loadUserProfile = async (): Promise<User> => {
    try {
      console.log('🔄 Đang tải thông tin người dùng...');
      
      const response = await authApi.getMe();
      
      console.log('✅ API /me response:', response);
      
      // Xử lý trường hợp response có thể chứa data hoặc chính là dữ liệu user
      const userData = response.data || response;
      
      if (!userData) {
        throw new Error('Không có dữ liệu người dùng từ API');
      }
      
      console.log('📊 Dữ liệu người dùng từ API /me:', userData);
      
      // Tạo đối tượng user với các trường mặc định
      const userObject: User = {
        id: userData.id || '',
        username: userData.username || userData.email || '',
        email: userData.email || '',
        name: userData.name || userData.full_name || userData.email?.split('@')[0] || 'User',
        full_name: userData.full_name || userData.name || userData.email?.split('@')[0] || 'User',
        phone: userData.phone || '',
        avatar: userData.avatar || userData.image || '',
        role: userData.role || 'user',
        email_verified: userData.email_verified || userData.verified || userData.verified_at !== null || false,
        // Thêm tất cả các trường khác từ userData
        ...userData
      };
      
      // Log chi tiết để debug
      console.log('🔍 Dữ liệu user từ API (raw):', userData);
      console.log('🔄 Dữ liệu user đã xử lý:', userObject);
      
      console.log('✅ Đã tạo user object thành công');
      return userObject;
      
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error);
      throw error;
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Kiểm tra cả localStorage và sessionStorage cho token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const userProfile = await loadUserProfile();
          setUser(userProfile);
        } catch (error) {
          console.error('Không thể tải thông tin người dùng:', error);
          // Xóa token nếu không thể tải thông tin người dùng
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        // Xóa token nếu có lỗi
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const { email, password, rememberMe = true } = credentials;
      
      // Sử dụng fetch thay vì authApi để tránh bị intercept bởi axios
      const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/login`;
      console.log('🌐 Gửi yêu cầu đăng nhập đến:', loginUrl);
      console.log('📝 Dữ liệu gửi đi:', { email: credentials.email, password: '[MASKED]' });
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }
      
      if (!data.token) {
        throw new Error('Không nhận được token từ máy chủ');
      }
      
      console.log('✅ Đăng nhập thành công, nhận được token:', data.token ? 'Có token' : 'Không có token');
      
      // Lưu token vào localStorage nếu người dùng chọn "Ghi nhớ đăng nhập"
      if (rememberMe) {
        console.log('💾 Lưu token vào localStorage');
        localStorage.setItem('token', data.token);
      } else {
        // Nếu không chọn ghi nhớ, chỉ lưu vào sessionStorage
        console.log('💾 Lưu token vào sessionStorage');
        sessionStorage.setItem('token', data.token);
      }
      
      // Gọi API /me để lấy thông tin user mới nhất
      try {
        console.log('🔄 Đang lấy thông tin người dùng từ /api/auth/me...');
        const meUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/me`;
        const userResponse = await fetch(meUrl, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!userResponse.ok) {
          throw new Error('Không thể lấy thông tin người dùng');
        }
        
        const userData = await userResponse.json();
        
        // Tạo đối tượng user từ dữ liệu trả về
        const userProfile: User = {
          id: userData.id || '',
          username: userData.email || '',
          email: userData.email || '',
          name: userData.full_name || userData.email?.split('@')[0] || 'User',
          full_name: userData.full_name || userData.email?.split('@')[0] || 'User',
          phone: userData.phone || '',
          avatar: userData.avatar || '',
          role: userData.role || 'user',
          email_verified: userData.email_verified || userData.verified_at !== null,
          ...userData
        };
        
        console.log('👤 Thông tin người dùng đã nhận được:', userProfile);
        
        // Cập nhật state user - điều này sẽ trigger re-render các component sử dụng useAuth()
        setUser(userProfile);
        
        // Lưu thông tin user vào localStorage để giữ trạng thái đăng nhập
        localStorage.setItem('user', JSON.stringify(userProfile));
        console.log('💾 Đã lưu thông tin người dùng vào localStorage');
        
        // Chuyển hướng về trang chủ
        console.log('🔄 Đang chuyển hướng về trang chủ...');
        router.push('/');
        
        // Không cần gọi router.refresh() vì setUser đã trigger re-render
      } catch (error) {
        console.error('❌ Lỗi khi lấy thông tin người dùng:', error);
        throw new Error('Không thể tải thông tin người dùng');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi đăng nhập');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Đang đăng xuất...');
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('🔑 Token hiện tại:', token ? 'Có token' : 'Không có token');
      
      if (token) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
        } catch (error) {
          console.error('Lỗi khi gọi API logout:', error);
          // Vẫn tiếp tục xử lý đăng xuất ngay cả khi gọi API logout thất bại
        }
      }
      
      console.log('🧹 Đang xóa dữ liệu đăng nhập...');
      // Xóa token và thông tin người dùng
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      console.log('✅ Đã đăng xuất thành công, chuyển hướng về trang đăng nhập');
      // Chuyển hướng về trang đăng nhập
      router.push('/dang-nhap');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      // Vẫn xóa token và thông tin người dùng ngay cả khi gọi API logout thất bại
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      router.push('/dang-nhap');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userProfile = await loadUserProfile();
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Lỗi khi làm mới thông tin người dùng:', error);
      // Xóa token nếu không thể làm mới thông tin người dùng
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Giá trị context
  const contextValue = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export default AuthContext;
