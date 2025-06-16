"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadSingleImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${(0, uuid_1.v4)()}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images are allowed.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn kích thước file 5MB
    },
});
// Middleware để tải lên một ảnh đơn lẻ
const uploadSingleImage = (fieldName) => exports.upload.single(fieldName);
exports.uploadSingleImage = uploadSingleImage;
// Middleware để tải lên nhiều ảnh (mặc định tối đa 5 ảnh)
const uploadMultipleImages = (fieldName, maxCount = 5) => exports.upload.array(fieldName, maxCount);
exports.uploadMultipleImages = uploadMultipleImages;
//# sourceMappingURL=upload.js.map