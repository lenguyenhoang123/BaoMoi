"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const http_status_codes_1 = require("http-status-codes");
const appError_1 = __importDefault(require("../utils/appError"));
/**
 * Lớp mô hình cho Comment
 */
class Comment {
    /**
     * Tạo mới một bình luận
     * @param data - Dữ liệu bình luận
     * @returns Promise chứa bình luận đã tạo
     */
    static async create(data) {
        const text = `
      INSERT INTO comments (content, user_id, post_id, parent_id, is_approved)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const values = [data.content, data.user_id, data.post_id, data.parent_id || null, data.is_approved || false];
        try {
            const result = await (0, database_1.query)(text, values);
            return result.rows[0];
        }
        catch (error) {
            // Xử lý lỗi khóa ngoại
            if (error.code === '23503') {
                if (error.constraint?.includes('user_id')) {
                    throw new appError_1.default('Không tìm thấy người dùng', http_status_codes_1.StatusCodes.NOT_FOUND);
                }
                else if (error.constraint?.includes('parent_id')) {
                    throw new appError_1.default('Không tìm thấy bình luận cha', http_status_codes_1.StatusCodes.NOT_FOUND);
                }
            }
            throw error;
        }
    }
    /**
     * Lấy tất cả bình luận (phân trang)
     */
    static async findAll(page = 1, limit = 10, filters = {}) {
        const offset = (page - 1) * limit;
        let whereClause = '';
        const queryParams = [];
        // Xây dựng điều kiện WHERE dựa trên filters
        const conditions = [];
        if (filters.post_id) {
            conditions.push(`post_id = $${queryParams.length + 1}`);
            queryParams.push(filters.post_id);
        }
        if (filters.user_id) {
            conditions.push(`user_id = $${queryParams.length + 1}`);
            queryParams.push(filters.user_id);
        }
        if (filters.parent_id !== undefined) {
            if (filters.parent_id === null || filters.parent_id === 'null') {
                conditions.push('parent_id IS NULL');
            }
            else {
                conditions.push(`parent_id = $${queryParams.length + 1}`);
                queryParams.push(filters.parent_id);
            }
        }
        if (filters.is_approved !== undefined) {
            conditions.push(`is_approved = $${queryParams.length + 1}`);
            queryParams.push(filters.is_approved);
        }
        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        // Thêm limit và offset vào query params
        queryParams.push(limit, offset);
        const text = `
      SELECT * FROM comments
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;
        try {
            const result = await (0, database_1.query)(text, queryParams);
            // Lấy tổng số bản ghi
            const countText = `
        SELECT COUNT(*) as total FROM comments
        ${whereClause}
      `;
            const countResult = await (0, database_1.query)(countText, queryParams.slice(0, -2) // Bỏ limit và offset
            );
            const total = parseInt(countResult.rows[0]?.total || '0', 10);
            const totalPages = Math.ceil(total / limit);
            return {
                data: result.rows,
                total,
                page,
                limit,
                totalPages,
            };
        }
        catch (error) {
            console.error('Error in Comment.findAll:', error);
            throw error;
        }
    }
    /**
     * Tìm bình luận theo ID
     */
    static async findById(id) {
        const text = 'SELECT * FROM comments WHERE id = $1';
        const values = [id];
        try {
            const result = await (0, database_1.query)(text, values);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error finding comment with id ${id}:`, error);
            throw error;
        }
    }
    /**
     * Cập nhật bình luận
     */
    static async update(id, data) {
        const updates = [];
        const values = [];
        Object.entries(data).forEach(([key, value], index) => {
            if (value !== undefined) {
                updates.push(`${key} = $${index + 1}`);
                values.push(value);
            }
        });
        if (updates.length === 0) {
            throw new appError_1.default('Không có trường nào để cập nhật', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // Thêm id vào cuối mảng values
        values.push(id);
        const text = `
      UPDATE comments
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;
        try {
            const result = await (0, database_1.query)(text, values);
            if (result.rows.length === 0) {
                throw new appError_1.default('Không tìm thấy bình luận để cập nhật', http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            return result.rows[0];
        }
        catch (error) {
            console.error(`Error updating comment with id ${id}:`, error);
            throw error;
        }
    }
    /**
     * Xóa mềm bình luận
     */
    static async delete(id) {
        const text = `
      UPDATE comments 
      SET deleted_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
        const values = [id];
        try {
            const result = await (0, database_1.query)(text, values);
            return result?.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            console.error(`Error deleting comment with id ${id}:`, error);
            throw error;
        }
    }
    /**
     * Kiểm tra người dùng có phải chủ sở hữu bình luận không
     */
    static async isOwner(commentId, userId) {
        const text = 'SELECT 1 FROM comments WHERE id = $1 AND user_id = $2';
        const values = [commentId, userId];
        try {
            const result = await (0, database_1.query)(text, values);
            return result?.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            console.error(`Error checking comment ownership:`, error);
            throw error;
        }
    }
    /**
     * Lấy tất cả bình luận con của một bình luận
     */
    static async findReplies(parentId) {
        const text = `
      WITH RECURSIVE comment_tree AS (
        -- Bình luận gốc
        SELECT * FROM comments WHERE id = $1
        
        UNION ALL
        
        -- Tất cả các bình luận con
        SELECT c.* 
        FROM comments c
        JOIN comment_tree ct ON c.parent_id = ct.id
        WHERE c.deleted_at IS NULL
      )
      SELECT * FROM comment_tree WHERE id != $1
      ORDER BY created_at ASC
    `;
        try {
            const result = await (0, database_1.query)(text, [parentId]);
            return result.rows;
        }
        catch (error) {
            console.error(`Error finding replies for comment ${parentId}:`, error);
            throw error;
        }
    }
}
exports.default = Comment;
