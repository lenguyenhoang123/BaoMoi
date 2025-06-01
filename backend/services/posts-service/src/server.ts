import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Get directory name in CommonJS
declare const __filename: string;
declare const __dirname: string;

// Tải biến môi trường - Ưu tiên tải từ file .env trong thư mục service trước
dotenv.config({ path: path.join(__dirname, '../.env') });

// Nếu không tìm thấy biến môi trường, thử tải từ thư mục gốc của dự án
if (!process.env.POSTGRES_DB) {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
}

// Import database configuration
import db from './config/database';

// Import routes
import postsRoutes from './routes/posts';

// Hàm kiểm tra kết nối database
const testDbConnection = async () => {
  try {
    console.log('🔄 Đang kết nối đến cơ sở dữ liệu...');
    
    // Khởi tạo kết nối database
    await db.init();
    
    // Test kết nối bằng một query đơn giản
    const result = await db.query('SELECT NOW() as current_time');
    
    console.log('✅ Kết nối cơ sở dữ liệu thành công');
    console.log('   Thời gian hiện tại:', result.rows[0].current_time);
  } catch (err) {
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
const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3004'],
    methods: ['GET', 'POST']
  }
});

// Thực hiện kiểm tra kết nối database khi khởi động
testDbConnection();

// Cấu hình giới hạn tỷ lệ truy cập
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Cấu hình CORS (Cross-Origin Resource Sharing)
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3004'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control']
};

// Các middleware cơ bản
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(limiter);

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Định tuyến cơ bản
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Định tuyến API
app.use('/api/posts', postsRoutes);

// Xử lý lỗi 404 - Không tìm thấy tài nguyên
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Không tìm thấy tài nguyên',
  });
});

// Middleware xử lý lỗi toàn cục
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
const PORT = Number(process.env.PORT) || 3002;
const HOST = '0.0.0.0'; // Lắng nghe trên tất cả các địa chỉ mạng
httpServer.listen({
  port: PORT,
  host: HOST
}, () => {
  console.log(`🚀 Posts Service đang chạy trên cổng ${PORT}`);
  console.log(`🌿 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Kết nối API: http://${HOST}:${PORT}/api`);
  console.log(`🌐 Có thể truy cập từ bên ngoài thông qua: http://localhost:${PORT}/api`);
});

// Xử lý các lỗi chưa được xử lý (unhandled)
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  if (reason instanceof Error) {
    console.error(reason.name, reason.message);
  } else {
    console.error('Lý do:', reason);
  }
  httpServer.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error.name, error.message);
  httpServer.close(() => {
    process.exit(1);
  });
});
