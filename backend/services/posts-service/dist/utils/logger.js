"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = void 0;
const winston_1 = __importStar(require("winston"));
const { combine, timestamp, printf, colorize } = winston_1.format;
// Định dạng log
const logFormat = printf((info) => {
    return `[${info.timestamp}] ${info.level}: ${info.message}`;
});
// Định nghĩa các mức độ log
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Thêm màu sắc cho winston
winston_1.default.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
});
// Tạo instance logger
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    defaultMeta: { service: 'posts-service' },
    transports: [
        new winston_1.transports.Console({
            format: combine(colorize({ all: true }), logFormat),
        }),
    ],
});
// Thêm ghi log vào file trong môi trường production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston_1.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(timestamp(), logFormat),
    }));
    logger.add(new winston_1.transports.File({
        filename: 'logs/combined.log',
        format: combine(timestamp(), logFormat),
    }));
}
// Tạo một stream object với hàm 'write' để sử dụng với morgan
exports.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
exports.default = logger;
//# sourceMappingURL=logger.js.map