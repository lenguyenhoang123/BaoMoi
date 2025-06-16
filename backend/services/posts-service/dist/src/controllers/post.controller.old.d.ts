import { Response } from 'express';
import { ApiResponse } from '../types';
import BaseController from './base.controller';
export default class PostController extends BaseController {
    private postService;
    /**
     * Lấy tất cả bài viết
     */
    getAllPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy danh sách bài viết nổi bật
     */
    getFeaturedPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy danh sách bài viết hot
     */
    getHotPosts: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * Lấy chi tiết bài viết
     */
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
     * Lấy thông tin chi tiết bài viết
     */
    private getPostWithDetails;
    /**
     * Gửi phản hồi thành công
     */
    protected sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response<ApiResponse<T>>;
    /**
     * Gửi phản hồi lỗi
     */
    protected sendError(res: Response, message?: string, statusCode?: number, errors?: any[]): void;
    /**
     * Gửi phản hồi không tìm thấy
     */
    protected sendNotFound(res: Response, message?: string): void;
}
//# sourceMappingURL=post.controller.old.d.ts.map