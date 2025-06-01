"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
// Tải các biến môi trường
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
let pool = null;
const config = {
    isConnected: false,
    async init() {
        await this.initPostgreSQL();
    },
    async initPostgreSQL() {
        if (pool) {
            return pool;
        }
        const poolConfig = {
            user: process.env.POSTGRES_USER || 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            database: process.env.POSTGRES_DB || 'posts_db',
            password: process.env.POSTGRES_PASSWORD || '123',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            max: 10,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 2000,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };
        try {
            logger_1.default.info('PostgreSQL Database configuration:', poolConfig);
            pool = new pg_1.Pool(poolConfig);
            // Kiểm tra kết nối
            const client = await pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.isConnected = true;
            logger_1.default.info('Successfully connected to PostgreSQL database');
            return pool;
        }
        catch (error) {
            logger_1.default.error('Error connecting to PostgreSQL:', error);
            throw error;
        }
    },
    async query(text, params = [], callback) {
        try {
            if (!pool) {
                await this.initPostgreSQL();
            }
            if (!pool) {
                throw new Error('Database connection not initialized');
            }
            const start = Date.now();
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            logger_1.default.debug('Executed query', {
                text,
                duration,
                rows: res.rowCount
            });
            if (callback) {
                callback(null, res);
            }
            return res;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.default.error('Error executing query:', {
                query: text,
                error: errorMessage
            });
            if (callback) {
                const err = error instanceof Error ? error : new Error(errorMessage);
                callback(err, {});
            }
            throw error;
        }
    },
    async getClient() {
        if (!pool) {
            await this.initPostgreSQL();
        }
        if (!pool) {
            throw new Error('Database connection not initialized');
        }
        return await pool.connect();
    },
    async end() {
        if (pool) {
            await pool.end();
            pool = null;
            this.isConnected = false;
            logger_1.default.info('Database connection pool has been closed');
        }
    }
};
// Khởi tạo cơ sở dữ liệu
config.init().catch(error => {
    logger_1.default.error('Failed to initialize database:', error);
    process.exit(1);
});
exports.default = config;
//# sourceMappingURL=database.js.map