'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Search as SearchIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/user/UserMenu';

interface NavItemProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavItem = ({ href, children, isActive = false }: NavItemProps) => {
  // Thêm className cụ thể để dễ dàng target CSS
  return (
    <div className="nav-item-container">
      <Link 
        href={href}
        className={`
          px-4 h-12 flex items-center text-sm font-bold uppercase
          transition-colors duration-200 text-black
          ${isActive ? 'text-red-600 border-b-2 border-red-600' : 'hover:text-red-600'}
        `}
      >
        {children}
      </Link>
    </div>
  );
}

const NewHeader = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  // Cập nhật ngày tháng hiện tại
  useEffect(() => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateStr = now.toLocaleDateString('vi-VN');
    setCurrentDate(`${dayName}, ${dateStr}`);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get('search') as string;
    console.log('Searching for:', query);
    // Xử lý tìm kiếm ở đây
  };

  return (
    <>
      {/* Global styles for header links */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Reset all link colors in header */
          .header-container > div a:not(.nav-item-container a),
          .header-container > div a:not(.nav-item-container a):link,
          .header-container > div a:not(.nav-item-container a):visited,
          .header-container > div a:not(.nav-item-container a):active,
          .header-container > div a:not(.nav-item-container a):focus,
          .header-container > div a:not(.nav-item-container a):hover {
            color: white !important;
            text-decoration: none !important;
          }
          
          /* Hover effect */
          .header-container > div a:not(.nav-item-container a):not(.no-header-style):hover {
            color: #fecaca !important; /* red-200 */
          }
          
          /* Đảm bảo các mục menu giữ được màu đen */
          .nav-item-container a {
            color: #000 !important;
          }
          
          .nav-item-container a:hover {
            color: #ef4444 !important; /* red-600 */
          }
        `
      }} />
      
      {/* Top bar */}
      <div className="header-container bg-red-700 text-white text-sm py-1.5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-100">{currentDate}</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu />
              ) : (
                <Link 
                  href="/dang-nhap" 
                  className="text-sm font-medium text-white hover:text-red-200 transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-600 hover:text-red-600 md:hidden"
                aria-expanded={isMobileMenuOpen}
                aria-label="Mở menu chính"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <Link href="/" className="ml-2 md:ml-0">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-red-600 leading-none">TUỔI TRẺ</span>
                  <span className="text-xs text-gray-600">ONLINE</span>
                </div>
              </Link>
            </div>
            
            {/* Search bar and button in one line */}
            <div className="flex items-center">
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  name="search"
                  placeholder="Tìm kiếm..."
                  className="border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-64"
                />
                <button 
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-r hover:bg-red-700 flex items-center h-10"
                  aria-label="Tìm kiếm"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
          
          {/* Main navigation */}
          <nav className="w-full bg-white border-t border-gray-200 shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-12">
                <div className="flex space-x-1">
                  <NavItem href="/" isActive>TRANG CHỦ</NavItem>
                  <NavItem href="/thoi-su">THỜI SỰ</NavItem>
                  <NavItem href="/the-gioi">THẾ GIỚI</NavItem>
                  <NavItem href="/kinh-doanh">KINH DOANH</NavItem>
                  <NavItem href="/giai-tri">GIẢI TRÍ</NavItem>
                  <NavItem href="/the-thao">THỂ THAO</NavItem>
                  <NavItem href="/giao-duc">GIÁO DỤC</NavItem>
                  <NavItem href="/doi-song">ĐỜI SỐNG</NavItem>
                </div>
                {/* Đã bỏ nút tìm kiếm khỏi thanh thể loại */}
              </div>
            </div>
          </nav>

          {/* Mobile search */}
          {isSearchOpen && (
            <div className="md:hidden bg-gray-50 p-4 border-t border-gray-200">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  name="search"
                  placeholder="Tìm kiếm..."
                  className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button 
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-r hover:bg-red-700"
                  aria-label="Tìm kiếm"
                >
                  <SearchIcon className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

    </>
  );
};

export default NewHeader;
