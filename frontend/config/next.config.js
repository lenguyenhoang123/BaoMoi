/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Enable production source maps in production
  productionBrowserSourceMaps: process.env.NODE_ENV === 'production',
  
  // Image optimization configuration
  images: {
    // Configure domains for optimized images
    domains: [
      'via.placeholder.com',
      'cdn2.tuoitre.vn',
      'images.unsplash.com',
      'example.com',
    ],
    // Remote patterns for image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Enable WebP format for modern browsers
    formats: ['image/webp'],
    // Set minimum cache TTL (in seconds)
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
  },
  
  // Compiler configuration
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error'],
    } : false,
    // Enable styled-components support
    styledComponents: true,
    // Enable emotion support
    emotion: {
      sourceMap: process.env.NODE_ENV !== 'production',
    },
  },
  
  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004',
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
  
  // CORS headers configuration
  async headers() {
    const headers = [];
    
    // Only add CORS headers in development or if explicitly enabled in production
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CORS === 'true') {
      headers.push({
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.NEXT_PUBLIC_SITE_URL || 'https://your-production-domain.com' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, Accept, X-CSRF-Token, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      });
    }
    
    // Security headers for all responses
    headers.push({
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    });
    
    return headers;
  },
  
  // API route rewrites and redirects
  async rewrites() {
    return [
      // API proxy
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/api/:path*`,
      },
      // Add more rewrites as needed
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      // Add permanent redirects here
      // Example:
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Add custom webpack configurations here
    if (!isServer) {
      // Fixes npm packages that depend on `fs` module
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        constants: false,
      };
    }
    
    // Add support for importing SVG as React components
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false,
                },
                {
                  name: 'cleanupIDs',
                  active: false,
                },
              ],
            },
          },
        },
      ],
    });
    
    // Add support for loading images
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif)$/i,
      type: 'asset/resource',
    });
    
    // Add support for loading fonts
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });
    
    // Enable source maps in development
    if (dev) {
      config.devtool = 'source-map';
    }
    
    return config;
  },
  
  // Enable React DevTools in development
  reactDevOverlay: process.env.NODE_ENV !== 'production',
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Configure static page generation timeout (in seconds)
  staticPageGenerationTimeout: 300,
};

module.exports = nextConfig;
