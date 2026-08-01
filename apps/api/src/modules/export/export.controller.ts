import { Request, Response, NextFunction } from 'express';
import { exportService } from './export.service';
import { projectStore } from '../../lib/project-store';
import fs from 'fs';
import path from 'path';

export class ExportController {
  async trigger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await exportService.exportTour();
      res.json({
        success: true,
        data: {
          message: 'Export completed successfully',
          zipPath: result.zipPath,
          downloadUrl: `/api/export/download`
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = projectStore.getProject();
      const zipPath = path.join(projectStore.getProjectDir(), 'export', `${project.slug}.zip`);
      
      if (!fs.existsSync(zipPath)) {
        const result = await exportService.exportTour();
        res.download(result.zipPath, `${result.slug}.zip`);
        return;
      }
      
      res.download(zipPath, `${project.slug}.zip`);
    } catch (err) {
      next(err);
    }
  }
}

export const exportController = new ExportController();
