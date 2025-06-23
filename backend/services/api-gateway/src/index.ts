import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { setupSimpleProxy } from './simple-proxy.js';

// Định nghĩa kiểu cho request với body
interface RequestWithBody extends express.Request {
  body: any;
  originalUrl: string;
  method: string;
}

// Cấu hình
const PORT = process.env.PORT || 3000;
const POSTS_SERVICE_URL = process.env.POSTS_SERVICE_URL || 'http://localhost:3002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Khởi tạo ứng dụng Express
const app = express();

// Middleware cơ bản
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3004', // Chỉ chấp nhận yêu cầu từ frontend
  credentials: true, // Cho phép gửi credentials (cookies, xác thực HTTP)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Cấu hình proxy
setupSimpleProxy(app);

// Các proxy đã được đăng ký trong setupSimpleProxy

// Các route khác có thể thêm vào đây

// Xử lý 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    error: 'The requested resource was not found'
  });
});

// Xử lý lỗi toàn cục
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Khởi động server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway đang chạy trên cổng ${PORT}`);
  console.log(`🔗 Posts Service: ${POSTS_SERVICE_URL}`);
  console.log(`🔗 Auth Service: ${AUTH_SERVICE_URL}\n`);
});

// Xử lý tín hiệu dừng
process.on('SIGTERM', () => {
  console.log('\n🛑 Nhận được tín hiệu SIGTERM. Đang tắt server...');
  server.close(() => {
    console.log('✅ Server đã dừng');
    process.exit(0);
  });
});

// Xử lý các lỗi chưa được bắt
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection tại:', promise, 'Lý do:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export { app, server };
