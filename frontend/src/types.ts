// Các vai trò người dùng
export type UserRole = 'admin' | 'editor' | 'author' | 'user';

export interface User {
  id: string | number;
  email: string;
  username?: string;
  name?: string;
  full_name?: string;
  role: string | UserRole;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any; // Cho phép các trường khác
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string | null;
  featuredImage?: string;
  isActive: boolean;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

// Các trạng thái bài viết
export type PostStatus = 'draft' | 'published' | 'archived' | 'pending_review';

// Độ ưu tiên hiển thị bài viết
export type PostPriority = 'low' | 'normal' | 'high' | 'featured';

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  gallery?: string[];
  author: User;
  category: Category;
  tags: string[];
  status: PostStatus;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isBreakingNews: boolean;
  isTrending: boolean;
  priority: PostPriority;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  gallery?: string[];
  category: string;
  tags: string[];
  status: PostStatus;
  isBreakingNews?: boolean;
  isTrending?: boolean;
  priority?: PostPriority;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  publishedAt?: string;
  scheduledAt?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: string;
}

// Trạng thái bình luận
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string | null;
  status: CommentStatus;
  likeCount: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string | null;
}

export interface UpdateCommentData {
  content: string;
  status?: CommentStatus;
}

// Kiểu dữ liệu cho phân trang
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Kiểu dữ liệu cho tìm kiếm
export interface SearchParams {
  query: string;
  category?: string;
  author?: string;
  tag?: string;
  status?: PostStatus;
  dateFrom?: string;
  dateTo?: string;
}

// Kiểu dữ liệu cho bộ lọc
export interface FilterOptions {
  categories: Category[];
  authors: Pick<User, 'id' | 'name' | 'avatar'>[];
  tags: string[];
  statuses: { value: PostStatus; label: string }[];
}

// Kiểu dữ liệu cho thống kê
export interface PostStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  byCategory: Array<{ category: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}
