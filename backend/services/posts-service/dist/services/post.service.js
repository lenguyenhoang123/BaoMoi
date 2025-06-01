"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../utils/logger"));
class PostService {
    /**
     * Tạo slug từ tiêu đề bài viết
     */
    static generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
            .trim();
    }
    /**
     * Ánh xạ dữ liệu từ database sang đối tượng Post
     */
    static mapPostRowToPost(row) {
        return {
            id: row.id,
            title: row.title,
            slug: row.slug || this.generateSlug(row.title),
            summary: row.summary || '',
            content: row.content,
            thumbnail: row.thumbnail || row.image_url || undefined,
            status: row.status || 'draft',
            view_count: Number(row.view_count) || 0,
            like_count: Number(row.like_count) || 0,
            comment_count: Number(row.comment_count) || 0,
            user_id: row.user_id || row.author_id,
            category_id: row.category_id,
            created_at: row.created_at ? new Date(row.created_at) : new Date(),
            updated_at: row.updated_at ? new Date(row.updated_at) : new Date(),
            published_at: row.published_at ? new Date(row.published_at) : undefined
        };
    }
    /**
     * Lấy danh sách bài viết theo tag với phân trang
     */
    static async getPostsByTag({ tagId, limit = 10, offset = 0 }) {
        if (!tagId) {
            throw new Error('Tag ID is required');
        }
        try {
            // Đếm tổng số bài viết có tag này
            const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM posts p
        INNER JOIN post_tags pt ON p.id = pt.post_id
        WHERE pt.tag_id = $1 AND p.status = 'published'`;
            // Lấy danh sách bài viết phân trang theo tag
            const dataQuery = `
        SELECT 
          p.*,
          u.username as "author_username",
          c.name as "category_name",
          c.slug as "category_slug",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'slug', t.slug
            )), '[]')
            FROM tags t
            JOIN post_tags pt2 ON t.id = pt2.tag_id
            WHERE pt2.post_id = p.id
          ) as tags
        FROM posts p
        INNER JOIN post_tags pt ON p.id = pt.post_id
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE pt.tag_id = $1 AND p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3`;
            const [countResult, dataResult] = await Promise.all([
                database_1.default.query(countQuery, [tagId]),
                database_1.default.query(dataQuery, [tagId, limit, offset])
            ]);
            return {
                posts: dataResult.rows.map(row => ({
                    ...this.mapPostRowToPost(row),
                    author_username: row.author_username,
                    category_name: row.category_name,
                    category_slug: row.category_slug,
                    tags: row.tags || []
                })),
                total: parseInt(countResult.rows[0]?.total || '0', 10)
            };
        }
        catch (error) {
            logger_1.default.error('Error in getPostsByTag service:', error);
            throw new Error('Failed to get posts by tag');
        }
    }
    /**
     * Lấy danh sách bài viết theo danh mục với phân trang
     */
    static async getPostsByCategory({ categoryId, limit = 10, offset = 0 }) {
        // Chuyển đổi categoryId sang number nếu cần
        const categoryIdNum = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
        if (!categoryId) {
            throw new Error('Category ID is required');
        }
        try {
            // Đếm tổng số bài viết trong danh mục
            const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts 
        WHERE category_id = $1 AND status = 'published'`;
            // Lấy danh sách bài viết phân trang trong danh mục
            const dataQuery = `
        SELECT 
          p.*,
          u.username as "author_username",
          c.name as "category_name",
          c.slug as "category_slug",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'slug', t.slug
            )), '[]')
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = p.id
          ) as tags
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = $1 AND p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3`;
            const [countResult, dataResult] = await Promise.all([
                database_1.default.query(countQuery, [categoryId]),
                database_1.default.query(dataQuery, [categoryId, limit, offset])
            ]);
            return {
                posts: dataResult.rows.map(row => ({
                    ...this.mapPostRowToPost(row),
                    author_username: row.author_username,
                    category_name: row.category_name,
                    category_slug: row.category_slug,
                    tags: row.tags || []
                })),
                total: parseInt(countResult.rows[0]?.total || '0', 10)
            };
        }
        catch (error) {
            logger_1.default.error('Error in getPostsByCategory service:', error);
            throw new Error('Failed to get posts by category');
        }
    }
    /**
     * Lấy bài viết nổi bật
     */
    static async getFeaturedPosts(limit = 5) {
        try {
            const query = `
        SELECT 
          p.*, 
          u.username as "author_username",
          c.name as "category_name",
          c.slug as "category_slug",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'slug', t.slug
            )), '[]')
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = p.id
          ) as tags
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published' AND p.is_featured = true
        ORDER BY p.published_at DESC
        LIMIT $1`;
            const result = await database_1.default.query(query, [limit]);
            return result.rows.map(row => ({
                ...this.mapPostRowToPost(row),
                author_username: row.author_username,
                category_name: row.category_name,
                category_slug: row.category_slug,
                tags: row.tags || []
            }));
        }
        catch (error) {
            logger_1.default.error('Lỗi khi lấy bài viết nổi bật:', error);
            throw new Error('Không thể lấy danh sách bài viết nổi bật');
        }
    }
    /**
     * Lấy thông tin chi tiết bài viết theo ID
     */
    static async getPostById(id) {
        try {
            const query = `
        SELECT 
          p.*, 
          u.username as "author_username",
          c.name as "category_name",
          c.slug as "category_slug",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'slug', t.slug
            )), '[]')
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = p.id
          ) as tags
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1`;
            const result = await database_1.default.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                ...this.mapPostRowToPost(row),
                author_username: row.author_username,
                category_name: row.category_name,
                category_slug: row.category_slug,
                tags: row.tags || []
            };
        }
        catch (error) {
            logger_1.default.error('Lỗi khi lấy thông tin bài viết:', error);
            throw new Error('Không thể lấy thông tin bài viết');
        }
    }
    /**
     * Xóa bài viết
     */
    static async deletePost(id) {
        const client = await database_1.default.getClient();
        try {
            await client.query('BEGIN');
            // Xóa các bản ghi liên quan trong bảng post_tags
            await client.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
            // Xóa bài viết
            const result = await client.query('DELETE FROM posts WHERE id = $1 RETURNING id', [id]);
            await client.query('COMMIT');
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.default.error('Lỗi khi xóa bài viết:', error);
            throw new Error('Không thể xóa bài viết');
        }
        finally {
            client.release();
        }
    }
    /**
     * Tăng số lượt xem của bài viết
     */
    static async incrementViewCount(id) {
        try {
            const result = await database_1.default.query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1 RETURNING id', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            logger_1.default.error('Lỗi khi tăng số lượt xem:', error);
            throw new Error('Không thể cập nhật số lượt xem');
        }
    }
    /**
     * Tăng số lượt thích của bài viết
     */
    static async incrementLikeCount(id) {
        try {
            const result = await database_1.default.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1 RETURNING id', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            logger_1.default.error('Lỗi khi tăng số lượt thích:', error);
            throw new Error('Không thể cập nhật số lượt thích');
        }
    }
    /**
     * Lấy danh sách bài viết mới nhất
     */
    static async getLatestPosts(limit = 5) {
        try {
            const query = `
        SELECT 
          p.*, 
          u.username as "author_username",
          c.name as "category_name",
          c.slug as "category_slug",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'slug', t.slug
            )), '[]')
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = p.id
          ) as tags
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT $1`;
            const result = await database_1.default.query(query, [limit]);
            return result.rows.map(row => ({
                ...this.mapPostRowToPost(row),
                author_username: row.author_username,
                category_name: row.category_name,
                category_slug: row.category_slug,
                tags: row.tags || []
            }));
        }
        catch (error) {
            logger_1.default.error('Error in getLatestPosts service:', error);
            throw new Error('Failed to get latest posts');
        }
    }
    /**
     * Tìm kiếm bài viết theo từ khóa
     */
    static async searchPosts(query, limit = 10, offset = 0) {
        try {
            const searchQuery = `%${query}%`;
            // Đếm tổng số bài viết phù hợp
            const countQuery = `
        SELECT COUNT(*) as total
        FROM posts p
        WHERE (p.title ILIKE $1 OR p.content ILIKE $1) 
        AND p.status = 'published'`;
            // Lấy danh sách bài viết phân trang
            const dataQuery = `
        SELECT 
          p.*, 
          u.username as "author_username",
          c.name as "category_name",
          c.slug as "category_slug",
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'slug', t.slug
            )), '[]')
            FROM tags t
            JOIN post_tags pt ON t.id = pt.tag_id
            WHERE pt.post_id = p.id
          ) as tags
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE (p.title ILIKE $1 OR p.content ILIKE $1) 
        AND p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3`;
            const [countResult, dataResult] = await Promise.all([
                database_1.default.query(countQuery, [searchQuery]),
                database_1.default.query(dataQuery, [searchQuery, limit, offset])
            ]);
            return {
                posts: dataResult.rows.map(row => ({
                    ...this.mapPostRowToPost(row),
                    author_username: row.author_username,
                    category_name: row.category_name,
                    category_slug: row.category_slug,
                    tags: row.tags || []
                })),
                total: parseInt(countResult.rows[0]?.total || '0', 10)
            };
        }
        catch (error) {
            logger_1.default.error('Lỗi khi tìm kiếm bài viết:', error);
            throw new Error('Không thể tìm kiếm bài viết');
        }
    }
}
exports.default = PostService;
//# sourceMappingURL=post.service.js.map