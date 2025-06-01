import type { Post, PostWithDetails } from '../types/post';
interface CategoryPostsOptions {
    categoryId: string;
    limit: number;
    offset: number;
}
interface TagPostsOptions {
    tagId: string;
    limit: number;
    offset: number;
}
declare class PostService {
    /**
     * Tạo slug từ tiêu đề bài viết
     */
    private static generateSlug;
    /**
     * Ánh xạ dữ liệu từ database sang đối tượng Post
     */
    static mapPostRowToPost(row: any): Post;
    /**
     * Lấy danh sách bài viết theo tag với phân trang
     */
    static getPostsByTag({ tagId, limit, offset }: TagPostsOptions): Promise<{
        posts: PostWithDetails[];
        total: number;
    }>;
    /**
     * Lấy danh sách bài viết theo danh mục với phân trang
     */
    static getPostsByCategory({ categoryId, limit, offset }: CategoryPostsOptions): Promise<{
        posts: PostWithDetails[];
        total: number;
    }>;
    /**
     * Lấy bài viết nổi bật
     */
    static getFeaturedPosts(limit?: number): Promise<PostWithDetails[]>;
    /**
     * Lấy thông tin chi tiết bài viết theo ID
     */
    static getPostById(id: string): Promise<PostWithDetails | null>;
    /**
     * Xóa bài viết
     */
    static deletePost(id: string): Promise<boolean>;
    /**
     * Tăng số lượt xem của bài viết
     */
    static incrementViewCount(id: string): Promise<boolean>;
    /**
     * Tăng số lượt thích của bài viết
     */
    static incrementLikeCount(id: string): Promise<boolean>;
    /**
     * Lấy danh sách bài viết mới nhất
     */
    static getLatestPosts(limit?: number): Promise<PostWithDetails[]>;
    /**
     * Tìm kiếm bài viết theo từ khóa
     */
    static searchPosts(query: string, limit?: number, offset?: number): Promise<{
        posts: PostWithDetails[];
        total: number;
    }>;
}
export default PostService;
//# sourceMappingURL=post.service.d.ts.map