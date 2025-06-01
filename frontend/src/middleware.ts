import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Danh sách các origin được phép
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3004',
  'http://localhost:3001',
  'http://192.168.100.50:3004'
];

// Middleware xử lý CORS
export function middleware(request: NextRequest) {
  // Lấy origin từ request
  const origin = request.headers.get('origin');
  
  // Kiểm tra origin có trong danh sách cho phép không
  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : '*';
  
  // Tạo response
  const response = NextResponse.next();

  // Thêm CORS headers
  response.headers.set('Access-Control-Allow-Origin', responseOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, Pragma, Cache-Control, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Expose-Headers', 'Content-Length,Content-Range');

  // Xử lý preflight request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin, Pragma, Cache-Control',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
    return response;
  }

  return response;
}

// Áp dụng middleware cho tất cả các route API
export const config = {
  matcher: '/api/:path*',
};
