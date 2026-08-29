// UserRole values as returned by the backend.
// DEVELOPER is kept for backward compatibility with legacy accounts.
// New registrations use TESTER (issue investigator) or TESTER (issue reporter mapped as USER in UI).
export type UserRole = 'ADMIN' | 'DEVELOPER' | 'TESTER';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
}

// Backend RegisterRequest.role accepts TESTER or DEVELOPER (not ADMIN).
// UI presents these as "Tester" and "User" but maps to backend enum values.
export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'DEVELOPER' | 'TESTER';
}

export interface RequestOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}
