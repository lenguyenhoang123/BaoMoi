/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - categoryId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID của bài viết
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         title:
 *           type: string
 *           description: Tiêu đề bài viết
 *           example: "Cách sử dụng Swagger với Node.js"
 *         slug:
 *           type: string
 *           description: Đường dẫn thân thiện SEO
 *           example: "cach-su-dung-swagger-voi-nodejs"
 *         excerpt:
 *           type: string
 *           description: Tóm tắt bài viết
 *           example: "Hướng dẫn chi tiết cách tích hợp Swagger vào dự án Node.js"
 *         content:
 *           type: string
 *           description: Nội dung bài viết (HTML)
 *           example: "<p>Nội dung bài viết chi tiết ở đây...</p>"
 *         thumbnail:
 *           type: string
 *           description: URL hình ảnh đại diện
 *           example: "https://example.com/images/thumbnail.jpg"
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: ID danh mục
 *           example: 223e4567-e89b-12d3-a456-426614174000
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: ID tác giả
 *           example: 323e4567-e89b-12d3-a456-426614174000
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: draft
 *           description: Trạng thái bài viết
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Danh sách các tag
 *           example: ["nodejs", "swagger", "api"]
 *         viewCount:
 *           type: integer
 *           default: 0
 *           description: Lượt xem
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian xuất bản
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật
 *
 *     CreatePostInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - categoryId
 *       properties:
 *         title:
 *           type: string
 *           minLength: 10
 *           maxLength: 255
 *           example: "Cách sử dụng Swagger với Node.js"
 *         content:
 *           type: string
 *           minLength: 100
 *           example: "<p>Nội dung bài viết chi tiết ở đây...</p>"
 *         excerpt:
 *           type: string
 *           maxLength: 500
 *           example: "Hướng dẫn chi tiết cách tích hợp Swagger vào dự án Node.js"
 *         thumbnail:
 *           type: string
 *           format: uri
 *           example: "https://example.com/images/thumbnail.jpg"
 *         categoryId:
 *           type: string
 *           format: uuid
 *           example: 223e4567-e89b-12d3-a456-426614174000
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["nodejs", "swagger", "api"]
 *
 *     UpdatePostInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 10
 *           maxLength: 255
 *           example: "Cách sử dụng Swagger với Node.js (Đã cập nhật)"
 *         content:
 *           type: string
 *           minLength: 100
 *           example: "<p>Nội dung bài viết đã được cập nhật...</p>"
 *         excerpt:
 *           type: string
 *           maxLength: 500
 *           example: "Hướng dẫn chi tiết cách tích hợp Swagger vào dự án Node.js (Đã cập nhật)"
 *         thumbnail:
 *           type: string
 *           format: uri
 *           example: "https://example.com/images/updated-thumbnail.jpg"
 *         categoryId:
 *           type: string
 *           format: uuid
 *           example: 223e4567-e89b-12d3-a456-426614174000
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["nodejs", "swagger", "api", "documentation"]
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           example: published
 */
//# sourceMappingURL=post.schemas.js.map