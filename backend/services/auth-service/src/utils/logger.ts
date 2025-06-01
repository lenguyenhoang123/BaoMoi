import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';
import Transport from 'winston-transport';

declare module 'winston' {
  interface Transports {
    DailyRotateFile: typeof Transport;
  }
}

// Định nghĩa các cấp độ log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Màu sắc cho các cấp độ log
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Thêm màu sắc vào winston
winston.addColors(colors);

// Định dạng log đơn giản
const format = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message }) => {
    // Chỉ lấy phần message chính, bỏ qua các metadata khác
    if (typeof message === 'object') {
      message = JSON.stringify(message);
    }
    return `${level}: ${message}`;
  })
);

// Tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(process.cwd(), 'logs');

// Định nghĩa các transport
const transports = [
  // Log ra console với format đơn giản
  new winston.transports.Console(),
  
  // Ghi log lỗi vào file
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
  }),
  
  // Ghi tất cả log vào file
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  })
];

// Tạo logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false, // Không thoát khi có lỗi
});

// Xử lý ngoại lệ chưa được bắt
process.on('unhandledRejection', (reason) => {
  throw reason;
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Thoát với lỗi
  process.exit(1);
});

export { logger };
