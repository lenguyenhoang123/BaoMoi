import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3000;
// Cấu hình CORS
const allowedOrigins = [
    'http://localhost:3000', // API Gateway
    'http://localhost:3001', // Frontend
    'http://localhost:3004', // Frontend phụ
    'http://192.168.100.50:3004' // IP local
];

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép tất cả trong môi trường phát triển
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, origin);
        }
        // Cho phép các request không có origin (như mobile app, curl, v.v.)
        if (!origin) return callback(null, true);
        
        // Kiểm tra origin có trong danh sách cho phép không
        if (allowedOrigins.includes(origin)) {
            return callback(null, origin);
        }
        
        console.warn(`[CORS] Origin not allowed: ${origin}`);
        return callback(new Error('Truy cập bị từ chối bởi CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Refresh-Token',
        'X-Request-ID',
        'Connection',
        'Host',
        'Referer',
        'User-Agent',
        'Cache-Control',
        'cache-control',
        'pragma',
        'expires',
        'withCredentials'
    ],
    exposedHeaders: [
        'Content-Range',
        'X-Content-Range',
        'X-Total-Count',
        'X-Total-Pages',
        'X-Refresh-Token',
        'Set-Cookie',
        'Content-Length',
        'ETag',
        'Content-Type',
        'Cache-Control',
        'cache-control'
    ],
    optionsSuccessStatus: 200,
    preflightContinue: false
};
// Thêm middleware để log request đơn giản
app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
// Áp dụng CORS cho tất cả các route
app.use(cors(corsOptions));
// Xử lý preflight requests
app.options('*', cors(corsOptions));
// Body parser middleware with enhanced configuration
app.use(express.json({
    limit: '50mb',
    verify: function verify(req, res, buf) {
        req.rawBody = buf;
        try {
            req.rawBodyString = buf.toString();
            JSON.parse(req.rawBodyString);
        }
        catch (e) {
            console.error('Failed to parse JSON body:', e);
        }
    }
}));
app.use(express.urlencoded({
    extended: true,
    limit: '50mb',
    parameterLimit: 1000000
}));
// Middleware để log request
app.use((req, res, next) => {
    console.log(`[API-Gateway] Incoming: ${req.method} ${req.path}`);
    next();
});
// Auth Service Proxy
const authProxy = createProxyMiddleware({
    target: 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '/auth',
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req) => {
        try {
            // Xử lý trường hợp đăng nhập: chuyển username thành email
            if (req.path.includes('/auth/register') || req.path.includes('/auth/login')) {
                if (req.method === 'POST' && req.body) {
                    // Create a new body with only the required fields
                    const body = { ...req.body };
                    // For login, convert username to email if needed
                    if (req.path.includes('/auth/login') && body.username && !body.email) {
                        body.email = body.username;
                        delete body.username;
                    }
                    // For register, ensure only allowed fields are sent
                    if (req.path.includes('/auth/register')) {
                        const { email, password, full_name, otp } = body;
                        const cleanBody = { email, password, full_name };
                        if (otp)
                            cleanBody.otp = otp;
                        const bodyData = JSON.stringify(cleanBody);
                        proxyReq.setHeader('Content-Type', 'application/json');
                        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                        proxyReq.write(bodyData);
                        return;
                    }
                    const bodyData = JSON.stringify(body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }
            }
        }
        catch (error) {
            console.error('Error processing request body:', error);
        }
    },
    onError: (err, req, res) => {
        console.error('Auth Service Proxy error:', err);
        res.status(500).json({
            error: 'Auth Service Error',
            details: 'Cannot connect to Auth Service at http://localhost:3005',
            message: err.message
        });
    },
    onProxyRes: (proxyRes) => {
        // Ensure CORS headers are set
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3004';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    }
});
// Sử dụng proxy auth
app.use('/api/auth', authProxy);
// Posts Service Proxy
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3002',
    pathRewrite: { '^/api': '' },
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
        console.error('Posts Service Proxy error:', err);
        res.status(500).json({
            error: 'Posts Service Error',
            details: 'Cannot connect to Posts Service at http://localhost:3002',
            originalError: err.message
        });
    }
}));
// Categories Service Proxy
app.use('/api/categories', createProxyMiddleware({
    target: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    pathRewrite: { '^/api/categories': '/api/categories' }
}));
// Comments Service Proxy
app.use('/api/comments', createProxyMiddleware({
    target: process.env.COMMENTS_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    pathRewrite: { '^/api/comments': '/api/comments' }
}));
// Tags Service Proxy
app.use('/api/tags', createProxyMiddleware({
    target: process.env.TAGS_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    pathRewrite: { '^/api/tags': '/api/tags' }
}));
// Test endpoint
app.post('/api/test', (req, res) => {
    console.log('Test endpoint called with body:', req.body);
    res.json({
        success: true,
        message: 'API Gateway is working!',
        body: req.body,
        timestamp: new Date().toISOString()
    });
});
// Health check endpoint
app.get('/api/health', (req, res) => {
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
    - /api/tags     -> http://localhost:3007
  `);
});
// Xử lý lỗi
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
