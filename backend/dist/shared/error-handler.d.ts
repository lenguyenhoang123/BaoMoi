import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: any, req: Request, res: Response, _next: NextFunction) => void;
export declare const catchAsync: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error-handler.d.ts.map