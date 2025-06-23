import { notFound } from 'next/navigation';
import NewsDetail from '@/components/news/NewsDetail';

export default function PostDetailPage({ params }: { params: { slug: string } }) {
  if (!params.slug) {
    notFound();
  }

  return <NewsDetail params={{ slug: params.slug }} />;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: 'Chi tiết bài viết',
    description: 'Đọc bài viết chi tiết',
  };
}
