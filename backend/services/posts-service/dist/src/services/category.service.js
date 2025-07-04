"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const CATEGORY_SERVICE_URL = process.env.CATEGORY_SERVICE_URL || 'http://localhost:3009';
class CategoryService {
    /**
     * Kiểm tra kết nối đến Category Service
     * @returns Promise<boolean> true nếu kết nối thành công, false nếu thất bại
     */
    static async testConnection() {
        const url = `${process.env.API_GATEWAY_URL || 'http://localhost:3000'}/api/categories`;
        logger_1.logger.info(`🔍 Đang kiểm tra kết nối đến Category Service thông qua API Gateway: ${url}`);
        try {
            const response = await axios_1.default.get(url, {
                timeout: 3000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            const isOk = response.status === 200 && response.data?.success === true;
            if (isOk) {
                const count = response.data.data?.length || 0;
                logger_1.logger.info(`✅ Kết nối thành công. Tìm thấy ${count} danh mục`);
                if (count > 0) {
                    logger_1.logger.debug('Danh sách danh mục:', response.data.data.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
                }
            }
            else {
                logger_1.logger.warn('⚠️ Kết nối không thành công hoặc dữ liệu không hợp lệ');
            }
            return isOk;
        }
        catch (error) {
            logger_1.logger.error('❌ Lỗi khi kiểm tra kết nối đến Category Service:', {
                message: error.message,
                code: error.code,
                url: url
            });
            return false;
        }
    }
    /**
     * Lấy thông tin chi tiết của một danh mục
     * @param categoryId ID của danh mục cần lấy
     * @returns Thông tin chi tiết của danh mục hoặc null nếu không tìm thấy
     */
    static async getCategoryById(identifier, bySlug = false) {
        if (!identifier) {
            logger_1.logger.warn('⚠️ getCategoryById được gọi với identifier rỗng');
            return null;
        }
        const identifierType = bySlug ? 'slug' : 'ID';
        logger_1.logger.info(`🔍 Đang tìm kiếm danh mục theo ${identifierType}: ${identifier}`);
        try {
            // Thử lấy tất cả danh mục trước
            logger_1.logger.info('🔄 Đang lấy danh sách tất cả danh mục...');
            const allCategories = await this.getCategories();
            // Kiểm tra xem danh mục có trong danh sách không
            const foundCategory = bySlug
                ? allCategories.find(cat => cat.slug === identifier)
                : allCategories.find(cat => cat.id === identifier);
            if (foundCategory) {
                logger_1.logger.info(`✅ Tìm thấy danh mục trong cache: ${foundCategory.name} (${identifierType}: ${identifier})`);
                return foundCategory;
            }
            // Nếu không tìm thấy trong danh sách, thử gọi trực tiếp đến endpoint
            const baseUrl = `${process.env.API_GATEWAY_URL || 'http://localhost:3000'}/api/categories`;
            const url = bySlug
                ? `${baseUrl}/slug/${identifier}`
                : `${baseUrl}/${identifier}`;
            logger_1.logger.warn(`⚠️ Không tìm thấy trong cache, thử gọi trực tiếp: ${url}`);
            const response = await axios_1.default.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            logger_1.logger.debug(`📥 Phản hồi từ API danh mục (${response.status}):`, {
                success: response.data.success,
                hasData: !!response.data.data,
                message: response.data.message
            });
            if (response.data?.success && response.data.data) {
                logger_1.logger.info(`✅ Lấy thông tin danh mục ${identifier} thành công`);
                return response.data.data;
            }
            logger_1.logger.warn(`❌ Không tìm thấy danh mục ${identifier}`);
            return null;
        }
        catch (error) {
            // Ghi log chi tiết lỗi
            const errorDetails = {
                message: error.message,
                code: error.code,
                stack: error.stack,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                    data: error.config?.data
                },
                response: error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                } : 'No response',
                request: error.request ? 'Request was made but no response received' : 'No request was made',
                identifier: identifier,
                bySlug: bySlug
            };
            if (error.code === 'ECONNABORTED') {
                logger_1.logger.error(`⏱️ Yêu cầu đến category service đã hết thời gian chờ sau 5s`, errorDetails);
            }
            else if (error.response) {
                // Yêu cầu đã được thực hiện và server đã phản hồi với mã trạng thái lỗi
                if (error.response.status === 404) {
                    const identifierType = bySlug ? 'slug' : 'ID';
                    logger_1.logger.error(`🔍 Không tìm thấy danh mục với ${identifierType}: ${identifier}`, errorDetails);
                }
                else {
                    logger_1.logger.error(`❌ Lỗi từ category service (${error.response.status}):`, errorDetails);
                }
            }
            else if (error.request) {
                // Yêu cầu đã được gửi đi nhưng không nhận được phản hồi
                logger_1.logger.error('❌ Không nhận được phản hồi từ category service', errorDetails);
            }
            else {
                // Có lỗi xảy ra khi thiết lập yêu cầu
                logger_1.logger.error('❌ Lỗi khi thiết lập yêu cầu đến category service', errorDetails);
            }
            return null;
        }
    }
    /**
     * Lấy tất cả danh mục
     * @returns Mảng các danh mục hoặc mảng rỗng nếu có lỗi
     */
    static async getCategories() {
        const url = `${process.env.API_GATEWAY_URL || 'http://localhost:3000'}/api/categories`;
        logger_1.logger.info(`🌐 Đang gọi API lấy danh sách danh mục: ${url}`);
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            logger_1.logger.debug(`📥 Phản hồi từ API danh mục (${response.status}):`, {
                success: response.data.success,
                count: response.data.data?.length || 0,
                message: response.data.message
            });
            if (response.data.success && Array.isArray(response.data.data)) {
                logger_1.logger.info(`✅ Lấy thành công ${response.data.data.length} danh mục`);
                return response.data.data;
            }
            logger_1.logger.warn('⚠️ Không có dữ liệu danh mục hợp lệ');
            return [];
        }
        catch (error) {
            logger_1.logger.error('Lỗi khi lấy danh sách danh mục:', {
                message: error.message,
                code: error.code,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                },
                response: error.response?.data || 'No response data'
            });
            return [];
        }
    }
    /**
     * Kiểm tra danh mục có tồn tại không
     * @param categoryId ID của danh mục cần kiểm tra
     * @returns true nếu danh mục tồn tại, false nếu không
     */
    static async validateCategory(categoryId) {
        try {
            await axios_1.default.head(`${CATEGORY_SERVICE_URL}/api/categories/${categoryId}`, {
                timeout: 3000 // 3s 
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Xác thực danh mục thất bại cho ${categoryId}:`, error.message);
            return false;
        }
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map