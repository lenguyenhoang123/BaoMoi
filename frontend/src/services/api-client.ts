import axios, { AxiosInstance, AxiosRequestConfig, AxiosStatic } from 'axios';
import { CreatePostRequest, UpdatePostRequest } from '@/types/post';

// Định nghĩa kiểu lỗi tùy chỉnh
export interface ApiError extends Error {
  status?: number;
  data?: any;
  timestamp?: string;
  url?: string;
  method?: string;
  serverError?: any;
}

// Lấy base URL từ biến môi trường và thêm /api vào cuối
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

// Tạo instance axios chung
const apiClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // 30 giây
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Xử lý request trước khi gửi đi
apiClient.interceptors.request.use(
  (config) => {
    // Thêm token vào header nếu có
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý response trả về
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi 429 (Too Many Requests)
    if (error.response?.status === 429) {
      console.warn('[API] Quá nhiều yêu cầu, thử lại sau');
      // TODO: Thêm cơ chế retry sau một khoảng thời gian
      return Promise.reject(error);
    }

    // Xử lý lỗi 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Thử làm mới token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${apiBaseUrl}/auth/refresh-token`, { refreshToken });
          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Lỗi khi làm mới token:', refreshError);
        // Xóa thông tin đăng nhập nếu không thể làm mới token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Chuyển hướng về trang đăng nhập
        if (typeof window !== 'undefined') {
          window.location.href = '/dang-nhap';
        }
        return Promise.reject(refreshError);
      }
    }

    // Xử lý lỗi từ server
    if (error.response) {
      const { status, data, config } = error.response;
      const requestUrl = config?.url || 'không xác định';
      const method = config?.method?.toUpperCase() || 'KHÔNG XÁC ĐỊNH';

      // Tạo thông báo lỗi chi tiết
      const errorMessage = data?.message || error.message || 'Đã xảy ra lỗi không xác định';
      const errorDetails = {
        name: `Lỗi ${status}`,
        message: errorMessage,
        status,
        data: data || {},
        timestamp: new Date().toISOString(),
        url: requestUrl,
        method,
      };

      console.error(`[API] Lỗi ${status} khi gọi ${method} ${requestUrl}:`, errorDetails);

      // Tạo đối tượng lỗi tùy chỉnh
      const apiError: ApiError = new Error(errorMessage);
      Object.assign(apiError, errorDetails);

      return Promise.reject(apiError);
    } else if (error.request) {
      // Không nhận được phản hồi từ server
      console.error('[API] Không nhận được phản hồi từ máy chủ:', error.request);
      const networkError: ApiError = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      networkError.name = 'Lỗi Mạng';
      networkError.status = 0;
      return Promise.reject(networkError);
    } else {
      // Có lỗi xảy ra khi thiết lập yêu cầu
      const errorMessage = error.message || 'Lỗi không xác định khi thiết lập yêu cầu';
      console.error('[API] Lỗi khi thiết lập yêu cầu:', errorMessage);

      const setupError: ApiError = new Error('Lỗi khi thiết lập yêu cầu');
      setupError.name = 'Lỗi Thiết Lập Yêu Cầu';
      setupError.status = -1;
      setupError.message = errorMessage;
      setupError.timestamp = new Date().toISOString();

      return Promise.reject(setupError);
    }
  }
);

// Các hàm xác thực
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh-token');
    return response.data;
  },
};

// API cho các chức năng quản lý bài viết
export const postApi = {
  getPosts: async (params: any = {}): Promise<{ data: any[]; total: number }> => {
    try {
      const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc', ...otherParams } = params;

      const queryParams: Record<string, any> = {
        page: Math.max(1, parseInt(page, 10)),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
        sortBy,
        sortOrder: ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc',
        ...(status && { status }),
        ...(search && { search: search.trim() }),
        ...otherParams
      };

      const response = await apiClient.get('/posts', { params: queryParams });
      const responseData = response.data?.data;

      if (responseData?.items) {
        return {
          data: Array.isArray(responseData.items) ? responseData.items : [],
          total: responseData.pagination?.total || 0
        };
      }

      return {
        data: Array.isArray(responseData) ? responseData : [],
        total: response.data?.pagination?.total || 0
      };
    } catch (error: any) {
      console.error('[API] Lỗi khi lấy danh sách bài viết:', {
        error: error.message,
        response: error.response?.data,
        params
      });

      throw new Error(
        error.response?.data?.message ||
        'Không thể tải danh sách bài viết. Vui lòng thử lại sau.'
      );
    }
  },

  createPost: async (data: CreatePostRequest): Promise<any> => {
    try {
      const postData = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [])
      };
      const response = await apiClient.post('/posts', postData);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi tạo bài viết:', error);
      throw error;
    }
  },

  updatePost: async (id: string, data: UpdatePostRequest): Promise<any> => {
    try {
      const postData = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [])
      };
      const response = await apiClient.put(`/posts/${id}`, postData);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      throw error;
    }
  },

  deletePost: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiClient.delete(`/posts/${id}`);
      return response.data || { success: true };
    } catch (error: any) {
      console.error('Lỗi khi xóa bài viết:', error);
      throw error;
    }
  },

  getPost: async (id: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/posts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin bài viết:', error);
      throw error;
    }
  },

  getPostBySlug: async (slug: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/posts/slug/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin bài viết theo slug:', error);
      throw error;
    }
  },
};

// API cho các chức năng quản lý danh mục
export const categoryApi = {
  getCategories: async (params: any = {}) => {
    try {
      const response = await apiClient.get('/categories', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách danh mục:', error);
      throw error;
    }
  },

  getCategory: async (id: string) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin danh mục:', error);
      throw error;
    }
  },

  createCategory: async (data: any) => {
    try {
      const response = await apiClient.post('/categories', data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo danh mục:', error);
      throw error;
    }
  },

  updateCategory: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật danh mục:', error);
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error);
      throw error;
    }
  }
};

// Export mặc định
const api = {
  ...apiClient,
  ...authApi,
  ...postApi,
  ...categoryApi,
};

export default api;
