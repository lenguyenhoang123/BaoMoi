"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_model_1 = __importDefault(require("../models/post.model"));
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
// Middleware để ghi log tất cả các request
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
// Route kiểm tra kết nối
router.get(['/test', '/posts/test', '/api/posts/test'], (req, res) => {
    console.log('Đã gọi route kiểm tra');
    res.json({
        success: true,
        message: 'Kết nối API Posts Service thành công!',
        timestamp: new Date().toISOString()
    });
});
// GET / or /posts - Get list of posts
router.get(['/', '/posts', '/api/posts'], async (req, res) => {
    try {
        console.log('GET /api/posts - Request received');
        console.log('Query params:', req.query);
        // Lấy tham số phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        // Lấy danh sách bài viết từ database
        const posts = await post_model_1.default.findAll({ limit, offset });
        // Lấy tổng số bài viết (để phân trang)
        const countResult = await database_1.default.query('SELECT COUNT(*) FROM posts');
        const total = parseInt(countResult.rows[0].count);
        res.status(200).json({
            status: 'success',
            results: posts.length,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
            data: {
                posts
            }
        });
    }
    catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Đã xảy ra lỗi khi lấy danh sách bài viết'
        });
    }
});
// POST /api/posts - Tạo bài viết mới
router.post('/', (req, res) => {
    console.log('POST /api/posts - Request received');
    console.log('Request body:', req.body);
    // Kiểm tra các trường bắt buộc
    const { title, content } = req.body;
    if (!title || !content) {
        console.log('Thiếu các trường bắt buộc');
        return res.status(400).json({
            status: 'error',
            message: 'Vui lòng cung cấp đầy đủ tiêu đề và nội dung'
        });
    }
    // Tạo bài viết mới
    const newPost = {
        id: Date.now(),
        title,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    console.log('Đã tạo bài viết thành công');
    res.status(201).json({
        status: 'success',
        message: 'Bài viết đã được tạo',
        data: {
            post: newPost
        }
    });
});
exports.default = router;
//# sourceMappingURL=posts.js.map