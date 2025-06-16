"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const post_service_1 = __importDefault(require("../services/post.service"));
const logger_1 = require("../utils/logger");
const base_controller_1 = __importDefault(require("./base.controller"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
class PostController extends base_controller_1.default {
    constructor() {
        super(...arguments);
        this.postService = post_service_1.default;
        /**
         * Lấy tất cả bài viết
         */
        this.getAllPosts = (0, catchAsync_1.default)(async (req, res) => {
            // Lấy các tham số từ query
            const { page = '1', limit = '10', page_size, is_published, status, category, search } = req.query;
            // Sử dụng page_size nếu có, không thì dùng limit
            const pageSize = page_size ? Number(page_size) : Number(limit);
            const pageNum = Number(page);
            const offset = (pageNum - 1) * pageSize;
            // Build câu query
            let query = `
      SELECT 
        p.*,
        'system' as author_id,
        'Hệ thống' as author_name,
        '/default-avatar.png' as author_avatar,
        'default-category' as category_id,
        'Chưa phân loại' as category_name
      FROM posts p
      WHERE 1=1
    `;
            const values = [];
            let paramIndex = 1;
            // Xử lý is_published - kiểm tra cả kiểu string và boolean
            const isPublished = typeof is_published === 'string'
                ? is_published.toLowerCase() === 'true'
                : Boolean(is_published);
            if (isPublished) {
                query += ` AND status = $${paramIndex++}`;
                values.push('published');
            }
            else if (status) {
                query += ` AND status = $${paramIndex++}`;
                values.push(status);
            }
            // Xử lý tìm kiếm
            if (search) {
                query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
                values.push(`%${search}%`);
                paramIndex++;
            }
            // Xử lý category nếu có
            if (category) {
                query += ` AND category_id = $${paramIndex++}`;
                values.push(category);
            }
            // Thêm sắp xếp và phân trang
            query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
            values.push(pageSize, offset);
            // Thực hiện query để lấy dữ liệu
            const result = await database_1.default.query(query, values);
            // Format lại dữ liệu theo đúng định dạng frontend mong đợi
            const formattedPosts = result.rows.map(post => ({
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt || '',
                content: post.content,
                featuredImage: post.image_url,
                author: {
                    id: 'system',
                    name: 'Hệ thống',
                    avatar: '/default-avatar.png'
                },
                category: {
                    id: 'default',
                    name: 'Chưa phân loại'
                },
                tags: this.processTags(post.tags),
                status: post.status,
                viewCount: post.view_count || 0,
                likeCount: 0,
                commentCount: 0,
                isBreakingNews: post.is_breaking_news || false,
                isTrending: post.is_trending || false,
                priority: 'normal',
                createdAt: post.created_at,
                updatedAt: post.updated_at || post.created_at
            }));
            // Query để đếm tổng số bản ghi (không phân trang)
            let countQuery = `
      SELECT COUNT(*) 
      FROM posts
      WHERE 1=1
    `;
            // Thêm điều kiện lọc tương tự như query chính
            if (is_published === 'true') {
                countQuery += ` AND status = $1`;
            }
            else if (status) {
                countQuery += ` AND status = $1`;
            }
            if (search) {
                const searchParamIndex = values.length > 0 ? 2 : 1;
                countQuery += ` AND (title ILIKE $${searchParamIndex} OR content ILIKE $${searchParamIndex})`;
            }
            if (category) {
                const categoryParamIndex = values.length > 0 ? (search ? 3 : 2) : 1;
                countQuery += ` AND category_id = $${categoryParamIndex}`;
            }
            const countResult = await database_1.default.query(countQuery, values.slice(0, -2)); // Bỏ limit và offset
            const total = parseInt(countResult.rows[0].count, 10);
            const totalPages = Math.ceil(total / pageSize);
            // Trả về dữ liệu theo đúng định dạng frontend mong đợi
            res.status(200).json({
                success: true,
                data: {
                    items: formattedPosts,
                    pagination: {
                        total,
                        page: pageNum,
                        limit: pageSize,
                        totalPages,
                        hasNextPage: pageNum < totalPages,
                        hasPreviousPage: pageNum > 1
                    }
                }
            });
        });
        // ... (giữ nguyên các phương thức khác)
        this.getFeaturedPosts = (0, catchAsync_1.default)(async (req, res) => {
            const limit = parseInt(req.query.limit) || 5;
            const currentDate = new Date().toISOString();
            const query = `
      SELECT 
        id,
        title,
        slug,
        summary,
        image_url,
        created_at
      FROM posts 
      WHERE status = 'published' 
        AND is_featured = true
        AND (publish_at IS NULL OR publish_at <= $1)
      ORDER BY publish_at DESC, created_at DESC
      LIMIT $2`;
            const result = await database_1.default.query(query, [currentDate, limit]);
            this.sendSuccess(res, result.rows);
        });
        this.getHotPosts = (0, catchAsync_1.default)(async (req, res) => {
            const limit = parseInt(req.query.limit) || 5;
            const currentDate = new Date().toISOString();
            const query = `
      SELECT 
        id,
        title,
        slug,
        summary,
        image_url,
        created_at,
        view_count
      FROM posts 
      WHERE status = 'published' 
        AND is_hot = true
        AND (publish_at IS NULL OR publish_at <= $1)
      ORDER BY view_count DESC, created_at DESC
      LIMIT $2`;
            const result = await database_1.default.query(query, [currentDate, limit]);
            this.sendSuccess(res, result.rows);
        });
        this.getPost = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            const post = await this.getPostWithDetails(id);
            if (!post) {
                return this.sendNotFound(res, 'Không tìm thấy bài viết');
            }
            this.sendSuccess(res, post);
        });
        /**
         * Tạo mới bài viết
         */
        this.createPost = (0, catchAsync_1.default)(async (req, res) => {
            const { title, content, status = 'draft', image_url, tags } = req.body;
            const userId = req.user?.id || 'system';
            // Kiểm tra các trường bắt buộc
            if (!title || !content) {
                return this.sendError(res, 'Vui lòng điền đầy đủ tiêu đề và nội dung', 400);
            }
            try {
                // Tạo slug tự động từ tiêu đề
                const slug = title
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/--+/g, '-')
                    .trim();
                // Xử lý tags
                let processedTags = [];
                if (tags) {
                    if (Array.isArray(tags)) {
                        processedTags = tags.filter(t => t !== null && t !== '');
                    }
                    else if (typeof tags === 'string') {
                        try {
                            const parsed = JSON.parse(tags);
                            processedTags = Array.isArray(parsed) ? parsed : [];
                        }
                        catch (e) {
                            processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                        }
                    }
                }
                // Thêm bài viết vào database
                const query = `
        INSERT INTO posts (
          title, content, status, slug, image_url, tags, user_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
                const values = [
                    title,
                    content,
                    status,
                    slug,
                    image_url || null,
                    processedTags.length > 0 ? processedTags : null,
                    userId
                ];
                const result = await database_1.default.query(query, values);
                const newPost = result.rows[0];
                // Lấy thông tin đầy đủ của bài viết
                const fullPost = await this.getPostWithDetails(newPost.id);
                this.sendSuccess(res, fullPost, 'Tạo bài viết thành công', 201);
            }
            catch (error) {
                if (error.code === '23505') { // Unique violation
                    return this.sendError(res, 'Tiêu đề đã tồn tại, vui lòng chọn tiêu đề khác', 400);
                }
                logger_1.logger.error('Lỗi khi tạo bài viết:', error);
                this.sendError(res, 'Có lỗi xảy ra khi tạo bài viết', 500);
            }
        });
        /**
         * Cập nhật bài viết
         */
        this.updatePost = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            const { title, content, status, image_url, tags } = req.body;
            try {
                // Kiểm tra sự tồn tại của bài viết
                const post = await this.getPostWithDetails(id);
                if (!post) {
                    return this.sendNotFound(res, 'Không tìm thấy bài viết');
                }
                // Xây dựng câu lệnh UPDATE động
                const updateFields = [];
                const values = [];
                let paramIndex = 1;
                // Thêm các trường cập nhật
                if (title !== undefined) {
                    updateFields.push(`title = $${paramIndex++}`);
                    values.push(title);
                }
                if (content !== undefined) {
                    updateFields.push(`content = $${paramIndex++}`);
                    values.push(content);
                }
                if (status !== undefined) {
                    updateFields.push(`status = $${paramIndex++}`);
                    values.push(status);
                }
                if (image_url !== undefined) {
                    updateFields.push(`image_url = $${paramIndex++}`);
                    values.push(image_url || null);
                }
                // Xử lý tags nếu có
                if (tags !== undefined) {
                    let processedTags = [];
                    if (Array.isArray(tags)) {
                        processedTags = tags.filter(t => t !== null && t !== '');
                    }
                    else if (typeof tags === 'string') {
                        try {
                            const parsed = JSON.parse(tags);
                            processedTags = Array.isArray(parsed) ? parsed : [];
                        }
                        catch (e) {
                            processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                        }
                    }
                    updateFields.push(`tags = $${paramIndex++}`);
                    values.push(processedTags.length > 0 ? processedTags : null);
                }
                // Thêm thời gian cập nhật
                updateFields.push(`updated_at = NOW()`);
                // Thêm điều kiện WHERE
                values.push(id);
                const whereClause = `WHERE id = $${paramIndex}`;
                // Tạo câu lệnh SQL hoàn chỉnh
                const query = `
        UPDATE posts 
        SET ${updateFields.join(', ')}
        ${whereClause}
        RETURNING *
      `;
                const result = await database_1.default.query(query, values);
                const updatedPost = result.rows[0];
                if (!updatedPost) {
                    return this.sendError(res, 'Không thể cập nhật bài viết', 500);
                }
                // Lấy thông tin đầy đủ của bài viết đã cập nhật
                const fullPost = await this.getPostWithDetails(updatedPost.id);
                this.sendSuccess(res, fullPost, 'Cập nhật bài viết thành công');
            }
            catch (error) {
                if (error.code === '23505') { // Unique violation
                    return this.sendError(res, 'Tiêu đề đã tồn tại, vui lòng chọn tiêu đề khác', 400);
                }
                logger_1.logger.error('Lỗi khi cập nhật bài viết:', error);
                this.sendError(res, 'Có lỗi xảy ra khi cập nhật bài viết', 500);
            }
        });
        /**
         * Xóa bài viết
         */
        this.deletePost = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            try {
                // Kiểm tra sự tồn tại của bài viết
                const post = await this.getPostWithDetails(id);
                if (!post) {
                    return this.sendNotFound(res, 'Không tìm thấy bài viết');
                }
                // Xóa bài viết
                const query = 'DELETE FROM posts WHERE id = $1 RETURNING *';
                const result = await database_1.default.query(query, [id]);
                if (result.rowCount === 0) {
                    return this.sendError(res, 'Không thể xóa bài viết', 500);
                }
                this.sendSuccess(res, null, 'Xóa bài viết thành công');
            }
            catch (error) {
                logger_1.logger.error('Lỗi khi xóa bài viết:', error);
                this.sendError(res, 'Có lỗi xảy ra khi xóa bài viết', 500);
            }
        });
        /**
         * Cập nhật trạng thái nổi bật
         */
        this.updateFeaturedStatus = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            const { is_featured } = req.body;
            if (typeof is_featured !== 'boolean') {
                return this.sendError(res, 'Trạng thái không hợp lệ', 400);
            }
            try {
                const query = 'UPDATE posts SET is_featured = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
                const result = await database_1.default.query(query, [is_featured, id]);
                if (result.rowCount === 0) {
                    return this.sendNotFound(res, 'Không tìm thấy bài viết');
                }
                this.sendSuccess(res, result.rows[0], 'Cập nhật trạng thái nổi bật thành công');
            }
            catch (error) {
                logger_1.logger.error('Lỗi khi cập nhật trạng thái nổi bật:', error);
                this.sendError(res, 'Có lỗi xảy ra khi cập nhật trạng thái nổi bật', 500);
            }
        });
        /**
         * Cập nhật trạng thái hot
         */
        this.updateHotStatus = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            const { is_hot } = req.body;
            if (typeof is_hot !== 'boolean') {
                return this.sendError(res, 'Trạng thái không hợp lệ', 400);
            }
            try {
                const query = 'UPDATE posts SET is_hot = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
                const result = await database_1.default.query(query, [is_hot, id]);
                if (result.rowCount === 0) {
                    return this.sendNotFound(res, 'Không tìm thấy bài viết');
                }
                this.sendSuccess(res, result.rows[0], 'Cập nhật trạng thái hot thành công');
            }
            catch (error) {
                logger_1.logger.error('Lỗi khi cập nhật trạng thái hot:', error);
                this.sendError(res, 'Có lỗi xảy ra khi cập nhật trạng thái hot', 500);
            }
        });
    }
    /**
     * Xử lý tags
     */
    processTags(tags) {
        if (!tags)
            return [];
        if (Array.isArray(tags)) {
            return tags.filter(tag => tag && typeof tag === 'string');
        }
        if (typeof tags === 'string') {
            try {
                const parsed = JSON.parse(tags);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch (e) {
                return tags.split(',').map((t) => t.trim()).filter(Boolean);
            }
        }
        return [];
    }
    /**
     * Lấy thông tin chi tiết bài viết
     */
    async getPostWithDetails(id) {
        // Kiểm tra nếu id là 'posts' (trường hợp gọi sai route)
        if (id === 'posts') {
            throw new Error('Invalid post ID');
        }
        try {
            const query = `
          SELECT *
          FROM posts
          WHERE id = $1`;
            const result = await database_1.default.query(query, [id]);
            const post = result.rows[0];
            if (!post)
                return null;
            // Xử lý tags
            if (post.tags && typeof post.tags === 'string') {
                try {
                    post.tags = JSON.parse(post.tags);
                }
                catch (e) {
                    post.tags = [];
                }
            }
            else if (!post.tags) {
                post.tags = [];
            }
            return post;
        }
        catch (error) {
            console.error('Error in getPostWithDetails:', error);
            throw error;
        }
    }
}
exports.default = PostController;
//# sourceMappingURL=post.controller.js.map