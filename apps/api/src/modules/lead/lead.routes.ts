import { Router } from 'express';
import { leadController } from './lead.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createLeadSchema } from '@vt/shared';
import { leadSubmitLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();

// Public route to submit a lead (contact form)
router.post('/', leadSubmitLimiter, validate(createLeadSchema), (req, res, next) =>
  leadController.create(req, res, next)
);

// Admin route to list leads (protected by authMiddleware)
router.get('/', authMiddleware, (req, res, next) =>
  leadController.list(req, res, next)
);

export default router;
