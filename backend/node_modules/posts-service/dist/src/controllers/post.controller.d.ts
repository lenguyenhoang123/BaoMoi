import BaseController from './base.controller';
export default class PostController extends BaseController {
    private postService;
    /**
     * Lấy tất cả bài viết
     */
    getAllPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    getFeaturedPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    getHotPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    getPost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Tạo mới bài viết
     */
    createPost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Cập nhật bài viết
     */
    updatePost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Xóa bài viết
     */
    deletePost: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Cập nhật trạng thái nổi bật
     */
    updateFeaturedStatus: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Cập nhật trạng thái hot
     */
    updateHotStatus: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Xử lý tags
     */
    private processTags;
    /**
     * Lấy thông tin chi tiết bài viết
     */
    private getPostWithDetails;
}
//# sourceMappingURL=post.controller.d.ts.map