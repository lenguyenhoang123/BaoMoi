import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';
import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import type { SwaggerUiOptions } from 'swagger-ui-express';
import { OpenAPIV3 } from 'openapi-types';
import 'dotenv/config';

// Type definitions for proxy middleware
type ProxyEventHandlers = {
  onProxyReq?: (proxyReq: any, req: Request, res: Response) => void;
  onError?: (err: Error, req: Request, res: Response) => void;
};

// Load environment variables
import { config } from 'dotenv';
config({ path: path.join(process.cwd(), '.env') });

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3000;

// Định nghĩa kiểu cho tên service
type ServiceName = 'auth' | 'posts' | 'categories';

// Định nghĩa cấu hình các service
const SERVICES: Record<Uppercase<ServiceName>, ServiceName> = {
  AUTH: 'auth',
  POSTS: 'posts',
  CATEGORIES: 'categories'
};

// Đối tượng ánh xạ tên service sang URL
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  posts: process.env.POSTS_SERVICE_URL || 'http://localhost:3002',
  categories: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3003'
};

// Cấu hình proxy cho các service
const proxyConfigs = [
  {
    context: '/api/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    pathRewrite: { '^/api': '' },
    service: SERVICES.AUTH
  },
  {
    context: '/api/posts',
    target: process.env.POSTS_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: { '^/api': '' },
    service: SERVICES.POSTS
  },
  {
    context: '/api/categories',
    target: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3003',
    pathRewrite: { '^/api': '' },
    service: SERVICES.CATEGORIES
  }
];

