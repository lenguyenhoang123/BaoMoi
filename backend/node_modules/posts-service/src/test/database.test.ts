import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

// Tải biến môi trường
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Tạo kết nối mới
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'posts_db',
  password: process.env.DB_PASSWORD || '123',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 5, // Số kết nối tối đa
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Hàm kiểm tra kết nối
async function testConnection() {
  logger.info('🔄 Đang kiểm tra kết nối đến PostgreSQL...');
  
  try {
    const client = await pool.connect();
    logger.info('✅ Kết nối thành công!');
    
    // Thực hiện một truy vấn đơn giản
    const result = await client.query('SELECT version()');
    logger.info('📊 Phiên bản PostgreSQL:', result.rows[0].version);
    
    // Kiểm tra bảng posts
    try {
      // Đếm tổng số bản ghi
      const countRes = await client.query('SELECT COUNT(*) as total FROM posts');
      const totalPosts = parseInt(countRes.rows[0].total);
      
      // Lấy 5 bản ghi đầu tiên để xem thông tin
      const sampleRes = await client.query('SELECT id, title, created_at FROM posts ORDER BY id LIMIT 5');
      
      logger.info(`✅ Bảng posts tồn tại với ${totalPosts} bản ghi`);
      logger.info('📝 Mẫu dữ liệu:', sampleRes.rows);
    } catch (err: any) {
      logger.warn('⚠️ Không thể truy vấn bảng posts:', err?.message || err);
    }
    
    client.release();
  } catch (err: any) {
    logger.error('❌ Lỗi kết nối đến PostgreSQL:', err?.message || err);
    logger.error('Chi tiết lỗi:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'posts_db',
      user: process.env.DB_USER || 'postgres',
    });
  } finally {
    await pool.end();
    logger.info('Đã đóng kết nối đến PostgreSQL');
  }
}

// Chạy test
testConnection().catch(console.error);
