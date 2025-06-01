export interface PostType {
    id?: number;
    title: string;
    content: string;
    category_id: number;
    created_at?: Date;
    updated_at?: Date;
    author_id?: number;
    slug?: string;
    excerpt?: string;
    featured_image?: string;
    status?: 'draft' | 'published' | 'archived';
    view_count?: number;
}
export interface FindAllOptions {
    limit?: number;
    offset?: number;
    category_id?: number | null;
}
declare class Post {
    /**
     * Lấy tất cả bài viết có phân trang
     * @param options - Các tùy chọn phân trang
     * @returns Promise chứa mảng các bài viết
     */
    static findAll({ limit, offset, category_id }?: FindAllOptions): Promise<PostType[]>;
    /**
     * Tìm bài viết theo ID
     * @param id - ID của bài viết
     * @returns Promise chứa thông tin bài viết hoặc null nếu không tìm thấy
     */
    static findById(id: number): Promise<PostType | null>;
    /**
     * Tạo bài viết mới
     * @param postData - Dữ liệu bài viết mới
     * @returns Promise chứa thông tin bài viết đã tạo
     */
    static create(postData: Omit<PostType, 'id' | 'created_at' | 'updated_at'>): Promise<PostType>;
    /**
     * Cập nhật bài viết
     * @param id - ID của bài viết cần cập nhật
     * @param updates - Đối tượng chứa các trường cần cập nhật
     * @returns Promise chứa thông tin bài viết đã cập nhật hoặc null nếu không tìm thấy
     */
    static update(id: number, updates: Partial<PostType>): Promise<PostType | null>;
    /**
     * Xóa bài viết
     * @param id - ID của bài viết cần xóa
     * @returns Promise chứa kết quả xóa
     */
    static delete(id: number): Promise<boolean>;
}
export default Post;
//# sourceMappingURL=post.model.d.ts.map