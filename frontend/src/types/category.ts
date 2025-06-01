export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  posts_count?: number;
  parent?: Category;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string | null;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface CategoryListParams {
  pagination?: {
    current: number;
    pageSize: number;
  };
  filters?: {
    parent_id?: string | null;
    [key: string]: any;
  };
  search?: string;
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
  current: number;
  pageSize: number;
}
