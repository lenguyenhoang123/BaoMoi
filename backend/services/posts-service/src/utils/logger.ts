import { format } from 'util';
import { inspect } from 'util';

// Set default encoding for console output
process.stdout.setDefaultEncoding('utf8');

// Custom stringify that handles circular references and supports UTF-8
const stringify = (obj: any): string => {
  if (typeof obj === 'string') return obj;
  if (obj instanceof Error) return obj.stack || obj.message;
  if (obj === undefined || obj === null) return '';
  
  return inspect(obj, {
    showHidden: false,
    depth: 5,
    colors: false,
    maxArrayLength: 10,
    breakLength: Infinity,
    compact: 3,
    sorted: true,
    getters: false,
    showProxy: false
  });
};

// Get current timestamp in local timezone
const getTimestamp = (): string => {
  return new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false
  });
};

// Logger với hỗ trợ UTF-8 và định dạng tiếng Việt
const logger = {
  // Ghi log lỗi
  error: (thongBao: string, loi?: any): void => {
    const noiDungLoi = loi ? `\n${stringify(loi)}` : '';
    console.error(`[${getTimestamp()}] [LỖI] ${thongBao}${noiDungLoi}`);
  },
  
  // Ghi log thông tin
  info: (thongBao: string, duLieu?: any): void => {
    const noiDung = duLieu ? `\n${stringify(duLieu)}` : '';
    console.log(`[${getTimestamp()}] [THÔNG TIN] ${thongBao}${noiDung}`);
  },
  
  // Ghi log debug (chỉ trong môi trường phát triển)
  debug: (thongBao: string, duLieu?: any): void => {
    if (process.env.NODE_ENV !== 'production') {
      const noiDung = duLieu ? `\n${stringify(duLieu)}` : '';
      console.debug(`[${getTimestamp()}] [GỠ LỖI] ${thongBao}${noiDung}`);
    }
  },
  
  // Ghi log cảnh báo
  warn: (thongBao: string, duLieu?: any): void => {
    const noiDung = duLieu ? `\n${stringify(duLieu)}` : '';
    console.warn(`[${getTimestamp()}] [CẢNH BÁO] ${thongBao}${noiDung}`);
  },
  
  // Ghi log HTTP
  http: (thongBao: string, meta?: any): void => {
    const noiDungMeta = meta ? `\n${stringify(meta)}` : '';
    console.log(`[${getTimestamp()}] [MẠNG] ${thongBao}${noiDungMeta}`);
  }
};

// Hỗ trợ cả default và named export
export { logger };
export default logger;
