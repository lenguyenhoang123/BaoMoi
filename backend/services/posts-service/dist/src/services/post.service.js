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
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }
    async createPost(data) {
        const client = await database_1.default.getClient();
        try {
            await client.query('BEGIN', []);
            // Tạo slug từ tiêu đề
            const slug = this.generateSlug(data.title);
            // Thêm bài viết mới
            const result = await client.query(`INSERT INTO posts (title, slug, content, status, image_url, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`, [
                data.title,
                slug,
                data.content,
                data.status || 'draft',
                data.image_url || null,
                data.tags ? JSON.stringify(data.tags) : null
            ]);
            const newPost = result.rows[0];
            await client.query('COMMIT', []);
            return newPost;
        }
        catch (error) {
            await client.query('ROLLBACK', []);
            console.error('Error creating post:', error);
            throw new Error('Failed to create post');
        }
        finally {
            client.release();
        }
    }
    /**
     * Cập nhật bài viết đã tồn tại
     */
    async updatePost(id, data) {
        const client = await database_1.default.getClient();
        try {
            await client.query('BEGIN', []);
            // Xây dựng câu query động
            const updates = [];
            const values = [];
            let paramIndex = 1;
            if (data.title) {
                updates.push(`title = $${paramIndex++}`);
                values.push(data.title);
                updates.push(`slug = $${paramIndex++}`);
                values.push(this.generateSlug(data.title));
            }
            if (data.content !== undefined) {
                updates.push(`content = $${paramIndex++}`);
                values.push(data.content);
            }
            if (data.status) {
                updates.push(`status = $${paramIndex++}`);
                values.push(data.status);
            }
            if (data.image_url !== undefined) {
                updates.push(`image_url = $${paramIndex++}`);
                values.push(data.image_url);
            }
            if (data.tags !== undefined) {
                updates.push(`tags = $${paramIndex++}`);
                values.push(Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags);
            }
            // If nothing to update
            if (updates.length === 0) {
                throw new Error('No fields to update');
            }
            // Add updated_at field
            updates.push(`updated_at = $${paramIndex++}`);
            values.push(new Date());
            // Add id to the end of values array
            values.push(id);
            const query = `
        UPDATE posts 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
            const result = await client.query(query, values);
            const updatedPost = result.rows[0];
            if (!result.rows[0]) {
                await client.query('ROLLBACK', []);
                return null;
            }
            await client.query('COMMIT', []);
            // Lấy lại thông tin đầy đủ của bài viết
            const fullPost = await this.getPostById(id);
            return fullPost;
        }
        catch (error) {
            await client.query('ROLLBACK', []);
            console.error('Error updating post:', error);
            throw new Error('Failed to update post');
        }
        finally {
            client.release();
        }
    }
    /**
     * Xóa bài viết
     */
    async deletePost(id) {
        const client = await database_1.default.getClient();
        try {
            await client.query('BEGIN', []);
            // Xóa các bản ghi liên quan trong bảng post_categories
            await client.query('DELETE FROM post_categories WHERE post_id = $1', [id]);
            // Xóa bài viết
            const result = await client.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
            if (result.rowCount === 0) {
                await client.query('ROLLBACK', []);
                return false;
            }
            await client.query('COMMIT', []);
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK', []);
            console.error('Error deleting post:', error);
            throw new Error('Failed to delete post');
        }
        finally {
            client.release();
        }
    }
    /**
     * Lấy bài viết theo ID
     */
    async getPostById(id) {
        try {
            // Chỉ lấy các trường cần thiết từ bảng posts
            const query = `
        SELECT 
          id,
          title,
          slug,
          content,
          status,
          created_at,
          updated_at,
          image_url,
          tags
        FROM posts 
        WHERE id = $1`;
            const result = await database_1.default.query(query, [id]);
            const post = result.rows[0];
            if (!post)
                return null;
            // Xử lý tags
            let tags = [];
            if (post.tags) {
                if (Array.isArray(post.tags)) {
                    // Nếu tags đã là mảng, lọc các giá trị hợp lệ
                    tags = post.tags.filter((t) => t !== null && t !== '');
                }
                else if (typeof post.tags === 'string') {
                    try {
                        // Thử parse nếu là JSON string
                        const parsed = JSON.parse(post.tags);
                        tags = Array.isArray(parsed) ? parsed : [];
                    }
                    catch (e) {
                        // Nếu không phải JSON, xử lý như chuỗi phân cách bằng dấu phẩy
                        const tagsStr = post.tags;
                        tags = tagsStr
                            .split(',')
                            .map((t) => t.trim())
                            .filter((t) => t !== '');
                    }
                }
            }
            // Tạo đối tượng bài viết với các trường cần thiết
            return {
                ...post,
                tags,
                image_url: post.image_url || '',
                created_at: post.created_at || new Date(),
                updated_at: post.updated_at || new Date(),
                status: (post.status || 'draft')
            };
        }
        catch (error) {
            logger_1.default.error('Error getting post by id:', error);
            throw new Error('Failed to get post');
        }
    }
    /**
     * Lấy bài viết theo đường dẫn tĩnh (slug)
     */
    async getPostBySlug(slug) {
        try {
            const result = await database_1.default.query('SELECT * FROM posts WHERE slug = $1', [slug]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error('Error getting post by slug:', error);
            throw new Error('Failed to get post');
        }
    }
    /**
     * Lấy danh sách bài viết có phân trang và lọc
     */
    async getPostsByCategory(categoryId, options = {}) {
        try {
            const { limit = 10, offset = 0, status, sort = 'created_at', order = 'desc', } = options;
            // Build WHERE conditions
            const whereConditions = [];
            const params = [];
            let paramIndex = 1;
            if (status) {
                whereConditions.push(`status = $${paramIndex++}`);
                params.push(status);
            }
            whereConditions.push(`category_id = $${paramIndex++}`);
            params.push(categoryId);
            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';
            // Get total count
            const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts 
        ${whereClause}
      `;
            const countResult = await database_1.default.query(countQuery, params);
            // Get paginated results
            const query = `
        SELECT * 
        FROM posts 
        ${whereClause}
        ORDER BY ${sort} ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
            const result = await database_1.default.query(query, [
                ...params,
                limit,
                offset
            ]);
            // Xử lý tags từ chuỗi phân cách bằng dấu phẩy sang mảng
            return result.rows.map(post => {
                if (post.tags) {
                    const tagsStr = post.tags;
                    if (typeof tagsStr === 'string') {
                        // Nếu tags là chuỗi JSON, parse nó
                        if (tagsStr.trim().startsWith('[')) {
                            try {
                                post.tags = JSON.parse(tagsStr);
                            }
                            catch (e) {
                                logger_1.default.warn(`Failed to parse tags as JSON for post ${post.id}:`, e);
                                // Nếu không parse được JSON, xử lý như chuỗi phân cách bằng dấu phẩy
                                post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
                            }
                        }
                        else {
                            // Xử lý chuỗi phân cách bằng dấu phẩy
                            post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
                        }
                    }
                }
                else {
                    post.tags = [];
                }
                return post;
            });
        }
        catch (error) {
            logger_1.default.error('Error getting posts:', error);
            throw new Error('Failed to get posts');
        }
    }
    /**
     * Tăng số lượt xem của bài viết
     */
    async incrementViewCount(id) {
        try {
            const result = await database_1.default.query('UPDATE posts SET view_count = view_count + 1 WHERE id = $1 RETURNING id', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            logger_1.default.error('Error incrementing view count:', error);
            throw new Error('Failed to increment view count');
        }
    }
    /**
     * Tăng số lượt thích của bài viết
     */
    async incrementLikeCount(id) {
        try {
            const result = await database_1.default.query('UPDATE posts SET like_count = like_count + 1 WHERE id = $1 RETURNING id', [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        catch (error) {
            logger_1.default.error('Error incrementing like count:', error);
            throw new Error('Failed to increment like count');
        }
    }
    /**
     * Lấy các bài viết mới nhất đã xuất bản
     */
    async getLatestPosts(limit = 10) {
        try {
            const result = await database_1.default.query(`SELECT * 
         FROM posts 
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT $1`, [limit]);
            return result.rows;
        }
        catch (error) {
            logger_1.default.error('Error getting latest posts:', error);
            throw new Error('Failed to get latest posts');
        }
    }
    /**
     * Tìm kiếm bài viết theo từ khóa
     */
    async searchPosts(query, limit = 10, offset = 0) {
        try {
            const searchQuery = `%${query}%`;
            // Get total count
            const countQuery = `
        SELECT COUNT(*) as total 
        FROM posts p
        WHERE p.status = 'published'
          AND (p.title ILIKE $1 OR p.content ILIKE $1 OR p.summary ILIKE $1)
      `;
            // Get paginated results
            const postsQuery = `
        SELECT p.*, 
               u.username as author_username,
               u.avatar as author_avatar,
               c.name as category_name,
               c.slug as category_slug
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
          AND (p.title ILIKE $1 OR p.content ILIKE $1 OR p.summary ILIKE $1)
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3`;
            const [countResult, postsResult] = await Promise.all([
                database_1.default.query(countQuery, [searchQuery]),
                database_1.default.query(postsQuery, [searchQuery, limit, offset])
            ]);
            const total = parseInt(countResult.rows[0].total, 10);
            // Xử lý tags từ chuỗi phân cách bằng dấu phẩy sang mảng
            const posts = postsResult.rows.map(post => {
                if (post.tags) {
                    const tagsStr = post.tags;
                    if (typeof tagsStr === 'string') {
                        // Nếu tags là chuỗi JSON, parse nó
                        if (tagsStr.trim().startsWith('[')) {
                            try {
                                post.tags = JSON.parse(tagsStr);
                            }
                            catch (e) {
                                logger_1.default.warn(`Failed to parse tags as JSON for post ${post.id}:`, e);
                                // Nếu không parse được JSON, xử lý như chuỗi phân cách bằng dấu phẩy
                                post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
                            }
                        }
                        else {
                            // Xử lý chuỗi phân cách bằng dấu phẩy
                            post.tags = tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
                        }
                    }
                }
                else {
                    post.tags = [];
                }
                return post;
            });
            return {
                posts,
                total
            };
        }
        catch (error) {
            logger_1.default.error('Error searching posts:', error);
            throw new Error('Failed to search posts');
        }
    }
}
exports.default = new PostService();
//# sourceMappingURL=post.service.js.map