import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      isAdmin: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

// This makes the file a module
export {};
