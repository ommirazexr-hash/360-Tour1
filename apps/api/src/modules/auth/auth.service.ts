import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError, NotFoundError, ValidationError } from '../../utils/errors';
import type { AdminProfile } from '@vt/shared';

export class AuthService {
  async login(username: string, password: string): Promise<{ token: string; admin: AdminProfile }> {
    // Light auth gate: check against environment variable or default
    const expectedPassword = env.ADMIN_PASSWORD || 'admin';
    
    // We allow username 'admin'
    if (username !== 'admin' || password !== expectedPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign(
      { adminId: 'admin', username: 'admin' },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    return {
      token,
      admin: {
        id: 'admin',
        username: 'admin',
        email: 'admin@local.com',
        lastLoginAt: new Date().toISOString(),
      },
    };
  }

  async getProfile(adminId: string): Promise<AdminProfile> {
    if (adminId !== 'admin') throw new NotFoundError('Admin');
    return {
      id: 'admin',
      username: 'admin',
      email: 'admin@local.com',
      lastLoginAt: new Date().toISOString(),
    };
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    throw new ValidationError('Password change is not supported in builder mode. Please update the ADMIN_PASSWORD variable in your .env file instead.');
  }
}

export const authService = new AuthService();
