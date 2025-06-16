import winston from 'winston';
import path from 'path';
import fs from 'fs';
import 'winston-daily-rotate-file';

// Tạo thư mục logs nếu chưa tồn tại
const logDir = process.env.LOG_DIR || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
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

winston.addColors(colors);

// Định dạng log
const format = winston.format.combine(
  winston.format.timestamp({ format: timeFormat }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Tạo logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format,
  defaultMeta: { service: process.env.SERVICE_NAME || 'unknown-service' },
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
      winston.format.simple()
    ),
  }));
}

export default logger;
