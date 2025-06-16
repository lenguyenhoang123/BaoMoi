import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      user?: any;  // User information from JWT
      cookies: {
        token?: string;
        refreshToken?: string;
      } & Record<string, string | undefined>;
    }
  }
}

export {};
