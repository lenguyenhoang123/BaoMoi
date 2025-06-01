// Allow .json files imports
declare module '*.json' {
  const value: any;
  export default value;
}

// Allow .png files imports
declare module '*.png';

// Allow .jpg files imports
declare module '*.jpg';

// Allow .jpeg files imports
declare module '*.jpeg';

// Allow .svg files imports
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Allow .css files imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Allow .scss files imports
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Add type definitions for Node.js
namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    // Add other environment variables here
  }
}

// Add global types for Express
namespace Express {
  interface Request {
    userId?: string;
    userRole?: string;
    // Add other custom request properties here
  }
}

// Add type for cors middleware
declare module 'cors' {
  import { RequestHandler } from 'express';
  
  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }
  
  function cors(options?: CorsOptions): RequestHandler;
  
  namespace cors {}
  export = cors;
}

// Add type for morgan middleware
declare module 'morgan' {
  import { RequestHandler } from 'express';
  
  function morgan(format: string, options?: any): RequestHandler;
  function morgan(format: (tokens: any, req: any, res: any) => string, options?: any): RequestHandler;
  
  namespace morgan {}
  export = morgan;
}
