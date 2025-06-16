import path from 'path';
import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';
import { createServer, Server } from 'http';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.handler';
import { initDatabase } from './config/init-db';
import commentRoutes from './routes/comment.routes';

// Ưu tiên tải file .env trong thư mục comments-service trước, sau đó mới tải file .env ở thư mục gốc
dotenv.config({ path: path.join(__dirname, '../.env') });

// Nếu không tìm thấy biến môi trường trong file .env của comments-service, sẽ tải từ file .env ở thư mục gốc
if (!process.env.DB_NAME) {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
}

// Khởi tạo ứng dụng
const app: Application = express();

// Cấu hình cổng
const PORT = process.env.COMMENTS_SERVICE_PORT ? parseInt(process.env.COMMENTS_SERVICE_PORT, 10) : 3008;

// CORS configuration
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004',
  'http://192.168.100.50:3004',
  '*', // Cho phép tất cả trong môi trường phát triển
];

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Cho phép tất cả trong môi trường phát triển
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // Trong môi trường production, kiểm tra origin
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`[CORS] Origin ${origin} not allowed`);
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
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình morgan để sử dụng logger winston
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  })
);

// Log các biến môi trường (không bao gồm dữ liệu nhạy cảm)
logger.info('Environment variables loaded', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER ? '***' : undefined,
});

// Routes
app.use('/', commentRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'comments-service',
    timestamp: new Date().toISOString(),
  });
});

// Xử lý route không tồn tại
app.use(notFoundHandler);

// Xử lý lỗi
app.use(errorHandler);

// Khởi động server
const startServer = async (): Promise<Server> => {
  try {
    logger.info('🚀 Starting Comments Service...');
    await initDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server is running on port ${PORT}`, { service: 'comments-service' });
    });

    // Xử lý lỗi server
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      } else {
        logger.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Xử lý tắt server
    const shutdown = (): void => {
      logger.info('🛑 Shutting down server...');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });

      // Force close server after 5s
      setTimeout(() => {
        logger.error('❌ Forcing server close');
        process.exit(1);
      }, 5000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    const error = err as Error;
    logger.error(`❌ Failed to start server: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Bắt đầu server
if (require.main === module) {
  startServer();
}

export { app, startServer };
