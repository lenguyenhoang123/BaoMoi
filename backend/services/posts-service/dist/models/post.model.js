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
    static async findAll({ limit = 10, offset = 0, category_id = null } = {}) {
        try {
            let whereClause = '';
            const queryParams = [];
            if (category_id) {
                whereClause = 'WHERE category_id = $1';
                queryParams.push(category_id);
            }
            // Thêm limit và offset vào params
            queryParams.push(limit, offset);
            const limitIndex = queryParams.length - 1;
            const offsetIndex = queryParams.length;
            const query = `
        SELECT id, title, content, category_id, created_at, updated_at
        FROM posts 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
            const result = await database_1.default.query(query, queryParams);
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
     * @param postData - Dữ liệu bài viết mới
     * @returns Promise chứa thông tin bài viết đã tạo
     */
    static async create(postData) {
        try {
            const { title, content, category_id, author_id, slug, excerpt, featured_image, status } = postData;
            const query = `
        INSERT INTO posts (title, content, category_id, author_id, slug, excerpt, featured_image, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`;
            const result = await database_1.default.query(query, [
                title,
                content,
                category_id,
                author_id,
                slug,
                excerpt,
                featured_image,
                status || 'draft'
            ]);
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('Error in Post.create:', error);
            throw error;
        }
    }
    /**
     * Cập nhật bài viết
     * @param id - ID của bài viết cần cập nhật
     * @param updates - Đối tượng chứa các trường cần cập nhật
     * @returns Promise chứa thông tin bài viết đã cập nhật hoặc null nếu không tìm thấy
     */
    static async update(id, updates) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;
            // Xây dựng câu truy vấn động dựa trên các trường cần cập nhật
            for (const [key, value] of Object.entries(updates)) {
                if (value !== undefined) {
                    fields.push(`${key} = $${paramIndex}`);
                    values.push(value);
                    paramIndex++;
                }
            }
            if (fields.length === 0) {
                throw new Error('No valid fields provided for update');
            }
            // Thêm ID vào cuối mảng values
            values.push(id);
            const query = `
        UPDATE posts 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *`;
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