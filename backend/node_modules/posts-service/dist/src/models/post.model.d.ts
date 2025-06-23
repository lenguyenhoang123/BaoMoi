export interface CategoryType {
    id: string;
    name: string;
    slug: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface PostType {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: string;
    category_id?: string | null;
    category?: CategoryType | null;
    created_at: Date;
    updated_at: Date;
    image_url?: string | null;
    tags?: string[];
    save?(): Promise<PostType>;
    update?(data: Partial<Omit<PostType, 'id' | 'created_at' | 'updated_at'>>): Promise<PostType>;
    delete?(): Promise<boolean>;
    getCategory?(): Promise<CategoryType | null>;
}
export interface FindAllOptions {
    limit?: number;
    offset?: number;
    status?: string;
}
declare class Post {
    /**
     * Lấy tất cả bài viết có phân trang
     * @param options - Các tùy chọn phân trang
     * @returns Promise chứa mảng các bài viết
     */
    /**
     * Lấy danh sách bài viết với phân trang và lọc
     * @param options - Các tùy chọn tìm kiếm và phân trang
     * @returns Promise chứa thông tin phân trang và danh sách bài viết
     */
    static findAll({ limit, offset, status }?: FindAllOptions): Promise<{
        posts: PostType[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Tìm bài viết theo ID
     * @param id - ID của bài viết
     * @returns Promise chứa thông tin bài viết hoặc null nếu không tìm thấy
     */
    static findById(id: string): Promise<PostType | null>;
    /**
     * Lấy thông tin chi tiết của danh mục cho bài viết
     * @returns Promise chứa thông tin danh mục hoặc null nếu không có
     */
    /**
     * Tạo bài viết mới
     * @param data - Dữ liệu bài viết mới
     * @returns Promise chứa thông tin bài viết đã tạo
     */
    static create(data: Omit<PostType, 'id' | 'created_at' | 'updated_at'>): Promise<PostType>;
    /**
     * Cập nhật bài viết
     * @param id - ID của bài viết cần cập nhật
     * @param data - Đối tượng chứa các trường cần cập nhật
     * @returns Promise chứa thông tin bài viết đã cập nhật hoặc null nếu không tìm thấy
     */
    static update(id: string, data: Partial<Omit<PostType, 'id' | 'created_at' | 'updated_at'>>): Promise<PostType | null>;
    /**
     * Xóa bài viết
     * @param id - ID của bài viết cần xóa
     * @returns Promise chứa kết quả xóa
     */
    static delete(id: string): Promise<boolean>;
}
export default Post;
//# sourceMappingURL=post.model.d.ts.map