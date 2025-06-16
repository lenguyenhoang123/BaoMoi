import { fileURLToPath } from 'url';
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(__dirname, '../../../logs/auth-service');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Màu sắc cho các mức độ log
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// Định dạng log
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Tạo logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format,
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Ghi log lỗi ra file
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Ghi tất cả log ra file
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Nếu không phải môi trường production thì ghi log ra console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        ({ level, message, timestamp, ...meta }) => 
          `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
      )
    ),
  }));
}

// Stream cho morgan
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };
export default logger;
