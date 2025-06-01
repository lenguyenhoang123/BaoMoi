'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Simple loading component instead of using Skeleton
const Loading = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse ${className}`} />
);

// Dynamic imports for better performance
const BreakingNewsTicker = dynamic(
  () => import('@/components/news/BreakingNewsTicker').then(mod => mod.default),
  { 
    ssr: false, 
    loading: () => <Loading className="h-8 w-full" /> 
  }
);

const MainNewsSection = dynamic(
  () => import('@/components/home/MainNewsSection').then(mod => mod.default),
  { 
    loading: () => <Loading className="h-96 w-full" /> 
  }
);

const NewsFeed = dynamic(
  () => import('@/components/home/NewsFeed').then(mod => mod.default),
  { 
    loading: () => <Loading className="h-96 w-full" /> 
  }
);

export default function HomePage() {
  // Mock data for BreakingNewsTicker
  const breakingNews = [
    { 
      id: '1',
      title: 'Tin tức khẩn cấp 1',
      url: '/tin-tuc-khan-cap-1',
      timestamp: '10 phút trước'
    },
    { 
      id: '2',
      title: 'Tin tức khẩn cấp 2',
      url: '/tin-tuc-khan-cap-2',
      timestamp: '15 phút trước'
    }
  ];

  // Mock data for featured news
  const featuredNews = {
    id: '1',
    title: 'Tin nổi bật trong ngày',
    excerpt: 'Mô tả ngắn cho tin nổi bật với nhiều thông tin hấp dẫn và chi tiết hơn so với các tin thông thường.',
    imageUrl: '/placeholder-featured.jpg',
    category: 'Nổi bật',
    date: '25/05/2023',
    url: '/tin-noi-bat-trong-ngay',
    variant: 'featured' as const
  };

  // Mock data for main news
  const mainNews = [
    {
      id: '1',
      title: 'Tin chính 1 với tiêu đề dài hơn để kiểm tra hiển thị',
      excerpt: 'Mô tả ngắn cho tin chính 1 với nội dung chi tiết hơn một chút so với bản tóm tắt',
      imageUrl: '/placeholder-news.jpg',
      category: 'Thời sự',
      date: '25/05/2023',
      url: '/tin-chinh-1',
      variant: 'small' as const
    },
    {
      id: '2',
      title: 'Tin chính 2 với tiêu đề cũng khá dài',
      excerpt: 'Mô tả ngắn cho tin chính 2 với nội dung khác biệt so với tin thứ nhất',
      imageUrl: '/placeholder-news.jpg',
      category: 'Kinh tế',
      date: '24/05/2023',
      url: '/tin-chinh-2',
      variant: 'small' as const
    },
    {
      id: '3',
      title: 'Tin chính 3 với tiêu đề bình thường',
      excerpt: 'Mô tả ngắn cho tin chính 3 với nội dung khác biệt',
      imageUrl: '/placeholder-news.jpg',
      category: 'Xã hội',
      date: '23/05/2023',
      url: '/tin-chinh-3',
      variant: 'small' as const
    }
  ];

  return (
    <main className="container mx-auto px-4 py-6">
      <Suspense fallback={<Loading className="h-96 w-full" />}>
        <BreakingNewsTicker newsItems={breakingNews} />
        <div className="mt-8">
          <MainNewsSection 
            featuredNews={featuredNews}
            mainNews={mainNews}
            sectionTitle="Tin nổi bật"
            sectionUrl="/tin-noi-bat"
          />
          <div className="mt-12">
            <NewsFeed />
          </div>
        </div>
      </Suspense>
    </main>
  );
}
