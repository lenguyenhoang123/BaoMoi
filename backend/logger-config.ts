import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Định dạng log
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return stack 
    ? `${timestamp} [${level}]: ${message}\n${stack}`
    : `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Ghi tất cả log từ mức info trở lên vào file combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        logFormat
      )
    }),
    // Ghi log lỗi vào file error.log
    new winston.transports.File({
      level: 'error',
      filename: path.join(logDir, 'error.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        logFormat
      )
    }),
    // Hiển thị log ra console trong môi trường development
    ...(process.env.NODE_ENV !== 'production' ? [new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        logFormat
      )
    })] : [])
  ]
});

export default logger;
