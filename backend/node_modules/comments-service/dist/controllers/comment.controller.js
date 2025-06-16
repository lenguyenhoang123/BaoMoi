"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countCommentsByPost = exports.getCommentById = exports.toggleApproveComment = exports.deleteComment = exports.updateComment = exports.getCommentsByPost = exports.createComment = void 0;
const http_status_codes_1 = require("http-status-codes");
const comment_service_1 = __importDefault(require("../services/comment.service"));
const appError_1 = __importDefault(require("../utils/appError"));
/**
 * Xử lý yêu cầu tạo mới bình luận
 */
const createComment = async (req, res, next) => {
    try {
        const { content, post_id, parent_id } = req.body;
        const user_id = req.user?.id; // Lấy từ middleware xác thực
        if (!user_id) {
            throw new appError_1.default('User not authenticated', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        if (!content || !post_id) {
            throw new appError_1.default('Content and post_id are required', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        const commentData = {
            content,
            user_id,
            post_id,
            parent_id: parent_id || null,
            is_approved: true, // Hoặc false nếu cần kiểm duyệt
        };
        const newComment = await comment_service_1.default.create(commentData);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            status: 'success',
            data: {
                comment: newComment,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createComment = createComment;
/**
 * Lấy danh sách bình luận theo post ID
 */
const getCommentsByPost = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const includeReplies = req.query.includeReplies === 'true';
        const result = await comment_service_1.default.getByPostId(postId, {
            page,
            limit,
            includeReplies,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: 'success',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCommentsByPost = getCommentsByPost;
/**
 * Cập nhật bình luận
 */
const updateComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const user_id = req.user?.id;
        if (!user_id) {
            throw new appError_1.default('User not authenticated', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        if (!content) {
            throw new appError_1.default('Content is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        const updateData = { content };
        const updatedComment = await comment_service_1.default.update(id, updateData, user_id, req.user?.role === 'admin');
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: 'success',
            data: {
                comment: updatedComment,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateComment = updateComment;
/**
 * Xóa bình luận
 */
const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        if (!user_id) {
            throw new appError_1.default('User not authenticated', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        await comment_service_1.default.delete(id, user_id, req.user?.role === 'admin');
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).json({
            status: 'success',
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteComment = deleteComment;
/**
 * Phê duyệt/bỏ phê duyệt bình luận (cho admin)
 */
const toggleApproveComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;
        if (typeof is_approved !== 'boolean') {
            throw new appError_1.default('Invalid status value', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        if (!req.user) {
            throw new appError_1.default('User not authenticated', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        const isOwner = await comment_service_1.default.isOwner(id, req.user.id);
        const updatedComment = await comment_service_1.default.update(id, { is_approved }, req.user.id, req.user.role === 'admin' || isOwner);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: 'success',
            data: {
                comment: updatedComment,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleApproveComment = toggleApproveComment;
/**
 * Lấy thông tin chi tiết bình luận
 */
const getCommentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const comment = await comment_service_1.default.getById(id);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: 'success',
            data: {
                comment,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCommentById = getCommentById;
/**
 * Đếm số lượng comments của một bài viết
 */
const countCommentsByPost = async (req, res, next) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            throw new appError_1.default('Post ID is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        const count = await comment_service_1.default.countByPostId(postId);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            status: 'success',
            data: {
                postId,
                count
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.countCommentsByPost = countCommentsByPost;
exports.default = {
    createComment: exports.createComment,
    getCommentsByPost: exports.getCommentsByPost,
    updateComment: exports.updateComment,
    deleteComment: exports.deleteComment,
    toggleApproveComment: exports.toggleApproveComment,
    getCommentById: exports.getCommentById,
    countCommentsByPost: exports.countCommentsByPost,
};
