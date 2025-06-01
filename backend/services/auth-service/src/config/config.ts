import dotenv from 'dotenv';
import path from 'path';

// Đường dẫn đến file .env của auth service
const AUTH_ENV_PATH = path.join(__dirname, '../../.env');

// Tải biến môi trường từ file .env của auth service
dotenv.config({ path: AUTH_ENV_PATH });

// Log thông báo xác nhận đã tải file .env
console.log(`[CONFIG] Đang tải cấu hình từ: ${AUTH_ENV_PATH}`);

interface DatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: 'postgres';
  logging: boolean | ((sql: string, timing?: number) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  passwordResetExpiresIn: string;
  emailVerificationExpiresIn: string;
  maxLoginAttempts: number;
  lockTime: number; // in minutes
}

interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  apiPrefix: string;
}

// Kiểm tra các biến môi trường bắt buộc
const requiredDbVars = ['DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', 'DB_HOST', 'DB_PORT'];
const missingDbVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingDbVars.length > 0) {
  console.error(`[CONFIG] Lỗi: Thiếu các biến môi trường bắt buộc: ${missingDbVars.join(', ')}`);
  console.error(`[CONFIG] Vui lòng kiểm tra lại file .env tại: ${AUTH_ENV_PATH}`);
  process.exit(1);
}

const config = {
  db: {
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    dialect: 'postgres' as const,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  } as DatabaseConfig,
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    passwordResetExpiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
    emailVerificationExpiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockTime: parseInt(process.env.ACCOUNT_LOCK_TIME || '15', 10), // in minutes
  } as AuthConfig,
  
  server: {
    port: parseInt(process.env.PORT || '3005', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    apiPrefix: process.env.API_PREFIX || '/api/auth',
  } as ServerConfig,
};

export default config;
