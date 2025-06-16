"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
require("winston-daily-rotate-file");
const winston_2 = require("winston");
const date_fns_1 = require("date-fns");
const { combine, timestamp, printf, colorize, json } = winston_2.format;
// Tạo thư mục logs nếu chưa tồn tại
const logDir = path_1.default.join(process.cwd(), 'logs');
// Định dạng log
const logFormat = printf((info) => {
    const { level, message, timestamp, ...meta } = info;
    const formattedTimestamp = timestamp
        ? (0, date_fns_1.format)(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
        : (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd HH:mm:ss');
    // Nếu message là object, chuyển thành JSON
    const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    // Nếu có metadata, thêm vào log
    const metaString = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${formattedTimestamp}] ${level}: ${formattedMessage}${metaString}`;
});
// Tạo logger
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), process.env.NODE_ENV === 'production' ? json() : winston_2.format.combine(colorize(), logFormat)),
    transports: [
        // Ghi log lỗi vào file
        new winston_1.default.transports.DailyRotateFile({
            level: 'error',
            dirname: path_1.default.join(logDir, 'error'),
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
        // Ghi tất cả log vào file
        new winston_1.default.transports.DailyRotateFile({
            dirname: path_1.default.join(logDir, 'combined'),
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});
exports.logger = logger;
// Nếu không phải môi trường production, ghi log ra console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat),
    }));
}
// Tạo stream cho morgan
const stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.stream = stream;
