import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
interface ValidationSchema {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
}
export declare const validate: (schema: ValidationSchema) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware to validate request body against a Joi schema
 * @param schema Joi validation schema
 */
export declare const validateBody: <T extends Joi.ObjectSchema>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware to validate request query parameters against a Joi schema
 * @param schema Joi validation schema
 */
export declare const validateQuery: <T extends Joi.ObjectSchema>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Middleware to validate request route parameters against a Joi schema
 * @param schema Joi validation schema
 */
export declare const validateParams: <T extends Joi.ObjectSchema>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const postSchemas: {
    createPost: Joi.ObjectSchema<any>;
    updatePost: Joi.ObjectSchema<any>;
    getPosts: Joi.ObjectSchema<any>;
};
/**
 * Middleware to validate request files
 * @param fields Fields configuration for file validation
 * @param maxFileSize Maximum file size in bytes
 * @param allowedMimeTypes Allowed MIME types
 */
export declare const validateFiles: (fields: Record<string, {
    required?: boolean;
}>, maxFileSize?: number, // Giới hạn kích thước file 5MB
allowedMimeTypes?: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
export declare const createPostSchema: Joi.ObjectSchema<any>, updatePostSchema: Joi.ObjectSchema<any>, getPostsSchema: Joi.ObjectSchema<any>;
declare const _default: {
    createPost: Joi.ObjectSchema<any>;
    updatePost: Joi.ObjectSchema<any>;
    getPosts: Joi.ObjectSchema<any>;
    validate: (schema: ValidationSchema) => (req: Request, _res: Response, next: NextFunction) => void;
    validateBody: <T extends Joi.ObjectSchema>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
    validateQuery: <T extends Joi.ObjectSchema>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
    validateParams: <T extends Joi.ObjectSchema>(schema: T) => (req: Request, _res: Response, next: NextFunction) => void;
    validateFiles: (fields: Record<string, {
        required?: boolean;
    }>, maxFileSize?: number, allowedMimeTypes?: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=validate.d.ts.map