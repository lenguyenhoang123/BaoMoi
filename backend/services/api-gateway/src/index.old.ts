import express, { Request } from 'express';
import { createProxyMiddleware, Options, RequestHandler } from 'http-proxy-middleware';

// Extend the Express Request type to include necessary properties
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
      end: Function;
      on: (event: string, callback: (...args: any[]) => void) => void;
    }
  }
}
import cors from 'cors';
// Định nghĩa kiểu CorsOptions thủ công
interface CorsOptions {
  origin?: string | boolean | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import winston from 'winston';

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Configure logger
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// Log to console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Initialize Express app
const app = express();

// Middleware để log tất cả các request
app.use((req, res, next) => {
  console.log('\n=== REQUEST RECEIVED ===');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', req.query);

  // Lưu lại hàm gốc để ghi log response
  const originalSend = res.send;
  res.send = function (body) {
    console.log('\n=== RESPONSE SENT ===');
    console.log(`[${new Date().toISOString()}] ${res.statusCode}`);
    console.log('Response body:', body);
    return originalSend.call(this, body);
  };

  next();
});
const PORT = process.env.PORT || 3000;

// Body parser middleware with increased limit and timeout
app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// Middleware để parse body trước khi proxy
app.use(express.json({
  limit: '50mb',
  verify: (req: any, res, buf) => {
    try {
      req.rawBody = buf.toString();
    } catch (e) {
      console.error('Lỗi khi đọc raw body:', e);
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 1000000
}));

// Middleware để lưu raw body
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});

// Middleware để log tất cả các request
app.use((req, res, next) => {
  console.log(`\n=== NEW ${req.method} REQUEST ===`);
  console.log('URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Query:', req.query);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  // Log body cho POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const chunks: Buffer[] = [];
    const oldEnd = req.end;

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.end = function (chunk?: any, encoding?: any, callback?: any): any {
      if (chunk) {
        chunks.push(Buffer.from(chunk, encoding));
      }

      if (chunks.length > 0) {
        const body = Buffer.concat(chunks).toString('utf8');
        console.log('Request body:', body);
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = body;
        }
      }

      if (typeof chunk === 'function') {
        callback = chunk;
        return oldEnd.call(this, callback);
      }

      return oldEnd.call(this, chunk, encoding, callback);
    };
  }

  next();
});

// Middleware để log request
app.use((req, res, next) => {
  console.log(`\n=== NEW ${req.method} REQUEST ===`);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('No Request Body');
  }

  // Lưu original send function
  const originalSend = res.send;

  // Override send function để log response
  res.send = function (body) {
    console.log('\n=== RESPONSE ===');
    console.log('Status:', res.statusCode);
    if (body) {
      try {
        const json = typeof body === 'string' ? JSON.parse(body) : body;
        console.log('Response Body:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Response Body:', body);
      }
    }
    return originalSend.call(res, body);
  };

  next();
});

// Request timeout middleware (60 seconds)
app.use((req, res, next) => {
  res.setTimeout(60000, () => {
    if (!res.headersSent) {
      logger.error(`Request timeout: ${req.method} ${req.originalUrl}`);
      res.status(504).json({
        success: false,
        message: 'Gateway Timeout'
      });
      res.end();
    }
  });
  next();
});

// CORS configuration
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    console.log('CORS origin check:', origin);
    // Cho phép tất cả các origin trong môi trường development
    if (!origin || process.env.NODE_ENV === 'development') {
      console.log('Allowing origin (development mode):', origin);
      return callback(null, true);
    }

    // Trong môi trường production, chỉ cho phép các domain cụ thể
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3008',
      'http://localhost:3009',
      'http://localhost:5173' // Vite dev server
    ];

    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.warn('Origin not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Refresh-Token',
    'X-Access-Token',
    'cache-control',
    'pragma',
    'expires'
  ],
  exposedHeaders: [
    'Content-Length',
    'ETag',
    'Date',
    'Connection'
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'API Gateway',
    version: '1.0.0'
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const { headers, query, body } = req;
  // Remove sensitive information from headers
  const headersCopy = { ...headers };
  if (headersCopy.authorization) {
    headersCopy.authorization = '***';
  }
  if (headersCopy.cookie) {
    headersCopy.cookie = '***';
  }

  logger.info(`${req.method} ${req.originalUrl}`, {
    headers: headersCopy,
    query,
    body: body && Object.keys(body).length > 0 ? body : undefined
  });
  next();
});

