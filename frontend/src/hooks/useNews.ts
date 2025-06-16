import { useState, useEffect, useCallback } from 'react';
import { newsService } from '../services/news';
import { Post } from '../types';

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
  const [news, setNews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, any> = { page: currentPage };
        if (category) params.category = category;
        if (search) params.search = search;

        const response = await newsService.getNews({
          ...params,
          page_size: params.limit || 6, // Đảm bảo sử dụng page_size thay vì limit
          page: currentPage
        });

        console.log('📊 [useNewsList] Response:', response);

        // Xử lý phản hồi từ API
        if (response && response.success && response.data) {
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
            
            // Cập nhật số trang hiện tại
            setCurrentPage(currentPage);
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
      setNews(response.results);
      setHasMore(!!response.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  return { news, loading, error, hasMore, loadMore, refresh };
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
  const [news, setNews] = useState<Post | null>(null);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [relatedNews, setRelatedNews] = useState<Post[]>([]);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const newsData = await newsService.getNewsBySlug(slug);
        setNews(newsData);

        // Fetch related news
        const relatedData = await newsService.getNewsByCategory(slug);
        setRelatedNews(relatedData);
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

  return { news, loading, error, relatedNews };
};
