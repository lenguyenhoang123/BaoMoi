import { useState, useEffect } from 'react';
import { newsService } from '../services/news';
import { Post } from '../types';

interface UseNewsListParams {
  page?: number;
  category?: string;
  search?: string;
  initialLoad?: boolean;
}

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

        const response = await newsService.getNewsList(params);
        setNews(response.results);
        setHasMore(!!response.next);
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

      const response = await newsService.getNewsList(params);
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
        const newsData = await newsService.getNewsDetail(slug);
        setNews(newsData);

        // Fetch related news
        const relatedData = await newsService.getRelatedNews(slug);
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
