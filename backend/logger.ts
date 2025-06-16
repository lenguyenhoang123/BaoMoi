import logger from './logger-config';

// Tạo stream cho morgan
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Hàm ghi log lỗi
const logError = (error: Error) => {
  logger.error(`[ERROR] ${error.message}\n${error.stack}`);
};

export { logger, stream, logError };
export default logger;
