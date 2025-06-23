import express from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

type RequestWithBody = express.Request & {
  body?: any;
};

export function setupSimpleProxy(app: express.Application) {
  // Cấu hình proxy cho Posts Service
  const postsProxy = createProxyMiddleware({
    target: process.env.POSTS_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    logLevel: 'debug',
    secure: false,
    xfwd: true,
    pathRewrite: (path: string, req: RequestWithBody) => {
      console.log(`[${new Date().toISOString()}] [POSTS] Rewriting path from: ${path}`);
      // Xóa /api cho các route
      const newPath = path.replace(/^\/api\/posts/, '/');
      console.log(`[${new Date().toISOString()}] [POSTS] Rewritten path to: ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req: RequestWithBody, res) => {
      console.log('\n=== SIMPLE PROXY REQUEST (POSTS) ===');
      console.log(`Proxying to Posts Service: ${req.method} ${req.originalUrl}`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));

      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData, 'utf8'));
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Accept-Charset', 'utf-8');
        proxyReq.write(bodyData, 'utf8');
        console.log('Request body:', bodyData);
      }
    },
    onProxyRes: (proxyRes, req: RequestWithBody, res) => {
      console.log('\n=== SIMPLE PROXY RESPONSE (POSTS) ===');
      console.log(`Status: ${proxyRes.statusCode} ${req.method} ${req.url}`);
      proxyRes.headers['content-type'] = 'application/json; charset=utf-8';
    },
    onError: (err: Error, req: RequestWithBody, res: any) => {
      console.error('\n=== SIMPLE PROXY ERROR (POSTS) ===');
      console.error('Error:', err);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: 'Cannot connect to Posts Service',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable'
        });
      }
    }
  });

  // Cấu hình proxy cho Categories Service
  const categoriesProxy = createProxyMiddleware({
    target: process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    logLevel: 'debug',
    secure: false,
    xfwd: true,
    pathRewrite: (path: string, req: RequestWithBody) => {
      console.log(`[${new Date().toISOString()}] Rewriting path from: ${path}`);

      // Xử lý đặc biệt cho /api/categories
      if (path.startsWith('/api/categories')) {
        const newPath = path.replace(/^\/api(\/categories.*)/, '$1');
        console.log(`[${new Date().toISOString()}] Rewritten categories path to: ${newPath}`);
        return newPath;
      }

      // Xóa /api cho các route khác
      const newPath = path.replace(/^\/api/, '');
      console.log(`[${new Date().toISOString()}] Rewritten path to: ${newPath}`);
      return newPath || '/';
    },
    onProxyReq: (proxyReq, req: RequestWithBody, res) => {
      const requestId = Math.random().toString(36).substring(2, 10);
      console.log(`\n=== [${new Date().toISOString()}] PROXY REQUEST (CATEGORIES) [${requestId}] ===`);
      console.log(`Original URL: ${req.originalUrl}`);
      console.log(`Method: ${req.method}`);
      console.log(`Proxying to: ${proxyReq.path}`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));

      // Thêm các header cần thiết
      proxyReq.setHeader('X-Request-Id', requestId);
      proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
      proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '');
      proxyReq.setHeader('X-Forwarded-For', req.ip || req.connection.remoteAddress || '');
      proxyReq.setHeader('X-Request-Start', Date.now().toString());

      // Xử lý body cho các request POST/PUT/PATCH
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData, 'utf8'));
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Accept-Charset', 'utf-8');
        proxyReq.write(bodyData, 'utf8');
        console.log(`Request body: ${bodyData}`);
      }

      console.log('Proxy request headers:', JSON.stringify(proxyReq.getHeaders(), null, 2));
    },
    onProxyRes: (proxyRes, req: RequestWithBody, res) => {
      // Safely get request ID and start time from either proxyRes or req
      const requestId = req.headers['x-request-id'] || '';
      const requestStartHeader = req.headers['x-request-start'] || '0';
      const requestStart = parseInt(Array.isArray(requestStartHeader) ? requestStartHeader[0] : requestStartHeader, 10);
      const duration = !isNaN(requestStart) && requestStart > 0 ? Date.now() - requestStart : 0;

      console.log(`\n=== [${new Date().toISOString()}] PROXY RESPONSE (CATEGORIES) [${requestId}] ===`);
      console.log(`Status: ${proxyRes.statusCode} ${proxyRes.statusMessage || ''}`);
      console.log(`Duration: ${duration}ms`);
      console.log('Response headers:', JSON.stringify(proxyRes.headers, null, 2));

      // Add response time header
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Request-ID', requestId || '');
      }

      // Set CORS headers
      proxyRes.headers['content-type'] = 'application/json; charset=utf-8';
      proxyRes.headers['access-control-allow-origin'] = req.headers.origin || '*';
      proxyRes.headers['access-control-allow-credentials'] = 'true';
    },
    onError: (err, req, res) => {
      console.error('\n=== SIMPLE PROXY ERROR (CATEGORIES) ===');
      console.error('Error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Cannot connect to Categories Service',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable',
          timestamp: new Date().toISOString()
        });
      }
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true'
    },
    logProvider: () => ({
      log: console.log,
      debug: console.log,
      error: console.error,
      info: console.log,
      warn: console.warn
    })
  });

  // Cấu hình proxy cho Auth Service
  const authProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    logLevel: 'debug',
    secure: false,
    xfwd: true,
    pathRewrite: { '^/api': '' },
    onProxyReq: (proxyReq, req: RequestWithBody, res) => {
      console.log('\n=== SIMPLE PROXY REQUEST (AUTH) ===');
      console.log(`Proxying to Auth Service: ${req.method} ${req.originalUrl}`);
      console.log('Headers:', JSON.stringify(req.headers, null, 2));

      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData, 'utf8'));
        proxyReq.setHeader('Accept', 'application/json');
        proxyReq.setHeader('Accept-Charset', 'utf-8');
        proxyReq.write(bodyData, 'utf8');
        console.log('Request body:', bodyData);
      }
    },
    onProxyRes: (proxyRes, req: RequestWithBody, res) => {
      console.log('\n=== SIMPLE PROXY RESPONSE (AUTH) ===');
      console.log(`Status: ${proxyRes.statusCode} ${req.method} ${req.url}`);
      proxyRes.headers['content-type'] = 'application/json; charset=utf-8';
    },
    onError: (err: Error, req: RequestWithBody, res: any) => {
      console.error('\n=== SIMPLE PROXY ERROR (AUTH) ===');
      console.error('Error:', err);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: 'Cannot connect to Auth Service',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable'
        });
      }
    }
  });

  // Đăng ký các proxy
  app.use('/api/posts', postsProxy);
  app.use('/api/auth', authProxy);
  app.use('/api/categories', categoriesProxy);
}
