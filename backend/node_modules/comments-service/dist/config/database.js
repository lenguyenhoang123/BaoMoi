"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.initDatabase = exports.testConnection = exports.pool = exports.closePool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
// Cấu hình kết nối database
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'comments_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Số lượng kết nối tối đa trong pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10), // Thời gian chờ tối đa khi kết nối nhàn rỗi
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000', 10), // Thời gian chờ kết nối
};
// Tạo mới pool kết nối
const pool = new pg_1.Pool(dbConfig);
exports.pool = pool;
/**
 * Kiểm tra kết nối đến database
 */
const testConnection = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT NOW() as now');
        logger_1.logger.info(`Kết nối database thành công: ${res.rows[0].now}`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        logger_1.logger.error('Lỗi kết nối database:', { error: errorMessage });
        throw new Error('Không thể kết nối đến database');
    }
    finally {
        client.release();
    }
};
exports.testConnection = testConnection;
/**
 * Khởi tạo các bảng trong database
 */
const initDatabase = async () => {
    const client = await pool.connect();
    try {
        // Bắt đầu transaction
        await client.query('BEGIN');
        // Tạo bảng comments nếu chưa tồn tại
        await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        parent_id INTEGER,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      );
    `);
        // Tạo các index để tối ưu hiệu năng truy vấn
        await client.query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved)');
        // Commit transaction
        await client.query('COMMIT');
        logger_1.logger.info('Khởi tạo database thành công');
    }
    catch (error) {
        // Rollback nếu có lỗi
        await client.query('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        logger_1.logger.error('Lỗi khi khởi tạo database:', { error: errorMessage });
        throw error;
    }
    finally {
        client.release();
    }
};
exports.initDatabase = initDatabase;
/**
 * Hàm thực thi câu truy vấn SQL với kiểu dữ liệu generic
 * @param text - Câu truy vấn SQL
 * @param params - Các tham số cho câu truy vấn
 * @returns Kết quả truy vấn
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // Log câu query (chỉ trong môi trường development)
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.debug('Executed query', {
                text,
                duration: `${duration}ms`,
                rows: res.rowCount,
            });
        }
        return res;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        logger_1.logger.error('Query error', {
            text,
            params,
            error: errorMessage,
        });
        if (error instanceof Error) {
            // Thêm thông tin về lỗi database nếu có
            if ('code' in error && typeof error.code === 'string') {
                error.code = error.code; // Thêm type assertion
            }
            if ('constraint' in error && typeof error.constraint === 'string') {
                error.constraint = error.constraint; // Thêm type assertion
            }
        }
        throw error;
    }
};
exports.query = query;
// Xử lý sự kiện lỗi từ pool
pool.on('error', (err) => {
    logger_1.logger.error('Unexpected error on idle client', { error: err.message });
    process.exit(-1);
});
// Xử lý tắt ứng dụng
const closePool = async () => {
    logger_1.logger.info('Closing database connection pool...');
    await pool.end();
    logger_1.logger.info('Database connection pool closed');
};
exports.closePool = closePool;
