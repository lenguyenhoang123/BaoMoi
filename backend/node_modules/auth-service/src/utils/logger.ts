// Logger implementation that forwards to console
const logger = {
  error: (message: string, meta?: any) => {
    console.error(message, meta || '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(message, meta || '');
  },
  info: (message: string, meta?: any) => {
    console.info(message, meta || '');
  },
  http: (message: string, meta?: any) => {
    console.log(`[HTTP] ${message}`, meta || '');
  },
  debug: (message: string, meta?: any) => {
    console.debug(message, meta || '');
  },
};

export default logger;
