import { useState, useEffect, useCallback } from 'react';
import { newsService, NewsItem } from '../services/news';

type NewsItemOrPost = NewsItem; // For now, we'll just use NewsItem

interface UseNewsListParams {
  page?: number;
  category?: string;
  search?: string;
  initialLoad?: boolean;
}

/**
 * Tham số cho hook useNewsList
 */
interface UseNewsListParams {
  /** Trang hiện tại */
  page?: number;
  /** Danh mục cần lọc */
  category?: string;
  /** Từ khóa tìm kiếm */
  search?: string;
  /** Tự động tải dữ liệu khi khởi tạo */
  initialLoad?: boolean;
}

/**
 * Hook để lấy danh sách tin tức với phân trang và tìm kiếm
 * @param params Tham số lọc và phân trang
 * @returns Đối tượng chứa danh sách tin tức và các phương thức liên quan
 */
export const useNewsList = ({
  page = 1,
  category,
  search,
  initialLoad = true,
}: UseNewsListParams = {}) => {
  const [news, setNews] = useState<NewsItemOrPost[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, any> = {
          page: currentPage,
          limit: 6,
          page_size: 6
        };

        if (category) params.category = category;
        if (search) params.search = search;

        const response = await newsService.getNews(params);
        console.log('📊 [useNewsList] Response:', response);

        // Xử lý phản hồi từ API
        if (response?.success && response.data) {
          const { items, pagination } = response.data;

          if (Array.isArray(items)) {
            // Nếu là trang đầu tiên, thay thế danh sách hiện tại
            // Nếu không, thêm vào cuối danh sách hiện có
            setNews(prevNews =>
              currentPage === 1 ? items : [...prevNews, ...items]
            );

            // Kiểm tra xem còn trang nào khác không
            if (pagination) {
              const { page, pageSize, totalItems } = pagination;
              setHasMore(page * pageSize < totalItems);
            } else {
              setHasMore(items.length > 0);
            }
          } else {
            console.warn('Items is not an array:', items);
            setNews([]);
            setHasMore(false);
          }
        } else {
          console.warn('Invalid response format:', response);
          setNews([]);
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải tin tức');
      } finally {
        setLoading(false);
      }
    };

    if (initialLoad) {
      fetchNews();
    }
  }, [currentPage, category, search, initialLoad]);

  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const refresh = async () => {
    setCurrentPage(1);
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, any> = { page: 1 };
      if (category) params.category = category;
      if (search) params.search = search;

      const response = await newsService.getNews(params);
      if (response.success && response.data) {
        setNews(prev => currentPage === 1
          ? response.data.items
          : [...prev, ...response.data.items]);

        if (response.data.pagination) {
          const { page, pageSize, totalItems } = response.data.pagination;
          setHasMore(page * pageSize < totalItems);
        } else {
          setHasMore(response.data.items.length > 0);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  return {
    news,
    loading,
    error,
    hasMore,
    loadMore,
    currentPage,
    refresh,
    setNews // Thêm setter để component có thể cập nhật state nếu cần
  };
};

/**
 * Hook để lấy thông tin chi tiết một bài viết theo slug
 * @deprecated Sử dụng useNewsDetail thay thế
 */
export const usePosts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPostDetail = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      const post = await newsService.getNewsBySlug(slug);
      return post;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch post'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getPostDetail,
    loading,
    error,
  };
};

/**
 * Hook để lấy thông tin chi tiết một bài viết kèm tin liên quan
 * @param slug Đường dẫn thân thiện của bài viết
 * @param initialLoad Tự động tải dữ liệu khi khởi tạo
 * @returns Đối tượng chứa thông tin bài viết, tin liên quan và trạng thái tải
 */
export const useNewsDetail = (slug: string, initialLoad = true) => {
  const [news, setNews] = useState<NewsItemOrPost | null>(null);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsItemOrPost[]>([]);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const newsData = await newsService.getNewsBySlug(slug);
        setNews(newsData);

        // Fetch related news
        const response = await newsService.getNewsByCategory(slug);
        if (response.success && response.data) {
          setRelatedNews(response.data.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải chi tiết tin tức');
      } finally {
        setLoading(false);
      }
    };

    if (slug && initialLoad) {
      fetchNewsDetail();
    }
  }, [slug, initialLoad]);

  return {
    news,
    loading,
    error,
    relatedNews,
    setNews // Expose setter for manual updates if needed
  };
};
