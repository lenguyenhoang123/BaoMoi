import 'express-validator';

declare module 'express-validator' {
  interface ValidationChain {
    isEmail(): ValidationChain;
    isLength(options: { min?: number; max?: number }): ValidationChain;
    optional(options?: { nullable?: boolean; checkFalsy?: boolean }): ValidationChain;
    isIn(items: any[]): ValidationChain;
    isInt(options?: { min?: number; max?: number }): ValidationChain;
    withMessage(message: string): ValidationChain;
    toInt(): ValidationChain;
    trim(): ValidationChain;
    notEmpty(): ValidationChain;
    isString(): ValidationChain;
  }
}
