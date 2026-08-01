export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: AdminProfile;
}

export interface AdminProfile {
  id: string;
  username: string;
  email: string;
  lastLoginAt: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
