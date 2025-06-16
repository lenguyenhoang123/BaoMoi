import logger from './logger';
export { logger };
export * from './error-handler';
export * from './types';
export * from './types/env';
export type { Request, Response, NextFunction } from 'express';
export declare const isProduction: boolean;
declare global {
    namespace NodeJS {
        interface Global {
            __rootdir__: string;
        }
    }
}
//# sourceMappingURL=index.d.ts.map