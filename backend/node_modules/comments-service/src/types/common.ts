/**
 * Trạng thái của bình luận
 */
export type ICommentStatus = 'pending' | 'approved' | 'rejected' | 'deleted';

/**
 * Interface đại diện cho một bình luận
 */
export interface IComment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  status: ICommentStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * Interface cho dữ liệu tạo mới bình luận
 */
export interface ICreateCommentDto {
  content: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  post_id: string;
  parent_id?: string | null;
  is_approved?: boolean;
}

/**
 * Interface cho dữ liệu cập nhật bình luận
 */
export interface IUpdateCommentDto {
  content?: string;
  is_approved?: boolean;
}

/**
 * Interface cho kết quả phân trang
 */
export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface cho các tham số phân trang
 */
export interface IPaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface cho bộ lọc bình luận
 */
export interface ICommentFilters {
  post_id?: string;
  user_id?: string;
  parent_id?: string | null;
  is_approved?: boolean;
}
