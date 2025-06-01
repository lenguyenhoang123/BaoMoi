import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

// Định dạng log cho console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const logMessage = stack || message;
  return `${timestamp} [${level}]: ${logMessage}`;
});

// Tạo logger với cấu hình mặc định
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
  ),
  defaultMeta: { service: 'categories-service' },
  transports: [
    // Cấu hình ghi log ra console
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      )
    }),
    // Cấu hình ghi log ra file
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Xử lý lỗi không bắt được
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

export { logger };
