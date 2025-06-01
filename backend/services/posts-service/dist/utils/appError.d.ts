import { AppError as AppErrorType } from '../types';
export declare class AppError extends Error implements AppErrorType {
    statusCode: number;
    status: string;
    isOperational: boolean;
    code?: number;
    constructor(message: string, statusCode: number, code?: number);
    static badRequest(message: string, code?: number): AppError;
    static unauthorized(message?: string, code?: number): AppError;
    static forbidden(message?: string, code?: number): AppError;
    static notFound(resource?: string): AppError;
    static conflict(message: string, code?: number): AppError;
    static validationError(message: string, code?: number): AppError;
    static internalError(message?: string, code?: number): AppError;
}
export default AppError;
//# sourceMappingURL=appError.d.ts.map