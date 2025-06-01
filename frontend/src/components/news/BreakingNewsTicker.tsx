import React from 'react';
import { Clock } from 'lucide-react';

type NewsItem = {
  id: string;
  title: string;
  url: string;
  timestamp?: string;
};

type BreakingNewsTickerProps = {
  newsItems: NewsItem[];
};

const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({ newsItems }) => {
  return (
    <div className="bg-red-600 text-white py-2 px-4">
      <div className="container mx-auto flex items-center">
        <div className="flex-shrink-0 flex items-center mr-4">
          <Clock className="w-4 h-4 mr-2" />
          <span className="font-bold">TIN MỚI NHẤT:</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee whitespace-nowrap">
            {newsItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <a 
                  href={item.url} 
                  className="hover:underline mr-8 inline-block"
                  title={item.title}
                >
                  {item.title}
                </a>
                {index < newsItems.length - 1 && (
                  <span className="text-red-300 mx-2">•</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
