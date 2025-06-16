import axios, { AxiosError } from 'axios';
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

// Lấy base URL từ biến môi trường, mặc định là http://localhost:3000/api
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'vi-VN', // Thêm header ngôn ngữ mặc định
  },
  withCredentials: true,
});

/**
 * Interceptor để tự động thêm token vào header của mỗi yêu cầu
 * Nếu có token trong localStorage hoặc sessionStorage, nó sẽ được thêm vào header Authorization
 */
api.interceptors.request.use(
  (config) => {
    // Thêm timestamp để tránh cache
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }

    // Lấy token từ localStorage hoặc sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Nếu có token, thêm vào header
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    console.error('❌ [API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Xử lý lỗi chung cho tất cả các phản hồi từ API
 * - Tự động làm mới token nếu hết hạn (lỗi 401)
 * - Xử lý các lỗi khác và trả về thông báo phù hợp
 */
// Cấu hình retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 giây

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Xử lý lỗi 429 (Too Many Requests)
    if (error.response?.status === 429) {
      const retryCount = originalRequest.retryCount || 0;

      // Nếu chưa vượt quá số lần thử lại tối đa
      if (retryCount < MAX_RETRIES) {
        // Tăng số lần đã thử
        originalRequest.retryCount = retryCount + 1;

        // Tính toán thời gian chờ tăng dần (exponential backoff)
        const delay = RETRY_DELAY * Math.pow(2, retryCount);

        console.log(`[API] Rate limited. Retrying (${retryCount + 1}/${MAX_RETRIES}) in ${delay}ms`);

        // Thêm delay trước khi thử lại
        await new Promise(resolve => setTimeout(resolve, delay));

        // Thử lại request
        return api(originalRequest);
      }

      // Nếu đã thử lại đủ số lần
      console.error('[API] Max retries reached for rate limited request');
      return Promise.reject({
        ...error,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
      });
    }

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
        // Xóa tất cả token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/dang-nhap';
        return Promise.reject(refreshError);
      }
    }

    // Xử lý lỗi từ phản hồi
    if (error.response) {
      const { status, data, config } = error.response;
      const requestUrl = config?.url || 'không xác định';
      const method = config?.method?.toUpperCase() || 'KHÔNG XÁC ĐỊNH';

      // Log lỗi chi tiết
      const errorDetails = {
        url: requestUrl,
        method,
        status,
        error: data?.error || data?.message || 'Không có thông tin lỗi',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          headers: error.response.headers,
          data: data,
          config: {
            ...config,
            headers: '***' // Ẩn thông tin nhạy cảm
          }
        })
      };

      console.error(`[API] Yêu cầu thất bại: ${method} ${requestUrl}`, errorDetails);

      // Xử lý các mã lỗi HTTP thông thường
      if (status === 401) {
        console.error('[API] Lỗi xác thực, vui lòng đăng nhập lại');
        // Xóa tất cả token
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');

        // Chỉ chuyển hướng nếu chưa ở trang đăng nhập
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/dang-nhap')) {
          window.location.href = '/dang-nhap';
        }
      } else if (status === 403) {
        console.error('[API] Từ chối truy cập: Bạn không có quyền truy cập tài nguyên này');
      } else if (status === 404) {
        console.error(`[API] Không tìm thấy tài nguyên: ${requestUrl}`);
      } else if (status >= 500) {
        console.error(`[API] Lỗi máy chủ (${status}) tại ${requestUrl}`);
      }

      // Xử lý thông báo lỗi chi tiết hơn
      let errorMessage = data?.message || 'Có lỗi xảy ra';

      // Xử lý lỗi cụ thể từ dịch vụ bài viết
      if (requestUrl.includes('/posts')) {
        if (status === 500) {
          errorMessage = 'Không thể kết nối đến dịch vụ bài viết. Vui lòng thử lại sau.';
          console.error('[API] Lỗi Dịch vụ Bài viết:', errorDetails);
        } else if (status === 400) {
          errorMessage = data?.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại dữ liệu.';
        } else if (status === 401) {
          errorMessage = 'Bạn cần đăng nhập để thực hiện thao tác này';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này';
        }
      } else if (status >= 500) {
        errorMessage = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
      }

      const apiError: ApiError = new Error(errorMessage);
      apiError.name = 'Lỗi API';
      apiError.status = status;
      apiError.data = data?.data || null;
      apiError.url = requestUrl;
      apiError.method = method;
      apiError.timestamp = new Date().toISOString();
      apiError.serverError = data?.error;

      return Promise.reject(apiError);

    } else if (error.request) {
      // Yêu cầu đã được gửi đi nhưng không nhận được phản hồi
      const url = error.config?.url || 'không xác định';
      const method = error.config?.method?.toUpperCase() || 'KHÔNG XÁC ĐỊNH';

      console.error('[API] Không nhận được phản hồi:', {
        url,
        phương_thức: method,
        thời_gian_chờ: error.config?.timeout,
        thông_báo_lỗi: error.config?.timeout ? 'Yêu cầu đã hết thời gian chờ' : 'Không xác định',
      });

      const networkError: ApiError = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
      networkError.name = 'Lỗi Mạng';
      networkError.status = 0;
      networkError.url = url;
      networkError.method = method;
      networkError.timestamp = new Date().toISOString();

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
  getPosts: async (params: any = {}): Promise<{ data: any[]; total: number }> => {
    try {
      // Xử lý và validate các tham số
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...otherParams
      } = params;

      // Xây dựng query parameters
      const queryParams: Record<string, any> = {
        page: Math.max(1, parseInt(page, 10)),
        limit: Math.min(100, Math.max(1, parseInt(limit, 10))),
        sortBy,
        sortOrder: ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc',
        ...(status && { status }),
        ...(search && { search: search.trim() }),
        ...otherParams
      };

      // Log thông tin request (chỉ trong môi trường development)
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] Gọi API getPosts với params:', JSON.stringify(queryParams, null, 2));
      }

      // Gọi API
      const response = await api.get('/posts', { params: queryParams });

      // Xử lý response
      const responseData = response.data?.data;

      // Kiểm tra cấu trúc dữ liệu trả về
      if (responseData?.items) {
        return {
          data: Array.isArray(responseData.items) ? responseData.items : [],
          total: responseData.pagination?.total || 0
        };
      }

      // Fallback cho cấu trúc dữ liệu cũ
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

      // Ném lỗi để component có thể xử lý
      throw new Error(
        error.response?.data?.message ||
        'Không thể tải danh sách bài viết. Vui lòng thử lại sau.'
      );
    }
  },

  /**
   * Tạo bài viết mới
   * @param data Dữ liệu bài viết mới
   */
  createPost: async (data: CreatePostRequest): Promise<any> => {
    try {
      const postData = {
        ...data,
        // Đảm bảo tags là mảng
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [])
      };
      const response = await api.post('/posts', postData);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi tạo bài viết:', error);
      throw error; // Let the error interceptor handle it
    }
  },

  /**
   * Cập nhật thông tin bài viết
   * @param id ID của bài viết cần cập nhật
   * @param data Dữ liệu cập nhật
   */
  updatePost: async (id: string, data: UpdatePostRequest): Promise<any> => {
    try {
      const postData = {
        ...data,
        // Đảm bảo tags là mảng
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : [])
      };
      const response = await api.put(`/posts/${id}`, postData);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      throw error; // Let the error interceptor handle it
    }
  },

  /**
   * Xóa bài viết
   * @param id ID của bài viết cần xóa
   */
  deletePost: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.delete(`/posts/${id}`);
      return response.data || { success: true };
    } catch (error: any) {
      console.error('Lỗi khi xóa bài viết:', error);
      throw error; // Let the error interceptor handle it
    }
  },

  /**
   * Lấy thông tin chi tiết bài viết
   * @param id ID của bài viết cần lấy thông tin
   */
  getPost: async (id: string): Promise<any> => {
    try {
      const response = await api.get(`/posts/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin bài viết:', error);
      throw error; // Let the error interceptor handle it
    }
  },

  /**
   * Lấy bài viết theo slug
   * @param slug Slug của bài viết
   */
  getPostBySlug: async (slug: string): Promise<any> => {
    try {
      const response = await api.get(`/posts/slug/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin bài viết theo slug:', error);
      throw error; // Let the error interceptor handle it
    }
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
