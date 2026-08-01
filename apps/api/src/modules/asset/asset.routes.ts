import { Router } from 'express';
import { assetController } from './asset.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { uploadAssetSchema, updateAssetSchema } from '@vt/shared';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => assetController.list(req, res, next));
router.post('/upload', uploadSingle('file'), validate(uploadAssetSchema, 'body'), (req, res, next) => assetController.upload(req, res, next));
router.get('/:id', (req, res, next) => assetController.getById(req, res, next));
router.put('/:id', validate(updateAssetSchema), (req, res, next) => assetController.update(req, res, next));
router.delete('/:id', (req, res, next) => assetController.delete(req, res, next));
router.get('/:id/usage', (req, res, next) => assetController.getUsage(req, res, next));

export default router;
