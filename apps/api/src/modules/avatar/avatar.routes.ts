import { Router } from 'express';
import { avatarController } from './avatar.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { upload } from '../../middleware/upload.middleware';
import { createAvatarSchema, updateAvatarSchema } from '@vt/shared';

const router = Router();

// Public route — needed by the public tour viewer to query sequence spokesperson avatars
router.get('/:id', (req, res, next) => avatarController.getById(req, res, next));

router.use(authMiddleware);

router.get('/', (req, res, next) => avatarController.list(req, res, next));
router.post(
  '/',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]),
  validate(createAvatarSchema, 'body'),
  (req, res, next) => avatarController.create(req, res, next)
);
router.put(
  '/:id',
  validate(updateAvatarSchema),
  (req, res, next) => avatarController.update(req, res, next)
);
router.delete('/:id', (req, res, next) => avatarController.delete(req, res, next));
router.post('/:id/retry', (req, res, next) => avatarController.retry(req, res, next));

export default router;
