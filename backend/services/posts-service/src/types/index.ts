// Base types
export type PostStatus = 'draft' | 'published' | 'archived';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Post related types
export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnail?: string;
  status: PostStatus;
  view_count: number;
  like_count: number;
  comment_count: number;
  user_id: string;
  category_id: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date | null;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface PostWithDetails extends Omit<Post, 'tags'> {
  author_username: string;
  author_avatar?: string;
  category_name: string;
  category_slug: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface PostWithDetailsWithCount extends PostWithDetails {
  total_count: string;
}

export interface PostCreateInput {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  thumbnail?: string;
  featuredImage?: string;
  status?: PostStatus;
  category_id: string;
  tags?: string[];
  published_at?: Date;
}

export interface PostUpdateInput {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  thumbnail?: string;
  featuredImage?: string;
  status?: PostStatus;
  category_id?: string;
  tags?: string[];
  published_at?: Date | null;
}

// Category related types
export interface Category {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
  post_count?: number;
}

// Tag related types
export interface Tag {
  id?: number;
  name: string;
  slug: string;
  created_at?: Date;
  updated_at?: Date;
}

// User related types (simplified)
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'author' | 'user';
}

// Request and Response types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: number;
}

// Database types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: any[];
}
