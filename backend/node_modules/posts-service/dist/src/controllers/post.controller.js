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
            try {
                // Lấy các tham số từ query
                const { page = '1', limit = '10', page_size = limit, status, search, category, is_published } = req.query;
                // Chuyển đổi page và limit sang number
                const pageNum = parseInt(page, 10) || 1;
                const pageSize = parseInt(page_size, 10) || 10;
                const offset = (pageNum - 1) * pageSize;
                // Xây dựng câu truy vấn SQL
                let query = `
      SELECT p.*, COUNT(*) OVER() as total_count
      FROM posts p
      WHERE 1=1
    `;
                const values = [];
                let paramIndex = 1;
                // Xử lý is_published - kiểm tra cả kiểu string và boolean
                const isPublished = is_published !== undefined
                    ? (typeof is_published === 'string'
                        ? is_published.toLowerCase() === 'true'
                        : Boolean(is_published))
                    : false;
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
                query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
                values.push(pageSize, offset);
                // Thực hiện query để lấy dữ liệu
                const result = await database_1.default.query(query, values);
                // Lấy danh sách category_id duy nhất từ các bài viết
                const categoryIds = [...new Set(result.rows
                        .filter(post => post.category_id)
                        .map(post => post.category_id))];
                logger_1.logger.info(`Tìm thấy ${categoryIds.length} category_id duy nhất`);
                // Tạo map để lưu thông tin category
                const categoriesMap = new Map();
                // Lấy thông tin chi tiết các category từ categories service
                if (categoryIds.length > 0) {
                    try {
                        logger_1.logger.info('Đang lấy thông tin chi tiết các danh mục...');
                        // Đầu tiên, lấy tất cả danh mục
                        const allCategories = await category_service_1.CategoryService.getCategories();
                        logger_1.logger.info(`Tổng số danh mục có sẵn: ${allCategories.length}`);
                        // Tạo map từ ID sang category
                        allCategories.forEach(category => {
                            categoriesMap.set(category.id, category);
                        });
                        // Kiểm tra xem có category_id nào không tìm thấy không
                        const missingCategories = categoryIds.filter(id => !categoriesMap.has(id));
                        if (missingCategories.length > 0) {
                            logger_1.logger.warn(`Không tìm thấy thông tin cho ${missingCategories.length} danh mục:`, missingCategories);
                        }
                        logger_1.logger.info(`Đã tải thông tin cho ${categoriesMap.size} danh mục`);
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
                const hasMore = (pageNum * pageSize) < totalCount;
                // Log thông tin categoriesMap để debug
                logger_1.logger.info('Categories in map:', Array.from(categoriesMap.entries()));
                // Gắn thông tin category vào từng bài viết
                const postsWithCategories = result.rows.map((post) => {
                    const postData = { ...post };
                    // Xóa các trường không cần thiết
                    delete postData.category_id;
                    // Nếu bài viết có category_id
                    if (post.category_id) {
                        const category = categoriesMap.get(post.category_id);
                        if (category) {
                            // Đảm bảo có slug trước khi gán
                            if (!category.slug) {
                                logger_1.logger.warn(`Danh mục ${category.id} không có slug:`, category);
                            }
                            // Tạo đối tượng category với các trường cần thiết
                            postData.category = {
                                id: category.id,
                                name: category.name || 'Không có tên',
                                slug: category.slug || `category-${category.id}`,
                                description: category.description || '',
                                icon: category.icon || '',
                                is_active: category.is_active !== undefined ? category.is_active : true
                            };
                            logger_1.logger.debug(`Đã gắn danh mục cho bài viết ${post.id}:`, postData.category);
                        }
                        else {
                            logger_1.logger.warn(`Không tìm thấy thông tin cho danh mục ${post.category_id} của bài viết ${post.id}`);
                            postData.category = null;
                        }
                    }
                    return postData;
                });
                // Tạo dữ liệu phân trang
                const pagination = {
                    total: totalCount,
                    totalPages: totalPages,
                    currentPage: pageNum,
                    limit: pageSize,
                    hasMore: hasMore,
                };
                // Tạo dữ liệu phản hồi
                const responseData = {
                    items: postsWithCategories,
                    pagination: pagination,
                };
                // Tạo đối tượng phản hồi
                const response = {
                    success: true,
                    data: responseData,
                    message: 'Lấy danh sách bài viết thành công',
                };
                // Log thông tin phản hồi (chỉ trong môi trường phát triển)
                if (process.env.NODE_ENV === 'development') {
                    logger_1.logger.debug('Dữ liệu phản hồi:', {
                        totalPosts: postsWithCategories.length,
                        hasPosts: postsWithCategories.length > 0,
                        firstPostCategory: postsWithCategories[0]?.category ? {
                            id: postsWithCategories[0].category?.id,
                            name: postsWithCategories[0].category?.name,
                            slug: postsWithCategories[0].category?.slug
                        } : 'Không có danh mục',
                        pagination: {
                            total: totalCount,
                            totalPages: totalPages,
                            currentPage: pageNum,
                            limit: pageSize,
                            hasMore: hasMore
                        }
                    });
                }
                res.status(200).json(response);
            }
            catch (error) {
                // Ghi log lỗi chi tiết
                const errorDetails = {
                    message: error.message,
                    stack: error.stack
                };
                if (error.response) {
                    errorDetails.response = {
                        status: error.response.status,
                        data: error.response.data
                    };
                }
                logger_1.logger.error('Lỗi khi lấy danh sách bài viết:', errorDetails);
                // Trả về thông báo lỗi phù hợp
                const isDev = process.env.NODE_ENV === 'development';
                const errorResponse = {
                    success: false,
                    message: isDev
                        ? `Lỗi khi lấy danh sách bài viết: ${error.message}`
                        : 'Đã xảy ra lỗi khi lấy danh sách bài viết',
                    ...(isDev && {
                        error: error.message,
                        stack: error.stack
                    })
                };
                if (!res.headersSent) {
                    res.status(500).json(errorResponse);
                }
                else {
                    logger_1.logger.error('Response headers already sent');
                }
            }
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