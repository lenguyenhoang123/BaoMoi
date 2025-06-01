import 'module-alias/register';
import 'reflect-metadata';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './config/logger';

// Log thông tin môi trường
logger.info('Khởi động Tags Service...');
logger.info(`NODE_ENV: ${process.env['NODE_ENV'] || 'development'}`);
logger.info(`PORT: ${process.env['PORT'] || 3007}`);

// Import module ghi log xoay vòng với kiểu dữ liệu tường minh
const rfs = require('rotating-file-stream');
import { errorHandler, notFoundHandler, apiNotFoundHandler } from './utils/apiError';
import tagRoutes from './routes/tag.routes';

// Tải biến môi trường từ file .env trong thư mục service
const envPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: envPath });
logger.info(`Đang sử dụng file cấu hình: ${envPath}`);

// Khởi tạo ứng dụng
const app = express();

// Tin tưởng proxy
app.set('trust proxy', 1);

// Các header bảo mật
app.use(helmet());

// Bật CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004',
  // Thêm các origin được phép khác nếu cần
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép các yêu cầu không có origin (như ứng dụng di động, curl, v.v.)
      if (!origin) return callback(null, true);
      
      // Kiểm tra xem origin có trong danh sách được phép không
      if (allowedOrigins.indexOf(origin) === -1) {
        logger.warn(`[CORS] Origin ${origin} not allowed`);
        return callback(new Error('Not allowed by CORS'), false);
      }
      
      return callback(null, true);
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
    ],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
  })
);

// Xử lý các yêu cầu preflight
app.options('*', cors());

// Nén Gzip
app.use(compression());

// Tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Tạo luồng ghi log xoay vòng cho các truy cập
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: logDir,
  size: '10M', // rotate after 10MB
  maxFiles: 30, // keep 30 days of logs
});

// Chỉ ghi log các phản hồi lỗi 4xx và 5xx ra console
app.use(
  morgan('dev', {
    skip: (_, res) => res.statusCode < 400,
    stream: process.stderr,
  })
);

// Chỉ ghi log các yêu cầu thành công ra console
app.use(
  morgan('dev', {
    skip: (_, res) => res.statusCode >= 400,
    stream: process.stdout,
  })
);

// Ghi log tất cả các yêu cầu vào access.log
app.use(
  morgan('combined', {
    stream: accessLogStream,
  })
);

// Giới hạn tốc độ
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // giới hạn mỗi IP 100 yêu cầu mỗi khoảng thời gian
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);

// Middleware cơ bản
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép các yêu cầu không có origin (như ứng dụng di động, curl, v.v.)
    if (!origin) return callback(null, true);
    
    // Kiểm tra xem origin có trong danh sách được phép không
    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn(`[CORS] Origin ${origin} not allowed`);
      return callback(new Error('Not allowed by CORS'), false);
    }
    
    return callback(null, true);
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
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
}));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Các route API
app.use('/api/tags', tagRoutes);

// Điểm kiểm tra trạng thái dịch vụ
app.get('/health', (_: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tags-service',
  });
});

// Middleware xử lý lỗi
app.use(notFoundHandler);
app.use(apiNotFoundHandler);
app.use(errorHandler);

// Xử lý các lỗi chưa được bắt
process.on('uncaughtException', (error) => {
  logger.error('Lỗi chưa được xử lý:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise bị từ chối chưa được xử lý tại:', promise, 'Lý do:', reason);
  process.exit(1);
});

// Ghi log các promise bị từ chối chưa được xử lý
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection at:', reason);
  // Consider whether to crash the app or not
  // process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Server configuration
const env = process.env['NODE_ENV'] || 'development';
// Always use port 3007 for tags service to avoid conflicts
const port = parseInt(process.env['PORT'] || '3006', 10);

// Create server
let server: http.Server | https.Server;

if (env === 'production' && process.env['SSL_KEY'] && process.env['SSL_CERT']) {
  // HTTPS server for production
  const privateKey = fs.readFileSync(process.env['SSL_KEY'], 'utf8');
  const certificate = fs.readFileSync(process.env['SSL_CERT'], 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
} else {
  // HTTP server for development
  server = http.createServer(app);
}

// Kết nối database
const connectDB = async () => {
  try {
    const { db } = await import('./config/database');
    await db.query('SELECT NOW()'); // Test connection
    logger.info('Đã kết nối đến cơ sở dữ liệu');
  } catch (error) {
    logger.error('Không thể kết nối đến cơ sở dữ liệu:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      logger.info(`Server running in ${env} mode on port ${port}`);
      logger.info(`API Documentation: http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});

// Start the server
startServer();

export default app;
