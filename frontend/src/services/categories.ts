import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '@/config/api';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Cho phép gửi cookie xác thực
});

// Interface cho dữ liệu danh mục
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface cho phản hồi từ API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Xử lý lỗi chung
const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message || defaultMessage;
    console.error(`[API Error] ${message}`, error);
    throw new Error(message);
  }
  console.error(`[API Error] ${defaultMessage}`, error);
  throw new Error(defaultMessage);
};

/**
 * Lấy danh sách tất cả danh mục
 * @returns {Promise<Array>} Danh sách các danh mục
 */
/**
 * Lấy thông tin danh mục theo slug
 * @param {string} slug - Slug của danh mục cần lấy
 * @returns Danh sách các danh mục
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    console.log('Đang gọi API lấy danh sách danh mục...');
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { _t: Date.now() } // Tránh cache
    });
    
    console.log('Nhận được phản hồi từ API danh mục:', response.status);
    
    if (response.status >= 400) {
      console.error('Lỗi từ API danh mục:', response.data);
      throw new Error(response.data?.message || 'Không thể lấy danh sách danh mục');
    }
    
    // Đảm bảo luôn trả về mảng, ngay cả khi data không tồn tại
    return response.data?.data || [];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
    }
    return [];
  }
};

/**
 * Lấy thông tin danh mục theo slug
 * @param {string} slug - Slug của danh mục cần lấy
 * @returns {Promise<Object>} Thông tin chi tiết danh mục
 */
/**
 * Lấy thông tin danh mục theo slug
 * @param slug - Slug của danh mục
 * @returns Thông tin chi tiết danh mục
 */
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  try {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không tìm thấy danh mục');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error, 'Lỗi khi lấy thông tin danh mục');
  }
};

/**
 * Lấy thông tin chi tiết một danh mục theo ID
 * @param {string|number} id - ID của danh mục cần lấy
 * @returns {Promise<Object>} Thông tin chi tiết danh mục
 * @throws {Error} Nếu không tìm thấy danh mục
 */
/**
 * Lấy thông tin chi tiết một danh mục theo ID
 * @param id - ID của danh mục
 * @returns Thông tin chi tiết danh mục hoặc null nếu không tìm thấy
 */
export const getCategoryById = async (id: string | number): Promise<Category> => {
  try {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không tìm thấy danh mục');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error, 'Lỗi khi lấy thông tin danh mục');
  }
};

/**
 * Tạo mới một danh mục
 * @param categoryData - Dữ liệu danh mục mới
 * @returns Danh mục vừa tạo
 */
export const createCategory = async (
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Category> => {
  try {
    const response = await apiClient.post<ApiResponse<Category>>(
      '/categories',
      categoryData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không thể tạo danh mục');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error, 'Lỗi khi tạo danh mục');
  }
};

/**
 * Cập nhật thông tin một danh mục
 * @param id - ID của danh mục cần cập nhật
 * @param categoryData - Dữ liệu cập nhật
 * @returns Thông tin danh mục đã cập nhật
 * @throws {Error} Nếu không tìm thấy danh mục
 */
export const updateCategory = async (
  id: string | number,
  categoryData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Category> => {
  try {
    const response = await apiClient.put<ApiResponse<Category>>(
      `/categories/${id}`,
      categoryData
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không thể cập nhật danh mục');
    }
    return response.data.data;
  } catch (error) {
    return handleApiError(error, 'Lỗi khi cập nhật danh mục');
  }
};

/**
 * Xóa một danh mục
 * @param id - ID của danh mục cần xóa
 * @returns Kết quả xóa
 * @throws {Error} Nếu không tìm thấy danh mục
 */
export const deleteCategory = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete<ApiResponse<null>>(`/categories/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể xóa danh mục');
    }
    return { success: true, message: 'Xóa danh mục thành công' };
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa danh mục'
    };
  }
};

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  categoryId: number;
  authorId: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lấy danh sách bài viết theo danh mục
 * @param categoryId - ID của danh mục
 * @param params - Các tham số phân trang/tìm kiếm
 * @returns Danh sách bài viết và phân trang
 */
export const getPostsByCategory = async (
  categoryId: string | number,
  params: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResponse<Post>> => {
  try {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Post>>>(
      `/api/categories/${categoryId}/posts`,
      {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder
        }
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Không thể lấy danh sách bài viết');
    }

    return response.data.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách bài viết cho danh mục ${categoryId}:`, error);
    return {
      data: [],
      pagination: {
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: 0
      }
    };
  }
};
