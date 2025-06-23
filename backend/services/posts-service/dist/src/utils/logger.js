"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const util_1 = require("util");
// Set default encoding for console output
process.stdout.setDefaultEncoding('utf8');
// Custom stringify that handles circular references and supports UTF-8
const stringify = (obj) => {
    if (typeof obj === 'string')
        return obj;
    if (obj instanceof Error)
        return obj.stack || obj.message;
    if (obj === undefined || obj === null)
        return '';
    return (0, util_1.inspect)(obj, {
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
const getTimestamp = () => {
    return new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false
    });
};
// Logger với hỗ trợ UTF-8 và định dạng tiếng Việt
const logger = {
    // Ghi log lỗi
    error: (thongBao, loi) => {
        const noiDungLoi = loi ? `\n${stringify(loi)}` : '';
        console.error(`[${getTimestamp()}] [LỖI] ${thongBao}${noiDungLoi}`);
    },
    // Ghi log thông tin
    info: (thongBao, duLieu) => {
        const noiDung = duLieu ? `\n${stringify(duLieu)}` : '';
        console.log(`[${getTimestamp()}] [THÔNG TIN] ${thongBao}${noiDung}`);
    },
    // Ghi log debug (chỉ trong môi trường phát triển)
    debug: (thongBao, duLieu) => {
        if (process.env.NODE_ENV !== 'production') {
            const noiDung = duLieu ? `\n${stringify(duLieu)}` : '';
            console.debug(`[${getTimestamp()}] [GỠ LỖI] ${thongBao}${noiDung}`);
        }
    },
    // Ghi log cảnh báo
    warn: (thongBao, duLieu) => {
        const noiDung = duLieu ? `\n${stringify(duLieu)}` : '';
        console.warn(`[${getTimestamp()}] [CẢNH BÁO] ${thongBao}${noiDung}`);
    },
    // Ghi log HTTP
    http: (thongBao, meta) => {
        const noiDungMeta = meta ? `\n${stringify(meta)}` : '';
        console.log(`[${getTimestamp()}] [MẠNG] ${thongBao}${noiDungMeta}`);
    }
};
exports.logger = logger;
exports.default = logger;
//# sourceMappingURL=logger.js.map