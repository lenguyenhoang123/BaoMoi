import { Request, Response } from 'express';
import { ApiResponse } from '../types';
/**
 * Lớp controller cơ sở cung cấp các chức năng chung cho tất cả các controller
 */
export default class BaseController {
    /**
     * Gửi phản hồi thành công
     * @param res Đối tượng response của Express
     * @param data Dữ liệu trả về
     * @param message Thông báo thành công (tùy chọn)
     * @param statusCode Mã trạng thái HTTP (mặc định: 200)
     */
    protected sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response<ApiResponse<T>>;
    /**
     * Gửi phản hồi dữ liệu phân trang
     * @param res Đối tượng response của Express
     * @param data Mảng dữ liệu
     * @param total Tổng số bản ghi
     * @param page Trang hiện tại
     * @param limit Số bản ghi mỗi trang
     * @param message Thông báo thành công (tùy chọn)
     */
    protected sendPaginated<T>(res: Response, data: T[], total: number, page: number, limit: number, message?: string): void;
    /**
     * Gửi phản hồi lỗi
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi
     * @param statusCode Mã trạng thái HTTP (mặc định: 500)
     * @param errors Mảng các lỗi validate (tùy chọn)
     */
    protected sendError(res: Response, message?: string, statusCode?: number, errors?: any[]): void;
    /**
     * Gửi phản hồi lỗi validate
     * @param res Đối tượng response của Express
     * @param errors Danh sách lỗi validate
     * @param message Thông báo lỗi (mặc định: 'Lỗi validate')
     */
    protected sendValidationError(res: Response, errors: Record<string, string[]> | string[], message?: string): void;
    /**
     * Gửi phản hồi không tìm thấy (404)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Không tìm thấy tài nguyên')
     */
    protected sendNotFound(res: Response, message?: string): void;
    /**
     * Gửi phản hồi chưa xác thực (401)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Chưa xác thực')
     */
    protected sendUnauthorized(res: Response, message?: string): void;
    /**
     * Gửi phản hồi từ chối truy cập (403)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Từ chối truy cập')
     */
    protected sendForbidden(res: Response, message?: string): void;
    /**
     * Gửi phản hồi xung đột (409)
     * @param res Đối tượng response của Express
     * @param message Thông báo lỗi (mặc định: 'Xung đột dữ liệu')
     */
    protected sendConflict(res: Response, message?: string): void;
    /**
     * Phân tích tham số phân trang từ query string
     * @param req Đối tượng request của Express
     * @returns Đối tượng chứa trang hiện tại và số lượng bản ghi mỗi trang
     */
    protected getPaginationParams(req: Request): {
        page: number;
        limit: number;
    };
}
//# sourceMappingURL=base.controller.d.ts.map