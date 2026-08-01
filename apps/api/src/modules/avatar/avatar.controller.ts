import { Request, Response, NextFunction } from 'express';
import { avatarService } from './avatar.service';
import { getParam } from '../../utils/params';
import { ValidationError } from '../../utils/errors';

export class AvatarController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query['page'] as string || '1'));
      const limit = Math.min(125, Math.max(1, parseInt(req.query['limit'] as string || '20')));
      const search = req.query['search'] as string;

      const { data, total } = await avatarService.list({
        search,
        page,
        limit,
      });

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

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let file: Express.Multer.File | undefined;
      let audioFile: Express.Multer.File | undefined;

      if (req.files && typeof req.files === 'object') {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        file = files['file']?.[0];
        audioFile = files['audio']?.[0];
      } else if (req.file) {
        file = req.file;
      }

      if (!file) {
        throw new ValidationError('Raw video file is required');
      }

      const avatar = await avatarService.create(req.body, file, audioFile);
      res.status(201).json({ success: true, data: avatar });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const avatar = await avatarService.getById(getParam(req, 'id'));
      res.json({ success: true, data: avatar });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const avatar = await avatarService.update(getParam(req, 'id'), req.body);
      res.json({ success: true, data: avatar });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await avatarService.delete(getParam(req, 'id'));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const avatar = await avatarService.retry(getParam(req, 'id'));
      res.json({ success: true, data: avatar });
    } catch (err) {
      next(err);
    }
  }
}

export const avatarController = new AvatarController();
