/**
 * Application constants
 * Tập trung tất cả các hằng số của ứng dụng vào một nơi để dễ quản lý
 */

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  ME: '/auth/me',
  
  // Users
  USERS: '/users',
  
  // Posts
  POSTS: '/posts',
  FEATURED_POSTS: '/posts/featured',
  
  // Categories
  CATEGORIES: '/categories',
  
  // Comments
  COMMENTS: '/comments',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_ORDER: 'desc',
  DEFAULT_SORT_BY: 'createdAt',
} as const;

// Validation rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 32,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DATE: 'dd/MM/yyyy',
  DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// Application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/dang-nhap',
  REGISTER: '/dang-ky',
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin',
    POSTS: '/admin/bai-viet',
    CREATE_POST: '/admin/bai-viet/them-moi',
    EDIT_POST: '/admin/bai-viet/chinh-sua',
    CATEGORIES: '/admin/danh-muc',
    USERS: '/admin/nguoi-dung',
  },
} as const;

// Default SEO configuration
export const SEO = {
  TITLE: 'Báo Mới - Tin tức mới nhất 24h',
  DESCRIPTION: 'Cập nhật tin tức mới nhất trong ngày Việt Nam và thế giới. Tin nhanh, tin nóng về kinh tế, chính trị, xã hội, thế giới, giáo dục, thể thao, văn hóa, giải trí, công nghệ.',
  KEYWORDS: 'tin tức, báo mới, tin mới, tin nóng, tin tức 24h, tin tuc, tin tuc moi nhat, tin tuc 24h, tin tức mới nhất, tin tức trong ngày',
  AUTHOR: 'Báo Mới',
  SITE_URL: 'https://baomoi.com',
  IMAGE: '/images/og-image.jpg',
  TWITTER_HANDLE: '@baomoi',
} as const;

// Default theme configuration
export const THEME = {
  COLORS: {
    PRIMARY: '#1890ff',
    SECONDARY: '#52c41a',
    SUCCESS: '#52c41a',
    ERROR: '#f5222d',
    WARNING: '#faad14',
    INFO: '#1890ff',
    TEXT: 'rgba(0, 0, 0, 0.85)',
    TEXT_SECONDARY: 'rgba(0, 0, 0, 0.65)',
    BORDER: '#f0f0f0',
    BACKGROUND: '#f5f5f5',
  },
  FONT_FAMILY: '"Roboto", "Helvetica", "Arial", sans-serif',
  BOX_SHADOW: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  BORDER_RADIUS: '4px',
  TRANSITION: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
