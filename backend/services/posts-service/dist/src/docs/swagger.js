"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const package_json_1 = require("../../package.json");
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Posts Service API',
            version: package_json_1.version,
            description: 'API documentation for the Posts Service',
            contact: {
                name: 'API Support',
                email: 'support@baomoi.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3004',
                description: 'Development server'
            },
            {
                url: 'https://api.baomoi.com/posts',
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
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    example: 'VALIDATION_ERROR'
                                },
                                message: {
                                    type: 'string',
                                    example: 'Có lỗi xảy ra khi xác thực dữ liệu'
                                },
                                details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            field: {
                                                type: 'string',
                                                example: 'title'
                                            },
                                            message: {
                                                type: 'string',
                                                example: 'Tiêu đề không được để trống'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/docs/schemas/*.ts'
    ]
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.default = specs;
//# sourceMappingURL=swagger.js.map