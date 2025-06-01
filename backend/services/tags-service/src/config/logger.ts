import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Đảm bảo thư mục log tồn tại
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Định dạng log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: false }),
  winston.format.simple()
);

// Tạo instance logger
const logger = winston.createLogger({
  level: 'info', // Chỉ hiển thị log từ mức info trở lên  
  format: logFormat,
  defaultMeta: { service: 'tags-service' },
  transports: [
    // Ghi tất cả log có mức 'error' và thấp hơn vào error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Ghi tất cả log vào combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Luôn bật log console nhưng với format đơn giản
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`
      )
    ),
  })
);

// Xử lý các ngoại lệ chưa được bắt
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Xử lý các promise bị từ chối chưa được xử lý
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider whether to exit the process here
  // process.exit(1);
});

export { logger };
