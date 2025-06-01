import api from './api';

// Maximum number of retries for failed requests
const MAX_RETRIES = 2;
// Delay between retries in milliseconds
const RETRY_DELAY = 1000;

/**
 * Retry a failed request with exponential backoff
 */
async function fetchWithRetry(url: string, options: any = {}, retries = 0): Promise<any> {
  try {
    const response = await api({
      url,
      ...options,
      params: options.params || {},
    });
    return response.data;
  } catch (error: any) {
    if (retries < MAX_RETRIES) {
      console.warn(`[NewsService] Retrying (${retries + 1}/${MAX_RETRIES}) ${options.method || 'GET'} ${url}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

export const newsService = {
  /**
   * Lấy danh sách tin tức
   * @param params Tham số tìm kiếm và phân trang
   */
  getNews: async (params: any = {}) => {
    try {
      console.log('🔍 [NewsService] Fetching news with params:', params);
      
      // Thêm thông tin yêu cầu vào params
      const requestParams = {
        ...params,
        _requestInfo: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'newsService.getNews',
          debug: true
        })
      };
      
      console.log('🚀 [NewsService] Sending request to /api/posts with params:', requestParams);
      
      const response = await api.get('/api/posts', { 
        params: requestParams,
        paramsSerializer: params => {
          console.log('📤 [NewsService] Serialized params:', params);
          return new URLSearchParams(params).toString();
        }
      });
      
      console.log('✅ [NewsService] Received response:', response);
      
      if (!response) {
        console.error('❌ [NewsService] No response received');
        throw new Error('Không nhận được phản hồi từ máy chủ');
      }
      
      if (!response.data) {
        console.error('❌ [NewsService] No data in response:', response);
        throw new Error('Dữ liệu trả về không hợp lệ');
      }
      
      console.log('📦 [NewsService] Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Lỗi khi lấy danh sách tin tức:', {
        error: error.message,
        status: error.response?.status,
        url: error.config?.url,
        params: error.config?.params,
        timestamp: new Date().toISOString()
      });
      
      // Xử lý lỗi cụ thể
      let errorMessage = 'Không thể tải danh sách tin tức';
      
      if (error.response?.status === 500) {
        errorMessage = 'Dịch vụ tin tức đang gặp sự cố. Vui lòng thử lại sau ít phút.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy dữ liệu tin tức';
      } else if (!navigator.onLine) {
        errorMessage = 'Mất kết nối mạng. Vui lòng kiểm tra kết nối của bạn.';
      }
      
      const customError = new Error(errorMessage);
      (customError as any).isCustom = true;
      throw customError;
    }
  },

  /**
   * Get news article by ID
   * @param id News article ID
   */
  getNewsById: async (id: string) => {
    try {
      return await fetchWithRetry(`/api/posts/${id}`);
    } catch (error: any) {
      console.error(`[NewsService] Failed to fetch news item ${id}:`, error);
      
      const errorMessage = error.status === 404
        ? 'Không tìm thấy bài viết yêu cầu.'
        : 'Không thể tải chi tiết bài viết. Vui lòng thử lại sau.';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get news by category
   * @param categoryId Category ID
   * @param params Pagination parameters
   */
  getNewsByCategory: async (categoryId: string, params: any = {}) => {
    try {
      return await fetchWithRetry(`/api/categories/${categoryId}/posts`, { params });
    } catch (error: any) {
      console.error(`[NewsService] Failed to fetch news for category ${categoryId}:`, error);
      
      const errorMessage = error.status === 404
        ? 'Không tìm thấy danh mục yêu cầu.'
        : 'Không thể tải tin tức theo danh mục. Vui lòng thử lại sau.';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Search for news articles
   * @param query Search query
   * @param params Additional parameters
   */
  searchNews: async (query: string, params: any = {}) => {
    try {
      return await fetchWithRetry('/api/posts/search', {
        params: {
          q: query,
          ...params
        }
      });
    } catch (error: any) {
      console.error('[NewsService] News search failed:', error);
      
      const errorMessage = error.status === 400
        ? 'Từ khóa tìm kiếm không hợp lệ.'
        : 'Có lỗi xảy ra khi tìm kiếm tin tức. Vui lòng thử lại sau.';
      
      throw new Error(errorMessage);
    }
  }
};

export default newsService;
