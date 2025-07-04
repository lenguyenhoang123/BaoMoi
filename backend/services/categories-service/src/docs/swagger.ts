import swaggerJsdoc from 'swagger-jsdoc';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Lấy đường dẫn thư mục hiện tại trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Đọc version từ package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
const version = packageJson.version;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Categories Service API',
      version,
      description: 'API documentation for the Categories Service',
      contact: {
        name: 'API Support',
        email: 'support@baomoi.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3009',
        description: 'Development server'
      },
      {
        url: 'https://api.baomoi.com/categories',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token của bạn. Ví dụ: Bearer abc123...'
        }
      },
      responses: {
        ServerError: {
          description: 'Lỗi máy chủ nội bộ',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Không có quyền truy cập',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Không tìm thấy tài nguyên',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        BadRequestError: {
          description: 'Dữ liệu không hợp lệ',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              },
              example: [
                { field: 'name', message: 'Tên không được để trống' },
                { field: 'email', message: 'Email không hợp lệ' }
              ]
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID của danh mục'
            },
            name: {
              type: 'string',
              description: 'Tên danh mục',
              example: 'Tin tức'
            },
            slug: {
              type: 'string',
              description: 'Đường dẫn thân thiện SEO',
              example: 'tin-tuc'
            },
            description: {
              type: 'string',
              description: 'Mô tả danh mục',
              example: 'Các tin tức mới nhất'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian tạo'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Thời gian cập nhật'
            }
          }
        },
        CreateCategoryInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Tên danh mục (bắt buộc)',
              example: 'Tin tức'
            },
            slug: {
              type: 'string',
              description: 'Đường dẫn thân thiện SEO (tự động tạo nếu để trống)',
              example: 'tin-tuc'
            },
            description: {
              type: 'string',
              description: 'Mô tả danh mục',
              example: 'Các tin tức mới nhất'
            }
          }
        },
        UpdateCategoryInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tên danh mục mới',
              example: 'Tin tức mới'
            },
            slug: {
              type: 'string',
              description: 'Đường dẫn thân thiện SEO mới',
              example: 'tin-tuc-moi'
            },
            description: {
              type: 'string',
              description: 'Mô tả mới cho danh mục',
              example: 'Cập nhật tin tức mới nhất'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Lấy danh sách tất cả danh mục',
          description: 'Trả về danh sách tất cả các danh mục',
          responses: {
            '200': {
              description: 'Danh sách danh mục',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Category' }
                      }
                    }
                  }
                }
              }
            },
            '500': {
              $ref: '#/components/responses/ServerError'
            }
          }
        },
        post: {
          tags: ['Categories'],
          summary: 'Tạo mới một danh mục',
          description: 'Tạo mới một danh mục với thông tin được cung cấp',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateCategoryInput'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Danh mục đã được tạo thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Category' }
                    }
                  }
                }
              }
            },
            '400': {
              $ref: '#/components/responses/BadRequestError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '500': {
              $ref: '#/components/responses/ServerError'
            }
          }
        }
      },
      '/categories/{id}': {
        get: {
          tags: ['Categories'],
          summary: 'Lấy thông tin chi tiết danh mục',
          description: 'Trả về thông tin chi tiết của một danh mục dựa trên ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID của danh mục',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Thông tin chi tiết danh mục',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Category' }
                    }
                  }
                }
              }
            },
            '404': {
              $ref: '#/components/responses/NotFoundError'
            },
            '500': {
              $ref: '#/components/responses/ServerError'
            }
          }
        },
        put: {
          tags: ['Categories'],
          summary: 'Cập nhật thông tin danh mục',
          description: 'Cập nhật thông tin của một danh mục dựa trên ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID của danh mục cần cập nhật',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateCategoryInput'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Danh mục đã được cập nhật thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Category' }
                    }
                  }
                }
              }
            },
            '400': {
              $ref: '#/components/responses/BadRequestError'
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '404': {
              $ref: '#/components/responses/NotFoundError'
            },
            '500': {
              $ref: '#/components/responses/ServerError'
            }
          }
        },
        delete: {
          tags: ['Categories'],
          summary: 'Xóa một danh mục',
          description: 'Xóa một danh mục dựa trên ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              description: 'ID của danh mục cần xóa',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Danh mục đã được xóa thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Danh mục đã được xóa thành công' }
                    }
                  }
                }
              }
            },
            '401': {
              $ref: '#/components/responses/UnauthorizedError'
            },
            '404': {
              $ref: '#/components/responses/NotFoundError'
            },
            '500': {
              $ref: '#/components/responses/ServerError'
            }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
