// Logger đã bị tắt hoàn toàn
type LogMethod = (message?: any, ...meta: any[]) => void;

const logger = {
  error: (() => {}) as LogMethod,
  warn: (() => {}) as LogMethod,
  info: (() => {}) as LogMethod,
  http: (() => {}) as LogMethod,
  debug: (() => {}) as LogMethod,
  add: (() => {}) as LogMethod
};

// Tắt log của morgan
const stream = {
  write: (() => {}) as (message: string) => void
};

export { logger, stream };
export default logger;