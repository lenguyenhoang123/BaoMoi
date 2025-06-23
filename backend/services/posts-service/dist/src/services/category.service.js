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
     * Lấy thông tin chi tiết của một danh mục
     * @param categoryId ID của danh mục cần lấy
     * @returns Thông tin chi tiết của danh mục hoặc null nếu không tìm thấy
     */
    static async getCategoryById(categoryId) {
        if (!categoryId) {
            logger_1.logger.warn('getCategoryById called with empty categoryId');
            return null;
        }
        try {
            logger_1.logger.info(`Fetching category with ID: ${categoryId}`);
            // First try to get all categories
            const allCategories = await this.getCategories();
            // Try to find the category in the list
            const foundCategory = allCategories.find(cat => cat.id === categoryId);
            if (foundCategory) {
                logger_1.logger.info(`Found category ${categoryId} in categories list`);
                return foundCategory;
            }
            // If not found in the list, try the direct endpoint as fallback
            logger_1.logger.info(`Category ${categoryId} not found in categories list, trying direct endpoint...`);
            const url = `${CATEGORY_SERVICE_URL}/categories/${categoryId}`;
            logger_1.logger.debug(`Request URL: ${url}`);
            const response = await axios_1.default.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            logger_1.logger.debug(`Response status: ${response.status}`, {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            if (response.data?.success && response.data.data) {
                logger_1.logger.info(`Successfully fetched category ${categoryId}`);
                return response.data.data;
            }
            logger_1.logger.warn(`Category ${categoryId} not found or invalid response format`);
            return null;
        }
        catch (error) {
            if (error.code === 'ECONNABORTED') {
                logger_1.logger.warn(`Timeout khi lấy thông tin danh mục ${categoryId}`);
            }
            else if (error.response?.status === 404) {
                logger_1.logger.warn(`Không tìm thấy danh mục: ${categoryId}`);
            }
            else {
                logger_1.logger.error(`Lỗi khi lấy thông tin danh mục ${categoryId}:`, error.message);
            }
            return null;
        }
    }
    /**
     * Lấy danh sách tất cả các danh mục
     * @returns Danh sách các danh mục
     */
    static async getCategories() {
        try {
            const response = await axios_1.default.get(`${CATEGORY_SERVICE_URL}/categories`, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 3000
            });
            // Giả sử API trả về dạng { success: true, data: [...] }
            if (response.data?.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Lỗi khi lấy danh sách danh mục:', error.message);
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