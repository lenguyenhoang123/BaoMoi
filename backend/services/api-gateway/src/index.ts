import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
// Load environment variables
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình CORS - Danh sách các domain được phép truy cập
const allowedOrigins = [
  'http://localhost:3000',  // Cổng của API Gateway
  'http://localhost:3004',  // Ứng dụng frontend
  'http://localhost:3002',  // Dịch vụ bài viết
  'http://localhost:3005',  // Dịch vụ xác thực
  'http://localhost:3006',  // Dịch vụ thẻ
  'http://localhost:3008',  // Dịch vụ bình luận
  'http://localhost:3009',  // Dịch vụ danh mục
  'http://192.168.100.50:3004',  // Địa chỉ IP nội bộ cho frontend
  'http://127.0.0.1:3004',  // Frontend trên localhost
  'http://127.0.0.1:3000'   // API Gateway trên localhost
];

// Cấu hình CORS middleware (sử dụng type assertion để tránh lỗi TypeScript)
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Cho phép tất cả các origin trong môi trường phát triển
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Kiểm tra origin có trong danh sách cho phép không
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Cho phép gửi credentials (cookies, authorization headers, etc.)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Access-Token', 'X-Refresh-Token'],
  exposedHeaders: ['Content-Range', 'X-Total-Count', 'X-Total-Pages', 'X-Access-Token', 'X-Refresh-Token', 'Set-Cookie'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as string[],
  maxAge: 86400, // Cache preflight request trong 24 giờ
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Áp dụng CORS middleware
app.use(cors(corsOptions));

// Xử lý preflight requests
app.options('*', cors(corsOptions));

// Middleware để log các yêu cầu
app.use((req, res, next) => {
  const origin = req.headers.origin || 'unknown';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} from ${origin}`);
  next();
});

// Thêm middleware để ghi log chi tiết các request
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Ghi log khi request hoàn thành
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - ${res.statusCode} [${Date.now() - start}ms] - IP: ${ip}`);
  });
  
  next();
});

// Cấu hình middleware xử lý dữ liệu JSON với giới hạn kích thước lớn
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      // Lưu raw body để xác thực chữ ký webhook nếu cần
      (req as any).rawBody = buf.toString();
    } catch (e) {
      console.error('Lỗi khi xử lý raw body:', e);
    }
  }
}));

// Cấu hình middleware xử lý dữ liệu URL-encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 100000 
}));

// Middleware xử lý cookie
app.use(cookieParser());

// Middleware ghi log thông tin cơ bản về request
app.use((req, res, next) => {
  console.log(`[API-Gateway] ${req.method} ${req.path} - Headers:`, req.headers);
  next();
});

// Auth Service Proxy
const authProxy = createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth',
    '^/auth': '/auth'
  },
  logLevel: 'debug',
  timeout: 30000, // 30s timeout
  proxyTimeout: 30000, // 30s proxy timeout
  secure: false,
  xfwd: true,
  headers: {
    'Connection': 'keep-alive'
  },
  onProxyReq: (proxyReq: any, req: any, res: any) => {
    console.log(`[Auth Proxy] Forwarding: ${req.method} ${req.originalUrl}`);
    
    // Xử lý OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Xử lý body nếu có
    if (req.body && Object.keys(req.body).length > 0) {
      try {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      } catch (error) {
        console.error('Lỗi khi xử lý body:', error);
        if (!res.headersSent) {
          res.status(400).json({ 
            success: false, 
            message: 'Lỗi khi xử lý dữ liệu yêu cầu' 
          });
        }
      }
    }
  },
  onError: (err: Error, req: any, res: any) => {
    console.error('[Auth Proxy] Error:', err);
    if (!res.headersSent) {
      res.status(502).json({ 
        success: false, 
        message: 'Lỗi kết nối đến Auth Service',
        error: err.message
      });
    }
  },
  onProxyRes: (proxyRes: any, req: any, res: any) => {
    // Log response status
    const statusCode = proxyRes.statusCode || 500;
    console.log(`[Auth Proxy] Response ${statusCode} for ${req.method} ${req.url}`);
    
    // Define allowed origins for CORS
    const allowedOrigins = [
      'http://localhost:3000',  // API Gateway
      'http://localhost:3004',  // Frontend
      'http://localhost:3002',  // Posts Service
      'http://localhost:3005',  // Auth Service
      'http://localhost:3006',  // Tags Service
      'http://localhost:3008',  // Comments Service
      'http://192.168.100.50:3004',  // Local IP for frontend
      'http://127.0.0.1:3004'  // Localhost frontend
    ];
    
    // Ensure CORS headers are set correctly
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      proxyRes.headers['Access-Control-Allow-Origin'] = origin;
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    } else if (!origin) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    }
    
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      proxyRes.statusCode = 200;
    }
    
    // Log response headers for debugging
    console.log('[Auth Proxy] Response headers:', JSON.stringify(proxyRes.headers, null, 2));
    // Log response body for debugging (only for errors)
    if (statusCode >= 400) {
      const chunks: Buffer[] = [];
      const originalWrite = res.write;
      const originalEnd = res.end;
      
      // @ts-ignore - Override write method to capture response chunks
      res.write = function(chunk: any, encoding?: BufferEncoding, callback?: (error: Error | null | undefined) => void): boolean {
        if (chunk) {
          const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding as BufferEncoding);
          chunks.push(bufferChunk);
        }
        return originalWrite.call(res, chunk, encoding as BufferEncoding, callback);
      };
      
      // @ts-ignore - Override end method to log the complete response
      res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): any {
        if (chunk) {
          const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding as BufferEncoding);
          chunks.push(bufferChunk);
        }
        
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          console.log(`[Auth Proxy] Error response (${statusCode}):`, body);
        } catch (e) {
          console.error('[Auth Proxy] Error parsing response body:', e);
        }
        
        return originalEnd.call(res, chunk, encoding as BufferEncoding, callback);
      };
    }
  }
});

