import { Request, Response, NextFunction } from 'express';
import { leadService } from './lead.service';

export class LeadController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.create(req.body);
      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string || '30')));
      const search = req.query['search'] as string;

      const { data, total } = await leadService.list({ search, page, limit });

      res.json({
        success: true,
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const leadController = new LeadController();
