/**
 * Interface đại diện cho một tag trong hệ thống
 */
export interface Tag {
  /** ID của tag (định dạng UUID) */
  id: string;
  
  /** Tên hiển thị của tag */
  name: string;
  
  /** Đường dẫn thân thiện SEO, tự động tạo từ tên */
  slug: string;
  
  /** Mô tả tag */
  description: string | null;
  
  /** Trạng thái hoạt động */
  isActive: boolean;
  
  /** Thời gian tạo tag */
  createdAt: string;
  
  /** Thời gian cập nhật gần nhất */
  updatedAt: string | null;
  
  /** Người tạo */
  createdBy: string | null;
  
  /** Người cập nhật gần nhất */
  updatedBy: string | null;
}

/**
 * Dữ liệu cần thiết để tạo mới một tag
 */
export interface CreateTagInput {
  /** Tên hiển thị của tag */
  name: string;
  
  /** 
   * Đường dẫn thân thiện SEO
   * Nếu không cung cấp, hệ thống sẽ tự động tạo từ tên
   */
  slug?: string;
}

/**
 * Dữ liệu cập nhật tag
 */
export interface UpdateTagInput {
  /** Tên mới của tag */
  name?: string;
  
  /** Đường dẫn thân thiện SEO mới */
  slug?: string;
}

/**
 * Tham số tìm kiếm và phân trang cho danh sách tag
 */
export interface TagQueryParams {
  /** Trang hiện tại */
  page?: number;
  
  /** Số lượng bản ghi mỗi trang */
  limit?: number;
  
  /** Từ khóa tìm kiếm */
  search?: string;
  
  /** Trường sắp xếp */
  sortBy?: 'id' | 'name' | 'slug' | 'created_at';
  
  /** Thứ tự sắp xếp */
  sortOrder?: 'ASC' | 'DESC';
  
  /** Trạng thái hoạt động */
  is_active?: boolean | string | undefined;
}

export interface TagFilterOptions extends TagQueryParams {
  offset: number;
}
