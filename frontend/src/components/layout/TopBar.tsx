'use client';

import { useEffect, useState } from 'react';
import { FaFacebookF, FaYoutube, FaTiktok, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

export default function TopBar() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setCurrentTime(now.toLocaleDateString('vi-VN', options) + ' (GMT+7)');
    };
    
    updateTime();
    const timer = setInterval(updateTime, 60000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm py-2 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-300 flex items-center">
            <i className="far fa-clock mr-2"></i>
            <span>{currentTime}</span>
          </div>
          <div className="flex items-center space-x-6 mt-2 md:mt-0">
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
              <FaSignInAlt className="inline mr-1" /> Đăng nhập
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">
              <FaUserPlus className="inline mr-1" /> Đăng ký
            </a>
            <div className="hidden md:flex items-center space-x-4 ml-2 border-l border-gray-600 pl-4">
              <a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200" title="Facebook">
                <FaFacebookF />
              </a>
              <a href="#" className="text-gray-300 hover:text-red-500 transition-colors duration-200" title="YouTube">
                <FaYoutube />
              </a>
              <a href="#" className="text-gray-300 hover:text-pink-500 transition-colors duration-200" title="TikTok">
                <FaTiktok />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
