import { Request, Response, NextFunction } from 'express';
import { hotspotService } from './hotspot.service';
import { getParam } from '../../utils/params';

export class HotspotController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspots = await hotspotService.listByScene(getParam(req, 'sceneId'));
      res.json({ success: true, data: hotspots });
    } catch (err) { next(err); }
  }
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspot = await hotspotService.create(getParam(req, 'sceneId'), req.body);
      res.status(201).json({ success: true, data: hotspot });
    } catch (err) { next(err); }
  }
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspot = await hotspotService.getById(getParam(req, 'id'));
      res.json({ success: true, data: hotspot });
    } catch (err) { next(err); }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspot = await hotspotService.update(getParam(req, 'id'), req.body);
      res.json({ success: true, data: hotspot });
    } catch (err) { next(err); }
  }
  async updatePosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { yaw, pitch } = req.body;
      const hotspot = await hotspotService.updatePosition(getParam(req, 'id'), yaw, pitch);
      res.json({ success: true, data: hotspot });
    } catch (err) { next(err); }
  }
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await hotspotService.delete(getParam(req, 'id'));
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const hotspotController = new HotspotController();
