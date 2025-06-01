import axios from 'axios';

/**
 * Tạo instance axios mặc định với cấu hình cơ bản
 * - baseURL: URL gốc của API
 * - withCredentials: Bật gửi cookie trong các yêu cầu cross-site
 * - headers: Cấu hình headers mặc định
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor để tự động thêm token vào header của mỗi yêu cầu
 * Nếu có token trong localStorage hoặc sessionStorage, nó sẽ được thêm vào header Authorization
 */
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage hoặc sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Nếu có token, thêm vào header
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Xử lý lỗi chung cho tất cả các phản hồi từ API
 * - Tự động làm mới token nếu hết hạn (lỗi 401)
 * - Xử lý các lỗi khác và trả về thông báo phù hợp
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Nếu lỗi 401 và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Thử refresh token
        const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Lưu token mới
          const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
          storage.setItem('token', token);
          if (newRefreshToken) {
            storage.setItem('refreshToken', newRefreshToken);
          }
          
          // Thử lại request ban đầu với token mới
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh token thất bại, đăng xuất
        console.error('Không thể làm mới phiên đăng nhập', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        window.location.href = '/dang-nhap';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle response errors
    if (error.response) {
      const { status, data, config } = error.response;
      const requestUrl = config?.url || 'unknown';
      
      console.error(`[API] Request failed: ${config?.method?.toUpperCase()} ${requestUrl}`, {
        status,
        data,
        headers: error.response.headers,
      });
      
      if (status === 401) {
        console.error('[API] Authentication error, please login again');
        // Clear tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        
        // Only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/dang-nhap')) {
          window.location.href = '/dang-nhap';
        }
      } else if (status === 403) {
        console.error('[API] Access denied: You do not have permission to access this resource');
      } else if (status === 404) {
        console.error(`[API] Resource not found: ${requestUrl}`);
      } else if (status >= 500) {
        console.error(`[API] Server error (${status}) on ${requestUrl}`);
      }
      
      // Xử lý thông báo lỗi chi tiết hơn
      let errorMessage = data?.message || 'Có lỗi xảy ra';
      
      // Xử lý lỗi cụ thể từ Posts Service
      if (requestUrl.includes('/posts') && status === 500) {
        errorMessage = 'Không thể kết nối đến dịch vụ bài viết. Vui lòng thử lại sau.';
        console.error('[API] Lỗi Posts Service:', {
          status,
          url: requestUrl,
          method: config?.method,
          error: data?.error || 'Không có thông tin lỗi chi tiết',
          timestamp: new Date().toISOString()
        });
      } else if (status >= 500) {
        errorMessage = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
      }
      
      return Promise.reject({
        status,
        message: errorMessage,
        error: data?.error || error.message || 'Lỗi không xác định',
        data: data?.data || null,
        url: requestUrl,
        method: config?.method,
        timestamp: new Date().toISOString(),
        serverError: data?.error // Thêm thông tin lỗi từ server nếu có
      });
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] No response received:', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        timeoutErrorMessage: error.config?.timeout ? 'Request timed out' : undefined,
      });
      
      return Promise.reject({
        status: 0,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.',
        error: 'Network Error',
        data: null,
        url: error.config?.url,
        method: error.config?.method,
      });
      
    } else {
      // Something happened in setting up the request
      console.error('[API] Request setup error:', error.message);
      
      return Promise.reject({
        status: -1,
        message: 'Lỗi khi thiết lập yêu cầu',
        error: error.message || 'Unknown error',
        data: null,
      });
    }
  }
);

/**
 * API cho các chức năng xác thực người dùng
 * Bao gồm đăng nhập, đăng xuất, lấy thông tin người dùng, làm mới token
 */
export const authApi = {
  /**
   * Đăng nhập người dùng
   * @param credentials Thông tin đăng nhập (email và mật khẩu)
   */
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Đăng xuất người dùng
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Làm mới access token bằng refresh token
   */
  refreshToken: async () => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },
};

/**
 * API cho các chức năng quản lý bài viết
 * Bao gồm lấy danh sách, tạo mới, cập nhật, xóa và xem chi tiết bài viết
 */
export const postApi = {
  /**
   * Lấy danh sách bài viết
   * @param params Các tham số lọc và phân trang
   */
  getPosts: async (params: any = {}) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  /**
   * Tạo bài viết mới
   * @param data Dữ liệu bài viết mới
   */
  createPost: async (data: any) => {
    const response = await api.post('/posts', data);
    return response.data;
  },

  /**
   * Cập nhật thông tin bài viết
   * @param id ID của bài viết cần cập nhật
   * @param data Dữ liệu cập nhật
   */
  updatePost: async (id: string, data: any) => {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  },

  /**
   * Xóa bài viết
   * @param id ID của bài viết cần xóa
   */
  deletePost: async (id: string) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết bài viết
   * @param id ID của bài viết cần lấy thông tin
   */
  getPost: async (id: string) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },
};

/**
 * API cho các chức năng quản lý danh mục
 * Bao gồm lấy danh sách, tạo mới, cập nhật, xóa và xem chi tiết danh mục
 */
export const categoryApi = {
  /**
   * Lấy danh sách tất cả danh mục
   * @param params Các tham số lọc và phân trang
   */
  getCategories: async (params: any = {}) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  /**
   * Tạo danh mục mới
   * @param data Dữ liệu danh mục mới
   */
  createCategory: async (data: any) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  /**
   * Cập nhật thông tin danh mục
   * @param id ID của danh mục cần cập nhật
   * @param data Dữ liệu cập nhật
   */
  updateCategory: async (id: string, data: any) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Xóa danh mục
   * @param id ID của danh mục cần xóa
   */
  deleteCategory: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết danh mục
   * @param id ID của danh mục cần lấy thông tin
   */
  getCategory: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
};

export default api;
