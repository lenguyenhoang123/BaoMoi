import api, { categoryApi } from './api';
import { AxiosError } from 'axios';

// Định nghĩa các kiểu dữ liệu
export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  is_published: boolean;
  is_featured: boolean;
  is_hot: boolean;
  view_count: number;
  category_id?: string;
  category_name: string;
  author_id?: string;
  author_name: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Cấu hình mặc định cho service
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

// Hàm trợ giúp để xử lý lỗi
const handleError = (error: unknown, defaultMessage: string): never => {
  console.error(`[NewsService] ${defaultMessage}:`, error);
  
  let errorMessage = defaultMessage;
  const axiosError = error as AxiosError;
  
  if (axiosError.response) {
    const { status, data } = axiosError.response;
    const responseData = data as { message?: string };
    
    if (status === 401) {
      errorMessage = 'Bạn cần đăng nhập để thực hiện thao tác này';
    } else if (status === 403) {
      errorMessage = 'Bạn không có quyền thực hiện thao tác này';
    } else if (status === 404) {
      errorMessage = 'Không tìm thấy dữ liệu yêu cầu';
    } else if (status === 429) {
      errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
    } else if (status && status >= 500) {
      errorMessage = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau';
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    }
  } else if (axiosError.request) {
    errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng';
  } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
    errorMessage = 'Mất kết nối mạng. Vui lòng kiểm tra kết nối của bạn';
  }
  
  const errorObj = new Error(errorMessage);
  (errorObj as { isCustom?: boolean }).isCustom = true;
  throw errorObj;
};

