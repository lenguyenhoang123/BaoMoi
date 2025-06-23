"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
// Cấu hình kiểu dữ liệu số
pg_1.types.setTypeParser(1700, parseFloat); // Xử lý kiểu dữ liệu numeric
let pool = null;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 giây
const config = {
    isConnected: false,
    async init() {
        if (pool) {
            console.log('🔌 Đã kết nối tới cơ sở dữ liệu');
            return;
        }
        const poolConfig = {
            user: process.env.POSTGRES_USER || 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            database: process.env.POSTGRES_DB || 'posts_db',
            password: process.env.POSTGRES_PASSWORD || '123',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            max: 20,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            // Cấu hình hỗ trợ tiếng Việt
            client_encoding: 'utf8mb4',
            // Tự động kết nối lại
            keepAlive: true,
            // Thời gian sống tối đa của kết nối (ms)
            maxLifetimeMillis: 3600000,
            // Thời gian giữa các lần kiểm tra kết nối (ms)
            idle_in_transaction_session_timeout: 10000
        };
        console.log('🔄 Đang kết nối tới cơ sở dữ liệu...');
        console.log(`📡 Host: ${poolConfig.host}:${poolConfig.port}`);
        console.log(`💾 Database: ${poolConfig.database}`);
        pool = new pg_1.Pool(poolConfig);
        // Kiểm tra kết nối
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW() as current_time');
            console.log('✅ Kết nối cơ sở dữ liệu thành công');
            console.log(`⏰ Thời gian hiện tại: ${result.rows[0].current_time}`);
            this.isConnected = true;
            client.release();
            retryCount = 0; // Reset lại số lần thử lại
        }
        catch (error) {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
                console.error(`❌ Lỗi kết nối cơ sở dữ liệu (${retryCount}/${MAX_RETRIES}):`, error.message);
                console.log(`⏳ Thử lại sau ${RETRY_DELAY / 1000} giây...`);
                // Thử lại sau một khoảng thời gian
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return this.init();
            }
            else {
                console.error('❌ Không thể kết nối tới cơ sở dữ liệu sau nhiều lần thử');
                process.exit(1);
            }
        }
    },
    async query(text, params = []) {
        if (!pool) {
            await this.init();
        }
        if (!pool) {
            throw new Error('Không thể khởi tạo kết nối cơ sở dữ liệu');
        }
        try {
            const start = Date.now();
            const result = await pool.query(text, params);
            const duration = Date.now() - start;
            // Ghi log các câu truy vấn chậm (lớn hơn 100ms)
            if (duration > 100) {
                console.log(`🐌 Truy vấn chậm (${duration}ms):`, {
                    truy_vấn: text,
                    tham_số: params,
                    thời_gian: `${duration}ms`
                });
            }
            return {
                rows: result.rows,
                rowCount: result.rowCount || 0
            };
        }
        catch (error) {
            console.error('❌ Lỗi truy vấn cơ sở dữ liệu:', {
                truy_vấn: text,
                tham_số: params,
                lỗi: error.message
            });
            throw error;
        }
    },
    async getClient() {
        if (!pool) {
            await this.init();
        }
        if (!pool) {
            throw new Error('Database pool is not initialized');
        }
        try {
            const client = await pool.connect();
            return {
                query: async (text, params = []) => {
                    return client.query(text, params);
                },
                release: (err) => client.release(err),
            };
        }
        catch (error) {
            console.error('❌ Lỗi khi lấy client từ pool:', error.message);
            throw error;
        }
    },
    async end() {
        if (pool) {
            try {
                await pool.end();
                pool = null;
                this.isConnected = false;
                console.log('✅ Đã đóng kết nối pool cơ sở dữ liệu');
            }
            catch (error) {
                console.error('❌ Lỗi khi đóng kết nối pool:', error.message);
                throw error;
            }
        }
        else {
            console.log('ℹ️ Không có kết nối pool nào để đóng');
        }
    }
};
// Xử lý sự kiện khi ứng dụng kết thúc
const handleShutdown = async () => {
    console.log('\n🛑 Đang đóng kết nối cơ sở dữ liệu...');
    try {
        await config.end();
        console.log('👋 Đã đóng kết nối cơ sở dữ liệu');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Lỗi khi đóng kết nối cơ sở dữ liệu:', error.message);
        process.exit(1);
    }
};
// Bắt sự kiện tắt máy chủ
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
// Khởi tạo kết nối cơ sở dữ liệu
if (process.env.NODE_ENV !== 'test') {
    config.init().catch((error) => {
        console.error('❌ Lỗi khởi tạo cơ sở dữ liệu:', error.message);
        setTimeout(() => process.exit(1), 1000);
    });
}
exports.default = config;
//# sourceMappingURL=database.js.map