"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Use CommonJS __dirname
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
// Load environment variables from the root .env file
dotenv_1.default.config({ path: path_1.default.join(currentDir, '../.env') });
async function runMigration() {
    const pool = new pg_1.Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'posts_db',
        password: process.env.POSTGRES_PASSWORD || '123',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    });
    const client = await pool.connect();
    try {
        console.log('Bắt đầu thêm cột category vào bảng posts...');
        // Kiểm tra xem cột đã tồn tại chưa
        const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'category';
    `;
        const result = await client.query(checkQuery);
        if (result.rows.length === 0) {
            // Thêm cột mới nếu chưa tồn tại
            const alterQuery = `
        ALTER TABLE posts 
        ADD COLUMN category VARCHAR(50) DEFAULT 'chung';
      `;
            await client.query(alterQuery);
            console.log('✅ Đã thêm cột category vào bảng posts');
            // Cập nhật giá trị mặc định cho các bài viết cũ
            const updateQuery = `
        UPDATE posts 
        SET category = 'chung' 
        WHERE category IS NULL;
      `;
            await client.query(updateQuery);
            console.log('✅ Đã cập nhật giá trị mặc định cho các bài viết cũ');
        }
        else {
            console.log('ℹ️  Cột category đã tồn tại trong bảng posts');
        }
        console.log('✅ Migration hoàn thành!');
    }
    catch (error) {
        console.error('❌ Lỗi khi chạy migration:', error);
        throw error;
    }
    finally {
        client.release();
        await pool.end();
    }
}
// Chạy migration
runMigration().catch(console.error);
//# sourceMappingURL=20250524_add_category_to_posts.js.map