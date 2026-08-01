import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await authService.getProfile(req.admin!.adminId);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.admin!.adminId, currentPassword, newPassword);
      res.status(200).json({ success: true, data: { message: 'Password changed successfully' } });
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
  }
}

export const authController = new AuthController();