// Hàm định dạng dữ liệu bài viết
const formatPost = (post: unknown): NewsItem => {
  if (!post || typeof post !== 'object') {
    throw new Error('Invalid post data');
  }
  
  // Type guard để đảm bảo post là object
  const postData = post as Record<string, unknown>;
  
  const content = String(postData.content || '');

  // Xử lý tags
  let tags: string[] = [];
  if (postData.tags) {
    if (Array.isArray(postData.tags)) {
      tags = postData.tags.map(String);
    } else if (typeof postData.tags === 'string') {
      try {
        // Thử parse nếu là JSON string
        const parsed = JSON.parse(postData.tags);
        tags = Array.isArray(parsed) 
          ? parsed.map(String) 
          : [String(parsed)].filter(Boolean);
      } catch (e) {
        // Nếu không phải JSON, tách bằng dấu phẩy
        tags = String(postData.tags)
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }
    }
  }


  // Trích xuất thông tin category và author từ đối tượng lồng nhau nếu có
  const category = typeof postData.category === 'object' && postData.category !== null 
    ? postData.category as { id?: unknown; name?: unknown; slug?: unknown }
    : null;
  
  const author = typeof postData.author === 'object' && postData.author !== null
    ? postData.author as { id?: unknown; name?: unknown; email?: unknown }
    : null;

  // Định dạng ngày tháng
  const formatDate = (date: unknown): string => {
    if (!date) return new Date().toISOString();
    try {
      return new Date(String(date)).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  // Lấy các trường không nằm trong interface NewsItem
  const excludedFields = new Set([
    'id', 'title', 'slug', 'content', 'image_url', 'image', 'created_at',
    'updated_at', 'published_at', 'is_published', 'is_featured', 'is_hot',
    'view_count', 'category_id', 'category_name', 'author_id', 'author_name', 'tags',
    'category', 'author'
  ]);

  const extraFields: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(postData)) {
    if (!excludedFields.has(key)) {
      extraFields[key] = value;
    }
  }

  // Tạo đối tượng kết quả cơ bản
  const basePost: Omit<NewsItem, 'category_id' | 'author_id' | 'tags'> = {
    id: String(postData.id || ''),
    title: String(postData.title || ''),
    slug: String(postData.slug || ''),

    content,
    image_url: String(postData.image_url || postData.image || ''),
    created_at: formatDate(postData.created_at),
    updated_at: formatDate(postData.updated_at),
    published_at: postData.published_at ? formatDate(postData.published_at) : undefined,
    is_published: Boolean(postData.is_published),
    is_featured: Boolean(postData.is_featured),
    is_hot: Boolean(postData.is_hot),
    view_count: Number(postData.view_count) || 0,
    category_name: String(postData.category_name || (category?.name ? String(category.name) : '')),
    author_name: String(postData.author_name || (author?.name ? String(author.name) : ''))
  };

  // Tạo đối tượng kết quả cuối cùng
  const result: NewsItem = {
    ...basePost,
    ...(postData.category_id || category?.id ? { 
      category_id: String(postData.category_id || category?.id) 
    } : {}),
    ...(postData.author_id || author?.id ? { 
      author_id: String(postData.author_id || author?.id) 
    } : {}),
    ...(tags.length > 0 ? { tags } : {})
  } as NewsItem;

  // Thêm các trường bổ sung từ extraFields
  for (const [key, value] of Object.entries(extraFields)) {
    if (!(key in result)) {
      (result as any)[key] = value;
    }
  }

  return result;
};

export const newsService = {
  /**
   * Lấy danh sách bài viết nổi bật
   * @param params Tham số lọc và phân trang
   */
  async getFeaturedPosts(params: {
    limit?: number;
    page?: number;
  } = {}): Promise<NewsItem[]> {
    try {
      const { limit = 3, page = 1 } = params;
      console.log('Fetching featured posts with params:', { limit, page });
      
      // Sử dụng endpoint chính và thêm tham số is_featured
      const response = await api.get<ApiResponse<{ items: NewsItem[]; pagination: Pagination }>>(
        '/posts',
        { 
          params: { 
            limit, 
            page,
            is_featured: true,  // Lọc bài viết nổi bật
            status: 'published' // Chỉ lấy bài đã xuất bản
          } 
        }
      );
      
      console.log('Featured posts response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        const { items } = response.data.data;
        return Array.isArray(items) ? items.map(formatPost) : [];
      }
      return [];
    } catch (error) {
      console.error('Error in getFeaturedPosts:', error);
      return []; // Trả về mảng rỗng thay vì ném lỗi
    }
  },

  /**
   * Lấy danh sách tin tức với các tham số tìm kiếm và phân trang
   */
  getNews: async (params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
    featured?: boolean;
    [key: string]: unknown;
  } = {}): Promise<ApiResponse<{ items: NewsItem[]; pagination: Pagination }>> => {
    try {
      const { page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE, ...restParams } = params;
      
      const response = await api.get('/posts', {
        params: {
          ...restParams,
          page,
          limit,
          is_published: true,
        },
      });

      // Xử lý đa dạng định dạng response
      let items: unknown[] = [];
      let totalItems = 0;
      let totalPages = 1;

      // Kiểm tra cấu trúc response
      if (response.data?.data) {
        // Định dạng mới: { data: { items: [], pagination: {} } }
        if (response.data.data.items) {
          items = response.data.data.items || [];
          totalItems = response.data.data.pagination?.totalItems || items.length;
          totalPages = response.data.data.pagination?.totalPages || Math.ceil(totalItems / limit);
        } 
        // Định dạng cũ: { data: [], total: number }
        else if (Array.isArray(response.data.data)) {
          items = response.data.data;
          totalItems = response.data.total || items.length;
          totalPages = Math.ceil(totalItems / limit);
        }
      } 
      // Trường hợp response là mảng trực tiếp
      else if (Array.isArray(response.data)) {
        items = response.data;
        totalItems = items.length;
        totalPages = Math.ceil(totalItems / limit);
      }

      // Định dạng lại các bài viết và đảm bảo kiểu dữ liệu
      const formattedItems: NewsItem[] = items.map(item => formatPost(item));

      return {
        success: true,
        data: {
          items: formattedItems,
          pagination: {
            page,
            pageSize: limit,
            totalItems,
            totalPages
          }
        }
      };
    } catch (error) {
      throw handleError(error, 'Không thể tải danh sách tin tức');
    }
  },

  /**
   * Lấy thông tin chi tiết bài viết theo ID
   */
  getNewsById: async (id: string): Promise<NewsItem> => {
    try {
      const response = await api.get(`/posts/${id}`);
      return formatPost(response.data);
    } catch (error) {
      throw handleError(error, 'Không thể tải chi tiết bài viết');
    }
  },

  /**
   * Lấy bài viết theo slug
   */
  getNewsBySlug: async (slug: string): Promise<NewsItem | null> => {
    try {
      const response = await api.get(`/posts/slug/${slug}`);
      return response.data ? formatPost(response.data) : null;
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) {
        return null;
      }
      throw handleError(error, 'Không thể tải bài viết');
    }
  },

  /**
   * Lấy danh sách tin tức liên quan
   */
  getRelatedNews: async (slug: string, limit = 4): Promise<NewsItem[]> => {
    try {
      const currentPost = await newsService.getNewsBySlug(slug);
      if (!currentPost) return [];

      const response = await newsService.getNews({
        category_id: currentPost.category_id,
        limit,
        exclude: currentPost.id,
      });

      return response.data.items;
    } catch (error) {
      console.error('Lỗi khi lấy tin liên quan:', error);
      return [];
    }
  },

  /**
   * Cập nhật bài viết
   */
  updatePost: async (id: string, data: Partial<NewsItem>): Promise<NewsItem> => {
    try {
      const response = await api.put(`/posts/${id}`, data);
      return formatPost(response.data);
    } catch (error) {
      throw handleError(error, 'Không thể cập nhật bài viết');
    }
  },

  /**
   * Tạo bài viết mới
   */
  createPost: async (data: Omit<NewsItem, 'id' | 'created_at' | 'updated_at'>): Promise<NewsItem> => {
    try {
      const response = await api.post('/posts', data);
      return formatPost(response.data);
    } catch (error) {
      throw handleError(error, 'Không thể tạo bài viết mới');
    }
  },

  /**
   * Xóa bài viết
   */
  deletePost: async (id: string): Promise<void> => {
    try {
      await api.delete(`/posts/${id}`);
    } catch (error) {
      throw handleError(error, 'Không thể xóa bài viết');
    }
  },

  /**
   * Lấy danh sách danh mục
   */
  async getCategories(): Promise<Category[]> {
    try {
      // Sử dụng api instance đã được cấu hình sẵn với baseURL
      const response = await api.get('/categories', {
        // Thêm timestamp để tránh cache
        params: { _t: Date.now() },
        // Xác thực các tham số yêu cầu
        validateStatus: (status) => status < 500
      });
      
      // Log response để debug
      console.log('Danh sách danh mục nhận được:', response.data);
      
      // Nếu response có status lỗi
      if (response.status >= 400) {
        throw new Error(response.data?.message || 'Lỗi khi tải danh sách danh mục');
      }
      
      // Xử lý các định dạng phản hồi khác nhau
      if (Array.isArray(response.data)) {
        return response.data as Category[];
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data as Category[];
      } else if (response.data && response.data.items) {
        return response.data.items as Category[];
      }
      
      console.warn('Định dạng phản hồi không xác định:', response.data);
      return [];
      
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách danh mục:', error);
      
      // Trả về dữ liệu mẫu nếu API bị lỗi
      return [
        { id: '1', name: 'Thể thao', slug: 'the-thao' },
        { id: '2', name: 'Giải trí', slug: 'giai-tri' },
        { id: '3', name: 'Công nghệ', slug: 'cong-nghe' },
      ];
    }
  },

  /**
   * Lấy thông tin chi tiết danh mục
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data?.data || response.data || null;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin danh mục ${id}:`, error);
      return null;
    }
  },

  /**
   * Lấy danh sách bài viết theo danh mục (bao gồm cả bài viết từ danh mục con)
   */
  async getPostsByCategory(
    categoryId: string, 
    params: { 
      page?: number; 
      limit?: number; 
      includeSubcategories?: boolean 
    } = {}
  ): Promise<{ items: NewsItem[]; pagination: Pagination }> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        includeSubcategories = true 
      } = params;

      const response = await api.get('/posts', {
        params: {
          category: categoryId,
          includeSubcategories,
          page,
          limit,
          is_published: true,
        },
      });

      const items = Array.isArray(response.data.data) 
        ? response.data.data.map((item: unknown) => formatPost(item))
        : [];

      return {
        items,
        pagination: response.data.pagination || {
          page,
          pageSize: limit,
          totalItems: response.data.total || 0,
          totalPages: Math.ceil((response.data.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Lỗi khi lấy bài viết theo danh mục:', error);
      return { items: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
    }
  },

  /**
   * Tìm kiếm tin tức
   */
  searchNews: async (
    query: string, 
    params: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<{ items: NewsItem[]; pagination: Pagination }>> => {
    try {
      const { page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE } = params;
      
      const response = await api.get('/posts/search', {
        params: {
          q: query,
          page,
          limit,
          is_published: true,
        },
      });

      const responseData = response.data?.data || response.data || [];
      const items = (Array.isArray(responseData) ? responseData : []).map(formatPost);
      const totalItems = response.data?.total || items.length;
      const totalPages = Math.ceil(totalItems / limit);

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize: limit,
            totalItems,
            totalPages
          }
        }
      };
    } catch (error) {
      throw handleError(error, 'Không thể tìm kiếm tin tức');
    }
  },

  /**
   * Lấy danh sách tin tức theo danh mục
   */
  getNewsByCategory: async (
    categoryId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<{ items: NewsItem[]; pagination: Pagination }>> => {
    try {
      const { page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE } = params;
      
      console.log('[NewsService] getNewsByCategory - Request:', {
        categoryId: {
          value: categoryId,
          type: typeof categoryId
        },
        page,
        limit,
        is_published: true,
        timestamp: new Date().toISOString()
      });
      
      const response = await api.get('/posts', {
        params: {
          category_id: categoryId,
          page,
          limit,
          is_published: true,
        },
      });

      console.log('[NewsService] getNewsByCategory - Raw Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data ? {
          hasItems: !!response.data?.data?.items || !!response.data?.items,
          itemsCount: (response.data?.data?.items || response.data?.items || []).length,
          pagination: response.data?.pagination || response.data?.data?.pagination
        } : 'No data',
        timestamp: new Date().toISOString()
      });

      // Handle both response formats: direct items array or nested data object
      const responseData = response.data?.data || response.data;
      const items = Array.isArray(responseData?.items) 
        ? responseData.items.map(formatPost)
        : Array.isArray(responseData)
          ? responseData.map(formatPost)
          : [];
          
      const totalItems = response.data?.pagination?.total || 
                        response.data?.data?.pagination?.total || 
                        response.data?.total || 
                        items.length;
                        
      const totalPages = response.data?.pagination?.totalPages || 
                        response.data?.data?.pagination?.totalPages || 
                        Math.ceil(totalItems / limit);

      const result = {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize: limit,
            totalItems,
            totalPages
          }
        }
      };

      console.log('[NewsService] getNewsByCategory - Processed Result:', {
        itemsCount: items.length,
        totalItems,
        totalPages,
        hasItems: items.length > 0
      });

      return result;
    } catch (error) {
      throw handleError(error, 'Không thể lấy tin tức theo danh mục');
    }
  }
};

export default newsService;
