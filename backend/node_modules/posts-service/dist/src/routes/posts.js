"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const body_parser_1 = __importDefault(require("body-parser"));
const post_model_1 = __importDefault(require("../models/post.model"));
const database_1 = __importDefault(require("../config/database"));
// Middleware xử lý lỗi kết nối cơ sở dữ liệu
const handleDatabaseError = (error, res) => {
    console.error('❌ Lỗi cơ sở dữ liệu:', error);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
        return res.status(503).json({
            success: false,
            message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.',
            error: 'Service Unavailable'
        });
    }
    return res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ nội bộ',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
};
const router = (0, express_1.Router)();
// Cấu hình body parser để xử lý dữ liệu gửi lên
const jsonParser = body_parser_1.default.json({ limit: '10mb' });
const urlencodedParser = body_parser_1.default.urlencoded({ extended: true, limit: '10mb' });
// Middleware xử lý dữ liệu JSON
router.use(jsonParser);
router.use(urlencodedParser);
// Middleware bắt lỗi khi parse body
router.use((err, req, res, next) => {
    if (err) {
        console.error('❌ Body parser error:', err);
        return res.status(400).json({
            success: false,
            message: 'Lỗi khi phân tích dữ liệu gửi lên',
            error: 'INVALID_REQUEST_BODY'
        });
    }
    next();
});
// Middleware ghi log tất cả các request
router.use((req, res, next) => {
    console.log(`\n=== ${new Date().toISOString()} ===`);
    console.log(`[${req.method}] ${req.originalUrl}`);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('Query:', req.query);
    console.log('Headers:', {
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? '***' : undefined,
        'user-agent': req.get('user-agent')
    });
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    next();
});
// Hàm tạo slug từ tiêu đề
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay dấu cách bằng dấu gạch ngang
        .replace(/--+/g, '-') // Thay nhiều dấu gạch ngang liên tiếp bằng một dấu
        .trim();
}
// Lấy danh sách bài viết
router.get(['/', '/posts', '/api', '/api/posts'], async (req, res) => {
    try {
        console.log('GET /api/posts - Request received');
        console.log('Query params:', req.query);
        // Lấy các tham số phân trang và sắp xếp
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        const searchTerm = req.query.search || '';
        // Tạo câu truy vấn SQL
        let query = 'SELECT * FROM posts';
        let countQuery = 'SELECT COUNT(*) FROM posts';
        const queryParams = [];
        const whereClauses = [];
        // Thêm điều kiện tìm kiếm nếu người dùng nhập từ khóa
        if (searchTerm) {
            whereClauses.push(`(title ILIKE $${queryParams.length + 1} OR content ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${searchTerm}%`);
        }
        // Thêm mệnh đề WHERE nếu có điều kiện tìm kiếm
        if (whereClauses.length > 0) {
            const whereClause = ' WHERE ' + whereClauses.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }
        // Thêm điều kiện sắp xếp và phân trang vào câu truy vấn
        query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);
        console.log('Executing query:', query, 'with params:', queryParams);
        // Thực thi đồng thời cả 2 truy vấn: lấy dữ liệu và đếm tổng số bản ghi
        const [postsResult, countResult] = await Promise.all([
            database_1.default.query(query, queryParams),
            database_1.default.query(countQuery, queryParams.slice(0, -2)) // Bỏ limit và offset cho count
        ]);
        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            data: {
                items: postsResult.rows,
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                    hasMore: page < totalPages
                }
            },
            message: 'Lấy danh sách bài viết thành công'
        });
    }
    catch (error) {
        console.error('❌ Error getting posts:', error);
        handleDatabaseError(error, res);
    }
});
// Cập nhật bài viết
router.put(['/api/posts/:id', '/posts/:id', '/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log('\n=== UPDATE POST REQUEST ===');
        console.log(`Path: ${req.path}`);
        console.log(`Method: ${req.method}`);
        console.log(`Post ID: ${id}`);
        console.log('Update data:', updateData);
        // Xác thực dữ liệu đầu vào
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID bài viết',
                error: 'MISSING_POST_ID'
            });
        }
        // Kiểm tra sự tồn tại của bài viết
        const checkResult = await database_1.default.query('SELECT * FROM posts WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết',
                error: 'POST_NOT_FOUND'
            });
        }
        // Tạo câu truy vấn cập nhật
        const updatedAt = new Date().toISOString();
        const query = `
      UPDATE posts 
      SET 
        title = $1,
        slug = $2,
        content = $3,
        status = $4,
        image_url = $5,
        tags = $6,
        updated_at = $7
      WHERE id = $8
      RETURNING *
    `;
        const values = [
            updateData.title,
            updateData.slug,
            updateData.content,
            updateData.status || 'draft',
            updateData.image_url || null,
            updateData.tags || [],
            updatedAt,
            id
        ];
        console.log('Executing update query:', query);
        console.log('With values:', values);
        // Thực thi câu truy vấn cập nhật
        const result = await database_1.default.query(query, values);
        const updatedPost = result.rows[0];
        res.status(200).json({
            success: true,
            data: updatedPost,
            message: 'Cập nhật bài viết thành công'
        });
    }
    catch (error) {
        console.error('❌ Error updating post:', error);
        handleDatabaseError(error, res);
    }
});
// Lấy thông tin chi tiết bài viết theo ID
router.get(['/api/posts/:id', '/posts/:id', '/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        console.log('\n=== GET POST BY ID REQUEST ===');
        console.log(`Path: ${req.path}`);
        console.log(`Method: ${req.method}`);
        console.log(`Params:`, req.params);
        console.log(`Query:`, req.query);
        console.log(`Headers:`, {
            'content-type': req.get('content-type'),
            'authorization': req.get('authorization') ? '***' : undefined,
            'accept': req.get('accept')
        });
        // Xác thực ID bài viết
        if (!id) {
            console.log('❌ Missing post ID');
            return res.status(400).json({
                success: false,
                message: 'Thiếu ID bài viết',
                error: 'MISSING_POST_ID'
            });
        }
        // Thực hiện truy vấn cơ sở dữ liệu
        console.log(`\n🔍 Truy vấn bài viết với ID: ${id}`);
        const query = 'SELECT * FROM posts WHERE id = $1';
        console.log('Query:', query);
        console.log('Params:', [id]);
        const result = await database_1.default.query(query, [id]);
        console.log(`Kết quả truy vấn: ${result.rows.length} bài viết tìm thấy`);
        // Kiểm tra sự tồn tại của bài viết
        if (result.rows.length === 0) {
            console.log(`❌ Post not found with ID: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết',
                error: 'POST_NOT_FOUND'
            });
        }
        const post = result.rows[0];
        // Lấy thông tin các thẻ (tags) nếu có
        if (post.tags && post.tags.length > 0) {
            try {
                const tagsResult = await database_1.default.query('SELECT name FROM tags WHERE id = ANY($1::uuid[])', [post.tags]);
                post.tags = tagsResult.rows.map(tag => tag.name);
            }
            catch (error) {
                console.error('Error fetching tags:', error);
                post.tags = [];
            }
        }
        else {
            post.tags = [];
        }
        console.log(`✅ Found post with ID: ${id}`);
        res.status(200).json({
            success: true,
            data: post,
            message: 'Lấy thông tin bài viết thành công'
        });
    }
    catch (error) {
        console.error('❌ Error getting post by ID:', error);
        handleDatabaseError(error, res);
    }
});
// Create a new post
router.post(['/', '/posts', '/api', '/api/posts'], async (req, res) => {
    console.log('\n=== POST REQUEST RECEIVED ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Path:', req.path);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', req.query);
    console.log('Params:', req.params);
    console.log('Raw body:', req.rawBody || 'No raw body');
    console.log('Parsed body:', req.body || 'No parsed body');
    console.log('Content-Type:', req.get('content-type'));
    console.log('Content-Length:', req.get('content-length'));
    // Kiểm tra middleware body-parser
    console.log('Body parser working:', !!req.body);
    console.log('Raw body exists:', !!req.rawBody);
    // Nếu không có body hoặc body không hợp lệ
    if (!req.body || Object.keys(req.body).length === 0) {
        console.error('❌ Lỗi: Request body không hợp lệ hoặc trống');
        return res.status(400).json({
            success: false,
            message: 'Yêu cầu không hợp lệ: Thiếu dữ liệu',
            error: 'INVALID_REQUEST_BODY'
        });
    }
    try {
        const { title, content, tags, status, image_url } = req.body;
        // Basic validation
        if (!title || !content) {
            console.log('❌ Validation failed - Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề và nội dung là bắt buộc',
                error: 'MISSING_REQUIRED_FIELDS'
            });
        }
        // Check if a post with the same title already exists
        console.log('🔍 Checking for duplicate post with title:', title);
        const existingPost = await database_1.default.query('SELECT id FROM posts WHERE title = $1', [title]);
        if (existingPost.rows.length > 0) {
            console.log('❌ Post with this title already exists');
            return res.status(409).json({
                success: false,
                message: 'Bài viết với tiêu đề này đã tồn tại',
                error: 'DUPLICATE_TITLE'
            });
        }
        // Generate slug from title
        const slug = generateSlug(title);
        console.log('✨ Generated slug:', slug);
        // Create new post
        console.log('💾 Creating new post...');
        const newPost = await post_model_1.default.create({
            title,
            slug,
            content,
            status: status || 'draft',
            image_url: image_url || null,
            tags: Array.isArray(tags) ? tags : []
        });
        console.log('✅ Post created successfully:', newPost.id);
        return res.status(201).json({
            success: true,
            message: 'Tạo bài viết thành công',
            data: newPost
        });
    }
    catch (error) {
        console.error('❌ Error creating post:', error);
        // Xử lý lỗi kết nối cơ sở dữ liệu
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
            return res.status(503).json({
                success: false,
                message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.',
                error: 'SERVICE_UNAVAILABLE'
            });
        }
        // Xử lý lỗi validation
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                error: 'VALIDATION_ERROR',
                details: error.errors?.map((e) => ({
                    field: e.path,
                    message: e.message
                })) || []
            });
        }
        // Lỗi khác
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_SERVER_ERROR'
        });
    }
});
// Health check endpoint
router.get(['/health', '/test', '/posts/test', '/api/posts/test'], async (req, res) => {
    try {
        // Kiểm tra kết nối cơ sở dữ liệu
        await database_1.default.query('SELECT NOW()');
        res.status(200).json({
            success: true,
            status: 'healthy',
            service: 'posts-service',
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            service: 'posts-service',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});
// GET /posts hoặc /api/posts - Lấy danh sách bài viết
router.get(['/', '/posts', '/api', '/api/posts'], async (req, res) => {
    try {
        console.log('GET /api/posts - Request received');
        console.log('Query params:', req.query);
        // Xử lý tham số truy vấn
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = parseInt(req.query.page_size) || parseInt(req.query.limit) || 10;
        const limit = Math.min(100, Math.max(1, pageSize)); // Giới hạn tối đa 100 bản ghi/trang
        const offset = (page - 1) * limit;
        // Kiểm tra nếu có yêu cầu lọc theo trạng thái
        const status = req.query.is_published === 'true' ? 'published' : undefined;
        // Lấy danh sách bài viết từ database với thông tin phân trang
        const { posts, total, page: currentPage, totalPages } = await post_model_1.default.findAll({
            limit,
            offset,
            status
        });
        // Trả về kết quả với cấu trúc phù hợp cho frontend
        res.status(200).json({
            success: true,
            data: posts,
            pagination: {
                total,
                page: currentPage,
                pageSize: limit,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách bài viết',
            error: error instanceof Error ? error.message : 'Lỗi không xác định'
        });
    }
});
// PATCH /posts/:id hoặc /api/posts/:id - Cập nhật bài viết
router.patch(['/:id', '/posts/:id', '/api/posts/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        console.log(`PATCH /api/posts/${id} - Request received`);
        console.log('Update data:', updateData);
        // Kiểm tra xem bài viết có tồn tại không
        const existingPost = await post_model_1.default.findById(id);
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }
        // Cập nhật bài viết
        const updatedPost = await post_model_1.default.update(id, updateData);
        if (!updatedPost) {
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi cập nhật bài viết'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Cập nhật bài viết thành công',
            data: updatedPost
        });
    }
    catch (error) {
        console.error('Error updating post:', error);
        // Xử lý lỗi kết nối cơ sở dữ liệu
        if (error instanceof Error &&
            (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET'))) {
            return res.status(503).json({
                success: false,
                message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.'
            });
        }
        // Xử lý lỗi validation
        if (error instanceof Error &&
            (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError')) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: error.errors?.map((e) => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật bài viết',
            error: error instanceof Error ? error.message : 'Lỗi không xác định'
        });
    }
});
// DELETE /posts/:id hoặc /api/posts/:id - Xóa bài viết
router.delete(['/:id', '/posts/:id', '/api/posts/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`DELETE /api/posts/${id} - Request received`);
        // Kiểm tra xem bài viết có tồn tại không
        const existingPost = await post_model_1.default.findById(id);
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }
        // Xóa bài viết
        const isDeleted = await post_model_1.default.delete(id);
        if (!isDeleted) {
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi xóa bài viết'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Xóa bài viết thành công'
        });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        // Xử lý lỗi kết nối cơ sở dữ liệu
        if (error instanceof Error &&
            (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET'))) {
            return res.status(503).json({
                success: false,
                message: 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại sau.'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa bài viết',
            error: error instanceof Error ? error.message : 'Lỗi không xác định'
        });
    }
});
exports.default = router;
//# sourceMappingURL=posts.js.map