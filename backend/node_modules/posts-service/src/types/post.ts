
// Các trạng thái có thể có của bài viết
export type PostStatus = 'draft' | 'published' | 'archived';

export interface Post {
  id: string;                    // ID duy nhất của bài viết (UUID)
  title: string;                 // Tiêu đề bài viết
  slug: string;                  // Đường dẫn thân thiện SEO
  content: string;               // Nội dung chính của bài viết
  status: string;                // Trạng thái hiện tại: 'draft' | 'published' | 'archived'
  category_id?: string | null;    // ID của danh mục (liên kết với Categories Service)
  created_at: Date;              // Thời điểm tạo bài viết
  updated_at: Date;              // Thời điểm cập nhật gần nhất
  image_url?: string | null;      // Đường dẫn ảnh đại diện (có thể null)
  tags?: string[];               // Danh sách các tag liên quan
  category?: any;                // Thông tin đầy đủ của danh mục (sẽ được gán sau)
}

/**
 * Chi tiết bài viết với các thông tin bổ sung
 * Không chứa bất kỳ thông tin liên kết nào với các service khác
 */
export interface PostWithDetails extends Post {
  /**
   * Ảnh đại diện thu nhỏ (thumbnail)
   * Nếu không có, sẽ sử dụng image_url
   */
  thumbnail?: string;
  
  /**
   * Thời điểm xuất bản bài viết
   * Nếu không có, sẽ sử dụng created_at
   */
  published_at?: Date | null;
}

// DTO dùng để tạo mới bài viết
export interface CreatePostDto {
  title: string;                          // Tiêu đề bài viết (bắt buộc)
  slug: string;                          // Đường dẫn thân thiện SEO (bắt buộc)
  content: string;                       // Nội dung chính (bắt buộc)
  status: 'draft' | 'published' | 'archived'; // Trạng thái bài viết
  category_id?: string | null;            // ID của danh mục (nếu có)
  image_url?: string | null;              // Đường dẫn ảnh đại diện
  tags?: string[];                       // Danh sách các tag
}

// DTO dùng để cập nhật bài viết
export interface UpdatePostDto extends Partial<Omit<CreatePostDto, 'id' | 'created_at' | 'updated_at'>> {
  id: string;         // ID của bài viết cần cập nhật
  tags?: string[];    // Danh sách các tag mới (nếu cập nhật)
}

// Interface cho các tham số lấy danh sách bài viết
export interface GetPostsQuery {
  page?: number;           // Trang hiện tại (dùng cho phân trang)
  limit?: number;          // Số lượng bài viết mỗi trang
  status?: PostStatus;     // Lọc theo trạng thái
  search?: string;         // Từ khóa tìm kiếm
  sort?: 'newest' | 'oldest';
}

export interface PostFilterOptions {
  status?: PostStatus;
  search?: string;
  sort?: 'newest' | 'oldest';
  page: number;
  limit: number;
}
