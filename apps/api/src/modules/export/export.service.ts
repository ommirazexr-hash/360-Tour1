import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { projectStore } from '../../lib/project-store';
import { viewerService } from '../viewer/viewer.service';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../lib/logger';

const copyRecursiveSync = (src: string, dest: string) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

const zipFolder = (sourceDir: string, zipPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // We use powershell on Windows to zip the folder
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${zipPath}' -Force`
    ]);
    
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Powershell Compress-Archive failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
};

export class ExportService {
  async exportTour(): Promise<{ exportDir: string; zipPath: string; slug: string }> {
    const project = projectStore.getProject();
    if (!project) throw new NotFoundError('Project');
    
    const slug = project.slug;
    const projectDir = projectStore.getProjectDir();
    const exportBaseDir = path.join(projectDir, 'export');
    const exportDir = path.join(exportBaseDir, slug);
    const zipPath = path.join(exportBaseDir, `${slug}.zip`);
    
    // Ensure clean export folder
    fs.rmSync(exportDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(exportDir, 'assets'), { recursive: true });
    
    // 1. Fetch full tour data
    const tourData = await viewerService.getTourBySlug(slug);
    
    // 2. Collect and copy all referenced assets
    const filesToCopy = new Set<string>();
    
    const addPath = (p: string | null | undefined) => {
      if (p && p.startsWith('assets/')) {
        filesToCopy.add(p);
      }
    };

    if (tourData.branding) {
      addPath(tourData.branding.logoPath);
      addPath(tourData.branding.coverPath);
    }

    for (const scene of tourData.scenes) {
      addPath(scene.panoramaPath);
      addPath(scene.thumbnailPath);
      addPath(scene.avatarPostPlaybackTargetAssetPath);

      if (scene.defaultAvatar) {
        addPath(scene.defaultAvatar.originalAssetPath);
        addPath(scene.defaultAvatar.optimizedAssetPath);
        addPath(scene.defaultAvatar.thumbnailAssetPath);
      }

      for (const hs of scene.hotspots) {
        addPath(hs.targetAssetPath);
        addPath(hs.avatarPostPlaybackTargetAssetPath);

        if (hs.avatar) {
          addPath(hs.avatar.originalAssetPath);
          addPath(hs.avatar.optimizedAssetPath);
          addPath(hs.avatar.thumbnailAssetPath);
        }
      }
    }

    for (const step of tourData.guidedTour) {
      addPath(step.audioUrl);
    }

    // Copy referenced assets to the export directory
    for (const relPath of filesToCopy) {
      const srcFile = path.join(projectDir, relPath);
      const destFile = path.join(exportDir, relPath);
      if (fs.existsSync(srcFile)) {
        fs.mkdirSync(path.dirname(destFile), { recursive: true });
        fs.copyFileSync(srcFile, destFile);
      }
    }
    
    // 3. Map URLs to relative paths for static hosting
    const exportTourData = JSON.parse(JSON.stringify(tourData));
    
    if (exportTourData.branding) {
      exportTourData.branding.logoUrl = exportTourData.branding.logoPath ? `./${exportTourData.branding.logoPath}` : null;
      exportTourData.branding.coverUrl = exportTourData.branding.coverPath ? `./${exportTourData.branding.coverPath}` : null;
    }

    for (const scene of exportTourData.scenes) {
      scene.panoramaUrl = scene.panoramaPath ? `./${scene.panoramaPath}` : null;
      scene.thumbnailUrl = scene.thumbnailPath ? `./${scene.thumbnailPath}` : null;
      scene.avatarPostPlaybackTargetAssetUrl = scene.avatarPostPlaybackTargetAssetPath ? `./${scene.avatarPostPlaybackTargetAssetPath}` : null;

      if (scene.defaultAvatar) {
        scene.defaultAvatar.originalUrl = scene.defaultAvatar.originalAssetPath ? `./${scene.defaultAvatar.originalAssetPath}` : null;
        scene.defaultAvatar.optimizedUrl = scene.defaultAvatar.optimizedAssetPath ? `./${scene.defaultAvatar.optimizedAssetPath}` : null;
        scene.defaultAvatar.thumbnailUrl = scene.defaultAvatar.thumbnailAssetPath ? `./${scene.defaultAvatar.thumbnailAssetPath}` : null;
      }

      for (const hs of scene.hotspots) {
        hs.targetAssetUrl = hs.targetAssetPath ? `./${hs.targetAssetPath}` : null;
        hs.avatarPostPlaybackTargetAssetUrl = hs.avatarPostPlaybackTargetAssetPath ? `./${hs.avatarPostPlaybackTargetAssetPath}` : null;

        if (hs.avatar) {
          hs.avatar.originalUrl = hs.avatar.originalAssetPath ? `./${hs.avatar.originalAssetPath}` : null;
          hs.avatar.optimizedUrl = hs.avatar.optimizedAssetPath ? `./${hs.avatar.optimizedAssetPath}` : null;
          hs.avatar.thumbnailUrl = hs.avatar.thumbnailAssetPath ? `./${hs.avatar.thumbnailAssetPath}` : null;
        }
      }
    }

    for (const step of exportTourData.guidedTour) {
      step.audioUrl = step.audioUrl && step.audioUrl.startsWith('assets/') ? `./${step.audioUrl}` : step.audioUrl;
    }

    // Embed all avatars list with relative urls
    if ((tourData as any).avatars) {
      exportTourData.avatars = (tourData as any).avatars.map((av: any) => ({
        ...av,
        originalUrl: av.originalAssetPath ? `./${av.originalAssetPath}` : null,
        optimizedUrl: av.optimizedAssetPath ? `./${av.optimizedAssetPath}` : null,
        thumbnailUrl: av.thumbnailAssetPath ? `./${av.thumbnailAssetPath}` : null,
      }));
    }

    // Write mapped data to tour.json
    fs.writeFileSync(
      path.join(exportDir, 'tour.json'),
      JSON.stringify(exportTourData, null, 2),
      'utf-8'
    );
    
    // 4. Copy pre-built viewer files
    const viewerDistDir = path.resolve(process.cwd(), '../export-viewer/dist');
    if (!fs.existsSync(viewerDistDir)) {
      throw new ValidationError('Export viewer build files not found. Please compile the export-viewer app first.');
    }
    
    copyRecursiveSync(viewerDistDir, exportDir);
    
    // 5. Compress the folder to ZIP
    logger.info(`Zipping export directory: ${exportDir} to ${zipPath}`);
    await zipFolder(exportDir, zipPath);
    
    return { exportDir, zipPath, slug };
  }
}

export const exportService = new ExportService();
