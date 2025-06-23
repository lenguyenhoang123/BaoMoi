'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { usePosts } from '../../hooks/useNews';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { commentsService } from '../../services/comments';
import { newsService } from '../../services/news';

// Sử dụng kiểu NewsItem từ service
import { NewsItem } from '../../services/news';

interface NewsDetailParams {
  slug: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image_url?: string;
  image?: string;
  view_count: number;
  tags?: string[];
  category: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category_id?: string;
  category_name?: string;
  author_id?: string;
  author_name?: string;
  published_at?: string;
  publishedAt?: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  created_at: string;
  published_at?: string;
  category_name: string;
  author_name: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface CreateCommentData {
  content: string;
  postId: string;
  authorId: string;
}

export default function NewsDetail({ params }: { params: NewsDetailParams }) {
  const { getPostDetail, loading: postLoading, error: postError } = usePosts();
  const { categories } = useCategories();
  const { user, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [categorySlug, setCategorySlug] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const fetchedPost = await getPostDetail(params.slug);
        if (fetchedPost) {
          // Chuyển đổi dữ liệu từ NewsItem sang Post
          const postData: Post = {
            ...fetchedPost,
            image: fetchedPost.image_url,
            category: {
              id: fetchedPost.category_id || '',
              name: fetchedPost.category_name,
              // Use category_slug if available, otherwise generate from category_name
              slug: (fetchedPost as any).category_slug || 
                   String(fetchedPost.category_name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
            },
            author: {
              id: fetchedPost.author_id || '',
              name: fetchedPost.author_name || 'Ẩn danh'
            },
            publishedAt: fetchedPost.published_at,
            slug: fetchedPost.slug
          };
          setPost(postData);
          
          // Lấy tin tức liên quan
          const related = await newsService.getRelatedNews(params.slug);
          if (related) {
            // Chuyển đổi dữ liệu từ NewsItem[] sang RelatedPost[]
            const relatedPostsData = related.map(item => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
              image_url: item.image_url,
              created_at: item.created_at,
              published_at: item.published_at,
              category_name: item.category_name,
              author_name: item.author_name || 'Ẩn danh'
            }));
            setRelatedPosts(relatedPostsData);
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
      }
    };
    fetchPost();
  }, [params.slug, getPostDetail]);

  if (postLoading || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      setLoading(true);
      // Gửi bình luận mới
      const comment = await commentsService.addComment(
        post.id,
        newComment,
        null // parentId
      );
      if (comment) {
        setComments([...comments, comment as Comment]);
      }
      setNewComment('');
    } catch (err) {
      console.error('Error creating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {/* Breadcrumb */}
            <nav className="flex mb-4 text-sm text-gray-600" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                    Trang chủ
                  </Link>
                </li>
                {post?.category && (
                  <li>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 text-gray-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                      </svg>
                      <Link 
                        href={`/danh-muc/${post.category.slug || post.category.id}`} 
                        className="ml-1 text-blue-600 hover:text-blue-800 md:ml-2"
                      >
                        {post.category.name}
                      </Link>
                    </div>
                  </li>
                )}
              </ol>
            </nav>
            
            {/* Hiển thị danh mục nổi bật */}
            {post?.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                  {post.category.name}
                </span>
              </div>
            )}
            
            <h1 className="text-3xl font-bold mb-4 text-gray-900">{post?.title}</h1>
            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6">
              <span className="flex items-center mr-4">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {post?.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : 'Chưa có ngày'}
              </span>
              <span className="flex items-center mr-4">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                {post?.author?.name || 'Ẩn danh'}
              </span>
              {post?.view_count ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  {post.view_count} {post.view_count === 1 ? 'lượt xem' : 'lượt xem'}
                </span>
              ) : null}
            </div>
            
            {/* Category Badge with icon and description */}
            {post?.category && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 uppercase font-medium mb-1">Chuyên mục</div>
                    <Link 
                      href={`/danh-muc/${post.category.slug || post.category.id}`} 
                      className="text-lg font-semibold text-gray-900 hover:text-blue-700 transition-colors"
                    >
                      {post.category.name}
                    </Link>
                    {post.category.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {post.category.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Hiển thị danh sách thẻ (tags) */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Thẻ:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link 
                      key={tag} 
                      href={`/tag/${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="prose max-w-none mt-6">
              <div className="mb-6" dangerouslySetInnerHTML={{ __html: post?.content || 'Không có nội dung' }} />
            </div>

            {/* Danh mục liên quan */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Có thể bạn quan tâm</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedPosts.slice(0, 2).map((related) => (
                  <Link 
                    key={related.id} 
                    href={`/bai-viet/${related.slug}`}
                    className="group block hover:bg-gray-50 rounded-lg p-3 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                      {related.title}
                    </h4>
                    <div className="mt-1 text-sm text-gray-500">
                      {related.published_at ? new Date(related.published_at).toLocaleDateString('vi-VN') : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-red-700 mb-4">BÌNH LUẬN</h2>
          {user ? (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex space-x-3">
                <img
                  src="/images/default-avatar.png"
                  alt={user?.email ? user.email.split('@')[0] : 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="w-full p-2 border rounded"
                  />
                  <button
                    onClick={handleCreateComment}
                    disabled={loading || !newComment.trim()}
                    className="mt-2 px-4 py-2 bg-red-700 text-white rounded disabled:opacity-50"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi bình luận'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-4">
              <Link href="/auth/login" className="text-red-700 hover:text-red-900">
                Đăng nhập để bình luận
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start">
                  <img
                    src={comment.author?.avatar || '/images/default-avatar.png'}
                    alt={comment.author?.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold">{comment.author?.name || 'Unknown'}</span>
                      <span className="text-gray-600 ml-2">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-red-700 mb-4">TIN TỨC LIÊN QUAN</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow">
                <img
                  src={post.image_url || '/images/news-related.jpg'}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Chưa xuất bản'}
                    {post.category_name && ` • ${post.category_name}`}
                  </p>
                  <Link
                    href={`/news/${post.slug}`}
                    className="text-red-700 hover:text-red-900"
                  >
                    Đọc thêm
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
