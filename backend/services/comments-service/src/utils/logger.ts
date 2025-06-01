import winston from 'winston';
import path from 'path';
import 'winston-daily-rotate-file';
import { format } from 'winston';
import type { TransformableInfo } from 'logform';
import { format as dateFnsFormat } from 'date-fns';

const { combine, timestamp, printf, colorize, json } = format;

// Tạo thư mục logs nếu chưa tồn tại
const logDir = path.join(process.cwd(), 'logs');

// Định dạng log
const logFormat = printf((info: TransformableInfo & { timestamp?: string }) => {
  const { level, message, timestamp, ...meta } = info;
  const formattedTimestamp = timestamp 
    ? dateFnsFormat(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
    : dateFnsFormat(new Date(), 'yyyy-MM-dd HH:mm:ss');

  // Nếu message là object, chuyển thành JSON
  const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;

  // Nếu có metadata, thêm vào log
  const metaString = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';

  return `[${formattedTimestamp}] ${level}: ${formattedMessage}${metaString}`;
});

// Tạo logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production' ? json() : format.combine(colorize(), logFormat)
  ),
  transports: [
    // Ghi log lỗi vào file
    new winston.transports.DailyRotateFile({
      level: 'error',
      dirname: path.join(logDir, 'error'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
    // Ghi tất cả log vào file
    new winston.transports.DailyRotateFile({
      dirname: path.join(logDir, 'combined'),
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Nếu không phải môi trường production, ghi log ra console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    })
  );
}

// Tạo stream cho morgan
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };
