// Type definitions for next-auth
// Project: BaoMoi Frontend

import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      role?: string;
      accessToken?: string;
      refreshToken?: string;
    } & DefaultSession['user'];
  }

  /**
   * Extend the built-in user type
   */
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT type
   */
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