// Sử dụng proxy auth cho cả /api/auth và /auth
app.use(['/api/auth', '/auth'], authProxy);

// Posts Service Proxy
const postsServiceUrl = process.env.POSTS_SERVICE_URL || 'http://localhost:3002';
console.log(`🔵 [API-Gateway] Configuring Posts Service proxy to ${postsServiceUrl}`);
app.use('/api/posts', createProxyMiddleware({
  target: postsServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/posts': '/api/posts'  // Giữ nguyên vì Posts Service cần đúng path này
  },
  onProxyReq: (proxyReq, req) => {
    console.log(`[Posts Proxy] Proxying to: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
    
    // Thêm các header CORS nếu cần
    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      proxyReq.setHeader('Origin', origin);
    }
  },
  onError: (err, req, res) => {
    console.error('[Posts Proxy] Error:', err);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: 'Lỗi kết nối đến dịch vụ bài viết. Vui lòng thử lại sau.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Posts Proxy] Received ${proxyRes.statusCode} from Posts Service for ${req.method} ${req.originalUrl}`);
    
    // Cập nhật các header CORS từ origin gốc
    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      proxyRes.headers['Access-Control-Allow-Origin'] = origin;
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // Thêm các header CORS cần thiết
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Access-Token, X-Refresh-Token';
    proxyRes.headers['Access-Control-Expose-Headers'] = 'X-Total-Count, X-Total-Pages, X-Access-Token, X-Refresh-Token';
  },
  secure: false,
  xfwd: true,
  ws: true, // Bật hỗ trợ WebSocket nếu cần
  logLevel: 'debug'
}));

// Categories Service Proxy
console.log(' [API-Gateway] Cấu hình proxy cho Dịch vụ Danh mục đến cổng 3009');
app.use('/api/categories', createProxyMiddleware({
  target: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3009',
  changeOrigin: true,
  pathRewrite: {
    '^/api/categories': '/api/categories' // Giữ nguyên đường dẫn
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] Chuyển tiếp yêu cầu đến Dịch vụ Danh mục: ${req.method} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Lỗi Dịch vụ Danh mục:', err);
    res.status(500).json({ error: 'Không thể kết nối đến dịch vụ danh mục' });
  }
}));

// Comments Service Proxy
console.log('🔵 [API-Gateway] Cấu hình proxy cho Dịch vụ Bình luận đến cổng 3008');
app.use('/api/comments', createProxyMiddleware({
  target: process.env.COMMENTS_SERVICE_URL || 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: {
    '^/api/comments': '/api/comments' // Giữ nguyên đường dẫn
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] Chuyển tiếp yêu cầu đến Dịch vụ Bình luận: ${req.method} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Lỗi Dịch vụ Bình luận:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Không thể kết nối đến dịch vụ bình luận',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },
  secure: false,
  xfwd: true,
  timeout: 30000, // Thời gian chờ 30 giây
  proxyTimeout: 30000,
  logLevel: 'debug' // Bật log debug
}));

// Tags Service Proxy 
console.log('🟠 [API-Gateway] Cấu hình proxy cho Dịch vụ Thẻ đến cổng 3006');
app.use('/api/tags', createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: {
    '^/api/tags': '/api/tags' // Keep the full path as the routes are mounted at /api/tags in the service
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[API-Gateway] Chuyển tiếp yêu cầu ${req.method} ${req.originalUrl} đến Dịch vụ Thẻ`);
    console.log(`[API-Gateway] Đường dẫn đang được yêu cầu: ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('[API-Gateway] Lỗi kết nối đến Dịch vụ Thẻ:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Lỗi kết nối đến Dịch vụ Thẻ',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },
  secure: false,
  xfwd: true,
  timeout: 30000, // 30 seconds timeout
  proxyTimeout: 30000,
  logLevel: 'debug' // Enable debug logging
}));

// Test endpoint
app.post('/api/test', (req: any, res: any) => {
  console.log('Test endpoint called with body:', req.body);
  res.json({
    success: true,
    message: 'API Gateway is working!',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    service: 'api-gateway', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
    🚀 API Gateway đang chạy tại http://localhost:${PORT}
    
    📡 Các endpoint đang được chuyển tiếp:
    - /api/auth      -> http://localhost:3005
    - /api/posts     -> http://localhost:3002
    - /api/categories-> http://localhost:3009
    - /api/comments  -> http://localhost:3008
    - /api/tags     -> http://localhost:3006
  `);
});

// Xử lý lỗi
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});