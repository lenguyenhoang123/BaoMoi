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
// Middleware cơ bản nên được đặt đầu tiên
app.use((0, helmet_1.default)()); // Bảo mật HTTP headers
// Sử dụng body-parser với cấu hình đơn giản
const body_parser_1 = __importDefault(require("body-parser"));
// Middleware xử lý JSON body
app.use(body_parser_1.default.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            // Lưu raw body để debug
            req.rawBody = buf.toString('utf8');
        }
        catch (e) {
            console.error('Lỗi khi đọc raw body:', e);
        }
    }
}));
// Xử lý URL-encoded data
app.use(body_parser_1.default.urlencoded({
    extended: true,
    limit: '10mb'
}));
// Middleware để log request body
app.use((req, res, next) => {
    console.log('\n=== REQUEST BODY MIDDLEWARE ===');
    console.log('Method:', req.method);
    console.log('Content-Type:', req.get('content-type'));
    console.log('Body:', req.body);
    console.log('Raw body:', req.rawBody);
    next();
});
// Middleware xử lý URL-encoded body
app.use(body_parser_1.default.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 10000
}));
// Middleware log request để debug
app.use((req, res, next) => {
    console.log(`\n=== NHẬN REQUEST TỪ API GATEWAY ===`);
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Raw Body:', req.rawBody);
    next();
});
// Middleware để ghi log tất cả các request
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Ghi log request
    console.log(`\n=== ${new Date().toISOString()} ===`);
    console.log(`[${req.method}] ${req.originalUrl}`);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('Query:', req.query);
    console.log('Headers:', {
        'content-type': req.get('content-type'),
        'content-length': req.get('content-length'),
        'authorization': req.get('authorization') ? '***' : undefined,
        'user-agent': req.get('user-agent'),
        'x-forwarded-for': req.get('x-forwarded-for')
    });
    // Log raw body nếu có
    if (req.rawBody) {
        console.log('Raw Body:', req.rawBody);
    }
    // Log parsed body nếu có
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Parsed Body:', req.body);
    }
    // Ghi log response
    const originalSend = res.send;
    res.send = function (body) {
        console.log(`\n[Response] Status: ${res.statusCode} - ${res.statusMessage}`);
        console.log(`Response Time: ${Date.now() - start}ms`);
        if (body && typeof body === 'string') {
            try {
                const jsonBody = JSON.parse(body);
                console.log('Response Body:', jsonBody);
            }
            catch (e) {
                console.log('Response Body:', body);
            }
        }
        return originalSend.call(this, body);
    };
    next();
};
// Middleware đảm bảo UTF-8 encoding và các headers cần thiết
app.use((req, res, next) => {
    // Set default content type to JSON with UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Ensure proper content encoding
    res.setHeader('Content-Encoding', 'identity');
    // Set character encoding for text responses
    res.charset = 'utf-8';
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Log incoming request details
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    next();
});
// Middleware log request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body)
        console.log('Body:', req.body);
    next();
});
// Cấu hình CORS (Cross-Origin Resource Sharing)
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3004',
    'http://127.0.0.1:3004',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Access-Token',
        'X-Refresh-Token'
    ],
    exposedHeaders: ['X-Access-Token', 'X-Refresh-Token']
};
// Áp dụng CORS trước tất cả các route khác
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions)); // Xử lý preflight requests
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
        const HOST = process.env.HOST || 'localhost';
        // Đảm bảo không lắng nghe nhiều lần
        if (!httpServer.listening) {
            httpServer.listen(PORT, HOST, () => {
                console.log(`🟢 Máy chủ đang chạy tại http://${HOST}:${PORT}`);
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
// Khởi tạo kết nối cơ sở dữ liệu và khởi động server
const init = async () => {
    try {
        await database_1.default.init();
        console.log('✅ Đã kết nối cơ sở dữ liệu');
        if (process.env.NODE_ENV !== 'test') {
            await startServer();
        }
    }
    catch (error) {
        console.error('❌ Không thể khởi tạo ứng dụng:', error);
        process.exit(1);
    }
};
// Middleware CORS headers
const corsHeaders = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
};
// Middleware xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
    console.error('❌ Lỗi server:', err);
    res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi máy chủ nội bộ',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
};
// Middleware xử lý 404
const notFoundHandler = (req, res) => {
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
};
// Áp dụng các middleware chung
app.use(corsHeaders);
app.use(requestLogger);
// Giới hạn tỷ lệ request
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
});
app.use(limiter);
// Đăng ký routes chính với base path /api
app.use('/api', posts_1.default);
// Đăng ký routes không có tiền tố (cho tương thích ngược)
app.use((req, res, next) => {
    // Nếu request đến /api/*, chuyển hướng đến /api handler
    if (req.path.startsWith('/api/')) {
        return next('router');
    }
    next();
}, posts_1.default);
// Endpoint kiểm tra trạng thái
app.get(['/api/health', '/health'], (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'posts-service',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Route kiểm thử
app.get(['/api/test', '/test'], (req, res) => {
    res.json({
        success: true,
        message: 'Kết nối API thành công!',
        timestamp: new Date().toISOString(),
        service: 'posts-service'
    });
});
// Xử lý 404 - Phải đặt sau tất cả các route khác
app.use((req, res, next) => {
    console.log(`❌ 404 - Không tìm thấy: ${req.method} ${req.originalUrl}`);
    console.log('Path:', req.path);
    console.log('Base URL:', req.baseUrl);
    console.log('Original URL:', req.originalUrl);
    next();
}, notFoundHandler);
// Xử lý lỗi toàn cục - Phải có đủ 4 tham số (err, req, res, next)
app.use(errorHandler);
// Khởi động ứng dụng
init();
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