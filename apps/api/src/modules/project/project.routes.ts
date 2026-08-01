import { Router } from 'express';
import { projectController } from './project.controller';
import { validate } from '../../middleware/validation.middleware';
import { updateProjectSchema } from '@vt/shared';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => projectController.get(req, res, next));
router.put('/', validate(updateProjectSchema), (req, res, next) => projectController.update(req, res, next));

export default router;
