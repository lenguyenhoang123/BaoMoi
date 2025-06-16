"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Bọc một hàm bất đồng bộ để xử lý lỗi và chuyển tiếp chúng đến middleware xử lý lỗi của Express
 * @param fn Hàm bất đồng bộ cần được bọc
 * @returns Một hàm mới có khả năng xử lý lỗi
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };
};
exports.default = catchAsync;
//# sourceMappingURL=catchAsync.js.map