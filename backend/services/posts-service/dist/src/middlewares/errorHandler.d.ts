import { Request, Response, NextFunction } from 'express';
interface ErrorWithCode extends Error {
    code?: string | number;
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    errors?: Record<string, {
        message: string;
    }>;
    path?: string;
    value?: any;
    detail?: string;
    stack?: string;
    name: string;
    message: string;
}
declare const errorHandler: (err: ErrorWithCode, req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map