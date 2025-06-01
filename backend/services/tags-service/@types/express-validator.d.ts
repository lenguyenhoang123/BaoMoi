import { ValidationChain } from 'express-validator';

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

  export function body(field: string, message?: string): ValidationChain;
  export function query(field: string, message?: string): ValidationChain;
  export function param(field: string, message?: string): ValidationChain;
  export function validationResult(req: Request): {
    isEmpty(): boolean;
    array(): Array<{ param: string; msg: string; value?: any }>;
    formatWith(formatter: (error: any) => any): {
      array(): Array<{ param: string; msg: string }>;
    };
  };
}
