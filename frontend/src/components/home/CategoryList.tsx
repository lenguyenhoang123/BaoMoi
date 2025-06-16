/** @jsxImportSource @emotion/react */
import React from 'react';
import Link from 'next/link';
import { useCategories } from '../../hooks/useCategories';
import { Category } from '../../types';

interface CategoryListProps {
  className?: string;
  vertical?: boolean;
}

const CategoryList: React.FC<CategoryListProps> = ({ className = '', vertical = false }) => {
  const { categories, loading, error, fetchCategories } = useCategories();
  
  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-md mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-red-600`}>
        <p>{error}</p>
      </div>
    );
  }

  // Danh sách categories mặc định
  const defaultCategories = [
    { id: 1, name: 'Thời sự', slug: 'thoi-su' },
    { id: 2, name: 'Thế giới', slug: 'the-gioi' },
    { id: 3, name: 'Kinh doanh', slug: 'kinh-doanh' },
    { id: 4, name: 'Công nghệ', slug: 'cong-nghe' },
    { id: 5, name: 'Thể thao', slug: 'the-thao' },
    { id: 6, name: 'Giải trí', slug: 'giai-tri' },
    { id: 7, name: 'Đời sống', slug: 'doi-song' },
    { id: 8, name: 'Giáo dục', slug: 'giao-duc' },
    { id: 9, name: 'Sức khỏe', slug: 'suc-khoe' },
    { id: 10, name: 'Du lịch', slug: 'du-lich' },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  if (displayCategories.length === 0) {
    return (
      <div className={`${className} text-gray-600`}>
        <p>Không có danh mục nào.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className={vertical ? 'space-y-2' : 'flex flex-wrap gap-4'}>
        {displayCategories.map((category) => (
          <li key={category.id} className={vertical ? '' : 'inline-block'}>
            <Link
              key={category.id}
              href={`/category/${category.slug || category.id}`}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                vertical 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={(e) => {
                // Nếu là categories mặc định, ngăn chuyển trang
                if (categories.length === 0) {
                  e.preventDefault();
                  // Có thể thêm thông báo hoặc xử lý khác ở đây
                  alert('Đây là danh mục mặc định. Vui lòng thêm danh mục vào hệ thống để sử dụng đầy đủ tính năng.');
                }
              }}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
