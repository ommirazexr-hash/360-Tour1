import { Request, Response, NextFunction } from 'express';
import { viewerService } from './viewer.service';
import { getParam } from '../../utils/params';

export class ViewerController {
  async getTour(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await viewerService.getTourBySlug(getParam(req, 'slug'));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

export const viewerController = new ViewerController();
