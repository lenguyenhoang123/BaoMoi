import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Middleware để log tất cả request
app.use((req, res, next) => {
  console.log('\n=== NEW REQUEST ===');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Lưu body để log sau khi parse
  const _end = res.end;
  const chunks: Buffer[] = [];
  
  (res as any).end = function (chunk?: any, encoding: BufferEncoding = 'utf8', cb?: () => void) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    const body = Buffer.concat(chunks).toString('utf8');
    console.log('Response:', body);
    _end.call(res, chunk, encoding, cb);
  };
  
  next();
});

// Middleware để parse JSON body
app.use(express.json());

// Cấu hình proxy cho Posts Service
const postsProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req: any, res) => {
    console.log('\n=== PROXY REQUEST ===');
    console.log(`Proxying: ${req.method} ${req.originalUrl}`);
    console.log('Body:', req.body);
    
    // Đảm bảo gửi body nếu có
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req: any, res) => {
    console.log('\n=== PROXY RESPONSE ===');
    console.log(`Status: ${proxyRes.statusCode} ${req.method} ${req.url}`);
  },
  onError: (err, req: any, res: any) => {
    console.error('\n=== PROXY ERROR ===');
    console.error('Error:', err);
    if (!res.headersSent) {
      res.status(502).json({
        success: false,
        message: 'Cannot connect to service',
        error: err.message
      });
    }
  }
});

app.use('/api/posts', postsProxy);

// Khởi động server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\nTest proxy server running on port ${PORT}`);
  console.log(`Proxying /api/posts/* -> http://localhost:3002/posts/*`);
  console.log('\nSend a test request to: http://localhost:3000/api/posts');
});
