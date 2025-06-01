import express, { Request, Response, Application, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer, Server as HttpServer } from 'http';
import { createLogger, format, transports, Logger } from 'winston';
import { sequelize, testConnection } from './config/database';
import { authRoutes } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DB_NAME: string;
      DB_USER: string;
      DB_PASS: string;
      DB_HOST: string;
      DB_PORT: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      LOG_LEVEL?: string;
    }
  }
}

// Cấu hình đường dẫn đến file .env của auth service
const SERVICE_ENV_PATH = path.join(__dirname, '../../.env');

// Tải biến môi trường từ file .env của auth service
dotenv.config({ path: SERVICE_ENV_PATH });

// Log thông báo xác nhận đã tải file .env
console.log(`[AUTH] Đang tải cấu hình từ: ${SERVICE_ENV_PATH}`);
console.log(`[AUTH] Cấu hình được tải thành công`);
// Kiểm tra các biến môi trường bắt buộc
const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRES_IN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[AUTH] Lỗi: Thiếu các biến môi trường bắt buộc: ${missingVars.join(', ')}`);
  console.error(`[AUTH] Vui lòng kiểm tra lại file .env tại: ${SERVICE_ENV_PATH}`);
  console.error(`[AUTH] Bạn có thể sao chép từ file .env.example và điền các giá trị phù hợp`);
  process.exit(1);
}

// Log thông tin cấu hình đã tải (không hiển thị giá trị nhạy cảm)
console.log('[AUTH] Đã tải cấu hình môi trường thành công');
console.log(`[AUTH] Môi trường: ${process.env.NODE_ENV || 'development'}`);
console.log(`[AUTH] Cổng dịch vụ: ${process.env.PORT}`);
console.log(`[AUTH] Kết nối database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

// Log thông tin môi trường đã tải (không hiển thị giá trị nhạy cảm)
console.log('[AUTH] Đã tải cấu hình môi trường thành công');
console.log(`[AUTH] Môi trường: ${process.env.NODE_ENV || 'development'}`);
console.log(`[AUTH] Cổng dịch vụ: ${process.env.PORT}`);
console.log(`[AUTH] Kết nối database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);

// Cấu hình CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004',
  'http://localhost:3005',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3007',
  'http://localhost:3008',
  'http://localhost:3009',
  'http://192.168.100.50:3004'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Trong môi trường development, cho phép tất cả các origin
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CORS] Allowing all origins in development`);
      return callback(null, true);
    }
    
    // Cho phép các request không có origin (từ API Gateway hoặc server-side)
    if (!origin) {
      console.log('[CORS] Allowing request with no origin (server-side/API Gateway)');
      return callback(null, true);
    }
    
    // Cho phép tất cả các origin trong môi trường phát triển
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth CORS] Allowing origin in development: ${origin}`);
      return callback(null, true);
    }
    
    // Trong môi trường production, kiểm tra origin
    if (allowedOrigins.includes(origin)) {
      console.log(`[Auth CORS] Allowed origin: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`[Auth CORS] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
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
    'X-Refresh-Token',
    'Cache-Control',
    'Accept-Encoding',
    'Accept-Language',
    'Connection',
    'Host',
    'Referer',
    'User-Agent'
  ],
  exposedHeaders: [
    'X-Access-Token',
    'X-Refresh-Token',
    'Set-Cookie',
    'Content-Length',
    'ETag'
  ]
};

// Khởi tạo ứng dụng Express
const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

// 1. Middleware CORS - Phải được đặt trước các route
app.use(cors(corsOptions));

// Xử lý preflight requests
app.options('*', cors(corsOptions));

// Middleware để log CORS headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Thêm CORS headers vào response
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  }
  
  // Log CORS headers
  console.log(`[CORS Headers] Origin: ${origin || 'none'}`);
  console.log(`[CORS Headers] Allowed-Methods: ${
    Array.isArray(corsOptions.methods) 
      ? corsOptions.methods.join(', ')
      : corsOptions.methods || 'N/A'
  }`);
  console.log(`[CORS Headers] Allowed-Headers: ${
    Array.isArray(corsOptions.allowedHeaders)
      ? corsOptions.allowedHeaders.join(', ')
      : corsOptions.allowedHeaders || 'N/A'
  }`);
  
  next();
});

// 2. Middleware xử lý dữ liệu JSON và URL-encoded
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 3. Middleware để ghi log tất cả các yêu cầu
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n[${new Date().toISOString()}] [${req.method}] ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Log body nếu có
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Log query parameters nếu có
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query Parameters:', JSON.stringify(req.query, null, 2));
  }
  
  // Log các tham số URL nếu có
  if (req.params && Object.keys(req.params).length > 0) {
    console.log('URL Parameters:', JSON.stringify(req.params, null, 2));
  }
  
  // Lưu lại hàm gửi response gốc để ghi log
  const originalSend = res.send;
  res.send = function (body?: any): any {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${req.originalUrl} - Status: ${res.statusCode}`);
    if (body) {
      try {
        const jsonBody = typeof body === 'string' ? JSON.parse(body) : body;
        console.log('Response:', JSON.stringify(jsonBody, null, 2));
      } catch (e) {
        console.log('Response (non-JSON):', body);
      }
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Cấu hình logger
const logger: Logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Ghi log ra console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, stack }) => {
          const logMessage = stack || message;
          return `${timestamp} [${level}]: ${logMessage}`;
        })
      )
    }),
    // Ghi log vào file
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Các middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sử dụng CORS với cấu hình đã định nghĩa trước đó
app.use(cors(corsOptions));

