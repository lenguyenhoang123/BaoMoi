declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    JWT_SECRET: string;
    DB_SSL?: string;
    SSL_KEY?: string;
    SSL_CERT?: string;
  }
}
