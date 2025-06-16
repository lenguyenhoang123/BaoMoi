/**
 * Environment variable types and interfaces
 * This file contains type definitions for environment variables
 */

/**
 * Type for environment variables
 */
export type EnvVars = {
  // Server configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
  
  // Database configuration
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASS: string;
  DB_NAME: string;
  
  // JWT configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // Add other environment variables as needed
  [key: string]: string | undefined;
};

/**
 * Type for required environment variables
 * Add all required environment variable names here
 */
export const requiredEnvVars: (keyof EnvVars)[] = [
  'NODE_ENV',
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN'
];

/**
 * Type guard to check if all required environment variables are set
 */
export function hasRequiredEnvVars(env: NodeJS.ProcessEnv): env is EnvVars {
  return requiredEnvVars.every(key => {
    const value = env[key];
    if (value === undefined || value === '') {
      console.error(`Missing required environment variable: ${key}`);
      return false;
    }
    return true;
  });
}

// Export the environment variables with proper typing
declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvVars {}
  }
}
