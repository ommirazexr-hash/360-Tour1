import { Router } from 'express';
import { hotspotController } from './hotspot.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createHotspotSchema, updateHotspotSchema, updateHotspotPositionSchema } from '@vt/shared';

// Nested under scenes
const sceneHotspotsRouter = Router({ mergeParams: true });
sceneHotspotsRouter.use(authMiddleware);
sceneHotspotsRouter.get('/', (req, res, next) => hotspotController.list(req, res, next));
sceneHotspotsRouter.post('/', validate(createHotspotSchema), (req, res, next) => hotspotController.create(req, res, next));

// Standalone
const hotspotsRouter = Router();
hotspotsRouter.use(authMiddleware);
hotspotsRouter.get('/:id', (req, res, next) => hotspotController.getById(req, res, next));
hotspotsRouter.put('/:id', validate(updateHotspotSchema), (req, res, next) => hotspotController.update(req, res, next));
hotspotsRouter.patch('/:id/position', validate(updateHotspotPositionSchema), (req, res, next) => hotspotController.updatePosition(req, res, next));
hotspotsRouter.delete('/:id', (req, res, next) => hotspotController.delete(req, res, next));

export { sceneHotspotsRouter, hotspotsRouter };
