import winston from 'winston';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

// Định dạng log đơn giản
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Tạo logger đơn giản
const logger = winston.createLogger({
  level: 'warn', // Chỉ hiển thị warn và error
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ],
  exitOnError: false
});

export default logger;
