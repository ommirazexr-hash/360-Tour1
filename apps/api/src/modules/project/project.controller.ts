import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service';

export class ProjectController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.get();
      res.json({ success: true, data: project });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.update(req.body);
      res.json({ success: true, data: project });
    } catch (err) { next(err); }
  }
}

export const projectController = new ProjectController();