// Áp dụng proxy middleware
proxyConfigs.forEach(serviceConfig => {
  const proxyOptions: any = {
    target: serviceConfig.target,
    changeOrigin: true,
    pathRewrite: serviceConfig.pathRewrite,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    onProxyReq: (proxyReq: any, req: any) => {
      console.log(`[${req.method}] ${req.url} -> ${serviceConfig.target}${req.url}`);
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onError: (err: Error, _req: any, res: any) => {
      console.error('Proxy error:', err);
      if (res && !res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Service unavailable',
          ...(process.env.NODE_ENV === 'development' && { error: err.message })
        });
      }
    }
  };

  if (process.env.NODE_ENV === 'development') {
    proxyOptions.secure = false; // Cho phép self-signed certificates trong môi trường development
  }

  const proxy = createProxyMiddleware(proxyOptions);
  // Sử dụng type assertion để tránh lỗi type
  app.use(serviceConfig.context, proxy as unknown as RequestHandler);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Tải các file OpenAPI từ các service
const loadOpenAPISpec = async (serviceName: 'auth' | 'posts' | 'categories'): Promise<OpenAPIV3.Document | null> => {
  const serviceUrl = SERVICE_URLS[serviceName];
  const specUrl = `${serviceUrl}/api-docs-json`;
  
  console.log(`🔄 Đang tải OpenAPI spec từ ${serviceName} (${specUrl})...`);
  
  try {
    const response = await fetch(specUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Lỗi khi tải OpenAPI spec từ ${serviceName} (${response.status} ${response.statusText}):`, errorText);
      return null;
    }
    
    const spec = await response.json() as OpenAPIV3.Document;
    console.log(`✅ Đã tải thành công OpenAPI spec từ ${serviceName}`);
    console.log(`   - Title: ${spec.info?.title || 'Không có tiêu đề'}`);
    console.log(`   - Version: ${spec.info?.version || 'Không có phiên bản'}`);
    console.log(`   - Paths: ${Object.keys(spec.paths || {}).length} endpoints`);
    
    return spec;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error(`❌ Lỗi khi tải OpenAPI spec từ ${serviceName}:`, errorMessage);
    console.error('Chi tiết lỗi:', error);
    return null;
  }
};

// Tạo Swagger UI tổng hợp
app.get('/api-docs-json', async (req: Request, res: Response) => {
  try {
    const [authSpec, postsSpec, categoriesSpec] = await Promise.all([
      loadOpenAPISpec(SERVICES.AUTH),
      loadOpenAPISpec(SERVICES.POSTS),
      loadOpenAPISpec(SERVICES.CATEGORIES)
    ]);

    const combinedSpec = {
      openapi: '3.0.0',
      info: {
        title: 'BaoMoi API Gateway',
        version: '1.0.0',
        description: 'Tổng hợp tất cả các API của hệ thống BaoMoi'
      },
      servers: [
        { url: '/api', description: 'API Gateway' }
      ],
      paths: {
        ...(authSpec?.paths && Object.fromEntries(
          Object.entries(authSpec.paths)
            .map(([path, methods]) => [`/auth${path}`, methods])
        )),
        ...(postsSpec?.paths && Object.fromEntries(
          Object.entries(postsSpec.paths)
            .map(([path, methods]) => [`/posts${path}`, methods])
        )),
        ...(categoriesSpec?.paths && Object.fromEntries(
          Object.entries(categoriesSpec.paths)
            .map(([path, methods]) => [`/categories${path}`, methods])
        ))
      },
      components: {
        schemas: {
          ...authSpec?.components?.schemas,
          ...postsSpec?.components?.schemas,
          ...categoriesSpec?.components?.schemas
        },
        securitySchemes: {
          ...authSpec?.components?.securitySchemes,
          ...postsSpec?.components?.securitySchemes,
          ...categoriesSpec?.components?.securitySchemes
        }
      }
    };

    res.json(combinedSpec);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error generating combined OpenAPI spec:', errorMessage);
    res.status(500).json({
      error: 'Failed to generate API documentation',
      details: errorMessage
    });
  }
});

// Cấu hình tài liệu OpenAPI
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BaoMoi API Gateway',
    version: '1.0.0',
    description: 'Tổng hợp tất cả các API của hệ thống BaoMoi'
  },
  servers: [
    { url: '/api', description: 'API Gateway' }
  ],
  paths: {},
  components: {}
};

// Route cho tài liệu API dạng JSON
app.get('/api-docs-json', (req, res) => {
  res.json(swaggerDocument);
});

// Configure Swagger UI
const swaggerOptions: SwaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    url: '/api-docs-json',
    docExpansion: 'list' as const,
    persistAuthorization: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    filter: true
  }
};

// Create a type assertion for the Swagger UI handler
type SwaggerUIHandler = (req: Request, res: Response, next: NextFunction) => void;

// Create a simple wrapper for swagger-ui-express
const setupSwaggerUI = (options: SwaggerUiOptions): RequestHandler => {
  const handler = swaggerUi.setup(undefined, options) as unknown as SwaggerUIHandler;
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req, res, next);
  };
};

// Serve Swagger UI with the wrapper
app.use('/api-docs', 
  swaggerUi.serve as unknown as RequestHandler,
  setupSwaggerUI(swaggerOptions)
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Route chính
app.get('/', (req: Request, res: Response) => {
  const services = [
    { name: 'Auth', path: 'auth', url: SERVICE_URLS.auth },
    { name: 'Posts', path: 'posts', url: SERVICE_URLS.posts },
    { name: 'Categories', path: 'categories', url: SERVICE_URLS.categories }
  ];

  const servicesList = services.map(service => `
      <div class="service">
        <h3>${service.name} Service</h3>
        <p>URL: <a href="${service.url}" target="_blank">${service.url}</a></p>
        <p>API Docs: <a href="/api/${service.path}/api-docs">Swagger UI</a></p>
        <p>Health Check: <a href="/api/${service.path}/health">Health Status</a></p>
      </div>`).join('');

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>BaoMoi API Gateway</title>
        <style>
          :root {
            --primary: #3498db;
            --secondary: #2c3e50;
            --background: #f5f7fa;
            --card-bg: #ffffff;
            --text: #333333;
            --text-light: #666666;
          }
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0; 
            color: var(--text);
            background-color: var(--background);
          }
          .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
          }
          header { 
            background: var(--secondary); 
            color: white; 
            padding: 1rem 0; 
            margin-bottom: 2rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          header .container { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
          }
          h1 { 
            color: white;
            font-weight: 300;
          }
          .card { 
            background: var(--card-bg); 
            padding: 1.5rem; 
            margin-bottom: 1.5rem; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-left: 4px solid var(--primary);
          }
          .card h2 { 
            color: var(--secondary); 
            margin-bottom: 1rem;
            font-weight: 500;
          }
          a { 
            color: var(--primary); 
            text-decoration: none; 
            transition: color 0.2s;
          }
          a:hover { 
            color: #1a73e8; 
            text-decoration: underline; 
          }
          .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
          }
          .service {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-top: 3px solid var(--primary);
          }
          .service h3 {
            color: var(--secondary);
            margin-bottom: 1rem;
          }
          .service p {
            margin: 0.5rem 0;
            color: var(--text-light);
          }
          .status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
          }
          .status-up { background-color: #2ecc71; }
          .status-down { background-color: #e74c3c; }
          .footer {
            text-align: center;
            margin-top: 3rem;
            padding: 1.5rem;
            color: var(--text-light);
            font-size: 0.9rem;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <header>
          <div class="container">
            <h1>BaoMoi API Gateway</h1>
            <div class="status status-up"></div>
          </div>
        </header>

        <div class="container">
          <div class="card">
            <h2>API Gateway Status</h2>
            <p>Environment: <strong>${process.env.NODE_ENV || 'development'}</strong></p>
            <p>Uptime: <strong>${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s</strong></p>
            <p>Version: <strong>${process.env.npm_package_version || '1.0.0'}</strong></p>
            <p>Node.js: <strong>${process.version}</strong></p>
            <p>Platform: <strong>${process.platform} (${process.arch})</strong></p>
          </div>
          
          <div class="card">
            <h2>API Documentation</h2>
            <p><a href="/api-docs" target="_blank">OpenAPI/Swagger UI</a> - Interactive API documentation</p>
            <p><a href="/api-docs-json" target="_blank">OpenAPI JSON</a> - Raw OpenAPI specification</p>
          </div>
          
          <h2>Available Services</h2>
          <div class="services-grid">
            ${servicesList}
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} BaoMoi API Gateway. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Error handling middleware
const errorHandler: express.ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

app.use(errorHandler);

// Start the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`\n🚀 ==================================================`);
  console.log(`   API Gateway đang chạy tại http://localhost:${port}`);
  console.log(`   📚 Tài liệu API: http://localhost:${port}/api-docs`);
  console.log(`   🔍 Kiểm tra trạng thái: http://localhost:${port}/health`);
  console.log(`   🌐 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   🕒 Khởi động lúc: ${new Date().toLocaleString()}`);
  console.log(`==================================================\n`);
});

// Xử lý các lỗi không mong muốn
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION ❌');
  console.error('Lý do:', reason);
  console.error('Tại promise:', promise);
  // Thoát ứng dụng với mã lỗi
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION ❌');
  console.error(error);
  // Thoát ứng dụng với mã lỗi
  process.exit(1);
});

// Xử lý tín hiệu dừng ứng dụng
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Nhận được tín hiệu ${signal}. Đang dừng ứng dụng...`);
  server.close(() => {
    console.log('\n👋 Ứng dụng đã dừng an toàn');
    console.log(`   Thời gian dừng: ${new Date().toLocaleString()}\n`);
    process.exit(0);
  });

  // Nếu server không đóng sau 10s, buộc thoát
  setTimeout(() => {
    console.error('⚠️  Buộc dừng ứng dụng do timeout');
    process.exit(1);
  }, 10000);
};

// Lắng nghe các tín hiệu dừng
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
