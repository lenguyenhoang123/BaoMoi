/** @type {import('next').NextConfig} */
const path = require('path');

// Cấu hình domains cho phép tải ảnh
const allowedImageDomains = [
  'placehold.co',
  'localhost',
  '127.0.0.1'
];

// Lưu lại console gốc
const originalConsole = { ...console };

// Tạo một bản sao tùy chỉnh của console
const customConsole = {
  ...console,
  log: (...args) => {
    if (args[0] && args[0].includes('started server')) {
      originalConsole.log('\x1b[36mFRONTEND   ▲ Next.js 14.2.29\x1b[0m');
      originalConsole.log('\x1b[36mFRONTEND   - Local: http://localhost:3004\x1b[0m');
    } else if (process.env.NODE_ENV !== 'production') {
      originalConsole.log(...args);
    }
  },
  error: (...args) => {
    originalConsole.error('\x1b[31m[ERROR]\x1b[0m', ...args);
  },
  warn: (...args) => {
    originalConsole.warn('\x1b[33m[WARN]\x1b[0m', ...args);
  }
};

// Gán lại console tùy chỉnh
global.console = customConsole;

// Cấu hình môi trường
if (process.env.NODE_ENV === 'production') {
  process.env.NEXT_DISABLE_SERVER_LOGS = '1';
  process.env.NODE_OPTIONS = '--no-warnings';
  process.env.DEBUG = '';
  process.env.NEXT_DEBUG = '';
}

const nextConfig = {
  // Enable CSS source maps in development
  productionBrowserSourceMaps: false,
  // Enable CSS support
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  // Configure webpack
  webpack: (config, { isServer }) => {
    // Thêm cấu hình webpack tại đây nếu cần
    return config;
  },
  // Tắt tất cả các log của Next.js
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    logging: {
      level: 'error', // Chỉ hiển thị lỗi
      fullUrl: false
    },
  },
  // Tắt source maps trong production để giảm log
  productionBrowserSourceMaps: false,
  // Tắt tất cả các log của Next.js
  logging: {
    fetches: {
      fullUrl: false
    },
    level: 'error', // Chỉ hiển thị lỗi
  },
  compress: true,
  reactStrictMode: true,
  compiler: {
    // Enable Emotion support
    emotion: true,
  },
  reactStrictMode: true,
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production',
  output: 'standalone', // Thêm cấu hình output: 'standalone' để cải thiện hiệu suất

  // Configure images
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'cdn.tuoitre.vn',
      'cdn2.tuoitre.vn',
      'images.unsplash.com',
      'example.com',
      'via.placeholder.com',
      'picsum.photos',
      'source.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add aliases for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@public': path.resolve(__dirname, 'public'),
    };

    // Fix for chunk loading error
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };

    // Handle fs module
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
      };
    }


    return config;
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Tất cả các yêu cầu API sẽ đi qua API Gateway
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },

  // Cấu hình images
  images: {
    domains: allowedImageDomains,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 1 phút
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // Environment variables
  env: {
    // API Gateway URL - this will be used as the base URL for all API requests
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  },
  
  // Experimental features
  experimental: {
    // Enable CSS optimizations
    optimizeCss: true
  },
};

module.exports = nextConfig;
