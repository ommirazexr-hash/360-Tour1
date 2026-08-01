import { Request, Response, NextFunction } from 'express';
import { guidedTourService } from './guided-tour.service';

export class GuidedTourController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const steps = await guidedTourService.get();
      res.json({ success: true, data: steps });
    } catch (err) { next(err); }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const steps = await guidedTourService.update(req.body);
      res.json({ success: true, data: steps });
    } catch (err) { next(err); }
  }
  async toggle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await guidedTourService.toggle();
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export const guidedTourController = new GuidedTourController();
