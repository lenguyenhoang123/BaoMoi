import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import AppError from '../utils/appError';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { body, params, query } = schema;
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const errors: string[] = [];

    if (body) {
      const { error, value } = body.validate(req.body, validationOptions);
      if (error) {
        error.details.forEach((detail: Joi.ValidationErrorItem) => 
          errors.push(detail.message)
        );
      } else {
        req.body = value;
      }
    }

    if (params) {
      const { error, value } = params.validate(req.params, validationOptions);
      if (error) {
        error.details.forEach((detail: Joi.ValidationErrorItem) => 
          errors.push(detail.message)
        );
      } else {
        req.params = value;
      }
    }

    if (query) {
      const { error, value } = query.validate(req.query, validationOptions);
      if (error) {
        error.details.forEach((detail: Joi.ValidationErrorItem) => 
          errors.push(detail.message)
        );
      } else {
        req.query = value;
      }
    }

    if (errors.length > 0) {
      return next(new AppError(`Validation error: ${errors.join('. ')}`, 400));
    }

    next();
  };
};

/**
 * Middleware to validate request body against a Joi schema
 * @param schema Joi validation schema
 */
export const validateBody = <T extends Joi.ObjectSchema>(schema: T) => {
  return validate({ body: schema });
};

/**
 * Middleware to validate request query parameters against a Joi schema
 * @param schema Joi validation schema
 */
export const validateQuery = <T extends Joi.ObjectSchema>(schema: T) => {
  return validate({ query: schema });
};

/**
 * Middleware to validate request route parameters against a Joi schema
 * @param schema Joi validation schema
 */
export const validateParams = <T extends Joi.ObjectSchema>(schema: T) => {
  return validate({ params: schema });
};

// Định nghĩa các schema mẫu cho bài viết
export const postSchemas = {
  createPost: Joi.object({
    title: Joi.string().required().min(10).max(255),
    slug: Joi.string().optional().allow('').max(255),
    summary: Joi.string().required().max(500),
    content: Joi.string().required(),
    thumbnail: Joi.string().optional().allow('').uri(),
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    category_id: Joi.number().integer().positive().required(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),

  updatePost: Joi.object({
    title: Joi.string().min(10).max(255),
    slug: Joi.string().optional().allow('').max(255),
    summary: Joi.string().max(500),
    content: Joi.string(),
    thumbnail: Joi.string().optional().allow('').uri(),
    status: Joi.string().valid('draft', 'published', 'archived'),
    category_id: Joi.number().integer().positive(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),

  getPosts: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('draft', 'published', 'archived'),
    category_id: Joi.number().integer().positive(),
    tag: Joi.string(),
    search: Joi.string(),
    sort: Joi.string().valid('newest', 'oldest', 'most_viewed', 'most_liked'),
  }),
};

/**
 * Middleware to validate request files
 * @param fields Fields configuration for file validation
 * @param maxFileSize Maximum file size in bytes
 * @param allowedMimeTypes Allowed MIME types
 */
export const validateFiles = (
  fields: Record<string, { required?: boolean }>,
  maxFileSize = 5 * 1024 * 1024, // Giới hạn kích thước file 5MB
  allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.files) {
      // Kiểm tra xem có trường file nào bắt buộc không
      const requiredFields = Object.entries(fields)
        .filter(([_, config]) => config.required)
        .map(([field]) => field);

      if (requiredFields.length > 0) {
        return next(
          AppError.validationError(
            `The following files are required: ${requiredFields.join(', ')}`
          )
        );
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
        return next(AppError.validationError(`Unexpected file field: ${field}`));
      }

      const filesArray = Array.isArray(fileArray) ? fileArray : [fileArray];

      for (const file of filesArray) {
        // Kiểm tra kích thước file
        if (file.size > maxFileSize) {
          return next(
            AppError.validationError(
              `File ${file.fieldname} is too large. Max size is ${
                maxFileSize / (1024 * 1024)
              }MB`
            )
          );
        }

        // Kiểm tra loại MIME
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return next(
            AppError.validationError(
              `Invalid file type for ${file.fieldname}. Allowed types: ${allowedMimeTypes.join(
                ', '
              )}`
            )
          );
        }
      }
    }

    next();
  };
};

// Xuất các schema để có thể sử dụng trực tiếp
export const {
  createPost: createPostSchema,
  updatePost: updatePostSchema,
  getPosts: getPostsSchema,
} = postSchemas;

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateFiles,
  ...postSchemas,
};
