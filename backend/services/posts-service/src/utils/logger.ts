import winston, { format, transports, Logger } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Định dạng log
const logFormat = printf((info) => {
  return `[${info.timestamp}] ${info.level}: ${info.message}`;
});

// Định nghĩa các mức độ log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Thêm màu sắc cho winston
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
});

// Tạo instance logger
const logger: Logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'posts-service' },
  transports: [
    new transports.Console({
      format: combine(colorize({ all: true }), logFormat),
    }),
  ],
});

// Thêm ghi log vào file trong môi trường production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), logFormat),
    })
  );
  
  logger.add(
    new transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), logFormat),
    })
  );
}

// Tạo một stream object với hàm 'write' để sử dụng với morgan
export const stream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export default logger;
