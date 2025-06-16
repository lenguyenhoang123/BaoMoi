// src/types/global.d.ts
// Simple type declarations for modules
declare module 'cors';
declare module 'dotenv';
declare module 'socket.io';
declare module 'helmet';
declare module 'morgan';
declare module 'pg';

// Global type for CORS options
type CorsOptions = {
  origin?: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
};
