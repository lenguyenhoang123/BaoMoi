import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export type NewsCardProps = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  date: string;
  url: string;
  variant?: 'default' | 'featured' | 'small';
  className?: string;
};

const NewsCard: React.FC<NewsCardProps> = ({
  id,
  title,
  excerpt,
  imageUrl,
  category,
  date,
  url,
  variant = 'default',
  className = '',
}) => {
  const baseClasses = 'group block overflow-hidden rounded-lg';
  const titleClasses = {
    default: 'text-lg font-bold leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors',
    featured: 'text-2xl font-bold leading-tight mb-3 line-clamp-3 group-hover:text-blue-600 transition-colors',
    small: 'text-base font-semibold leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors',
  };

  const excerptClasses = {
    default: 'text-gray-600 text-sm line-clamp-2',
    featured: 'text-gray-700 mb-3 line-clamp-3',
    small: 'text-gray-500 text-xs line-clamp-2',
  };

  return (
    <Link href={url} className={`${baseClasses} ${className}`}>
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <div className="aspect-w-16 aspect-h-9">
          <Image
            src={imageUrl}
            alt={title}
            width={variant === 'featured' ? 800 : 400}
            height={variant === 'featured' ? 450 : 225}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        {category && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
            {category}
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className={titleClasses[variant]}>{title}</h3>
        {excerpt && variant !== 'small' && (
          <p className={excerptClasses[variant]}>{excerpt}</p>
        )}
        <div className="flex items-center text-xs text-gray-500 mt-2">
          <time dateTime={date} className="mr-3">
            {new Date(date).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </time>
          <span>•</span>
          <span className="ml-3">5 phút đọc</span>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;
