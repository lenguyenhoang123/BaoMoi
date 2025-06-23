'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Skeleton, Empty, Pagination } from 'antd';
import { newsService } from '@/services/news';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Meta } = Card;

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  category_id: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  tags?: string[];
  
  // Các trường được join từ bảng khác (nếu có)
  category_name?: string;
  author_name?: string;
}

interface CategoryPostsProps {
  categoryId: string | number;
  categoryName: string;
}

export default function CategoryPosts({ categoryId, categoryName }: CategoryPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching posts for category:', {
          categoryId,
          type: typeof categoryId,
          currentPage,
          pageSize
        });
        
        const response = await newsService.getNewsByCategory(categoryId.toString(), {
          page: currentPage,
          limit: pageSize
        });
        
        console.log('API Response for category', categoryId, ':', {
          status: 'success',
          responseData: response.data, // Log full response data
          itemsCount: response.data?.items?.length || 0,
          pagination: response.data?.pagination
        });
        
        // Format lại dữ liệu từ API để phù hợp với component
        const items = response.data?.items || [];
        console.log('Formatted posts:', items);
        
        const formattedPosts: Post[] = items.map(item => {
          // Đảm bảo status có giá trị hợp lệ
          const statusValue = typeof item.status === 'string' ? item.status : 'published';
          const validStatus = (['draft', 'published', 'archived'] as const).includes(statusValue as any)
            ? statusValue as 'draft' | 'published' | 'archived'
            : 'published';
            
          return {
            ...item,
            status: validStatus,
            category_id: item.category_id || null,
            image_url: item.image_url || null,
            // Thêm các trường cần thiết cho giao diện
            category_name: item.category_name || 'Chưa phân loại',
            author_name: item.author_name || 'Người dùng'
          };
        });
        
        setPosts(formattedPosts);
        setTotal(response.data.pagination?.totalItems || 0);
      } catch (error) {
        console.error('Lỗi khi tải bài viết:', error);
        setError('Đã xảy ra lỗi khi tải danh sách bài viết. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [categoryId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">{categoryName}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} hoverable className="mb-4">
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">{categoryName}</h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">{categoryName}</h1>
        <Empty description="Không có bài viết nào trong danh mục này" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-red-600">{categoryName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {posts.map((post) => (
          <Link key={post.id} href={`/bai-viet/${post.slug}`}>
            <Card
              hoverable
              className="h-full flex flex-col"
              cover={
                <div className="h-48 overflow-hidden">
                  <img 
                    alt={post.title}
                    src={post.image_url || '/images/placeholder.jpg'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              }
            >
              <div className="flex-1 flex flex-col">
                {/* Hiển thị tên danh mục - sử dụng categoryName từ props nếu có */}
                <div className="mb-2">
                  <span className="text-xs font-medium text-red-600 uppercase">
                    {post.category_name || categoryName || 'Chưa phân loại'}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {post.content?.substring(0, 150)}...
                </p>
                <div className="mt-auto text-sm text-gray-500">
                  <span>
                    {format(new Date(post.created_at), 'dd MMM yyyy', { locale: vi })}
                  </span>
                  {post.author_name && (
                    <span className="ml-2">• {post.author_name}</span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {total > pageSize && (
        <div className="flex justify-center mt-8">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
            className="ant-pagination"
          />
        </div>
      )}
    </div>
  );
}
