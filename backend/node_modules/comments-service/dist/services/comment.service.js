"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const comment_model_1 = __importDefault(require("../models/comment.model"));
const appError_1 = __importDefault(require("../utils/appError"));
const http_status_codes_1 = require("http-status-codes");
class CommentService {
    /**
     * Lấy danh sách comments với phân trang và lọc
     * @param options - Các tùy chọn tìm kiếm
     * @returns Danh sách comments và thông tin phân trang
     */
    async getAll({ page = 1, limit = 10, status, userId, postId } = {}) {
        try {
            const filters = {};
            if (status)
                filters.status = status;
            if (userId)
                filters.user_id = userId;
            if (postId)
                filters.post_id = postId;
            return await comment_model_1.default.findAll(page, limit, filters);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Lấy thông tin chi tiết comment
     * @param id - ID của comment
     * @returns Thông tin comment
     */
    async getById(id) {
        try {
            if (!id) {
                throw new appError_1.default('Comment ID is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            const comment = await comment_model_1.default.findById(id);
            if (!comment) {
                throw new appError_1.default('Comment not found', http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            return comment;
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Lấy danh sách comments theo post ID
     * @param postId - ID của bài viết
     * @param options - Các tùy chọn
     * @returns Danh sách comments và thông tin phân trang
     */
    async getByPostId(postId, { page = 1, limit = 10, includeReplies = false } = {}) {
        try {
            if (!postId) {
                throw new appError_1.default('Post ID is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Sử dụng phương thức tạm thời nếu findByPostId chưa được định nghĩa
            if (typeof comment_model_1.default.findByPostId === 'function') {
                return await comment_model_1.default.findByPostId(postId, { page, limit, includeReplies });
            }
            else {
                // Fallback: Sử dụng phương thức findAll với bộ lọc
                const result = await comment_model_1.default.findAll(page, limit, { post_id: postId });
                return {
                    data: result.data || [],
                    total: result.total || 0,
                    page: result.page || page,
                    limit: result.limit || limit,
                    totalPages: result.totalPages || 1
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Lấy danh sách replies của một comment
     * @param commentId - ID của comment cha
     * @param options - Các tùy chọn
     * @returns Danh sách replies và thông tin phân trang
     */
    async getReplies(commentId, { page = 1, limit = 10 } = {}) {
        try {
            if (!commentId) {
                throw new appError_1.default('Comment ID is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Kiểm tra xem comment cha có tồn tại không
            await this.getById(commentId);
            // Sử dụng phương thức tạm thời nếu getReplies chưa được định nghĩa
            if (typeof comment_model_1.default.getReplies === 'function') {
                return await comment_model_1.default.getReplies(commentId, page, limit);
            }
            else {
                // Fallback: Sử dụng phương thức findAll với bộ lọc parent_id
                const result = await comment_model_1.default.findAll(page, limit, { parent_id: commentId });
                return {
                    data: result.data || [],
                    total: result.total || 0,
                    page: result.page || page,
                    limit: result.limit || limit,
                    totalPages: result.totalPages || 1
                };
            }
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Tạo mới comment
     * @param commentData - Dữ liệu comment
     * @returns Comment đã tạo
     */
    async create(commentData) {
        try {
            // Validate required fields
            if (!commentData.content || !commentData.user_id || !commentData.post_id) {
                throw new appError_1.default('Content, user_id, and post_id are required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Validate content length
            if (commentData.content.trim().length < 3) {
                throw new appError_1.default('Comment must be at least 3 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Nếu là reply, kiểm tra comment cha tồn tại
            if (commentData.parent_id) {
                const parentComment = await comment_model_1.default.findById(commentData.parent_id);
                if (!parentComment) {
                    throw new appError_1.default('Parent comment not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                }
                // Ngăn chặn reply nhiều cấp
                if (parentComment.parent_id) {
                    throw new appError_1.default('Cannot reply to a reply', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
            }
            // Tạo comment mới
            return await comment_model_1.default.create(commentData);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Cập nhật comment
     * @param id - ID của comment cần cập nhật
     * @param data - Dữ liệu cập nhật
     * @param userId - ID của người dùng thực hiện thao tác
     * @param isAdmin - Có phải là admin không
     * @returns Comment đã cập nhật
     */
    async update(id, data, userId, isAdmin = false) {
        try {
            if (!id || !userId) {
                throw new appError_1.default('Comment ID and user ID are required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Lấy thông tin comment hiện tại
            const comment = await this.getById(id);
            // Kiểm tra quyền sở hữu
            if (!isAdmin && comment.user_id !== userId) {
                throw new appError_1.default('You are not authorized to update this comment', http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            // Chỉ cho phép cập nhật các trường được phép
            const updateData = {};
            if (data.content !== undefined) {
                if (data.content.trim().length < 3) {
                    throw new appError_1.default('Comment must be at least 3 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
                updateData.content = data.content;
            }
            // Chỉ admin mới được cập nhật trạng thái
            if ('status' in data && isAdmin) {
                const validStatuses = ['pending', 'approved', 'rejected', 'deleted'];
                const status = data.status;
                if (!validStatuses.includes(status)) {
                    throw new appError_1.default('Trạng thái không hợp lệ', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
                updateData.status = status;
            }
            // Nếu không có trường nào để cập nhật
            if (Object.keys(updateData).length === 0) {
                return comment; // Trả về thông tin cũ nếu không có gì thay đổi
            }
            return await comment_model_1.default.update(id, updateData);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Kiểm tra xem user có phải là chủ sở hữu comment không
     * @param commentId - ID của comment
     * @param userId - ID của user
     * @returns Promise<boolean> - Trả về true nếu user là chủ sở hữu
     */
    async isOwner(commentId, userId) {
        try {
            if (!commentId || !userId) {
                return false;
            }
            const comment = await this.getById(commentId);
            return comment.user_id === userId;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Xóa comment (soft delete)
     * @param id - ID của comment cần xóa
     * @param userId - ID của người dùng thực hiện thao tác
     * @param isAdmin - Có phải là admin không
     * @returns Kết quả thực hiện
     */
    async delete(id, userId, isAdmin = false) {
        try {
            if (!id || !userId) {
                throw new appError_1.default('Comment ID and user ID are required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Lấy thông tin comment hiện tại
            const comment = await this.getById(id);
            // Kiểm tra quyền sở hữu
            if (!isAdmin && comment.user_id !== userId) {
                throw new appError_1.default('You are not authorized to delete this comment', http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            // Thực hiện xóa mềm
            return await comment_model_1.default.delete(id);
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * Đếm số lượng comments của một bài viết
     * @param postId ID của bài viết
     * @returns Số lượng comments
     */
    async countByPostId(postId) {
        try {
            if (!postId) {
                throw new appError_1.default('Post ID is required', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            const result = await comment_model_1.default.count({ post_id: postId });
            return result?.count || 0;
        }
        catch (error) {
            throw error;
        }
    }
}
exports.default = new CommentService();
