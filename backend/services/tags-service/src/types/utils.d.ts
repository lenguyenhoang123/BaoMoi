// Khai báo kiểu cho logger
import { Logger } from 'winston';
declare const logger: Logger;
export default logger;

declare module '../utils/error' {
  export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    
    constructor(statusCode: number, message: string, isOperational?: boolean);
  }
  
  export const errorHandler: (
    err: any,
    req: any,
    res: any,
    next: any
  ) => void;
}

// Các khai báo types khác...
