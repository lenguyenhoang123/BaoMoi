import type { Post, PostStatus, CreatePostDto, UpdatePostDto } from '../types/post';
interface GetPostsOptions {
    limit?: number;
    offset?: number;
    status?: PostStatus;
    sort?: string;
    order?: 'asc' | 'desc';
    authorId?: string;
}
declare class PostService {
    /**
     * Tạo slug từ tiêu đề bài viết
     */
    private generateSlug;
    createPost(data: CreatePostDto, authorId: string): Promise<Post>;
    /**
     * Cập nhật bài viết đã tồn tại
     */
    updatePost(id: string, data: UpdatePostDto): Promise<Post | null>;
    /**
     * Xóa bài viết
     */
    deletePost(id: string): Promise<boolean>;
    /**
     * Lấy bài viết theo ID
     */
    getPostById(id: string): Promise<Post | null>;
    /**
     * Lấy bài viết theo đường dẫn tĩnh (slug)
     */
    getPostBySlug(slug: string): Promise<Post | null>;
    /**
     * Lấy danh sách bài viết có phân trang và lọc
     */
    getPostsByCategory(categoryId: string, options?: GetPostsOptions): Promise<Post[]>;
    /**
     * Tăng số lượt xem của bài viết
     */
    incrementViewCount(id: string): Promise<boolean>;
    /**
     * Tăng số lượt thích của bài viết
     */
    incrementLikeCount(id: string): Promise<boolean>;
    /**
     * Lấy các bài viết mới nhất đã xuất bản
     */
    getLatestPosts(limit?: number): Promise<Post[]>;
    /**
     * Tìm kiếm bài viết theo từ khóa
     */
    searchPosts(query: string, limit?: number, offset?: number): Promise<{
        posts: Post[];
        total: number;
    }>;
}
declare const _default: PostService;
export default _default;
//# sourceMappingURL=post.service.d.ts.map