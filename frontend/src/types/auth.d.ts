// Type definitions for authentication
// Project: BaoMoi Frontend

import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

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
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}

// Application-specific authentication types
declare namespace Auth {
  // User information
  interface User {
    id: string;
    email: string;
    username?: string;
    name?: string;
    avatar?: string;
    role?: string;
    accessToken?: string;
    refreshToken?: string;
    [key: string]: any;
  }

  // Login credentials
  interface Credentials {
    username: string;
    password: string;
    rememberMe?: boolean;
  }

  // Registration data
  interface RegisterData {
    email: string;
    password: string;
    confirmPassword?: string;
    full_name: string;
    otp?: string;
    [key: string]: any;
  }

  // API response
  interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    token?: string;
    user?: User;
    chiTiet?: string;
    errors?: Record<string, string[]>;
    requiresVerification?: boolean;
    [key: string]: any;
  }

  // Register response
  interface RegisterResponse extends ApiResponse {
    requiresVerification: boolean;
    user?: User;
    token?: string;
  }

  // Login response
  interface LoginResponse {
    success: boolean;
    message?: string;
    user?: User;
    token?: string;
    data?: {
      user?: User;
      token?: string;
      [key: string]: any;
    };
    chiTiet?: string;
    requiresVerification?: boolean;
  }

  // User profile response
  interface ProfileResponse {
    success: boolean;
    data?: {
      user: User;
    };
    message?: string;
  }

  // Password reset request
  interface PasswordResetRequest {
    email: string;
  }

  // Password reset confirmation
  interface PasswordResetConfirm {
    token: string;
    password: string;
    confirmPassword: string;
  }
}

export type { Auth };

// Global type definitions
declare global {
  // Extend the global Window interface
  interface Window {
    // Add any global window properties here if needed
  }

  // Extend the global JSX namespace
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // Thêm các thuộc tính tùy chỉnh nếu cần
    }
  }
}
