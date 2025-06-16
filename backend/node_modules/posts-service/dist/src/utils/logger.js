"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// Simple console logger with Winston-like interface
const logger = {
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error || '');
    },
    info: (message, data) => {
        console.log(`[INFO] ${message}`, data || '');
    },
    debug: (message, data) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${message}`, data || '');
        }
    },
    warn: (message, data) => {
        console.warn(`[WARN] ${message}`, data || '');
    },
    http: (message, meta) => {
        console.log(`[HTTP] ${message}`, meta || '');
    }
};
exports.logger = logger;
exports.default = logger;
//# sourceMappingURL=logger.js.map