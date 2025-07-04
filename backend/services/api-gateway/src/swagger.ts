import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

// Cấu hình tài liệu OpenAPI
export const swaggerDocument = {
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

// Cấu hình Swagger UI
export function setupSwagger(app: Express) {
  // Route cho tài liệu API dạng JSON
  app.get('/api-docs-json', (req, res) => {
    res.json(swaggerDocument);
  });

  // Route cho giao diện Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      explorer: true,
      swaggerOptions: {
        url: '/api-docs-json',
        docExpansion: 'list',
        persistAuthorization: true,
        tryItOutEnabled: true,
        displayRequestDuration: true,
        filter: true
      }
    }) as any // Sử dụng any để bỏ qua lỗi TypeScript
  );
}
