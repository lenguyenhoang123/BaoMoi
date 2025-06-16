import { StatusCodes } from 'http-status-codes';

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  post_id: number;
  parent_id: number | null;
  is_approved: boolean;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
  status?: string;
}

export interface CommentCreateData {
  content: string;
  user_id: number;
  post_id: number;
  parent_id?: number | null;
  is_approved?: boolean;
}

export interface CommentUpdateData {
  content?: string;
  is_approved?: boolean;
}

export interface CommentFilters {
  post_id?: number;
  user_id?: number;
  parent_id?: number | 'null' | null;
  is_approved?: boolean;
  status?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
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

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
