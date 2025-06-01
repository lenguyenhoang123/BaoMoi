import { Request } from 'express';
import { UserAttributes } from '../models/user.model';

export interface IAuthRequest extends Request {
  user?: UserAttributes;
  token?: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  full_name: string;
  otp?: string; // Thêm trường OTP cho bước xác thực
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  data?: any;
  token?: string;
  refreshToken?: string;
  user?: Partial<UserAttributes>;
  requires_verification?: boolean;
}

export interface ITokenPayload {
  id: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface IResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IResendOtpRequest {
  email: string;
}

export interface IAuthService {
  register(userData: IRegisterRequest): Promise<{ user: UserAttributes; requiresVerification: boolean }>;
  login(email: string, password: string): Promise<{ user: UserAttributes; token: string }>;
  validateUser(email: string, password: string): Promise<UserAttributes | null>;
  generateToken(user: UserAttributes): string;
  verifyToken(token: string): ITokenPayload | null;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
  verifyEmail(email: string, otp: string): Promise<{ user: UserAttributes; token: string }>;
  verifyEmailByToken(token: string): Promise<{ success: boolean; message: string; user?: UserAttributes }>;
  /**
   * Gửi lại email xác thực
   * @param email Email của người dùng cần gửi lại email xác thực
   * @returns Promise<{ success: boolean; message: string }> Kết quả gửi lại email xác thực
   */
  resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }>;
  resendOtp(data: IResendOtpRequest): Promise<{ success: boolean; message: string }>;
  logout(token: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string } | null>;
}
