import { config as dotenvConfig } from 'dotenv';

// Tải cấu hình từ file .env
dotenvConfig();

// Định nghĩa cấu hình cho các môi trường khác nhau
interface Config {
  [key: string]: {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql';
    logging: boolean | ((sql: string, timing?: number) => void);
  };
}

// Cấu hình cho các môi trường
const config: Config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'categories_service_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME_TEST || 'categories_service_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'categories_service_prod',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  },
};

export default config;
