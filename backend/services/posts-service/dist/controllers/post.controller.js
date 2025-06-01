"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const post_service_1 = __importDefault(require("../services/post.service"));
const base_controller_1 = __importDefault(require("./base.controller"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = __importDefault(require("../config/database"));
const apiClient_1 = require("../utils/apiClient");
class PostController extends base_controller_1.default {
    constructor() {
        super(...arguments);
        /**
         * Thêm các thẻ (tags) vào bài viết
         * @param postId - ID của bài viết
         * @param tagIds - Mảng các ID của thẻ cần thêm
         */
        this.addTagsToPost = async (postId, tagIds) => {
            if (!tagIds.length)
                return;
            const values = tagIds.map((tagId, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(',');
            const query = `
      INSERT INTO post_tags (post_id, tag_id)
      VALUES ${values}
      ON CONFLICT (post_id, tag_id) DO NOTHING`;
            const flatValues = tagIds.flatMap(tagId => [postId, tagId]);
            await database_1.default.query(query, flatValues);
        };
        /**
         * Lấy thông tin chi tiết của một bài viết
         * Bao gồm thông tin tác giả, danh mục và các thẻ
         * @param postId - ID của bài viết cần lấy thông tin
         * @returns Thông tin chi tiết bài viết hoặc null nếu không tìm thấy
         */
        this.getPostWithDetails = async (postId) => {
            // Lấy thông tin bài viết
            const postQuery = `
      SELECT 
        p.*,
        u.username as "author_username",
        u.avatar as "author_avatar",
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
      WHERE p.id = $1`;
            const result = await database_1.default.query(postQuery, [postId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            // Lấy thông tin danh mục từ Categories Service
            const category = row.category_id
                ? await (0, apiClient_1.getCategoryById)(Number(row.category_id))
                : null;
            return {
                ...post_service_1.default.mapPostRowToPost(row),
                author_username: row.author_username,
                author_avatar: row.author_avatar,
                category_name: category?.name || 'Không có danh mục',
                category_slug: category?.slug || '',
                tags: row.tags || []
            };
        };
        /**
         * Lấy danh sách bài viết nổi bật
         */
        this.getFeaturedPosts = (0, catchAsync_1.default)(async (req, res) => {
            const { limit = '5' } = req.query;
            const posts = await post_service_1.default.getFeaturedPosts(parseInt(limit, 10));
            this.sendSuccess(res, posts, 'Lấy danh sách bài viết nổi bật thành công');
        });
        /**
         * Lấy danh sách bài viết mới nhất
         */
        this.getLatestPosts = (0, catchAsync_1.default)(async (req, res) => {
            const { limit = '10' } = req.query;
            const posts = await post_service_1.default.getLatestPosts(parseInt(limit, 10));
            this.sendSuccess(res, posts, 'Lấy danh sách bài viết mới nhất thành công');
        });
        /**
         * Lấy danh sách bài viết theo danh mục
         */
        this.getPostsByCategory = (0, catchAsync_1.default)(async (req, res) => {
            const { categoryId } = req.params;
            const { limit = '10', page = '1' } = req.query;
            // Chuyển đổi categoryId sang number
            const categoryIdNum = parseInt(categoryId, 10);
            if (isNaN(categoryIdNum)) {
                return this.sendError(res, 'ID danh mục không hợp lệ', 400);
            }
            try {
                const result = await post_service_1.default.getPostsByCategory({
                    categoryId: categoryIdNum.toString(), // Chuyển về string để phù hợp với interface
                    limit: parseInt(limit, 10),
                    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
                });
                this.sendSuccess(res, {
                    posts: result.posts,
                    pagination: {
                        total: result.total,
                        page: parseInt(page, 10),
                        limit: parseInt(limit, 10),
                        totalPages: Math.ceil(result.total / parseInt(limit, 10))
                    }
                }, 'Lấy danh sách bài viết theo danh mục thành công');
            }
            catch (error) {
                logger_1.default.error('Lỗi khi lấy bài viết theo danh mục:', error);
                this.sendError(res, 'Không thể lấy danh sách bài viết', 500);
            }
        });
        /**
         * Lấy danh sách bài viết theo thẻ
         */
        this.getPostsByTag = (0, catchAsync_1.default)(async (req, res) => {
            const { tagId } = req.params;
            const { limit = '10', offset = '0' } = req.query;
            const { posts, total } = await post_service_1.default.getPostsByTag({
                tagId,
                limit: parseInt(limit, 10),
                offset: parseInt(offset, 10)
            });
            this.sendPaginated(res, posts, total, Math.floor(parseInt(offset, 10) / parseInt(limit, 10)) + 1, parseInt(limit, 10), 'Lấy danh sách bài viết theo thẻ thành công');
        });
        /**
         * Lấy danh sách tất cả bài viết với phân trang và bộ lọc
         */
        this.getAllPosts = (0, catchAsync_1.default)(async (req, res) => {
            const { limit = '10', offset = '0', category, status, search } = req.query;
            const limitNum = parseInt(limit, 10);
            const offsetNum = parseInt(offset, 10);
            // Xử lý tìm kiếm nếu có từ khóa
            if (search) {
                const { posts, total } = await post_service_1.default.searchPosts(search, limitNum, offsetNum);
                return this.sendPaginated(res, posts, total, Math.floor(offsetNum / limitNum) + 1, limitNum, 'Tìm kiếm bài viết thành công');
            }
            // Xử lý lọc theo danh mục nếu có
            if (category) {
                const { posts, total } = await post_service_1.default.getPostsByCategory({
                    categoryId: category,
                    limit: limitNum,
                    offset: offsetNum
                });
                return this.sendPaginated(res, posts, total, Math.floor(offsetNum / limitNum) + 1, limitNum, 'Lấy danh sách bài viết theo danh mục thành công');
            }
            // Mặc định: Lấy danh sách bài viết mới nhất nếu không có điều kiện lọc
            const posts = await post_service_1.default.getLatestPosts(limitNum);
            this.sendSuccess(res, posts, 'Lấy danh sách bài viết mới nhất thành công');
        });
        /**
         * Lấy chi tiết bài viết theo ID hoặc slug
         */
        this.getPostById = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            const post = await post_service_1.default.getPostById(id);
            if (!post) {
                return this.sendNotFound(res, 'Không tìm thấy bài viết');
            }
            this.sendSuccess(res, post, 'Lấy thông tin bài viết thành công');
        });
        /**
         * Tạo mới một bài viết
         * Yêu cầu quyền đăng nhập và có quyền tạo bài viết
         */
        this.createPost = (0, catchAsync_1.default)(async (req, res) => {
            const userId = req.user?.id; // Lấy user_id từ middleware xác thực
            if (!userId) {
                return this.sendError(res, 'Không tìm thấy thông tin người dùng', 401);
            }
            const postData = {
                ...req.body,
                author_id: userId,
                status: req.body.status || 'draft',
                created_at: new Date(),
                updated_at: new Date()
            }; // Sử dụng type assertion tạm thởi để tránh lỗi TypeScript
            // Kiểm tra các trường bắt buộc
            if (!postData.title || !postData.content || !postData.category_id) {
                return this.sendError(res, 'Vui lòng điền đầy đủ tiêu đề, nội dung và chọn danh mục', 400);
            }
            try {
                // Tạo slug tự động từ tiêu đề nếu không có sẵn
                if (!postData.slug) {
                    postData.slug = postData.title
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
                        .replace(/\s+/g, '-') // Thay dấu cách bằng dấu gạch ngang
                        .replace(/--+/g, '-') // Loại bỏ nhiều dấu gạch ngang liên tiếp
                        .trim();
                }
                // Insert post vào database
                const query = `
        INSERT INTO posts (
          title, content, category_id, status, 
          thumbnail, summary, slug, author_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`;
                const values = [
                    postData.title,
                    postData.content,
                    postData.category_id,
                    postData.status,
                    postData.thumbnail || null,
                    postData.summary || null,
                    postData.slug,
                    postData.user_id,
                    postData.created_at,
                    postData.updated_at
                ];
                const result = await database_1.default.query(query, values);
                const newPost = result.rows[0];
                // Handle tags nếu có
                if (postData.tags && postData.tags.length > 0) {
                    await this.addTagsToPost(newPost.id, postData.tags);
                }
                // Get bài viết đầy đủ với thông tin tác giả và danh mục
                const fullPost = await this.getPostWithDetails(newPost.id);
                this.sendSuccess(res, fullPost, 'Tạo bài viết thành công', 201);
            }
            catch (error) {
                if (error.code === '23505') { // Unique violation
                    return this.sendError(res, 'Slug đã tồn tại, vui lòng chọn tiêu đề khác', 400);
                }
                logger_1.default.error('Error tạo bài viết:', error);
                this.sendError(res, 'Có lỗi xảy ra khi tạo bài viết', 500);
            }
        });
        /**
         * Cập nhật thông tin bài viết
         * Chỉ chủ sở hữu bài viết hoặc admin mới có quyền cập nhật
         */
        this.updatePost = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return this.sendError(res, 'Không tìm thấy thông tin người dùng', 401);
            }
            try {
                // Kiểm tra sự tồn tại của bài viết
                const post = await this.getPostWithDetails(id);
                if (!post) {
                    return this.sendNotFound(res, 'Không tìm thấy bài viết');
                }
                // Kiểm tra quyền sở hữu (trừ khi là admin)
                if (req.user.role !== 'admin' && post.user_id !== userId) {
                    return this.sendForbidden(res, 'Bạn không có quyền chỉnh sửa bài viết này');
                }
                // Xây dựng câu lệnh UPDATE động
                const updateFields = [];
                const values = [];
                let paramIndex = 1;
                // Thêm các trường cập nhật
                if (updateData.title) {
                    updateFields.push(`title = $${paramIndex++}`);
                    values.push(updateData.title);
                    // Cập nhật slug nếu tiêu đề thay đổi
                    if (!updateData.slug) {
                        updateFields.push(`slug = $${paramIndex++}`);
                        values.push(updateData.title
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/--+/g, '-')
                            .trim());
                    }
                }
                if (updateData.content) {
                    updateFields.push(`content = $${paramIndex++}`);
                    values.push(updateData.content);
                }
                if (updateData.category_id) {
                    updateFields.push(`category_id = $${paramIndex++}`);
                    values.push(updateData.category_id);
                }
                if (updateData.status) {
                    updateFields.push(`status = $${paramIndex++}`);
                    values.push(updateData.status);
                }
                if (updateData.thumbnail !== undefined) {
                    updateFields.push(`thumbnail = $${paramIndex++}`);
                    values.push(updateData.thumbnail);
                }
                if (updateData.summary !== undefined) {
                    updateFields.push(`summary = $${paramIndex++}`);
                    values.push(updateData.summary);
                }
                if (updateData.slug) {
                    updateFields.push(`slug = $${paramIndex++}`);
                    values.push(updateData.slug);
                }
                // Thêm thời gian cập nhật
                updateFields.push(`updated_at = NOW()`);
                // Thêm ID vào cuối mảng giá trị
                values.push(id);
                // Thực hiện cập nhật
                const updateQuery = `
        UPDATE posts 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *`;
                const result = await database_1.default.query(updateQuery, values);
                if (result.rows.length === 0) {
                    return this.sendError(res, 'Cập nhật bài viết thất bại', 500);
                }
                // Cập nhật tags nếu có
                if (updateData.tags) {
                    // Xóa tất cả tags cũ
                    await database_1.default.query('DELETE FROM post_tags WHERE post_id = $1', [id]);
                    // Thêm tags mới nếu có
                    if (updateData.tags.length > 0) {
                        await this.addTagsToPost(id, updateData.tags);
                    }
                }
                // Lấy lại thông tin đầy đủ của bài viết
                const updatedPost = await this.getPostWithDetails(id);
                if (!updatedPost) {
                    return this.sendError(res, 'Không thể tải thông tin cập nhật', 500);
                }
                this.sendSuccess(res, updatedPost, 'Cập nhật bài viết thành công');
            }
            catch (error) {
                if (error.code === '23505') { // Unique violation
                    return this.sendError(res, 'Slug đã tồn tại, vui lòng chọn tiêu đề khác', 400);
                }
                logger_1.default.error('Error cập nhật bài viết:', error);
                this.sendError(res, 'Có lỗi xảy ra khi cập nhật bài viết', 500);
            }
        });
        /**
         * Xóa một bài viết
         * Chỉ chủ sở hữu bài viết hoặc admin mới có quyền xóa
         * Khi xóa bài viết sẽ xóa luôn các bình luận và thẻ liên quan
         */
        this.deletePost = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            // Kiểm tra sự tồn tại của bài viết
            const post = await post_service_1.default.getPostById(id);
            if (!post) {
                return this.sendNotFound(res, 'Không tìm thấy bài viết');
            }
            // Kiểm tra quyền sở hữu (trừ khi là admin)
            if (req.user.role !== 'admin' && post.user_id !== req.user.id) {
                return this.sendForbidden(res, 'Bạn không có quyền xóa bài viết này');
            }
            await post_service_1.default.deletePost(id);
            this.sendSuccess(res, null, 'Xóa bài viết thành công');
        });
        /**
         * Tăng số lượt xem của bài viết lên 1
         * Gọi API này mỗi khi người dùng xem chi tiết bài viết
         */
        this.incrementViewCount = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            await post_service_1.default.incrementViewCount(id);
            this.sendSuccess(res, null, 'Cập nhật số lượt xem thành công');
        });
        /**
         * Tăng số lượt thích
         */
        this.incrementLikeCount = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            await post_service_1.default.incrementViewCount(id);
            this.sendSuccess(res, null, 'Cập nhật số lượt thích thành công');
        });
        /**
         * Tìm kiếm bài viết
         * Sử dụng tham số search trong query params
         */
        this.searchPosts = this.getAllPosts;
    }
}
exports.default = PostController;
//# sourceMappingURL=post.controller.js.map