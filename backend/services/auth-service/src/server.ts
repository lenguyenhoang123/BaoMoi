import express, { Request, Response, NextFunction, Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import { sequelize } from './config/database';
import authRouter from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';
import { UserRole } from './models/user.types';
import { fileURLToPath } from 'url';

// Tạo __dirname cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a stream for morgan
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
import cors from 'cors';

interface IUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      originalUrl: string;
      ip: string;
      get(name: string): string | undefined;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Response {
    on(event: string, listener: (...args: any[]) => void): this;
    statusCode: number;
    statusMessage: string;
    get(name: string): string | undefined;
  }
}

// Cấu hình đường dẫn đến file .env
const SERVICE_ENV_PATH = path.join(__dirname, '../../.env');
dotenv.config({ path: SERVICE_ENV_PATH });

// Kiểm tra các biến môi trường bắt buộc
const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXPIRES_IN'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Cấu hình CORS cho phép các domain truy cập
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

// Cấu hình tùy chọn CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Cho phép tất cả các origin trong môi trường phát triển
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Trong môi trường production, chỉ cho phép các origin được chỉ định
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked by CORS: ${origin}`);
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
    'X-Refresh-Token',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['X-Access-Token', 'X-Refresh-Token'],
  optionsSuccessStatus: 200 // Một số trình duyệt cần status 200 thay vì 204
};

// Khởi tạo ứng dụng Express
const app: Application = express();

// Middleware cơ bản
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.get('/api-docs', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Auth Service API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
        <style>
          .swagger-ui .topbar { display: none }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/api-docs-json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout",
              deepLinking: true,
              showExtensions: true,
              showCommonExtensions: true
            });
          };
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

// Serve Swagger JSON
app.get('/api-docs-json', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// Logging HTTP requests
app.use(morgan('combined', { stream }));

// Log các request đến
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`[${req.method}] ${req.originalUrl}`, {
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Cấu hình middleware CORS
app.use(cors(corsOptions));

// Route cơ bản
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'success' });
});

// Đăng ký các route xác thực
app.use('/auth', authRouter);

// Xử lý lỗi 404 - Không tìm thấy đường dẫn
app.use((req: Request, res: Response) => {
  res.status(404).json({
    thanhCong: false,
    thongBao: 'Không tìm thấy đường dẫn',
    loi: {
      maLoi: 404,
      thongBao: `Không thể ${req.method} ${req.originalUrl}`
    }
  });
});

// Middleware xử lý lỗi toàn cục
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Kiểm tra kiểu của err trước khi sử dụng
  if (err instanceof Error) {
    logger.error('Unhandled error:', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      },
      request: {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        headers: {
          'content-type': req.get('content-type'),
          'authorization': req.get('authorization') ? '***' : undefined,
          'x-forwarded-for': req.get('x-forwarded-for'),
          'x-real-ip': req.get('x-real-ip')
        }
      },
      timestamp: new Date().toISOString()
    });
  } else {
    logger.error('Unhandled non-Error exception:', { error: err });
  }
  
  // Chuyển lỗi tới errorHandler
  errorHandler(err instanceof Error ? err : new Error('Unknown error occurred'), req, res, next);
});

// Log các request hoàn thành
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
      contentType: res.get('content-type'),
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});

// Cấu hình cổng mặc định cho auth-service
const DEFAULT_PORT = 3005;
const PORT: number = parseInt(process.env.PORT || DEFAULT_PORT.toString(), 10);
const server: HttpServer = createServer(app);

// Khởi động máy chủ
async function khoiDongMayChu(): Promise<void> {
  try {
    console.log('🔄 Đang kiểm tra kết nối database...');
    // Kiểm tra kết nối database
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Kết nối database thành công');
    
    // Lắng nghe kết nối
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
      console.log(`🌐 Truy cập: http://localhost:${PORT}`);
    });
    
    // Xử lý lỗi khi khởi động server
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ Cổng ${PORT} cần quyền truy cập đặc biệt`);
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
    process.exit(1);
  }
}

// Bắt đầu khởi động máy chủ
khoiDongMayChu().catch(() => {
  process.exit(1);
});

export default app;
