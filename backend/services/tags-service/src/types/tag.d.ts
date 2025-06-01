import { Pool } from 'pg';

declare module '../types/tag' {
  export interface Tag {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
  }

  export interface CreateTagInput {
    name: string;
    slug?: string;
    description?: string;
    is_active?: boolean;
    created_by?: string;
  }

  export interface UpdateTagInput {
    name?: string;
    slug?: string;
    description?: string | null;
    is_active?: boolean;
    updated_by?: string | null;
  }

  export interface TagRow {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
  }

  export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }

  export interface PaginatedResult<T> {
    data: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
}
