export interface PostType {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    image_url?: string | null;
    tags?: string[];
    save?(): Promise<PostType>;
    update?(data: Partial<Omit<PostType, 'id' | 'created_at' | 'updated_at'>>): Promise<PostType>;
    delete?(): Promise<boolean>;
}
export interface FindAllOptions {
    limit?: number;
    offset?: number;
}
declare class Post {
    /**
     * Lấy tất cả bài viết có phân trang
     * @param options - Các tùy chọn phân trang
     * @returns Promise chứa mảng các bài viết
     */
    static findAll({ limit, offset }?: FindAllOptions): Promise<PostType[]>;
    /**
     * Tìm bài viết theo ID
     * @param id - ID của bài viết
     * @returns Promise chứa thông tin bài viết hoặc null nếu không tìm thấy
     */
    static findById(id: string): Promise<PostType | null>;
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