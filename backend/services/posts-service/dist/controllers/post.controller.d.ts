import BaseController from './base.controller';
export default class PostController extends BaseController {
    /**
     * Thêm các thẻ (tags) vào bài viết
     * @param postId - ID của bài viết
     * @param tagIds - Mảng các ID của thẻ cần thêm
     */
    private addTagsToPost;
    /**
     * Lấy thông tin chi tiết của một bài viết
     * Bao gồm thông tin tác giả, danh mục và các thẻ
     * @param postId - ID của bài viết cần lấy thông tin
     * @returns Thông tin chi tiết bài viết hoặc null nếu không tìm thấy
     */
    private getPostWithDetails;
    /**
     * Lấy danh sách bài viết nổi bật
     */
    getFeaturedPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy danh sách bài viết mới nhất
     */
    getLatestPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy danh sách bài viết theo danh mục
     */
    getPostsByCategory: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy danh sách bài viết theo thẻ
     */
    getPostsByTag: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy danh sách tất cả bài viết với phân trang và bộ lọc
     */
    getAllPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy chi tiết bài viết theo ID hoặc slug
     */
    getPostById: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Tạo mới một bài viết
     * Yêu cầu quyền đăng nhập và có quyền tạo bài viết
     */
    createPost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Cập nhật thông tin bài viết
     * Chỉ chủ sở hữu bài viết hoặc admin mới có quyền cập nhật
     */
    updatePost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Xóa một bài viết
     * Chỉ chủ sở hữu bài viết hoặc admin mới có quyền xóa
     * Khi xóa bài viết sẽ xóa luôn các bình luận và thẻ liên quan
     */
    deletePost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Tăng số lượt xem của bài viết lên 1
     * Gọi API này mỗi khi người dùng xem chi tiết bài viết
     */
    incrementViewCount: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Tăng số lượt thích
     */
    incrementLikeCount: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Tìm kiếm bài viết
     * Sử dụng tham số search trong query params
     */
    searchPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
}
//# sourceMappingURL=post.controller.d.ts.map