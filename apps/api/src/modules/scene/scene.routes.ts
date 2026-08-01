import { Router } from 'express';
import { sceneController } from './scene.controller';
import { validate } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { createSceneSchema, updateSceneSchema, reorderScenesSchema, updateDefaultViewSchema } from '@vt/shared';
import { authMiddleware } from '../../middleware/auth.middleware';

// Scenes under project: /api/project/scenes
const projectScenesRouter = Router();
projectScenesRouter.use(authMiddleware);
projectScenesRouter.get('/', (req, res, next) => sceneController.list(req, res, next));
projectScenesRouter.post('/', uploadSingle('panorama'), validate(createSceneSchema, 'body'), (req, res, next) => sceneController.create(req, res, next));

// Individual scene routes: /api/scenes/:id
const scenesRouter = Router();
scenesRouter.use(authMiddleware);
scenesRouter.patch('/reorder', validate(reorderScenesSchema), (req, res, next) => sceneController.reorder(req, res, next));
scenesRouter.get('/:id', (req, res, next) => sceneController.getById(req, res, next));
scenesRouter.put('/:id', validate(updateSceneSchema), (req, res, next) => sceneController.update(req, res, next));
scenesRouter.delete('/:id', (req, res, next) => sceneController.delete(req, res, next));
scenesRouter.patch('/:id/start', (req, res, next) => sceneController.setStart(req, res, next));
scenesRouter.patch('/:id/default-view', validate(updateDefaultViewSchema), (req, res, next) => sceneController.updateDefaultView(req, res, next));
scenesRouter.patch('/:id/panorama', uploadSingle('panorama'), (req, res, next) => sceneController.replacePanorama(req, res, next));

export { projectScenesRouter, scenesRouter };
