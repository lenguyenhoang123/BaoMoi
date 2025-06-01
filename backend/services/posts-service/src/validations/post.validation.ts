import Joi from 'joi';

// Schema cho việc tạo bài viết mới
export const createPostSchema = Joi.object({
  title: Joi.string().required().min(10).max(255),
  slug: Joi.string().optional().allow('').max(255),
  summary: Joi.string().required().max(500),
  content: Joi.string().required(),
  thumbnail: Joi.string().optional().allow('').uri(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  category_id: Joi.number().integer().positive().required(),
  tags: Joi.array().items(Joi.string()).optional(),
});

// Schema cho việc cập nhật bài viết
// Yêu cầu ít nhất 1 trường được cập nhật
export const updatePostSchema = Joi.object({
  title: Joi.string().min(10).max(255),
  slug: Joi.string().optional().allow('').max(255),
  summary: Joi.string().max(500),
  content: Joi.string(),
  thumbnail: Joi.string().optional().allow('').uri(),
  status: Joi.string().valid('draft', 'published', 'archived'),
  category_id: Joi.number().integer().positive(),
  tags: Joi.array().items(Joi.string()).optional(),
}).min(1); // At least one field should be provided for update
