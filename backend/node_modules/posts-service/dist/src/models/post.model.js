"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
class Post {
    /**
     * Lấy tất cả bài viết có phân trang
     * @param options - Các tùy chọn phân trang
     * @returns Promise chứa mảng các bài viết
     */
    static async findAll({ limit = 10, offset = 0 } = {}) {
        try {
            const query = `
        SELECT id, title, content, created_at, updated_at, slug, excerpt, 
               featured_image, status, view_count, is_featured, is_hot,
               featured_order, hot_order, featured_expires_at, hot_expires_at
        FROM posts 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`;
            const result = await database_1.default.query(query, [limit, offset]);
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('Error in Post.findAll:', error);
            throw error;
        }
    }
    /**
     * Tìm bài viết theo ID
     * @param id - ID của bài viết
     * @returns Promise chứa thông tin bài viết hoặc null nếu không tìm thấy
     */
    static async findById(id) {
        try {
            const query = 'SELECT * FROM posts WHERE id = $1';
            const result = await database_1.default.query(query, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error('Error in Post.findById:', error);
            throw error;
        }
    }
    /**
     * Tạo bài viết mới
     * @param data - Dữ liệu bài viết mới
     * @returns Promise chứa thông tin bài viết đã tạo
     */
    static async create(data) {
        const { title, slug, content, status, image_url, tags } = data;
        const query = `
      INSERT INTO posts(title, slug, content, status, image_url, tags, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
        const result = await database_1.default.query(query, [
            title,
            slug,
            content,
            status || 'draft',
            image_url,
            tags ? `{${tags.join(',')}}` : null
        ]);
        return result.rows[0];
    }
    /**
     * Cập nhật bài viết
     * @param id - ID của bài viết cần cập nhật
     * @param data - Đối tượng chứa các trường cần cập nhật
     * @returns Promise chứa thông tin bài viết đã cập nhật hoặc null nếu không tìm thấy
     */
    static async update(id, data) {
        try {
            const { title, slug, content, status, image_url, tags } = data;
            const updates = [];
            const values = [];
            let paramIndex = 1;
            if (title !== undefined) {
                updates.push(`title = $${paramIndex++}`);
                values.push(title);
            }
            if (slug !== undefined) {
                updates.push(`slug = $${paramIndex++}`);
                values.push(slug);
            }
            if (content !== undefined) {
                updates.push(`content = $${paramIndex++}`);
                values.push(content);
            }
            if (status !== undefined) {
                updates.push(`status = $${paramIndex++}`);
                values.push(status);
            }
            if (image_url !== undefined) {
                updates.push(`image_url = $${paramIndex++}`);
                values.push(image_url);
            }
            if (tags !== undefined) {
                updates.push(`tags = $${paramIndex++}`);
                values.push(`{${tags.join(',')}}`);
            }
            if (updates.length === 0) {
                throw new Error('No fields to update');
            }
            // Thêm updated_at
            updates.push(`updated_at = NOW()`);
            // Thêm id vào cuối mảng values
            values.push(id);
            const whereClause = `WHERE id = $${paramIndex}`;
            const query = `
        UPDATE posts 
        SET ${updates.join(', ')}
        ${whereClause}
        RETURNING *
      `;
            const result = await database_1.default.query(query, values);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error('Error in Post.update:', error);
            throw error;
        }
    }
    /**
     * Xóa bài viết
     * @param id - ID của bài viết cần xóa
     * @returns Promise chứa kết quả xóa
     */
    static async delete(id) {
        try {
            const query = 'DELETE FROM posts WHERE id = $1';
            const result = await database_1.default.query(query, [id]);
            return (result.rowCount ?? 0) > 0;
        }
        catch (error) {
            logger_1.default.error('Error in Post.delete:', error);
            throw error;
        }
    }
}
exports.default = Post;
//# sourceMappingURL=post.model.js.map