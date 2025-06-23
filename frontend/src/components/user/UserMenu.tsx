'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, FileText, Plus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Tạo portal container
  const portalRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Tạo một div mới cho portal nếu chưa tồn tại
    if (!document.getElementById('user-menu-portal')) {
      const portal = document.createElement('div');
      portal.id = 'user-menu-portal';
      portal.style.position = 'relative';
      portal.style.zIndex = '1000';
      document.body.appendChild(portal);
    }
    portalRef.current = document.getElementById('user-menu-portal');
    
    return () => {
      setIsMounted(false);
      // Dọn dẹp khi component unmount
      if (portalRef.current && document.body.contains(portalRef.current)) {
        document.body.removeChild(portalRef.current);
      }
    };
  }, []);

  // Cập nhật vị trí dropdown
  const [position, setPosition] = useState({ 
    top: 0, 
    left: 0, 
    right: 0,
    width: 0,
    height: 0 
  });

  useEffect(() => {
    if (isOpen && buttonRef.current && portalRef.current) {
      const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        });
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
    
    // Return undefined nếu không có gì để dọn dẹp
    return undefined;
  }, [isOpen]);

  // Xử lý click ra ngoài
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/dang-nhap');
  };

  if (!user) {
    console.log('No user found in UserMenu');
    return null;
  }

  // Lấy tên hiển thị ưu tiên full_name, sau đó đến email
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Người dùng';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar || '';
  
  console.log('UserMenu user data:', { user, displayName, userEmail });

  // Nội dung dropdown
  const dropdownContent = (
    <div 
      ref={dropdownRef}
      className="bg-white w-64 rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu"
    >
      {/* Header với thông tin user */}
      <div className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 border-b border-red-700">
        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
        {userEmail && <p className="text-xs text-red-100 opacity-90 truncate">{userEmail}</p>}
      </div>
      
      {/* Các mục menu */}
      <div className="py-1">
        {/* Chỉ hiển thị cho admin và editor */}
        {(user.role === 'admin' || user.role === 'editor') && (
          <>
            <Link 
              href="/admin/bai-viet/them-moi" 
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 group/item transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-1.5 mr-3 rounded-md bg-red-50 group-hover/item:bg-red-100 transition-colors">
                <Plus className="h-4 w-4 text-red-600" />
              </div>
              <span className="group-hover/item:text-red-600 font-medium">Tạo bài viết mới</span>
            </Link>
            
            <Link 
              href="/admin/bai-viet" 
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 group/item transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-1.5 mr-3 rounded-md bg-blue-50 group-hover/item:bg-blue-100 transition-colors">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <span className="group-hover/item:text-blue-600 font-medium">Quản lý bài viết</span>
            </Link>
          </>
        )}
        
        {/* Chỉ hiển thị cho admin */}
        {user.role === 'admin' && (
          <Link 
            href="/admin/cai-dat" 
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 group/item transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-1.5 mr-3 rounded-md bg-amber-50 group-hover/item:bg-amber-100 transition-colors">
              <Settings className="h-4 w-4 text-amber-600" />
            </div>
            <span className="group-hover/item:text-amber-600 font-medium">Cài đặt</span>
          </Link>
        )}
        
        {/* Thêm mục Quản lý người dùng nếu là admin */}
        {user.role === 'admin' && (
          <Link 
            href="/admin/nguoi-dung" 
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 group/item transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="p-1.5 mr-3 rounded-md bg-purple-50 group-hover/item:bg-purple-100 transition-colors">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <span className="group-hover/item:text-purple-600 font-medium">Quản lý người dùng</span>
          </Link>
        )}
        
        <div className="border-t border-gray-100 my-1" />
        
        <button
          onClick={() => {
            setIsOpen(false);
            handleLogout();
          }}
          className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Nút avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
        ref={buttonRef}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm hover:border-red-300 transition-all duration-200">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={displayName} 
              className="w-full h-full object-cover"
              width={40}
              height={40}
            />
          ) : (
            <User className="w-5 h-5 text-red-500" />
          )}
        </div>
      </button>
      
      {/* Dropdown Menu */}
      {isMounted && portalRef.current && isOpen && createPortal(
        <div 
          className="fixed z-50 transition-all duration-200 ease-out transform"
          style={{
            top: position.top + 10,
            right: window.innerWidth - position.right,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
            pointerEvents: isOpen ? 'auto' : 'none',
            transformOrigin: 'top right',
            minWidth: '16rem',
            maxWidth: 'calc(100% - 1rem)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {dropdownContent}
        </div>,
        portalRef.current
      )}
    </div>
  );
}
