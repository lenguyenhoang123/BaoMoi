"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = void 0;
const database_1 = require("./database");
const logger_1 = require("../utils/logger");
/**
 * Khởi tạo cơ sở dữ liệu và các bảng cần thiết
 */
const initDatabase = async () => {
    try {
        logger_1.logger.info('🔄 Đang khởi tạo cơ sở dữ liệu...');
        // Tạo bảng comments nếu chưa tồn tại
        await (0, database_1.query)(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);
        // Tạo index để tối ưu hiệu năng truy vấn
        await (0, database_1.query)('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
        await (0, database_1.query)('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
        await (0, database_1.query)('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)');
        await (0, database_1.query)('CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved)');
        logger_1.logger.info('✅ Cơ sở dữ liệu đã được khởi tạo thành công');
    }
    catch (error) {
        logger_1.logger.error('❌ Lỗi khi khởi tạo cơ sở dữ liệu:', error);
        throw error;
    }
};
exports.initDatabase = initDatabase;
exports.default = exports.initDatabase;
