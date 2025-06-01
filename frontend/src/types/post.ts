export type PostStatus = 'draft' | 'published' | 'pending' | 'archived';

export interface Tag {
  id?: string;
  name: string;
  slug?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  status: PostStatus;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  author_id: string;
  category_id: string;
  tags?: Tag[];
  author?: {
    id: string;
    full_name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreatePostRequest {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  status?: PostStatus;
  meta_title?: string;
  meta_description?: string;
  category_id: string;
  tags?: string[] | { name: string }[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
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
