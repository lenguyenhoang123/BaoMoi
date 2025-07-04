"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const knex_1 = __importDefault(require("knex"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Initialize Knex with configuration
const knex = knex_1.default.knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'baomoi'
    },
    migrations: {
        tableName: 'knex_migrations',
        directory: path.join(__dirname, '.')
    }
});
async function runMigrations() {
    try {
        // Đọc tất cả các file migration từ thư mục hiện tại
        const migrationsDir = path.join(__dirname);
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.ts') && file !== 'migrate.ts')
            .sort();
        console.log('Found migrations:', files);
        // Tạo bảng migrations nếu chưa tồn tại
        await knex.schema.hasTable('knex_migrations').then(async (exists) => {
            if (!exists) {
                await knex.migrate.latest();
            }
        });
        // Thực thi từng migration
        for (const file of files) {
            console.log(`\nRunning migration: ${file}`);
            const migration = require(`./${file}`);
            await migration.up(knex);
            console.log(`✓ ${file} completed`);
        }
        console.log('\n✅ All migrations completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=migrate.js.map