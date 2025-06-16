"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
require("winston-daily-rotate-file");
// Tạo thư mục logs nếu chưa tồn tại
const logDir = process.env.LOG_DIR || 'logs';
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Định dạng thời gian
const timeFormat = 'YYYY-MM-DD HH:mm:ss';
// Màu sắc cho các mức độ log
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
winston_1.default.addColors(colors);
// Định dạng log
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: timeFormat }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Tạo logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format,
    defaultMeta: { service: process.env.SERVICE_NAME || 'unknown-service' },
    transports: [
        // Ghi log lỗi ra file
        new winston_1.default.transports.DailyRotateFile({
            level: 'error',
            filename: path_1.default.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
        // Ghi tất cả log ra file
        new winston_1.default.transports.DailyRotateFile({
            filename: path_1.default.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});
// Nếu không phải môi trường production thì ghi log ra console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.simple()),
    }));
}
exports.default = logger;
//# sourceMappingURL=logger.js.map