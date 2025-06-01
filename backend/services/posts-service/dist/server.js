"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Tải biến môi trường - Ưu tiên tải từ file .env trong thư mục service trước
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
// Nếu không tìm thấy biến môi trường, thử tải từ thư mục gốc của dự án
if (!process.env.POSTGRES_DB) {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
}
// Import database configuration
const database_1 = __importDefault(require("./config/database"));
// Import routes
const posts_1 = __importDefault(require("./routes/posts"));
// Hàm kiểm tra kết nối database
const testDbConnection = async () => {
    try {
        console.log('🔄 Đang kết nối đến cơ sở dữ liệu...');
        // Khởi tạo kết nối database
        await database_1.default.init();
        // Test kết nối bằng một query đơn giản
        const result = await database_1.default.query('SELECT NOW() as current_time');
        console.log('✅ Kết nối cơ sở dữ liệu thành công');
        console.log('   Thời gian hiện tại:', result.rows[0].current_time);
    }
    catch (err) {
        console.error('❌ Lỗi kết nối cơ sở dữ liệu:');
        console.error(err);
        console.error('\n🔧 Nguyên nhân có thể do:');
        console.error('1. PostgreSQL chưa được cài đặt hoặc chưa chạy');
        console.error('2. Thông tin kết nối trong file .env không chính xác');
        console.error('3. Database chưa được tạo');
        console.error('4. Tài khoản PostgreSQL không có quyền truy cập');
        console.error('\n🛠️ Hãy kiểm tra lại cấu hình và thử lại');
        process.exit(1);
    }
};
// Khởi tạo ứng dụng Express
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3004'],
        methods: ['GET', 'POST']
    }
});
// Thực hiện kiểm tra kết nối database khi khởi động
testDbConnection();
// Cấu hình giới hạn tỷ lệ truy cập
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
// Cấu hình CORS (Cross-Origin Resource Sharing)
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3004'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control']
};
// Các middleware cơ bản
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(limiter);
// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
// Định tuyến cơ bản
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Định tuyến API
app.use('/api/posts', posts_1.default);
// Xử lý lỗi 404 - Không tìm thấy tài nguyên
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài nguyên',
    });
});
// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('❌ Lỗi:', err);
    // Set default status code
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Đã xảy ra lỗi máy chủ',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Khởi động máy chủ
const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
    console.log(`🚀 Posts Service đang chạy trên cổng ${PORT}`);
    console.log(`🌿 Môi trường: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Kết nối API: http://localhost:${PORT}/api`);
});
// Xử lý các lỗi chưa được xử lý (unhandled)
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    if (reason instanceof Error) {
        console.error(reason.name, reason.message);
    }
    else {
        console.error('Lý do:', reason);
    }
    httpServer.close(() => {
        process.exit(1);
    });
});
process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    httpServer.close(() => {
        process.exit(1);
    });
});
//# sourceMappingURL=server.js.map