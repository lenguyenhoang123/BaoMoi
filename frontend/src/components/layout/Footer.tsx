'use client';

import Link from 'next/link';
import { Facebook, Youtube, MessageSquare, Music, Mail, MapPin, Phone, Clock } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'VỀ BÁO TUỔI TRẺ',
      links: [
        { name: 'Giới thiệu', href: '/about' },
        { name: 'Liên hệ tòa soạn', href: '/lien-he' },
        { name: 'Tuyển dụng', href: '/tuyen-dung' },
        { name: 'Quảng cáo', href: '/quang-cao' },
        { name: 'Điều kiện sử dụng', href: '/dieu-khoan' },
      ],
    },
    {
      title: 'DỊCH VỤ',
      links: [
        { name: 'Rao vặt', href: '/rao-vat' },
        { name: 'Tìm việc', href: '/viec-lam' },
        { name: 'Mua sắm', href: '/mua-sam' },
        { name: 'Du lịch', href: '/du-lich' },
        { name: 'Nhà đất', href: '/nha-dat' },
      ],
    },
    {
      title: 'CHUYÊN MỤC',
      links: [
        { name: 'Thời sự', href: '/thoi-su' },
        { name: 'Thế giới', href: '/the-gioi' },
        { name: 'Kinh doanh', href: '/kinh-doanh' },
        { name: 'Giải trí', href: '/giai-tri' },
        { name: 'Thể thao', href: '/the-thao' },
      ],
    },
    {
      title: 'TIỆN ÍCH',
      links: [
        { name: 'Thời tiết', href: '/thoi-tiet' },
        { name: 'Tỷ giá', href: '/ty-gia' },
        { name: 'Giá vàng', href: '/gia-vang' },
        { name: 'Lịch phát sóng', href: '/lich-phat-song' },
        { name: 'Xem lịch', href: '/xem-lich' },
      ],
    },
  ];

  const socialLinks = [
    { 
      name: 'Facebook',
      icon: <Facebook size={20} />, 
      href: 'https://facebook.com/tuoitreonline' 
    },
    { 
      name: 'Youtube',
      icon: <Youtube size={20} />, 
      href: 'https://youtube.com/tuoitreonline' 
    },
    { 
      name: 'Zalo',
      icon: <MessageSquare size={20} />, 
      href: 'https://zalo.me/tuoitre' 
    },
    { 
      name: 'TikTok',
      icon: <Music size={20} />, 
      href: 'https://tiktok.com/@tuoitre' 
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-white">
              BÁO MỚI
            </Link>
            <p className="text-gray-400">
              Cập nhật tin tức mới nhất trong ngày, tin nóng, tin nhanh, tin thời sự, thể thao, giải trí, đời sống,...
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Social media link"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-white font-semibold text-lg">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">LIÊN HỆ</h3>
            <address className="not-italic space-y-3">
              <div className="flex items-start">
                <MapPin className="flex-shrink-0 mt-1 mr-2 text-primary-400" size={16} />
                <span>123 Đường Báo Chí, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center">
                <Mail className="flex-shrink-0 mr-2 text-primary-400" size={16} />
                <a href="mailto:info@baomoi.com" className="hover:text-white transition-colors">info@baomoi.com</a>
              </div>
              <div className="flex items-center">
                <Phone className="flex-shrink-0 mr-2 text-primary-400" size={16} />
                <a href="tel:+84281234567" className="hover:text-white transition-colors">(028) 123 4567</a>
              </div>
              <div className="flex items-start">
                <Clock className="flex-shrink-0 mt-1 mr-2 text-primary-400" size={16} />
                <span>Thứ 2 - Thứ 6: 8:00 - 17:00</span>
              </div>
            </address>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {currentYear} Báo Mới. Tất cả các quyền được bảo lưu.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">
                Điều khoản sử dụng
              </Link>
              <Link href="/sitemap" className="text-sm text-gray-500 hover:text-white transition-colors">
                Sơ đồ trang web
              </Link>
            </div>
          </div>
          
          {/* App Download */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <h4 className="text-sm font-medium text-white mb-3">TẢI ỨNG DỤNG</h4>
            <div className="flex flex-wrap gap-3">
              <a 
                href="#" 
                className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Tải ứng dụng trên App Store"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.13 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-3.46 2.74-3.46 1.15 0 2.85 1.16 2.85 3.3 0 1.57-1.34 3.25-2.74 3.13-1.36-.12-2.9-1.99-2.85-2.97z" />
                </svg>
                App Store
              </a>
              <a 
                href="#" 
                className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                aria-label="Tải ứng dụng trên Google Play"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.6 1.5h16.8a2.1 2.1 0 0 1 2.1 2.1v16.8a2.1 2.1 0 0 1-2.1 2.1H3.6a2.1 2.1 0 0 1-2.1-2.1V3.6a2.1 2.1 0 0 1 2.1-2.1zm10.5 12.6l-2.7-2.7-2.7 2.7 2.7 2.7 2.7-2.7zm-7.35-1.2l-3.3 3.3V3.6a.6.6 0 0 1 .6-.6h12.9l-3.3 3.3-3.3 3.3-3.3-3.3-3.3 3.3z" />
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
