import * as React from 'react';
import type { FC } from 'react';
import NewsCard, { type NewsCardProps } from '../news/NewsCard';
import Link from 'next/link';

type NewsItem = NewsCardProps & {
  id: string;
};

interface MainNewsSectionProps {
  featuredNews: NewsItem;
  mainNews: NewsItem[];
  sectionTitle: string;
  sectionUrl: string;
}

const MainNewsSection: FC<MainNewsSectionProps> = ({
  featuredNews,
  mainNews,
  sectionTitle,
  sectionUrl,
}) => {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-red-600 pl-3">
            {sectionTitle}
          </h2>
          <Link href={sectionUrl} className="text-red-600 hover:underline text-sm font-medium">
              Xem thêm <span className="ml-1">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured News */}
          <div className="lg:col-span-2">
            <NewsCard
              {...featuredNews}
              variant="featured"
              className="h-full"
            />
          </div>

          {/* Main News List */}
          <div className="space-y-6">
            {mainNews.map((news) => (
              <div key={news.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                <NewsCard
                  {...news}
                  variant="small"
                  className="flex flex-row-reverse items-start gap-4"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MainNewsSection;
