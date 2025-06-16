import api from './api';

/**
 * Lấy danh sách tất cả danh mục
 * @returns {Promise<Array>} Danh sách các danh mục
 */
export const getCategories = async () => {
  try {
    const response = await api.get('/api/categories');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết một danh mục theo ID
 * @param {string|number} id - ID của danh mục cần lấy
 * @returns {Promise<Object>} Thông tin chi tiết danh mục
 * @throws {Error} Nếu không tìm thấy danh mục
 */
export const getCategoryById = async (id: string | number) => {
  try {
    const response = await api.get(`/api/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin danh mục ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo mới một danh mục
 * @param {Object} categoryData - Dữ liệu danh mục mới
 * @param {string} categoryData.name - Tên danh mục (bắt buộc)
 * @param {string} [categoryData.slug] - Đường dẫn thân thiện (tự động tạo nếu không cung cấp)
 * @param {string} [categoryData.description] - Mô tả danh mục
 * @param {number} [categoryData.parentId] - ID danh mục cha (nếu có)
 * @param {boolean} [categoryData.isActive=true] - Trạng thái kích hoạt
 * @param {string} [categoryData.metaTitle] - Tiêu đề SEO
 * @param {string} [categoryData.metaDescription] - Mô tả SEO
 * @param {string} [categoryData.metaKeywords] - Từ khóa SEO
 * @returns {Promise<Object>} Danh mục vừa tạo
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
    const response = await api.post('/api/categories', categoryData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo mới danh mục:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin một danh mục
 * @param {string|number} id - ID của danh mục cần cập nhật
 * @param {Object} categoryData - Dữ liệu cập nhật
 * @param {string} [categoryData.name] - Tên danh mục
 * @param {string} [categoryData.slug] - Đường dẫn thân thiện
 * @param {string} [categoryData.description] - Mô tả
 * @param {number|null} [categoryData.parentId] - ID danh mục cha (null nếu là danh mục gốc)
 * @param {boolean} [categoryData.isActive] - Trạng thái kích hoạt
 * @param {string} [categoryData.metaTitle] - Tiêu đề SEO
 * @param {string} [categoryData.metaDescription] - Mô tả SEO
 * @param {string} [categoryData.metaKeywords] - Từ khóa SEO
 * @returns {Promise<Object>} Thông tin danh mục đã cập nhật
 * @throws {Error} Nếu không tìm thấy danh mục
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
    const response = await api.put(`/api/categories/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật danh mục ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa một danh mục
 * @param {string|number} id - ID của danh mục cần xóa
 * @returns {Promise<Object>} Kết quả xóa
 * @throws {Error} Nếu không tìm thấy danh mục
 */
export const deleteCategory = async (id: string | number) => {
  try {
    const response = await api.delete(`/api/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa danh mục ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách bài viết theo danh mục
 * @param {string|number} categoryId - ID của danh mục
 * @param {Object} [params] - Các tham số phân trang/tìm kiếm
 * @param {number} [params.page=1] - Trang hiện tại
 * @param {number} [params.limit=10] - Số lượng bài viết mỗi trang
 * @param {string} [params.search] - Từ khóa tìm kiếm
 * @returns {Promise<Object>} Danh sách bài viết và phân trang
 */
export const getPostsByCategory = async (categoryId: string | number, params?: any) => {
  try {
    const response = await api.get(`/api/categories/${categoryId}/posts`, { params });
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách bài viết của danh mục ${categoryId}:`, error);
    throw error;
  }
};
