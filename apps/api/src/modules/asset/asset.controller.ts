import { Request, Response, NextFunction } from 'express';
import { assetService } from './asset.service';
import { getParam } from '../../utils/params';
import type { AssetCategory } from '@vt/shared';

export class AssetController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string || '30')));
      const { data, total } = await assetService.list({
        category: req.query['category'] as string,
        search: req.query['search'] as string,
        tags: req.query['tags'] as string,
        page, limit,
        sortBy: req.query['sortBy'] as string || 'createdAt',
        order: (req.query['order'] as 'asc' | 'desc') || 'desc',
      });
      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  }

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } }); return; }
      const category = req.body.category as AssetCategory;
      const tags = req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      const asset = await assetService.upload(req.file, category, tags);
      res.status(201).json({ success: true, data: asset });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.getById(getParam(req, 'id'));
      res.json({ success: true, data: asset });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await assetService.update(getParam(req, 'id'), req.body);
      res.json({ success: true, data: asset });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const force = req.query['force'] === 'true';
      await assetService.delete(getParam(req, 'id'), force);
      res.status(204).send();
    } catch (err) { next(err); }
  }

  async getUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usage = await assetService.getUsage(getParam(req, 'id'));
      res.json({ success: true, data: usage });
    } catch (err) { next(err); }
  }
}

export const assetController = new AssetController();
