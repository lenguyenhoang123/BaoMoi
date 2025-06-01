import { RequestHandler } from 'express';
/**
 * Bọc một hàm bất đồng bộ để xử lý lỗi và chuyển tiếp chúng đến middleware xử lý lỗi của Express
 * @param fn Hàm bất đồng bộ cần được bọc
 * @returns Một hàm mới có khả năng xử lý lỗi
 */
declare const catchAsync: <T extends RequestHandler>(fn: T) => RequestHandler;
export default catchAsync;
//# sourceMappingURL=catchAsync.d.ts.map