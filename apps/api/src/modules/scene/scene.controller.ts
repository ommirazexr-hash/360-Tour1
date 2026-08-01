import { Request, Response, NextFunction } from 'express';
import { sceneService } from './scene.service';
import { getParam } from '../../utils/params';

export class SceneController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scenes = await sceneService.listByProject();
      res.json({ success: true, data: scenes });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scene = await sceneService.create(req.body, req.file);
      res.status(201).json({ success: true, data: scene });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scene = await sceneService.getById(getParam(req, 'id'));
      res.json({ success: true, data: scene });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scene = await sceneService.update(getParam(req, 'id'), req.body);
      res.json({ success: true, data: scene });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await sceneService.delete(getParam(req, 'id'));
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await sceneService.reorder(req.body.scenes);
      res.json({ success: true, data: { message: 'Scenes reordered' } });
    } catch (err) { next(err); }
  }

  async setStart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scene = await sceneService.setStartScene(getParam(req, 'id'));
      res.json({ success: true, data: scene });
    } catch (err) { next(err); }
  }

  async updateDefaultView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scene = await sceneService.updateDefaultView(getParam(req, 'id'), req.body);
      res.json({ success: true, data: scene });
    } catch (err) { next(err); }
  }

  async replacePanorama(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } }); return; }
      const scene = await sceneService.replacePanorama(getParam(req, 'id'), req.file);
      res.json({ success: true, data: scene });
    } catch (err) { next(err); }
  }
}

export const sceneController = new SceneController();
