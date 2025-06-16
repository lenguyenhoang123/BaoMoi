"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.app = void 0;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const error_handler_1 = require("./middlewares/error.handler");
const init_db_1 = require("./config/init-db");
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
// Ưu tiên tải file .env trong thư mục comments-service trước, sau đó mới tải file .env ở thư mục gốc
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
// Nếu không tìm thấy biến môi trường trong file .env của comments-service, sẽ tải từ file .env ở thư mục gốc
if (!process.env.DB_NAME) {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
}
// Khởi tạo ứng dụng
const app = (0, express_1.default)();
exports.app = app;
// Cấu hình cổng
const PORT = process.env.COMMENTS_SERVICE_PORT ? parseInt(process.env.COMMENTS_SERVICE_PORT, 10) : 3008;
// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3004',
    'http://192.168.100.50:3004',
    '*', // Cho phép tất cả trong môi trường phát triển
];
const corsOptions = {
    origin: (origin, callback) => {
        // Cho phép tất cả trong môi trường phát triển
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        // Trong môi trường production, kiểm tra origin
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        logger_1.logger.warn(`[CORS] Origin ${origin} not allowed`);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'X-CSRF-Token',
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Date',
        'X-Api-Version',
    ],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};
// Apply CORS with options
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Cấu hình morgan để sử dụng logger winston
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => {
            logger_1.logger.info(message.trim());
        },
    },
}));
// Log các biến môi trường (không bao gồm dữ liệu nhạy cảm)
logger_1.logger.info('Environment variables loaded', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: PORT,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER ? '***' : undefined,
});
// Routes
app.use('/', comment_routes_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'comments-service',
        timestamp: new Date().toISOString(),
    });
});
// Xử lý route không tồn tại
app.use(error_handler_1.notFoundHandler);
// Xử lý lỗi
app.use(error_handler_1.errorHandler);
// Khởi động server
const startServer = async () => {
    try {
        logger_1.logger.info('🚀 Starting Comments Service...');
        await (0, init_db_1.initDatabase)();
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger_1.logger.info(`🚀 Server is running on port ${PORT}`, { service: 'comments-service' });
        });
        // Xử lý lỗi server
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger_1.logger.error(`❌ Port ${PORT} is already in use`);
            }
            else {
                logger_1.logger.error('❌ Server error:', error);
            }
            process.exit(1);
        });
        // Xử lý tắt server
        const shutdown = () => {
            logger_1.logger.info('🛑 Shutting down server...');
            server.close(() => {
                logger_1.logger.info('✅ Server closed');
                process.exit(0);
            });
            // Force close server after 5s
            setTimeout(() => {
                logger_1.logger.error('❌ Forcing server close');
                process.exit(1);
            }, 5000);
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        return server;
    }
    catch (err) {
        const error = err;
        logger_1.logger.error(`❌ Failed to start server: ${error.message}`);
        logger_1.logger.error(error.stack);
        process.exit(1);
    }
};
exports.startServer = startServer;
// Bắt đầu server
if (require.main === module) {
    startServer();
}