// Ghi log các yêu cầu HTTP
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  },
  skip: (req: Request) => {
    return req.originalUrl === '/health' || req.originalUrl === '/favicon.ico';
  }
}));

// Điểm kiểm tra trạng thái dịch vụ
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Các route API
app.use('/auth', authRoutes);

// Xử lý lỗi 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      statusCode: 404,
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// Xử lý lỗi toàn cục
app.use(errorHandler);

/**
 * Kiểm tra kết nối cơ sở dữ liệu
 */
async function testDatabaseConnection(): Promise<void> {
  try {
    await testConnection();
    console.log('✅ Kết nối cơ sở dữ liệu thành công!');
  } catch (error) {
    console.error('❌ Không thể kết nối đến cơ sở dữ liệu:', error);
    throw error;
  }
}

// Khởi động máy chủ
async function startServer(): Promise<void> {
  try {
    console.log('🔄 Đang khởi động Auth Service...');
    
    // Kiểm tra kết nối cơ sở dữ liệu trước khi khởi động server
    await testDatabaseConnection();

    // Đồng bộ hóa mô hình với cơ sở dữ liệu (không nên dùng trong môi trường production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Đang đồng bộ hóa mô hình với cơ sở dữ liệu...');
      await sequelize.sync({ alter: true });
      console.log('✅ Đồng bộ hóa mô hình với cơ sở dữ liệu thành công!');
    }

    // Tạo HTTP server
    const server: HttpServer = createServer(app);

    // Xử lý các lỗi chưa được bắt
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Lắng nghe các kết nối
    server.listen(PORT, () => {
      console.log(`\n🚀 Auth Service đang chạy:`);
      console.log(`   - Môi trường: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - Địa chỉ: http://localhost:${PORT}`);
      console.log(`   - Thời gian: ${new Date().toISOString()}\n`);
      
      // Log tất cả các route đã đăng ký
      console.log('📡 Các endpoint đang được chuyển tiếp:');
      
      // Hàm đơn giản để in route
      const printRoutes = (layer: any, parentPath = '') => {
        if (layer.route) {
          // Xử lý route trực tiếp
          const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(', ');
          const routePath = layer.route.path === '/' ? '' : layer.route.path;
          console.log(`   - ${methods.padEnd(8)} ${parentPath}${routePath}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
          // Xử lý router được đăng ký với app.use
          let routePath = parentPath;
          
          // Lấy path từ regex (nếu có)
          if (layer.regexp) {
            const match = layer.regexp.toString()
              .replace('\\/?', '')     // Bỏ \/?
              .replace('/^', '')        // Bỏ /^
              .replace('(?=\\/|$)', '') // Bỏ (?=\/|$)
              .split('/');
              
            if (match && match[1]) {
              routePath += '/' + match[1];
            }
          }
          
          // Đệ quy xử lý các route con
          layer.handle.stack.forEach((handler: any) => {
            printRoutes(handler, routePath);
          });
        }
      };
      
      // In tất cả các route
      if (app._router && app._router.stack) {
        app._router.stack.forEach((layer: any) => printRoutes(layer));
      }
      console.log(''); // Thêm dòng trống để dễ đọc
    });

    // Xử lý lỗi khi khởi động server
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      // Xử lý các lỗi cụ thể
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ Cần quyền truy cập để sử dụng cổng ${PORT}`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ Cổng ${PORT} đã được sử dụng`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error('❌ Lỗi khi khởi động server:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
};

startServer();

export default app;
