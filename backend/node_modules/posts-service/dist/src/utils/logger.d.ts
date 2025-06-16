declare const logger: {
    error: (message: string, error?: any) => void;
    info: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    http: (message: string, meta?: any) => void;
};
export { logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map