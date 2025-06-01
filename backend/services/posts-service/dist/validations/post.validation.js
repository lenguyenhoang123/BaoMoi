"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.createPostSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Schema cho việc tạo bài viết mới
exports.createPostSchema = joi_1.default.object({
    title: joi_1.default.string().required().min(10).max(255),
    slug: joi_1.default.string().optional().allow('').max(255),
    summary: joi_1.default.string().required().max(500),
    content: joi_1.default.string().required(),
    thumbnail: joi_1.default.string().optional().allow('').uri(),
    status: joi_1.default.string().valid('draft', 'published', 'archived').default('draft'),
    category_id: joi_1.default.number().integer().positive().required(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
});
// Schema cho việc cập nhật bài viết
// Yêu cầu ít nhất 1 trường được cập nhật
exports.updatePostSchema = joi_1.default.object({
    title: joi_1.default.string().min(10).max(255),
    slug: joi_1.default.string().optional().allow('').max(255),
    summary: joi_1.default.string().max(500),
    content: joi_1.default.string(),
    thumbnail: joi_1.default.string().optional().allow('').uri(),
    status: joi_1.default.string().valid('draft', 'published', 'archived'),
    category_id: joi_1.default.number().integer().positive(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
}).min(1); // At least one field should be provided for update
//# sourceMappingURL=post.validation.js.map