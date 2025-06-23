"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const post_service_1 = __importDefault(require("../services/post.service"));
const category_service_1 = require("../services/category.service");
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
        COUNT(*) OVER() as total_count
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
            // Lấy danh sách category_id duy nhất từ các bài viết
            const categoryIds = [...new Set(result.rows
                    .filter(post => post.category_id)
                    .map(post => post.category_id))];
            logger_1.logger.info(`Found ${categoryIds.length} unique category IDs:`, categoryIds);
            // Tạo map để lưu thông tin category
            const categoriesMap = new Map();
            // Lấy thông tin chi tiết các category từ categories service
            if (categoryIds.length > 0) {
                try {
                    logger_1.logger.info('Fetching category details...');
                    // Sử dụng Promise.all để lấy song song các category
                    const categories = await Promise.all(categoryIds.map(async (id) => {
                        logger_1.logger.info(`Fetching category with ID: ${id}`);
                        const category = await category_service_1.CategoryService.getCategoryById(id);
                        logger_1.logger.info(`Fetched category ${id}:`, category ? 'Found' : 'Not found');
                        return category;
                    }));
                    // Thêm vào map để dễ dàng truy xuất
                    categories.forEach(category => {
                        if (category) {
                            categoriesMap.set(category.id, category);
                        }
                    });
                    logger_1.logger.info(`Successfully fetched ${categoriesMap.size} categories`);
                }
                catch (error) {
                    logger_1.logger.error('Lỗi khi lấy thông tin danh mục:', error);
                    // Tiếp tục xử lý ngay cả khi không lấy được thông tin category
                }
            }
            else {
                logger_1.logger.info('No category IDs found in posts');
            }
            // Lấy tổng số bản ghi
            const totalCount = result.rows[0]?.total_count || 0;
            const totalPages = Math.ceil(totalCount / pageSize);
            // Gắn thông tin category vào từng bài viết
            const postsWithCategories = result.rows.map((post) => {
                // Tạo bản sao của post để không ảnh hưởng đến dữ liệu gốc
                const postData = { ...post };
                // Xóa các trường không cần thiết
                delete postData.total_count;
                // Thêm thông tin category nếu có
                if (post.category_id && categoriesMap.has(post.category_id)) {
                    postData.category = categoriesMap.get(post.category_id);
                }
                else if (post.category_id) {
                    // Nếu có category_id nhưng không tìm thấy trong categoriesMap
                    logger_1.logger.warn(`Category not found for post ${post.id} with category_id ${post.category_id}`);
                }
                return postData;
            });
            // Trả về kết quả
            res.status(200).json({
                success: true,
                data: {
                    items: postsWithCategories,
                    pagination: {
                        total: totalCount,
                        page: pageNum,
                        limit: pageSize,
                        totalPages: totalPages,
                        hasMore: pageNum < totalPages
                    }
                },
                message: 'Lấy danh sách bài viết thành công'
            });
        });
        // Các phương thức khác...
        this.getPostById = (0, catchAsync_1.default)(async (req, res) => {
            const { id } = req.params;
            try {
                // Lấy thông tin bài viết
                const post = await this.postService.getPostById(id);
                if (!post) {
                    res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
                    return;
                }
                // Lấy thông tin category nếu có
                let category = null;
                if (post.category_id) {
                    try {
                        category = await category_service_1.CategoryService.getCategoryById(post.category_id);
                    }
                    catch (error) {
                        logger_1.logger.error('Lỗi khi lấy thông tin danh mục:', error);
                    }
                }
                // Trả về kết quả
                res.status(200).json({
                    success: true,
                    data: {
                        ...post,
                        category
                    }
                });
            }
            catch (error) {
                logger_1.logger.error('Lỗi khi lấy thông tin bài viết:', error);
                res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
            }
        });
        // Các phương thức khác (create, update, delete, ...) cần được triển khai tương tự
        // với việc xử lý category thông qua CategoryService
    }
}
exports.default = PostController;
//# sourceMappingURL=post.controller.js.map