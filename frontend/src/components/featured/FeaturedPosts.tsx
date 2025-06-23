import { useCallback } from 'react';
import Link from 'next/link';
import { NewsItem } from '@/services/news';
import { formatDate } from '@/utils/date';

interface FeaturedPostsProps {
  initialPosts?: NewsItem[];
}

export function FeaturedPosts({ initialPosts }: FeaturedPostsProps) {
  // Xử lý lỗi ảnh
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    
    // Nếu đây không phải là lần thử tải lại ảnh placeholder
    if (!target.dataset.retry) {
      target.dataset.retry = 'true';
      // Thử tải lại với ảnh placeholder
      target.src = '/images/placeholder-news.jpg';
      // Đặt onerror một lần nữa để xử lý trường hợp placeholder cũng lỗi
      target.onerror = () => { 
        target.style.display = 'none';
        // Xóa sự kiện onerror để ngăn chặn các yêu cầu tiếp theo
        target.onerror = null;
      };
    } else {
      // Nếu vẫn lỗi, ẩn ảnh đi
      target.style.display = 'none';
      // Xóa sự kiện onerror để ngăn chặn các yêu cầu tiếp theo
      target.onerror = null;
    }
  }, []);
  if (!initialPosts || initialPosts.length === 0) {
    return <div className="text-sm text-gray-500">Không có bài viết nổi bật.</div>;
  }

  return (
    <div className="space-y-4">
      {initialPosts.map((post) => (
        <div key={post.id} className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0">
          {post.image_url && (
            <Link href={`/bai-viet/${post.slug}`} className="flex-shrink-0 w-20 h-16">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-full object-cover rounded"
                onError={handleImageError}
                loading="lazy"
              />
            </Link>
          )}
          <div>
            <h3 className="font-medium text-sm hover:text-blue-600">
              <Link href={`/bai-viet/${post.slug}`}>
                {post.title}
              </Link>
            </h3>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(post.published_at || post.created_at, 'dd/MM/yyyy')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
