import { Router } from 'express';
import { guidedTourController } from './guided-tour.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { updateGuidedTourSchema } from '@vt/shared';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', (req, res, next) => guidedTourController.get(req, res, next));
router.put('/', validate(updateGuidedTourSchema), (req, res, next) => guidedTourController.update(req, res, next));
router.patch('/toggle', (req, res, next) => guidedTourController.toggle(req, res, next));

export default router;
