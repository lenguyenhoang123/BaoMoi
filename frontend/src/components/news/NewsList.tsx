'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/date';
import { NewsItem } from '@/services/news';
import { PostSkeleton } from '../common/PostSkeleton';

// Định nghĩa kiểu dữ liệu cho props
interface NewsListProps {
  initialPosts?: NewsItem[];  // Danh sách bài viết ban đầu
}

// Hàm hỗ trợ định dạng ngày tháng an toàn
const safeFormatDate = (dateString?: string | Date | null, fallback = 'Chưa có ngày'): string => {
  try {
    if (!dateString) return fallback;
    const result = formatDate(dateString);
    return result || fallback;
  } catch (error) {
    console.error('Lỗi khi định dạng ngày tháng:', error);
    return fallback;
  }
};

// Hàm hỗ trợ hiển thị nội dung an toàn
const renderContent = (content: unknown): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  return '';
};

// Hàm lấy tên danh mục an toàn
const getCategoryName = (category: unknown): string => {
  if (!category) return '';
  if (typeof category === 'string') return category;
  if (typeof category === 'object' && category !== null && 'name' in category) {
    return String((category as { name: unknown }).name || '');
  }
  return String(category);
};

/**
 * Component hiển thị danh sách bài viết
 * @param initialPosts - Mảng các bài viết cần hiển thị
 */
export function NewsList({ initialPosts }: NewsListProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<NewsItem[]>(initialPosts || []);

  // Sử dụng useCallback để tránh tạo lại hàm khi re-render
  const handlePostHover = useCallback((slug: string) => {
    router.prefetch(`/bai-viet/${slug}`);
  }, [router]);

  // Xử lý lỗi ảnh
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    // Nếu đây không phải là lần thử tải lại ảnh placeholder
    if (!target.dataset.retry) {
      target.dataset.retry = 'true';
      // Thử tải lại với timestamp mới
      target.src = '/images/placeholder-news.jpg';
      // Đặt onerror một lần nữa để xử lý trường hợp placeholder cũng lỗi
      target.onerror = () => { target.style.display = 'none'; };
    } else {
      // Nếu vẫn lỗi, ẩn ảnh đi
      target.style.display = 'none';
      // Xóa sự kiện onerror để ngăn chặn các yêu cầu tiếp theo
      target.onerror = null;
    }
  }, []);

  // Kiểm tra nếu không có bài viết nào
  if (!posts || posts.length === 0) {
    return (
      <div className="text-gray-500 p-8 text-center">
        <div className="text-2xl mb-2">📰</div>
        <p className="text-lg">Không tìm thấy bài viết nào</p>
        <p className="text-sm text-gray-400 mt-1">Vui lòng thử lại với từ khóa khác</p>
      </div>
    );
  }

  // Hiển thị loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>Đã xảy ra lỗi khi tải dữ liệu</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts?.map((post) => {
        if (!post) return null;

        // Lấy thông tin bài viết với giá trị mặc định
        const {
          id = '',
          slug = '',
          title = 'Không có tiêu đề',
          image_url,
          category_name,
          excerpt,
          content,
          published_at,
          created_at = new Date().toISOString(),
          author_name = 'Ẩn danh'
        } = post;

        // Định dạng ngày đăng
        const formattedDate = safeFormatDate(published_at || created_at);

        return (
          <article 
            key={id} 
            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="p-5">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Hình ảnh bài viết */}
                {image_url && (
                  <div className="md:w-1/3">
                    <Link 
                      href={`/bai-viet/${slug}`}
                      onMouseEnter={() => handlePostHover(slug)}
                      className="block h-full"
                    >
                      <div className="relative w-full h-48 md:h-full overflow-hidden rounded-lg">
                        <img
                          src={image_url}
                          alt={title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={handleImageError}
                        />
                      </div>
                    </Link>
                  </div>
                )}
                
                {/* Nội dung bài viết */}
                <div className={`${image_url ? 'md:w-2/3' : 'w-full'} flex-1`}>
                {/* Tên danh mục và thời gian */}
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {category_name && (
                    <Link 
                      href={`/danh-muc/${getCategoryName(category_name).toLowerCase()}`}
                      className="group inline-flex items-center"
                    >
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                        {getCategoryName(category_name)}
                      </span>
                    </Link>
                  )}
                  <span className="text-xs text-gray-500">
                    {formattedDate}
                  </span>
                </div>
                
                {/* Tiêu đề bài viết */}
                <h2 className="text-xl font-bold mb-3 hover:text-blue-600 transition-colors">
                  <Link 
                    href={`/bai-viet/${slug}`}
                    className="line-clamp-2 hover:underline"
                    onMouseEnter={() => handlePostHover(slug)}
                  >
                    {title || 'Không có tiêu đề'}
                  </Link>
                </h2>
                
                {/* Trích dẫn/nội dung tóm tắt */}
                {(excerpt || content) && (
                  <div className="mb-4">
                    <div 
                      className="text-gray-600 line-clamp-3 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderContent(excerpt || content)
                          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<h3 class="text-lg font-semibold my-2">$1</h3>')
                          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '<strong class="font-semibold">$1</strong>') 
                      }} 
                    />
                  </div>
                )}

                {/* Thẻ (tags) */}
                {(post as any).tags && (post as any).tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 mb-3">
                    {(post as any).tags.slice(0, 3).map((tag: string, index: number) => (
                      <Link 
                        key={index} 
                        href={`/tag/${encodeURIComponent(tag)}`}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
                
                {/* Thông tin tác giả và lượt xem */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm">{author_name || 'Ẩn danh'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {(post as any).view_count > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {(post as any).view_count}
                      </div>
                    )}
                    <Link 
                      href={`/bai-viet/${slug}`}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                      onMouseEnter={() => handlePostHover(slug)}
                    >
                      Đọc tiếp
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
                </div>{/* Kết thúc nội dung bài viết */}
              </div>{/* Kết thúc flex container */}
            </div>{/* Kết thúc p-5 */}
          </article>
        );
      })}
    </div>
  );
}
