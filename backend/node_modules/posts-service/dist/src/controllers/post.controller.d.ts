import BaseController from './base.controller';
export default class PostController extends BaseController {
    private postService;
    /**
     * Lấy tất cả bài viết
     */
    getAllPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    getPostById: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
}
//# sourceMappingURL=post.controller.d.ts.map