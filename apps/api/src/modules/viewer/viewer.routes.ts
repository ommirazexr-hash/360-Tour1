import { Router } from 'express';
import { viewerController } from './viewer.controller';

const router = Router();
// Public — no auth required
router.get('/:slug', (req, res, next) => viewerController.getTour(req, res, next));

export default router;