// Service configuration interface
type PathRewrite = Record<string, string> | ((path: string, req: any) => string);

interface ServiceConfig {
  // Các thuộc tính cơ bản
  path: string | string[];
  target: string;
  pathRewrite?: PathRewrite;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';

  // Timeout và bảo mật
  timeout?: number;
  proxyTimeout?: number;
  changeOrigin?: boolean;
  secure?: boolean;

  // WebSocket
  ws?: boolean;

  // Headers và CORS
  xfwd?: boolean;
  headers?: Record<string, string>;

  // Điều hướng và ghi đè
  followRedirects?: boolean;
  autoRewrite?: boolean;
  hostRewrite?: string | { [key: string]: string };
  protocolRewrite?: 'http' | 'https' | 'auto';

  // Logging
  logProvider?: () => {
    log: (msg: string) => void;
    debug: (msg: string) => void;
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };

  // Xử lý request/response
  onProxyReq?: (proxyReq: any, req: any, res: any) => void;
  onProxyRes?: (proxyRes: any, req: any, res: any) => void;
  onError?: (err: Error, req: any, res: any) => void;

  // Body parsing
  limit?: string | number;
  parseReqBody?: boolean;

  // Các thuộc tính khác
  preserveHeaderKeyCase?: boolean;
  proxyReqOptDecorator?: (opts: any, req: any) => any;
  selfHandleResponse?: boolean;

  // SSL
  ssl?: any;

  // Các thuộc tính tùy chọn khác
  [key: string]: any;
}

// Extend Error type to include code
interface CustomError extends Error {
  code?: string;
}

// Create a proxy middleware with common configuration
const createServiceProxy = (config: ServiceConfig): RequestHandler => {
  const proxyOptions: Options = {
    target: config.target,
    changeOrigin: true,
    pathRewrite: config.pathRewrite,
    logLevel: config.logLevel || 'debug',
    timeout: config.timeout || 30000, // 30 seconds timeout
    proxyTimeout: config.proxyTimeout || 30000,
    }
  },
  onProxyRes: (proxyRes, req: any, res) => {
    console.log(`\n[${new Date().toISOString()}] === RESPONSE FROM POSTS SERVICE ===`);
    console.log(`Status: ${proxyRes.statusCode} ${req.method} ${req.url}`);
  },
  onError: (err, req: any, res: any) => {
    console.error(`\n[${new Date().toISOString()}] === PROXY ERROR ===`);
    console.error('Error:', err);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: 'Cannot connect to Posts Service',
        error: err.message
      });
    }
  }
  const proxy = createServiceProxy(service);

}
  };

// Tạo proxy middleware
const proxy = createProxyMiddleware(proxyOptions);

// Đăng ký middleware cho từng path
if (Array.isArray(service.path)) {
  service.path.forEach(path => {
    console.log(`Registering proxy for path: ${path} -> ${service.target}`);
    app.use(path, proxy);
    logger.info(`Mapped ${path} -> ${service.target}`);
  });
} else {
  console.log(`Registering proxy for path: ${service.path} -> ${service.target}`);
  app.use(service.path, proxy);
  logger.info(`Mapped ${service.path} -> ${service.target}`);
}
});

// Add health check endpoint for each service
services.forEach(service => {
  const serviceName = (Array.isArray(service.path) ? service.path[0] : service.path)
    .replace('/api/', '')
    .replace(/^\//, '');

  app.get(`/health/${serviceName}`, (req, res) => {
    res.status(200).json({
      status: 'UP',
      service: serviceName,
      target: service.target,
      timestamp: new Date().toISOString()
    });
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Log all registered routes
  services.forEach(service => {
    const paths = Array.isArray(service.path) ? service.path : [service.path];
    paths.forEach(p => {
      logger.info(`Mapped ${p} -> ${service.target}`);
    });
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down server...');

  server.close(() => {
    logger.info('Server stopped');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  process.exit(1);
});

export default app;
