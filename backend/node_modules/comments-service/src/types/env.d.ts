namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    COMMENTS_SERVICE_PORT: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
  }
}
