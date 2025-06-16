"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const database_1 = __importDefault(require("./config/database"));
const posts_1 = __importDefault(require("./routes/posts"));
// Tải biến môi trường
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
if (!process.env.POSTGRES_DB) {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
}
// Kiểm tra kết nối cơ sở dữ liệu
const testDbConnection = async () => {
    try {
        await database_1.default.init();
        await database_1.default.query('SELECT NOW() as current_time');
    }
    catch (error) {
        console.log('Đang thử kết nối lại cơ sở dữ liệu sau 5 giây...');
        setTimeout(testDbConnection, 5000);
    }
};
// Khởi tạo ứng dụng Express
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Khởi động máy chủ
const startServer = async () => {
    // Kiểm tra nếu server đã được khởi tạo
    if (httpServer.listening) {
        console.log('🔄 Server đã được khởi động trước đó');
        return;
    }
    try {
        await testDbConnection();
        const PORT = Number(process.env.PORT) || 3002;
        const HOST = '0.0.0.0';
        // Đảm bảo không lắng nghe nhiều lần
        if (!httpServer.listening) {
            httpServer.listen(PORT, HOST, () => {
                console.log(`🟢 Máy chủ đang chạy trên cổng ${PORT}`);
                console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
                console.log(`🔗 API: http://${HOST}:${PORT}/api`);
            });
        }
    }
    catch (error) {
        console.error('❌ Không thể khởi động máy chủ:', error);
        process.exit(1);
    }
};
// Kiểm tra xem có đang chạy trong môi trường test không
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
// Middleware để log tất cả các request
app.use((req, res, next) => {
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
    next();
});
// Áp dụng các middleware cần thiết
app.use((0, helmet_1.default)()); // Bảo mật HTTP headers
app.use(express_1.default.json()); // Phân tích JSON request
app.use(express_1.default.urlencoded({ extended: true })); // Phân tích URL-encoded data
// Cấu hình CORS (Cross-Origin Resource Sharing)
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3004'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Cho phép gửi cookie qua CORS
};
// Áp dụng CORS
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // Xử lý preflight requests
// Log CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    // Log response headers
    console.log('Response Headers:', {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers'),
        'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
    });
    next();
});
// Giới hạn tỷ lệ request
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100 // Giới hạn mỗi IP 100 request mỗi cửa sổ thời gian
});
app.use(limiter);
// Endpoint kiểm tra trạng thái
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
// Đăng ký routes
app.use('/api', posts_1.default); // Tiền tố /api cho tất cả các routes
app.use('/posts', posts_1.default); // Tương thích ngược
app.use('/', posts_1.default); // Route gốc
// Route kiểm thử
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Kết nối API thành công!',
        timestamp: new Date().toISOString()
    });
});
// Xử lý lỗi 404 - Không tìm thấy
app.use((req, res, next) => {
    console.error(`❌ 404 - Không tìm thấy: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài nguyên',
        error: {
            code: 404,
            description: `Không tìm thấy ${req.originalUrl} trên máy chủ này`,
            method: req.method,
            path: req.path,
            query: req.query
        },
        timestamp: new Date().toISOString()
    });
});
// Xử lý lỗi tổng thể
app.use((err, req, res, next) => {
    console.error('❌ Lỗi:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Lỗi máy chủ nội bộ',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Start server
startServer();
// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map