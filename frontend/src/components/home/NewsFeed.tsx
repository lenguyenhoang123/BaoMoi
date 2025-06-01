import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import newsService from '@/services/news';
import { Post } from '../../types';
import { getImageUrl, getPostUrl } from '../../utils/url';

interface NewsFeedProps {
  category?: string;
  limit?: number;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ category, limit = 6 }) => {
  const [news, setNews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: Record<string, any> = { 
          page: 1,
          page_size: limit,
          is_published: true
        };
        
        if (category) {
          params.categories = category;
        }

        console.log('📡 [NewsFeed] Fetching news with params:', params);
        const response = await newsService.getNews(params);
        console.log('📥 [NewsFeed] Received response:', response);
        
        // Kiểm tra cấu trúc phản hồi
        let newsItems = [];
        if (Array.isArray(response)) {
          newsItems = response; // Nếu response là mảng
        } else if (response && response.results && Array.isArray(response.results)) {
          newsItems = response.results; // Nếu response có thuộc tính results là mảng
        } else if (response && response.data && Array.isArray(response.data)) {
          newsItems = response.data; // Nếu response có thuộc tính data là mảng
        } else if (response && response.data && response.data.results && Array.isArray(response.data.results)) {
          newsItems = response.data.results; // Nếu response.data.results là mảng
        }
        
        console.log('📋 [NewsFeed] Processed news items:', newsItems);
        setNews(newsItems);
      } catch (err: any) {
        console.error('Failed to fetch news:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải tin tức');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="animate-pulse bg-gray-100 rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Không có bài viết nào được tìm thấy
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item: Post) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative h-48 w-full">
              <Image
                src={getImageUrl((item as any).thumbnail || (item as any).image, '/images/placeholder-news.svg')}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                <Link href={getPostUrl(item.slug)} className="hover:text-blue-600 transition-colors">
                  {item.title}
                </Link>
              </h3>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Calendar size={14} className="mr-1" />
                <span>
                  {(() => {
                    try {
                      const dateValue = item.publishedAt || item.createdAt;
                      if (!dateValue) return 'N/A';
                      
                      const date = new Date(dateValue);
                      return isValid(date) 
                        ? format(date, 'dd/MM/yyyy', { locale: vi })
                        : 'N/A';
                    } catch (error) {
                      console.error('Error formatting date:', error, 'Date value:', item.publishedAt || item.createdAt);
                      return 'N/A';
                    }
                  })()}
                </span>
                <span className="mx-2">•</span>
                <Clock size={14} className="mr-1" />
                <span>{(item as any).readingTime || '3'} phút đọc</span>
              </div>
              <p className="text-gray-600 line-clamp-3 mb-4">
                {(item as any).summary || (item as any).excerpt || item.seoDescription || (item as any).description || ''}
              </p>
              <Link 
                href={getPostUrl(item.slug)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Xem thêm
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {category && (
        <div className="mt-6 text-center">
          <Link 
            href={`/danh-muc/${category}`} 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            Xem thêm tin tức <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
