import { Request, Response, NextFunction } from 'express';
import { brandingService } from './branding.service';

export class BrandingController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branding = await brandingService.get();
      res.json({ success: true, data: branding });
    } catch (err) { next(err); }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branding = await brandingService.update(req.body);
      res.json({ success: true, data: branding });
    } catch (err) { next(err); }
  }
}
export const brandingController = new BrandingController();
