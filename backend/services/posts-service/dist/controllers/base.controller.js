"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Lớp controller cơ sở cung cấp các chức năng chung cho tất cả các controller
 */
class BaseController {
    /**
     * Gửi phản hồi thành công
     * @param res Đối tượng response của Express
     * @param data Dữ liệu trả về
     * @param message Thông báo thành công (tùy chọn)
     * @param statusCode Mã trạng thái HTTP (mặc định: 200)
     */
    sendSuccess(res, data, message = 'Thành công', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }
    /**
     * Gửi phản hồi dữ liệu phân trang
     * @param res Đối tượng response của Express
     * @param data Mảng dữ liệu
     * @param total Tổng số bản ghi
     * @param page Trang hiện tại
     * @param limit Số bản ghi mỗi trang
     * @param message Thông báo thành công (tùy chọn)
     */
    sendPaginated(res, data, total, page, limit, message = 'Thành công') {
        const totalPages = Math.ceil(total / limit);
        this.sendSuccess(res, {
            items: data,
            total,
            page,
            totalPages,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        }, message);
    }
    /**
     * Gửi phản hồi lỗi
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi
     * @param statusCode Mã trạng thái HTTP (mặc định: 500)
     * @param errors Mảng các lỗi validate (tùy chọn)
     */
    sendError(res, message = 'Lỗi máy chủ nội bộ', statusCode = 500, errors = []) {
        res.status(statusCode).json({
            success: false,
            message,
            errors: errors.length > 0 ? errors : undefined,
        });
    }
    /**
     * Gửi phản hồi lỗi validate
     * @param res Đối tượng response của Express
     * @param errors Danh sách lỗi validate
     * @param message Thông báo lỗi (mặc định: 'Lỗi validate')
     */
    sendValidationError(res, errors, message = 'Lỗi validate') {
        this.sendError(res, message, 400, Array.isArray(errors) ? errors : [errors]);
    }
    /**
     * Gửi phản hồi không tìm thấy (404)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Không tìm thấy tài nguyên')
     */
    sendNotFound(res, message = 'Không tìm thấy tài nguyên') {
        this.sendError(res, message, 404);
    }
    /**
     * Gửi phản hồi chưa xác thực (401)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Chưa xác thực')
     */
    sendUnauthorized(res, message = 'Chưa xác thực') {
        this.sendError(res, message, 401);
    }
    /**
     * Gửi phản hồi từ chối truy cập (403)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Từ chối truy cập')
     */
    sendForbidden(res, message = 'Từ chối truy cập') {
        this.sendError(res, message, 403);
    }
    /**
     * Gửi phản hồi xung đột (409)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Xung đột dữ liệu')
     */
    sendConflict(res, message = 'Xung đột dữ liệu') {
        this.sendError(res, message, 409);
    }
    /**
     * Phân tích tham số phân trang từ query string
     * @param req Đối tượng request của Express
     * @returns Đối tượng chứa trang hiện tại và số lượng bản ghi mỗi trang
     */
    getPaginationParams(req) {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100); // Tối đa 100 bản ghi mỗi trang
        return { page, limit };
    }
}
exports.default = BaseController;
//# sourceMappingURL=base.controller.js.map