"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = __importDefault(require("../controllers/post.controller"));
const validate_1 = require("../middlewares/validate");
const post_validation_1 = require("../validations/post.validation");
const router = (0, express_1.Router)();
const postController = new post_controller_1.default();
// Các route công khai (không yêu cầu xác thực)
router.get('/', postController.getAllPosts);
router.get('/featured', postController.getFeaturedPosts);
router.get('/latest', postController.getLatestPosts);
router.get('/:id', postController.getPostById);
router.get('/category/:categoryId', postController.getPostsByCategory);
router.get('/tag/:tagId', postController.getPostsByTag);
// Các route được bảo vệ (xác thực được xử lý bởi API Gateway)
router.post('/', (0, validate_1.validate)({ body: post_validation_1.createPostSchema }), postController.createPost);
router.put('/:id', (0, validate_1.validate)({ body: post_validation_1.updatePostSchema }), postController.updatePost);
router.delete('/:id', postController.deletePost);
exports.default = router;
//# sourceMappingURL=posts.js.map