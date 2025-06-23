'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import newsService, { NewsItem } from '@/services/news';

// Định nghĩa lại interface Category vì nó không được export từ news.ts
interface Category {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

// Sử dụng dynamic import cho các component client-side
const NewsList = dynamic(
  () => import('@/components/news/NewsList').then(mod => mod.NewsList),
  {
    ssr: false,
    loading: () => <LoadingSpinner className="my-8" />
  }
);

const FeaturedPosts = dynamic(
  () => import('@/components/featured/FeaturedPosts').then(mod => mod.FeaturedPosts),
  {
    ssr: false,
    loading: () => <LoadingSpinner className="my-4" />
  }
);

const CategoriesList = dynamic(
  () => import('@/components/categories/CategoriesList').then(mod => mod.CategoriesList),
  {
    ssr: false,
    loading: () => <LoadingSpinner className="my-4" />
  }
);

// Component chính cho trang chủ
export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');

  // Hàm fetch dữ liệu
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Gọi API để lấy dữ liệu
      const [postsRes, featuredRes, categoriesRes] = await Promise.all([
        newsService.getNews({ limit: 10 }),
        newsService.getFeaturedPosts({ limit: 3 }),
        newsService.getCategories()
      ]);

      // Xử lý dữ liệu trả về
      if (Array.isArray(postsRes)) {
        setPosts(postsRes);
      } else if (postsRes && 'data' in postsRes && 'items' in postsRes.data) {
        // Xử lý trường hợp trả về dạng ApiResponse
        setPosts(postsRes.data.items);
      }

      // getFeaturedPosts trả về Promise<NewsItem[]>
      if (Array.isArray(featuredRes)) {
        setFeaturedPosts(featuredRes);
      }

      // getCategories trả về Promise<Category[]>
      if (Array.isArray(categoriesRes)) {
        setCategories(categoriesRes);
      }
      
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg my-4">
        <h2 className="font-bold text-lg mb-2">Đã xảy ra lỗi</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ErrorBoundary 
        fallback={
          <div className="p-4 bg-red-50 text-red-700 rounded-lg my-4">
            <h2 className="font-bold text-lg mb-2">Đã xảy ra lỗi khi tải nội dung</h2>
            <p>Vui lòng tải lại trang hoặc thử lại sau.</p>
          </div>
        }
        onError={(error, errorInfo) => {
          console.error('Lỗi trong component:', error, errorInfo);
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-6">Tin mới nhất</h1>
            <Suspense fallback={<LoadingSpinner className="my-8" />}>
              <NewsList initialPosts={posts} />
            </Suspense>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Nổi bật</h2>
              <Suspense fallback={<LoadingSpinner className="my-4" />}>
                <FeaturedPosts initialPosts={featuredPosts} />
              </Suspense>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Danh mục</h2>
              <Suspense fallback={<LoadingSpinner className="my-4" />}>
                <CategoriesList categories={categories} />
              </Suspense>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
