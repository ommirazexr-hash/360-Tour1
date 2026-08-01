import { Router } from 'express';
import { exportController } from './export.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, (req, res, next) => exportController.trigger(req, res, next));
router.get('/download', authMiddleware, (req, res, next) => exportController.download(req, res, next));

export default router;
