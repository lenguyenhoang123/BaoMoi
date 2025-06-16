'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { usePosts } from '../../hooks/useNews';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { commentsService } from '../../services/comments';
import { newsService } from '../../services/news';

interface NewsDetailParams {
  slug: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  image?: string;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  publishedAt: string | undefined;
  createdAt: string;
  slug: string;
}

interface RelatedPost extends Post {
  slug: string;
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

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const fetchedPost = await getPostDetail(params.slug);
        if (fetchedPost) {
          setPost(fetchedPost as Post);
          // Lấy tin tức liên quan
          const related = await newsService.getRelatedNews(params.slug);
          if (related) {
            setRelatedPosts(related as RelatedPost[]);
          }
        }
      } catch (err) {
        console.error('Error fetching post:', err);
      }
    };
    fetchPost();
  }, [params.slug, getPostDetail]);

  if (postLoading || !post) {
    return <div>Loading...</div>;
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
            <h1 className="text-3xl font-bold mb-4">{post?.title}</h1>
            <div className="flex items-center mb-4">
              <span className="text-gray-600 mr-4">{post?.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Unknown'}</span>
              <span className="text-gray-600">{post?.author?.name || 'Unknown'}</span>
            </div>
            <div className="prose max-w-none">
              <p className="mb-4">{post?.content || 'No content available'}</p>
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
                  src={post.image || '/images/news-related.jpg'}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Unknown'}</p>
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
