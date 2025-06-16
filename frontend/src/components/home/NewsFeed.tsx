import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNewsList } from '@/hooks/useNews';
import { Post as BasePost, PostStatus, Tag, Author, Category, Post } from '@/types/post';
import { getImageUrl, getPostUrl } from '../../utils/url';

// Extended Post type that includes all possible fields
interface ExtendedPost extends Omit<BasePost, 'view_count'> {
  // Field variations
  featured_image?: string;
  featuredImage?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  seoTitle?: string;
  seoDescription?: string;
  
  // Stats
  viewCount?: number;
  view_count?: number;
  likeCount?: number;
  like_count?: number;
  commentCount?: number;
  comment_count?: number;
  readingTime?: number;
  reading_time?: number;
  
  // Flags
  isPublished?: boolean;
  isFeatured?: boolean;
  
  // Allow additional properties
  [key: string]: any;
}

interface NewsFeedProps {
  category?: string;
  limit?: number;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ category, limit = 6 }) => {
  const { news, loading, error, hasMore, loadMore, refresh } = useNewsList({
    page: 1,
    category,
    initialLoad: true
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return isValid(date)
        ? format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
        : 'Ngày không hợp lệ';
    } catch (error) {
      console.error('Lỗi định dạng ngày tháng:', error);
      return 'Ngày không xác định';
    }
  };
  // Process news items to ensure they have required fields
  const processedNews = React.useMemo(() => {
    return news.map((item: ExtendedPost) => {
      // Helper to get value with fallback for both snake_case and camelCase
      const getValue = <T,>(obj: any, key: string, fallback: T): T => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        return obj[key] ?? obj[snakeKey] ?? fallback;
      };

      // Process tags to ensure they match Tag interface
      const processTags = (tags: any): Tag[] => {
        if (!Array.isArray(tags)) return [];
        return tags
          .filter(tag => tag && (typeof tag === 'string' || (typeof tag === 'object' && tag.name)))
          .map(tag => ({
            id: typeof tag === 'object' ? String(tag.id || '') : '',
            name: typeof tag === 'object' ? String(tag.name || '') : String(tag),
            slug: typeof tag === 'object' ? String(tag.slug || '') : ''
          }));
      };

      // Helper to get date with fallback
      const getDate = (dateStr: string | undefined, fallback: string): string => {
        try {
          if (!dateStr) return fallback;
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? fallback : date.toISOString();
        } catch {
          return fallback;
        }
      };

      // Get values with fallbacks
      const now = new Date().toISOString();
      const featuredImage = getValue(item, 'featuredImage', getValue(item, 'featured_image', '/images/default-news.jpg'));
      const status = (getValue(item, 'status', 'draft') as PostStatus) || 'draft';
      const createdAt = getDate(getValue(item, 'createdAt', getValue(item, 'created_at', now)), now);
      const updatedAt = getDate(getValue(item, 'updatedAt', getValue(item, 'updated_at', now)), now);
      const publishedAt = getValue(item, 'publishedAt', getValue(item, 'published_at', undefined));

      // Process author
      const author = item.author || {
        id: 'anonymous',
        name: 'Ẩn danh',
        full_name: 'Ẩn danh',
        email: 'anonymous@example.com'
      };

      // Process category
      const category = item.category || null;

      // Process SEO fields
      const seoTitle = getValue(item, 'seoTitle', getValue(item, 'meta_title', item.title || ''));
      const seoDescription = getValue(item, 'seoDescription', getValue(item, 'meta_description', item.excerpt || ''));
      const seoKeywords = Array.isArray(item.seoKeywords) ? item.seoKeywords : [];

      // Create the processed post
      const processedItem: ExtendedPost = {
        ...item,
        id: String(item.id || ''),
        title: String(item.title || 'Không có tiêu đề'),
        slug: String(item.slug || ''),
        excerpt: String(item.excerpt || ''),
        content: String(item.content || ''),

        // Media
        featuredImage,
        featured_image: featuredImage,

        // Status and dates
        status,
        createdAt,
        updatedAt,
        created_at: createdAt,
        updated_at: updatedAt,
        publishedAt: publishedAt,
        published_at: publishedAt,

        // Relationships
        author,
        category,
        tags: processTags(item.tags || []),

        // SEO
        seoTitle,
        seoDescription,
        seoKeywords,
        meta_title: seoTitle,
        meta_description: seoDescription,

        // Stats - handle both snake_case and camelCase
        viewCount: Number(item.viewCount ?? item.view_count ?? 0) || 0,
        view_count: Number(item.viewCount ?? item.view_count ?? 0) || 0,
        likeCount: Number(item.likeCount ?? item.like_count ?? 0) || 0,
        like_count: Number(item.likeCount ?? item.like_count ?? 0) || 0,
        commentCount: Number(item.commentCount ?? item.comment_count ?? 0) || 0,
        comment_count: Number(item.commentCount ?? item.comment_count ?? 0) || 0,
        readingTime: Number(item.readingTime ?? item.reading_time ?? 0) || 0,
        reading_time: Number(item.readingTime ?? item.reading_time ?? 0) || 0,

        // Compatibility flags
        isPublished: !!item.isPublished,
        isFeatured: !!item.isFeatured
      };

      // Create excerpt from content if not provided
      if (!processedItem.excerpt && processedItem.content) {
        const plainText = String(processedItem.content || '')
          .replace(/<[^>]*>?/gm, '')
          .replace(/\s+/g, ' ')
          .trim();
        processedItem.excerpt = plainText.substring(0, 150) +
          (plainText.length > 150 ? '...' : '');
      }

      return processedItem;
    });
  }, [news]);

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
        {processedNews.map((item: ExtendedPost) => (
          <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative h-48 w-full">
              <Image
                src={getImageUrl(item.image_url || item.thumbnail || item.featured_image || item.featuredImage || '', '/images/placeholder-news.svg')}
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
                      const dateValue = item.published_at || item.created_at;
                      if (!dateValue) return 'N/A';

                      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
                      return isValid(date)
                        ? format(date, 'dd/MM/yyyy', { locale: vi })
                        : 'N/A';
                    } catch (error) {
                      console.error('Error formatting date:', error, 'Date value:', item.published_at || item.created_at);
                      return 'N/A';
                    }
                  })()}
                </span>
                <span className="mx-2">•</span>
                <Clock size={14} className="mr-1" />
                <span>{(item as any).readingTime || '3'} phút đọc</span>
              </div>
              <p className="text-gray-600 line-clamp-3 mb-4">
                {item.excerpt || item.meta_description || ''}
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
