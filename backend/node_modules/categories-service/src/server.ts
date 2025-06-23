import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors, { CorsOptions } from 'cors';

// Import các route
import categoryRoutes from './routes/category.routes';
import { sequelize } from './config/sequelize';
import { QueryTypes } from 'sequelize';
import { errorHandler, notFoundHandler } from './middlewares/error.handler';
import { logger } from './utils/logger';

// Lấy đường dẫn thư mục hiện tại (tương thích với ES module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tải các biến môi trường
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Nếu không tìm thấy DB_NAME, thử tải từ file .env ở thư mục gốc
if (!process.env.DB_NAME) {
  const rootEnvPath = path.join(__dirname, '../../../.env');
  dotenv.config({ path: rootEnvPath });
}

// Khởi tạo ứng dụng
const app = express();

// Cấu hình cổng
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3009;

// Đảm bảo thư mục logs tồn tại
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3004',
  'http://localhost:3005'
];

const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed origins
    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn(`[CORS] Origin ${origin} not allowed`);
      return callback(null, false);
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
    'Cache-Control'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Range'
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS with options
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Log all requests
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
  next();
});

// Log HTTP requests
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  },
  skip: (req: Request) => {
    return req.originalUrl === '/health' || req.originalUrl.startsWith('/metrics');
  }
}));

// Log environment variables (without sensitive data)
logger.info('Environment variables loaded', {
  node_env: process.env.NODE_ENV,
  PORT: PORT,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER ? '***' : undefined,
  DB_PASSWORD: process.env.DB_PASSWORD ? '***' : undefined
});

// Cấu hình base path
const BASE_PATH = '/api';

// Xóa route hiển thị thông báo chào mừng

// Health check endpoint - Đặt trước các route khác
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'categories-service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: true,
      status: 'Connected'
    }
  });
});

// Register category routes without /api prefix since API Gateway will add it
const API_PREFIX = '/categories';
app.use(API_PREFIX, categoryRoutes);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'categories-service',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    metrics: 'Not implemented yet',
    timestamp: new Date().toISOString()
  });
});

// Test database connection
app.get(`${BASE_PATH}/test-db`, async (_req: Request, res: Response) => {
  try {
    // Kiểm tra kết nối database
    await sequelize.authenticate();
    
    // Kiểm tra bảng categories
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories'",
      { type: QueryTypes.SELECT }
    );
    
    const categoriesExist = tables.length > 0;
    
    // Đếm số lượng bản ghi trong bảng categories nếu tồn tại
    let count = 0;
    if (categoriesExist) {
      const result = await sequelize.query('SELECT COUNT(*) FROM categories', { type: QueryTypes.SELECT });
      count = Number((result[0] as any)?.count || 0);
    }
    
    res.json({
      success: true,
      database: {
        connected: true,
        database: sequelize.getDatabaseName(),
        dialect: sequelize.getDialect(),
      },
      categories: {
        exists: categoriesExist,
        count: count
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API Routes
// Đăng ký routes với base path
console.log(`Đăng ký routes với BASE_PATH: ${BASE_PATH}`);

// Route gốc
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Categories Service',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      { method: 'GET', path: '/health', description: 'Health check' },
      { method: 'GET', path: '/categories', description: 'Get all categories' },
      { method: 'GET', path: '/categories/:id', description: 'Get category by ID' },
    ]
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'categories-service', timestamp: new Date().toISOString() });
});

// API routes
app.use('', categoryRoutes);

// Test route
app.get('/test', (_req: Request, res: Response) => {
  res.json({ message: 'Test endpoint is working', timestamp: new Date().toISOString() });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  const host = typeof address === 'string' ? 'localhost' : address?.address || 'localhost';
  const port = (typeof address === 'string' ? address : address?.port || PORT).toString();
  
  const serverUrl = `http://${host === '::' ? 'localhost' : host}:${port}`;
  
  console.log('='.repeat(80));
  console.log(`🚀 Categories Service is running on ${serverUrl}`);
  console.log(`📡 Health check: ${serverUrl}/health`);
  console.log(`🔍 API Documentation: ${serverUrl}${BASE_PATH}/categories`);
  console.log('='.repeat(80));
  
  logger.info(`Server started on ${serverUrl}`);
  
  // Test database connection and run migrations if needed
  if (process.env.NODE_ENV !== 'test') {
    (async () => {
      try {
        const { default: db } = await import('./config/database.js');
        
        try {
          await db.testConnection();
          logger.info('Database connected successfully');
          console.log('='.repeat(80));
          
          // Check if categories table exists
          try {
            const client = await db.getClient();
            
            try {
              // Check if categories table exists
              const tableCheckResult = await client.query(`
                SELECT EXISTS (
                  SELECT FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND table_name = 'categories'
                );
              `);
              
              const tableExists = tableCheckResult.rows[0].exists;
              
              if (!tableExists) {
                logger.info('Categories table does not exist, running migration...');
                
                // Read and execute the migration file
                const migrationFilePath = path.join(__dirname, '../migrations/001_create_categories_table.sql');
                const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
                
                logger.info('Executing migration: 001_create_categories_table.sql');
                
                // Execute the migration in a transaction
                await client.query('BEGIN');
                await client.query(migrationSQL);
                await client.query('COMMIT');
                
                logger.info('✅ Database migrations completed successfully');
              } else {
                logger.info('Categories table already exists, skipping migrations');
              }
            } catch (error: unknown) {
              // Rollback transaction if there was an error
              await client.query('ROLLBACK');
              
              logger.error('❌ Migration failed:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: (error as any)?.code,
                stack: error instanceof Error ? error.stack : undefined
              });
            } finally {
              client.release();
            }
          } catch (error: unknown) {
            logger.error('❌ Failed to run migrations:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: (error as any)?.code,
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        } catch (error: unknown) {
          logger.error('Database connection error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: (error as any)?.code,
            stack: error instanceof Error ? error.stack : undefined
          });
          process.exit(1);
        }
      } catch (error) {
        logger.error('Failed to initialize database:', error);
        process.exit(1);
      }
    })();
  }
});

// Handle server errors
server.on('error', (error) => {
  if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
  } else {
    logger.error('❌ Server error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as NodeJS.ErrnoException)?.code,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  process.exit(1);
});

// ...
process.on('SIGTERM', () => {
  logger.info('🛑 Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    logger.info('✅ Server has been stopped');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default server;
