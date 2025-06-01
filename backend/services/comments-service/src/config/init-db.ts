import { query } from './database';
import { logger } from '../utils/logger';

/**
 * Khởi tạo cơ sở dữ liệu và các bảng cần thiết
 */
export const initDatabase = async (): Promise<void> => {
  try {
    logger.info('🔄 Đang khởi tạo cơ sở dữ liệu...');

    // Tạo bảng comments nếu chưa tồn tại
    await query(`
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
    await query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved)');

    logger.info('✅ Cơ sở dữ liệu đã được khởi tạo thành công');
  } catch (error) {
    logger.error('❌ Lỗi khi khởi tạo cơ sở dữ liệu:', error);
    throw error;
  }
};

export default initDatabase;
