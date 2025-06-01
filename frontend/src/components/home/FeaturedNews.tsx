'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Share2, MessageSquare, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  categorySlug: string;
  author: string;
  date: Date;
  readTime: string;
  commentCount: number;
  isHot?: boolean;
  isPremium?: boolean;
}

const FeaturedNews = () => {
  const featuredNews: NewsItem[] = [
    {
      id: '1',
      title: 'Chính phủ ban hành Nghị quyết mới về phát triển kinh tế số',
      excerpt: 'Nghị quyết mới của Chính phủ đặt mục tiêu đưa kinh tế số đóng góp 30% GDP vào năm 2030, với nhiều chính sách ưu đãi cho doanh nghiệp công nghệ...',
      image: '/images/featured-1.jpg',
      category: 'Kinh tế',
      categorySlug: 'kinh-te',
      author: 'Minh Hải',
      date: new Date(2025, 4, 22, 8, 30),
      readTime: '5 phút',
      commentCount: 42,
      isHot: true,
      isPremium: true
    },
    {
      id: '2',
      title: 'Hà Nội: Dự án đường sắt đô thị Cát Linh - Hà Đông tăng tần suất chạy tàu',
      excerpt: 'Từ ngày 1/6, tuyến đường sắt đô thị Cát Linh - Hà Đông sẽ tăng tần suất chạy tàu lên 10 phút/chuyến vào giờ cao điểm để đáp ứng nhu cầu đi lại của người dân...',
      image: '/images/featured-2.jpg',
      category: 'Giao thông',
      categorySlug: 'giao-thong',
      author: 'Quang Dũng',
      date: new Date(2025, 4, 21, 14, 15),
      readTime: '3 phút',
      commentCount: 28
    },
    {
      id: '3',
      title: 'Giáo dục phổ thông: Đổi mới toàn diện chương trình đào tạo từ năm 2026',
      excerpt: 'Bộ GD-ĐT vừa công bố dự thảo chương trình giáo dục phổ thông mới với nhiều thay đổi về nội dung và phương pháp giảng dạy, hướng đến phát triển năng lực học sinh...',
      image: '/images/featured-3.jpg',
      category: 'Giáo dục',
      categorySlug: 'giao-duc',
      author: 'Thanh Tùng',
      date: new Date(2025, 4, 20, 10, 45),
      readTime: '7 phút',
      commentCount: 35,
      isPremium: true
    },
    {
      id: '4',
      title: 'Xuất khẩu nông sản Việt Nam tăng trưởng ấn tượng trong 5 tháng đầu năm',
      excerpt: 'Kim ngạch xuất khẩu nông sản 5 tháng đầu năm 2025 ước đạt 25 tỷ USD, tăng 15% so với cùng kỳ năm trước, trong đó gạo, cà phê, hồ tiêu là những mặt hàng chủ lực...',
      image: '/images/featured-4.jpg',
      category: 'Kinh doanh',
      categorySlug: 'kinh-doanh',
      author: 'Mai Linh',
      date: new Date(2025, 4, 22, 9, 20),
      readTime: '4 phút',
      commentCount: 19,
      isHot: true
    }
  ];

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="w-1 h-8 bg-red-600 mr-3"></span>
            Tin nổi bật
          </h2>
          <Link 
            href="/tin-noi-bat" 
            className="text-primary hover:text-primary-dark font-medium flex items-center"
          >
            Xem tất cả
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredNews.map((item, index) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${index === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className="relative h-48 md:h-56 lg:h-48 xl:h-56">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  priority={index < 2}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {item.isHot && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        NÓNG
                      </span>
                    )}
                    {item.isPremium && (
                      <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <Link 
                    href={`/${item.categorySlug}`}
                    className="absolute bottom-3 left-3 bg-primary text-white text-xs font-medium px-2 py-1 rounded hover:bg-primary-dark transition-colors"
                  >
                    {item.category}
                  </Link>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 line-clamp-2 h-14">
                  <Link href={`/bai-viet/${item.id}`} className="hover:text-primary transition-colors">
                    {item.title}
                  </Link>
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(item.date, 'dd/MM/yyyy')}
                    </span>
                    <span>•</span>
                    <span>{item.readTime} đọc</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center hover:text-primary transition-colors">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {item.commentCount}
                    </button>
                    <button className="hover:text-primary transition-colors">
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button className="hover:text-primary transition-colors">
                      <Bookmark className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedNews;
