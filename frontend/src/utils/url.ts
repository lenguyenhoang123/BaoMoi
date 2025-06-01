const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const getImageUrl = (path?: string, defaultImage = '/images/placeholder.jpg'): string => {
  if (!path) return defaultImage;
  
  // Nếu là URL đầy đủ thì trả về luôn
  if (path.startsWith('http')) {
    return path;
  }
  
  // Nếu là đường dẫn tương đối thì thêm base URL
  const basePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${basePath}`;
};

export const getPostUrl = (slug: string): string => {
  return `/bai-viet/${slug}`;
};

export const getCategoryUrl = (slug: string): string => {
  return `/danh-muc/${slug}`;
};

export const getTagUrl = (slug: string): string => {
  return `/tag/${slug}`;
};
