import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors, { CorsOptions } from 'cors';
import path from 'path';
import swaggerSpec from './docs/swagger';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import db from './config/database';
import postsRoutes from './routes/posts';

// Tải biến môi trường
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.POSTGRES_DB) {
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
}

// Kiểm tra kết nối cơ sở dữ liệu
const testDbConnection = async () => {
  try {
    await db.init();
    await db.query('SELECT NOW() as current_time');
  } catch (error) {
    console.log('Đang thử kết nối lại cơ sở dữ liệu sau 5 giây...');
    setTimeout(testDbConnection, 5000);
  }
};

// Khởi tạo ứng dụng Express
const app: Express = express();
const httpServer = createServer(app);

// Middleware cơ bản nên được đặt đầu tiên
app.use(helmet()); // Bảo mật HTTP headers

// Sử dụng body-parser với cấu hình đơn giản
import bodyParser from 'body-parser';

// Middleware xử lý JSON body
app.use(bodyParser.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    try {
      // Lưu raw body để debug
      req.rawBody = buf.toString('utf8');
    } catch (e) {
      console.error('Lỗi khi đọc raw body:', e);
    }
  }
}));

// Xử lý URL-encoded data
app.use(bodyParser.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Middleware để log request body
app.use((req, res, next) => {
  console.log('\n=== REQUEST BODY MIDDLEWARE ===');
  console.log('Method:', req.method);
  console.log('Content-Type:', req.get('content-type'));
  console.log('Body:', req.body);
  console.log('Raw body:', (req as any).rawBody);
  next();
});

// Middleware xử lý URL-encoded body
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 10000
}));

// Middleware log request để debug
app.use((req: any, res, next) => {
  console.log(`\n=== NHẬN REQUEST TỪ API GATEWAY ===`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Raw Body:', req.rawBody);
  next();
});

// Middleware để ghi log tất cả các request
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Ghi log request
  console.log(`\n=== ${new Date().toISOString()} ===`);
  console.log(`[${req.method}] ${req.originalUrl}`);
  console.log('Base URL:', req.baseUrl);
  console.log('Path:', req.path);
  console.log('Query:', req.query);
  console.log('Headers:', {
    'content-type': req.get('content-type'),
    'content-length': req.get('content-length'),
    'authorization': req.get('authorization') ? '***' : undefined,
    'user-agent': req.get('user-agent'),
    'x-forwarded-for': req.get('x-forwarded-for')
  });
  
  // Log raw body nếu có
  if ((req as any).rawBody) {
    console.log('Raw Body:', (req as any).rawBody);
  }
  
  // Log parsed body nếu có
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Parsed Body:', req.body);
  }
  
  // Ghi log response
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`\n[Response] Status: ${res.statusCode} - ${res.statusMessage}`);
    console.log(`Response Time: ${Date.now() - start}ms`);
    if (body && typeof body === 'string') {
      try {
        const jsonBody = JSON.parse(body);
        console.log('Response Body:', jsonBody);
      } catch (e) {
        console.log('Response Body:', body);
      }
    }
    return originalSend.call(this, body);
  };
  
  next();
};

// Middleware đảm bảo UTF-8 encoding và các headers cần thiết
app.use((req, res, next) => {
  // Set default content type to JSON with UTF-8
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Ensure proper content encoding
  res.setHeader('Content-Encoding', 'identity');
  
  // Set character encoding for text responses
  res.charset = 'utf-8';
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Log incoming request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  next();
});

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body) console.log('Body:', req.body);
  next();
});

// Cấu hình CORS (Cross-Origin Resource Sharing)
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

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Cho phép tất cả các origin trong môi trường phát triển
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Trong môi trường production, chỉ cho phép các origin được chỉ định
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
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
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: [
    'X-Access-Token', 
    'X-Refresh-Token',
    'Content-Disposition',
    'Access-Control-Allow-Origin'
  ],
  optionsSuccessStatus: 200 // Một số trình duyệt cần status 200 thay vì 204
};

// Áp dụng CORS trước tất cả các route khác
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Xử lý preflight requests

// Khởi động máy chủ
const startServer = async () => {
  // Kiểm tra nếu server đã được khởi tạo
  if (httpServer.listening) {
    console.log('🔄 Server đã được khởi động trước đó');
    return;
  }

  try {
    await testDbConnection();
    
    const PORT = Number(process.env.PORT) || 3002;
    const HOST = process.env.HOST || 'localhost';
    
    // Đảm bảo không lắng nghe nhiều lần
    if (!httpServer.listening) {
      httpServer.listen(PORT, HOST, () => {
        console.log(`🟢 Máy chủ đang chạy tại http://${HOST}:${PORT}`);
        console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API: http://${HOST}:${PORT}/api`);
      });
    }
  } catch (error) {
    console.error('❌ Không thể khởi động máy chủ:', error);
    process.exit(1);
  }
};

