import { Router } from 'express';
import { brandingController } from './branding.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateBrandingSchema } from '@vt/shared';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', (req, res, next) => brandingController.get(req, res, next));
router.put('/', validate(updateBrandingSchema), (req, res, next) => brandingController.update(req, res, next));

export default router;
