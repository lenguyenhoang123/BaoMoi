declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      HOST?: string;
      
      // Database
      DB_HOST: string;
      DB_PORT: string;
      DB_USER: string;
      DB_PASS: string;
      DB_NAME: string;
      DB_SSL?: string;
      
      // JWT
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      REFRESH_TOKEN_SECRET: string;
      REFRESH_TOKEN_EXPIRES_IN: string;
      
      // Logging
      LOG_LEVEL?: string;
      LOG_TO_FILE?: string;
      LOG_DIR?: string;
      
      // CORS
      ALLOWED_ORIGINS?: string;
      
      // Other
      [key: string]: string | undefined;
    }
  }
}

export {};
