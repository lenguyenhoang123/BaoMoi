export type PostStatus = 'draft' | 'published' | 'archived';
export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: string;
    category_id?: string | null;
    created_at: Date;
    updated_at: Date;
    image_url?: string | null;
    tags?: string[];
    category?: any;
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
export interface CreatePostDto {
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published' | 'archived';
    category_id?: string | null;
    image_url?: string | null;
    tags?: string[];
}
export interface UpdatePostDto extends Partial<Omit<CreatePostDto, 'id' | 'created_at' | 'updated_at'>> {
    id: string;
    tags?: string[];
}
export interface GetPostsQuery {
    page?: number;
    limit?: number;
    status?: PostStatus;
    search?: string;
    sort?: 'newest' | 'oldest';
}
export interface PostFilterOptions {
    status?: PostStatus;
    search?: string;
    sort?: 'newest' | 'oldest';
    page: number;
    limit: number;
}
//# sourceMappingURL=post.d.ts.map