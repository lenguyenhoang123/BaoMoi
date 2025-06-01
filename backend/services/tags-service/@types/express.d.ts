import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export interface CustomRequest extends ExpressRequest {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}
