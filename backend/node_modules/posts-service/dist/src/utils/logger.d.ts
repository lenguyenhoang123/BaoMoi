declare const logger: {
    error: (thongBao: string, loi?: any) => void;
    info: (thongBao: string, duLieu?: any) => void;
    debug: (thongBao: string, duLieu?: any) => void;
    warn: (thongBao: string, duLieu?: any) => void;
    http: (thongBao: string, meta?: any) => void;
};
export { logger };
export default logger;
//# sourceMappingURL=logger.d.ts.map