import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { authLimiter } from '../../middleware/rateLimiter.middleware';
import { loginSchema, changePasswordSchema } from '@vt/shared';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);
router.post('/logout', authMiddleware, (req, res, next) =>
  authController.logout(req, res, next)
);
router.get('/me', authMiddleware, (req, res, next) =>
  authController.me(req, res, next)
);
router.put('/password', authMiddleware, validate(changePasswordSchema), (req, res, next) =>
  authController.changePassword(req, res, next)
);

export default router;
