import { projectStore } from '../../lib/project-store';
import { NotFoundError } from '../../utils/errors';
import { assetService } from '../asset/asset.service';
import { storage } from '../../lib/storage';
import { processAvatarVideo } from '../../lib/avatarProcessor';
import { logger } from '../../lib/logger';
import type { AvatarWithUrls, CreateAvatarRequest, UpdateAvatarRequest } from '@vt/shared';

export class AvatarService {
  async list(opts: { search?: string; page: number; limit: number }) {
    const { search, page, limit } = opts;
    const result = projectStore.listAvatars({ search, page, limit });

    return {
      data: result.data.map((a) => this.toDto(a)),
      total: result.total,
    };
  }

  async create(data: CreateAvatarRequest, file: Express.Multer.File, audioFile?: Express.Multer.File): Promise<AvatarWithUrls> {
    // 1. Upload original video asset under category AVATAR
    const originalAsset = await assetService.upload(file, 'AVATAR', []);

    // Combine scale into description
    const scaleVal = data.scale ?? 1.0;
    const rawDescription = data.description ?? '';
    const formattedDescription = `${rawDescription} [scale:${scaleVal}]`.trim();

    // 2. Create Avatar record linked to original asset
    const avatar = projectStore.createAvatar({
      name: data.name,
      description: formattedDescription || null,
      language: data.language ?? 'en',
      scriptNotes: data.scriptNotes ?? null,
      projectId: data.projectId ?? null,
      originalAssetPath: originalAsset.filePath,
      optimizedAssetPath: null,
      thumbnailAssetPath: null,
      status: 'PENDING',
      progress: 0,
      duration: null,
      version: 1,
      error: null
    });

    // If separate audio file is provided, upload it and tag it
    if (audioFile) {
      await assetService.upload(audioFile, 'AVATAR', ['avatar-audio', avatar.id]).catch((err) => {
        logger.error(`[AvatarService] Error uploading separate audio file for avatar ${avatar.id}: ${err?.message}`);
      });
    }

    // 3. Trigger processing in the background asynchronously
    processAvatarVideo(avatar.id).catch((err) => {
      logger.error(`[AvatarService] Error starting background transcoding for avatar ${avatar.id}: ${err?.message}`);
    });

    return this.toDto(avatar);
  }

  async getById(id: string): Promise<AvatarWithUrls> {
    const avatar = projectStore.getAvatar(id);
    if (!avatar) throw new NotFoundError('Avatar');
    return this.toDto(avatar);
  }

  async update(id: string, data: UpdateAvatarRequest): Promise<AvatarWithUrls> {
    const avatar = projectStore.getAvatar(id);
    if (!avatar) throw new NotFoundError('Avatar');

    let formattedDescription = data.description;
    if (data.scale !== undefined || data.description !== undefined) {
      const currentScale = this.parseScaleFromDescription(avatar.description || '');
      const currentDescClean = this.cleanDescription(avatar.description || '');
      
      const newScale = data.scale !== undefined ? data.scale : currentScale;
      const newDescClean = data.description !== undefined ? (data.description || '') : currentDescClean;
      
      formattedDescription = `${newDescClean} [scale:${newScale}]`.trim();
    }

    const updated = projectStore.updateAvatar(id, {
      name: data.name,
      description: formattedDescription,
      language: data.language,
      scriptNotes: data.scriptNotes,
    });

    if (!updated) throw new NotFoundError('Avatar');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<void> {
    const avatar = projectStore.getAvatar(id);
    if (!avatar) throw new NotFoundError('Avatar');

    // Delete related assets and folders
    projectStore.deleteAvatarAssets(avatar);
    
    // Delete the avatar record itself
    projectStore.deleteAvatar(id);
  }

  async retry(id: string): Promise<AvatarWithUrls> {
    const avatar = projectStore.getAvatar(id);
    if (!avatar) throw new NotFoundError('Avatar');

    // Dereference and delete the old optimized asset
    if (avatar.optimizedAssetPath) {
      const oldPath = avatar.optimizedAssetPath;

      projectStore.updateAvatar(id, { optimizedAssetPath: null });

      await storage.delete(oldPath).catch(() => {});
      
      // Look up and delete metadata from assets list
      const asset = projectStore.getAssetByPath(oldPath);
      if (asset) {
        projectStore.deleteAsset(asset.id);
      }
    }

    const updated = projectStore.updateAvatar(id, {
      status: 'PENDING',
      progress: 0,
      error: null,
      version: avatar.version + 1,
    });

    if (!updated) throw new NotFoundError('Avatar');

    // Trigger transcode process in the background
    processAvatarVideo(updated.id).catch((err) => {
      logger.error(`[AvatarService] Error in background retry transcoding for avatar ${updated.id}: ${err?.message}`);
    });

    return this.toDto(updated);
  }

  private parseScaleFromDescription(desc: string): number {
    const match = desc.match(/\[scale:([\d.]+)\]/);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      if (!isNaN(val)) return val;
    }
    return 1.0;
  }

  private cleanDescription(desc: string): string {
    return desc.replace(/\[scale:[\d.]+\]/, '').trim();
  }

  private toDto(av: any): AvatarWithUrls {
    const description = av.description || '';
    const scale = this.parseScaleFromDescription(description);
    const cleanDesc = this.cleanDescription(description);

    return {
      id: av.id,
      projectId: av.projectId,
      name: av.name,
      description: cleanDesc || null,
      scale,
      language: av.language,
      scriptNotes: av.scriptNotes,
      duration: av.duration,
      version: av.version,
      originalAssetId: av.originalAssetPath, // compat
      optimizedAssetId: av.optimizedAssetPath, // compat
      thumbnailAssetId: av.thumbnailAssetPath, // compat
      originalAssetPath: av.originalAssetPath,
      optimizedAssetPath: av.optimizedAssetPath,
      thumbnailAssetPath: av.thumbnailAssetPath,
      status: av.status,
      progress: av.progress,
      error: av.error,
      originalUrl: av.originalAssetPath ? storage.getPublicUrl(av.originalAssetPath) : null,
      optimizedUrl: av.optimizedAssetPath ? storage.getPublicUrl(av.optimizedAssetPath) : null,
      thumbnailUrl: av.thumbnailAssetPath ? storage.getPublicUrl(av.thumbnailAssetPath) : null,
      createdAt: av.createdAt,
      updatedAt: av.updatedAt,
    };
  }
}

export const avatarService = new AvatarService();
