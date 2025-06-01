export interface Image {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  fullName?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Credentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  excerpt?: string;
  content: string;
  thumbnail?: string;
  image?: string;
  images?: Image[];
  category: Category | string;
  tags?: Tag[];
  isPublished: boolean;
  isFeatured?: boolean;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  readingTime?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  // Thêm các trường bổ sung từ API nếu cần
  description?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ListResponse<T> {
  results: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
