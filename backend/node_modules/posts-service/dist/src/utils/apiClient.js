"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryById = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const CATEGORIES_SERVICE_URL = process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3002';
const apiClient = axios_1.default.create({
    baseURL: CATEGORIES_SERVICE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});
const getCategoryById = async (id) => {
    try {
        const response = await apiClient.get(`/api/categories/${id}`);
        return response.data.data;
    }
    catch (error) {
        console.error('Error fetching category:', error);
        return null;
    }
};
exports.getCategoryById = getCategoryById;
exports.default = {
    getCategoryById: exports.getCategoryById,
};
//# sourceMappingURL=apiClient.js.map