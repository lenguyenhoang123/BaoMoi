import { User as ExpressUser } from 'express';

declare global {
  namespace Express {
    interface User extends ExpressUser {
      id: string;
      email: string;
      name: string;  // Bắt buộc vì luôn có giá trị mặc định
      avatar_url?: string | null;
      role: string;
      isAdmin: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}
