import { api } from './api';

/**
 * Lấy danh sách tất cả danh mục
 */
export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết một danh mục theo ID
 */
export const getCategoryById = async (id: string | number) => {
  try {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin danh mục ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo mới một danh mục
 */
export const createCategory = async (categoryData: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}) => {
  try {
    const response = await api.post('/categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo mới danh mục:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin một danh mục
 */
export const updateCategory = async (
  id: string | number,
  categoryData: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: number | null;
    isActive?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
  }
) => {
  try {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật danh mục ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa một danh mục
 */
export const deleteCategory = async (id: string | number) => {
  try {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa danh mục ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách bài viết theo danh mục
 */
export const getPostsByCategory = async (categoryId: string | number, params?: any) => {
  try {
    const response = await api.get(`/categories/${categoryId}/posts`, { params });
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách bài viết của danh mục ${categoryId}:`, error);
    throw error;
  }
};
