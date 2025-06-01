import winston, { format } from 'winston';
const { combine, timestamp, printf, colorize, align } = format;

// Tạo định dạng log với kiểu dữ liệu của Winston
const logFormat = printf((info: winston.Logform.TransformableInfo) => {
  const { timestamp, level, message, ...meta } = info;
  return `[${timestamp as string}] ${level}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    align(),
    logFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export default logger;
