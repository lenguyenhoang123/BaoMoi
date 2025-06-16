"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostsSchema = exports.updatePostSchema = exports.createPostSchema = exports.validateFiles = exports.postSchemas = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const joi_1 = __importDefault(require("joi"));
const appError_1 = __importDefault(require("../utils/appError"));
const validate = (schema) => {
    return (req, _res, next) => {
        const { body, params, query } = schema;
        const validationOptions = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        };
        const errors = [];
        if (body) {
            const { error, value } = body.validate(req.body, validationOptions);
            if (error) {
                error.details.forEach((detail) => errors.push(detail.message));
            }
            else {
                req.body = value;
            }
        }
        if (params) {
            const { error, value } = params.validate(req.params, validationOptions);
            if (error) {
                error.details.forEach((detail) => errors.push(detail.message));
            }
            else {
                req.params = value;
            }
        }
        if (query) {
            const { error, value } = query.validate(req.query, validationOptions);
            if (error) {
                error.details.forEach((detail) => errors.push(detail.message));
            }
            else {
                req.query = value;
            }
        }
        if (errors.length > 0) {
            return next(new appError_1.default(`Validation error: ${errors.join('. ')}`, 400));
        }
        next();
    };
};
exports.validate = validate;
/**
 * Middleware to validate request body against a Joi schema
 * @param schema Joi validation schema
 */
const validateBody = (schema) => {
    return (0, exports.validate)({ body: schema });
};
exports.validateBody = validateBody;
/**
 * Middleware to validate request query parameters against a Joi schema
 * @param schema Joi validation schema
 */
const validateQuery = (schema) => {
    return (0, exports.validate)({ query: schema });
};
exports.validateQuery = validateQuery;
/**
 * Middleware to validate request route parameters against a Joi schema
 * @param schema Joi validation schema
 */
const validateParams = (schema) => {
    return (0, exports.validate)({ params: schema });
};
exports.validateParams = validateParams;
// Định nghĩa các schema mẫu cho bài viết
exports.postSchemas = {
    createPost: joi_1.default.object({
        title: joi_1.default.string().required().min(10).max(255),
        slug: joi_1.default.string().optional().allow('').max(255),
        summary: joi_1.default.string().required().max(500),
        content: joi_1.default.string().required(),
        thumbnail: joi_1.default.string().optional().allow('').uri(),
        status: joi_1.default.string().valid('draft', 'published', 'archived').default('draft'),
        category_id: joi_1.default.number().integer().positive().required(),
        tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    }),
    updatePost: joi_1.default.object({
        title: joi_1.default.string().min(10).max(255),
        slug: joi_1.default.string().optional().allow('').max(255),
        summary: joi_1.default.string().max(500),
        content: joi_1.default.string(),
        thumbnail: joi_1.default.string().optional().allow('').uri(),
        status: joi_1.default.string().valid('draft', 'published', 'archived'),
        category_id: joi_1.default.number().integer().positive(),
        tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    }),
    getPosts: joi_1.default.object({
        page: joi_1.default.number().integer().min(1).default(1),
        limit: joi_1.default.number().integer().min(1).max(100).default(10),
        status: joi_1.default.string().valid('draft', 'published', 'archived'),
        category_id: joi_1.default.number().integer().positive(),
        tag: joi_1.default.string(),
        search: joi_1.default.string(),
        sort: joi_1.default.string().valid('newest', 'oldest', 'most_viewed', 'most_liked'),
    }),
};
/**
 * Middleware to validate request files
 * @param fields Fields configuration for file validation
 * @param maxFileSize Maximum file size in bytes
 * @param allowedMimeTypes Allowed MIME types
 */
const validateFiles = (fields, maxFileSize = 5 * 1024 * 1024, // Giới hạn kích thước file 5MB
allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
    return (req, _res, next) => {
        if (!req.files) {
            // Kiểm tra xem có trường file nào bắt buộc không
            const requiredFields = Object.entries(fields)
                .filter(([_, config]) => config.required)
                .map(([field]) => field);
            if (requiredFields.length > 0) {
                return next(appError_1.default.validationError(`The following files are required: ${requiredFields.join(', ')}`));
            }
            return next();
        }
        const files = Array.isArray(req.files)
            ? { file: req.files }
            : req.files;
        // Xác thực từng file
        for (const [field, fileArray] of Object.entries(files)) {
            const fileConfig = fields[field];
            if (!fileConfig) {
                return next(appError_1.default.validationError(`Unexpected file field: ${field}`));
            }
            const filesArray = Array.isArray(fileArray) ? fileArray : [fileArray];
            for (const file of filesArray) {
                // Kiểm tra kích thước file
                if (file.size > maxFileSize) {
                    return next(appError_1.default.validationError(`File ${file.fieldname} is too large. Max size is ${maxFileSize / (1024 * 1024)}MB`));
                }
                // Kiểm tra loại MIME
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return next(appError_1.default.validationError(`Invalid file type for ${file.fieldname}. Allowed types: ${allowedMimeTypes.join(', ')}`));
                }
            }
        }
        next();
    };
};
exports.validateFiles = validateFiles;
// Xuất các schema để có thể sử dụng trực tiếp
exports.createPostSchema = exports.postSchemas.createPost, exports.updatePostSchema = exports.postSchemas.updatePost, exports.getPostsSchema = exports.postSchemas.getPosts;
exports.default = {
    validate: exports.validate,
    validateBody: exports.validateBody,
    validateQuery: exports.validateQuery,
    validateParams: exports.validateParams,
    validateFiles: exports.validateFiles,
    ...exports.postSchemas,
};
//# sourceMappingURL=validate.js.map