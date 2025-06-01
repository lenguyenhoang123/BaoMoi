import { body } from 'express-validator';

const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

export default validateCategory;
