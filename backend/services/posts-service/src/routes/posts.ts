import { Router } from 'express';
import PostController from '../controllers/post.controller';
import { validate } from '../middlewares/validate';
import { createPostSchema, updatePostSchema } from '../validations/post.validation';

const router = Router();
const postController = new PostController();

// Các route công khai (không yêu cầu xác thực)
router.get('/', postController.getAllPosts);
router.get('/featured', postController.getFeaturedPosts);
router.get('/latest', postController.getLatestPosts);
router.get('/hot', postController.getHotPosts);
router.get('/:id', postController.getPostById);
router.get('/category/:categoryId', postController.getPostsByCategory);
router.get('/tag/:tagId', postController.getPostsByTag);

// Các route được bảo vệ (xác thực được xử lý bởi API Gateway)
router.post('/', validate({ body: createPostSchema }), postController.createPost);
router.put('/:id', validate({ body: updatePostSchema }), postController.updatePost);
router.delete('/:id', postController.deletePost);

// Các route quản lý trạng thái bài viết
router.patch('/:postId/featured', postController.updateFeaturedStatus);
router.patch('/:postId/hot', postController.updateHotStatus);

export default router;