// Khởi tạo kết nối cơ sở dữ liệu và khởi động server
const init = async () => {
  try {
    await db.init();
    console.log('✅ Đã kết nối cơ sở dữ liệu');
    
    if (process.env.NODE_ENV !== 'test') {
      await startServer();
    }
  } catch (error) {
    console.error('❌ Không thể khởi tạo ứng dụng:', error);
    process.exit(1);
  }
};

// Middleware CORS headers
const corsHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
};

// Middleware xử lý lỗi toàn cục
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Lỗi server:', err);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ nội bộ',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
};

// Middleware xử lý 404
const notFoundHandler = (req: Request, res: Response) => {
  console.error(`❌ 404 - Không tìm thấy: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy tài nguyên',
    error: {
      code: 404,
      description: `Không tìm thấy ${req.originalUrl} trên máy chủ này`,
      method: req.method,
      path: req.path,
      query: req.query
    }
  });
};

// Xử lý favicon.ico - đặt đầu tiên để tránh bị các route khác bắt nhầm
app.get('/favicon.ico', (req, res) => {
  console.log('Favicon.ico requested, returning 204');
  res.status(204).end();
  return; // Đảm bảo không có middleware nào khác xử lý tiếp
});

// Đặt các route API docs trước middleware static files
// Serve Swagger UI HTML
// Route cho Swagger UI
app.get('/api-docs', (req, res) => {
  console.log('Serving Swagger UI HTML');
  
  // Thiết lập CSP headers cho Swagger UI
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com`,
    `style-src 'self' 'unsafe-inline' https://unpkg.com`,
    `img-src 'self' data: https: http:`,
    `font-src 'self' https://unpkg.com data:`,
    `connect-src 'self' http://localhost:3002`,  // Cho phép kết nối đến API server
    `frame-ancestors 'self'`,
    `form-action 'self'`,
    `frame-src 'self' https://unpkg.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Security-Policy', csp);
  res.setHeader('X-WebKit-CSP', csp);
  
  // Tạo HTML đơn giản không dùng template string
  const html = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <title>Posts Service API Documentation</title>',
    '  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />',
    '  <style>',
    '    body { margin: 0; padding: 20px; }',
    '    #swagger-ui { margin: 20px 0; }',
    '    .swagger-ui .topbar { display: none !important; }',
    '    .loading {',
    '      font-family: Arial, sans-serif;',
    '      padding: 20px;',
    '      background: #f5f5f5;',
    '      border-radius: 4px;',
    '      margin: 20px 0;',
    '    }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>Posts Service API Documentation</h1>',
    '  <div id="loading" class="loading">Loading API documentation...</div>',
    '  <div id="swagger-ui"></div>',
    '  ',
    '  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>',
    '  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>',
    '  <script>',
    '    console.log(\'Initializing Swagger UI...\');',
    '    ', 
    '    // Show error message',
    '    function showError(message) {',
    '      const container = document.getElementById(\'swagger-ui\');',
    '      if (!container) return;',
    '      ', 
    '      const errorDiv = document.createElement(\'div\');',
    '      errorDiv.style.color = \'#721c24\';',
    '      errorDiv.style.backgroundColor = \'#f8d7da\';',
    '      errorDiv.style.border = \'1px solid #f5c6cb\';',
    '      errorDiv.style.borderRadius = \'4px\';',
    '      errorDiv.style.padding = \'15px\';',
    '      errorDiv.style.margin = \'20px 0\';',
    '      ', 
    '      const h3 = document.createElement(\'h3\');',
    '      h3.style.marginTop = \'0\';',
    '      h3.style.color = \'inherit\';',
    '      h3.textContent = \'Error loading API documentation\';',
    '      ', 
    '      const p1 = document.createElement(\'p\');',
    '      p1.textContent = message;',
    '      ', 
    '      const p2 = document.createElement(\'p\');',
    '      p2.textContent = \'Please check the browser console for more details.\';',
    '      ', 
    '      errorDiv.appendChild(h3);',
    '      errorDiv.appendChild(p1);',
    '      errorDiv.appendChild(p2);',
    '      ', 
    '      container.appendChild(errorDiv);',
    '    }',
    '    ', 
    '    // Check if SwaggerUIBundle is available',
    '    console.log(\'Checking SwaggerUIBundle availability...\');',
    '    if (typeof SwaggerUIBundle === \'undefined\') {',
    '      const errorMsg = \'Failed to load Swagger UI library. Please check your internet connection.\';',
    '      console.error(errorMsg);',
    '      showError(errorMsg);',
    '      const loadingEl = document.getElementById(\'loading\');',
    '      if (loadingEl) loadingEl.textContent = \'Error: Could not load Swagger UI\';',
    '    } else {',
    '      try {',
    '        console.log(\'SwaggerUIBundle is available, initializing...\');',
    '        ', 
    '        // Show loading state',
    '        const loadingEl = document.getElementById(\'loading\');',
    '        if (loadingEl) {',
    '          loadingEl.textContent = \'Đang tải tài liệu API...\';',
    '        }',
    '        ', 
    '        // Log before initializing',
    '        console.log(\'Fetching API docs from:\', \'http://localhost:3002/api-docs-json\');',
    '        ', 
    '        // Initialize Swagger UI',
    '        window.ui = SwaggerUIBundle({',
    '          url: \'http://localhost:3002/api-docs-json\',',
    '          dom_id: \'#swagger-ui\',',
    '          deepLinking: true,',
    '          presets: [',
    '            SwaggerUIBundle.presets.apis,',
    '            SwaggerUIStandalonePreset',
    '          ],',
    '          requestInterceptor: function(request) {',
    '            // Đảm bảo tất cả các request API đều đi qua cổng 3002',
    '            if (request.url && request.url.startsWith(\'/api/\')) {',
    '              request.url = \'http://localhost:3002\' + request.url;',
    '            }',
    '            return request;',
    '          },',
    '          layout: "StandaloneLayout",',
    '          onComplete: function() {',
    '            console.log(\'✅ Swagger UI loaded successfully\');',
    '            if (loadingEl) loadingEl.style.display = \'none\';',
    '          },',
    '          onFailure: function(error) {',
    '            const errorMsg = \'Failed to load API documentation: \' + (error && error.message ? error.message : \'Unknown error\');',
    '            console.error(\'❌ Swagger UI error:\', error);',
    '            showError(errorMsg);',
    '            if (loadingEl) loadingEl.textContent = \'Lỗi: Không thể tải tài liệu API\';',
    '          }',
    '        });',
    '        ', 
    '        // Add fetch error handler',
    '        fetch(\'http://localhost:3002/api-docs-json\')',
    '          .then(response => {',
    '            if (!response.ok) {',
    '              throw new Error(`HTTP error! status: ${response.status}`);',
    '            }',
    '            return response.json();',
    '          })',
    '          .then(json => console.log(\'✅ API docs JSON loaded successfully\', json))',
    '          .catch(error => {',
    '            console.error(\'❌ Failed to fetch API docs JSON:\', error);',
    '            showError(`Không thể tải tài liệu API: ${error.message}`);',
    '            if (loadingEl) loadingEl.textContent = \'Lỗi: Không thể tải tài liệu API\';',
    '          });',
    '        ', 
    '        // Handle resource loading errors',
    '        window.addEventListener(\'error\', function(e) {',
    '          console.error(\'❌ Error loading resource:\', e);',
    '          if (loadingEl) loadingEl.textContent += \'\\nLỗi tải tài nguyên: \' + (e.message || \'Unknown error\');',
    '        }, true);',
    '        ', 
    '      } catch (error) {',
    '        console.error(\'Error initializing Swagger UI:\', error);',
    '        showError(\'Error initializing API documentation: \' + (error && error.message ? error.message : \'Unknown error\'));',
    '      }',
    '    }',
    '  </script>',
    '</body>',
    '</html>'
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Serve Swagger JSON
app.get('/api-docs-json', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// Phục vụ file tĩnh từ thư mục public (đặt sau các route API docs)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Áp dụng các middleware chung
app.use(corsHeaders);
app.use(requestLogger);

// Giới hạn tỷ lệ request
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP 100 request mỗi cửa sổ thời gian
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
});
app.use(limiter);

// Đăng ký routes chính với base path /api
app.use('/api', postsRoutes);

// Đăng ký routes không có tiền tố (cho tương thích ngược)
app.use((req, res, next) => {
  // Nếu request đến /api/*, chuyển hướng đến /api handler
  if (req.path.startsWith('/api/')) {
    return next('router');
  }
  next();
}, postsRoutes);

// Endpoint kiểm tra trạng thái
app.get(['/api/health', '/health'], (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'posts-service',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route kiểm thử
app.get(['/api/test', '/test'], (req: Request, res: Response) => {
  res.json({ 
    success: true,
    message: 'Kết nối API thành công!',
    timestamp: new Date().toISOString(),
    service: 'posts-service'
  });
});

// Xử lý 404 - Phải đặt sau tất cả các route khác
app.use((req, res, next) => {
  console.log(`❌ 404 - Không tìm thấy: ${req.method} ${req.originalUrl}`);
  console.log('Path:', req.path);
  console.log('Base URL:', req.baseUrl);
  console.log('Original URL:', req.originalUrl);
  next();
}, notFoundHandler);

// Xử lý lỗi toàn cục - Phải có đủ 4 tham số (err, req, res, next)
app.use(errorHandler);

// Khởi động ứng dụng
init();

// Start server
startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
