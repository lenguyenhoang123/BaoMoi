export type PostStatus = 'draft' | 'published' | 'pending' | 'archived' | 'pending_review';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  [key: string]: any;
}

export interface Author {
  id: string | number;
  name?: string;
  full_name?: string;
  email: string;
  avatar?: string;
  role?: string;
  [key: string]: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  [key: string]: any;
}

// Interface đại diện cho kiểu dữ liệu bài viết từ database
export interface DbPost {
  id: string;                    // UUID
  title: string;                 // Tiêu đề bài viết
  slug: string;                  // Đường dẫn thân thiện SEO
  content: string;               // Nội dung chính
  status: PostStatus;            // Trạng thái: 'draft', 'published', v.v.
  created_at: string;           // Ngày tạo (timestamp with timezone)
  updated_at: string;           // Ngày cập nhật (timestamp with timezone)
  image_url?: string | null;    // URL ảnh đại diện (có thể null)
  tags?: string[];              // Mảng các tag (ARRAY trong PostgreSQL)
}

// Interface cho dữ liệu bài viết dùng trong frontend
export interface Post {
  // Core fields
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  
  // Media
  imageUrl?: string | null;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Tags
  tags: string[];
  
  // Các trường tính toán hoặc từ các bảng liên quan
  isPublished?: boolean;         // = status === 'published'
  
  // Quan hệ
  author?: Author | string;
  category?: Category | string | null;
  
  // Các trường mở rộng (nếu cần)
  [key: string]: any;
}

// Interface cho danh sách bài viết với phân trang
export interface PostListResponse {
  data: Post[];
  total: number;
  current: number;
  pageSize: number;
}

// Interface cho tham số lọc bài viết
export interface PostListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: PostStatus;
  search?: string;
}

export interface CreatePostRequest {
  title: string;
  slug?: string;
  content: string;
  status?: PostStatus;
  image_url?: string;
  tags?: string[];
  category_id?: string | number | null;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
  category_id?: string | number | null;
}

export interface PostListParams {
  pagination?: {
    current: number;
    pageSize: number;
  };
  filters?: {
    status?: PostStatus;
    category_id?: string;
    [key: string]: any;
  };
  sorter?: {
    field: string;
    order: 'ascend' | 'descend' | null;
  };
  search?: string;
}

export interface PostListResponse {
  data: Post[];
  total: number;
  current: number;
  pageSize: number;
}
