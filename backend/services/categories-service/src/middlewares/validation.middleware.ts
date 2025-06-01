import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validationResult, ValidationChain, Result, ValidationError as ExpressValidationError } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Middleware xử lý lỗi validation
 */
export const validate = (validations: ValidationChain[]): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Run all validations
      await Promise.all(validations.map(validation => validation.run(req)));
      
      const errors: Result<ExpressValidationError> = validationResult(req);
      
      if (!errors.isEmpty()) {
        // Convert errors to our format
        const formattedErrors: Record<string, string[]> = {};
        
        errors.array().forEach((error: ExpressValidationError) => {
          const param = error.type === 'field' ? error.path : '_';
          const message = error.msg;
          
          if (!formattedErrors[param]) {
            formattedErrors[param] = [];
          }
          formattedErrors[param].push(message);
        });
        
        return next(new ValidationError(formattedErrors));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
