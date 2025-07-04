import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc file package.json
const packageJson = JSON.parse(
  readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: packageJson.version || '1.0.0',
      description: 'Tài liệu API cho dịch vụ xác thực người dùng',
      contact: {
        name: 'Hỗ trợ kỹ thuật',
        email: 'support@example.com',
        url: 'https://example.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      termsOfService: 'https://example.com/terms',
    },
    externalDocs: {
      description: 'Tìm hiểu thêm về Auth Service',
      url: 'https://docs.example.com/auth-service',
    },
    servers: [
      {
        url: 'http://localhost:3005',
        description: 'Môi trường phát triển',
        variables: {
          port: {
            enum: [3005, 3000],
            default: 3005
          }
        }
      },
      {
        url: 'https://api.example.com/v1',
        description: 'Môi trường sản phẩm',
      },
    ],
    tags: [
      {
        name: 'Auth Service',
        description: 'Tất cả các API của Auth Service',
        externalDocs: {
          description: 'Tìm hiểu thêm về xác thực',
          url: 'https://docs.example.com/auth'
        }
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập token JWT của bạn. Ví dụ: Bearer abc123...'
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/**/*.ts'),
    path.join(__dirname, './schemas/*.ts'),
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
