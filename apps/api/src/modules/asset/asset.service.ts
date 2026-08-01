import { projectStore } from '../../lib/project-store';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { processImage, getExtension } from '../../lib/imageProcessor';
import { storage } from '../../lib/storage';
import { validateFileForCategory } from '../../middleware/upload.middleware';
import type { AssetCategory, AssetWithUrls, AssetUsage } from '@vt/shared';
import { v4 as uuidv4 } from 'uuid';

export class AssetService {
  async list(opts: { category?: string; search?: string; tags?: string; page: number; limit: number; sortBy: string; order: 'asc' | 'desc' }) {
    const result = projectStore.listAssets(opts);
    return {
      data: result.data.map(this.toDto.bind(this)),
      total: result.total,
    };
  }

  async upload(file: Express.Multer.File, category: AssetCategory, tags: string[]): Promise<AssetWithUrls> {
    validateFileForCategory(file, category);

    let filePath: string;
    let optimizedPath: string | null = null;
    let thumbnailPath: string | null = null;
    let width: number | null = null;
    let height: number | null = null;
    let fileName: string;

    if (['PANORAMA', 'IMAGE', 'LOGO'].includes(category)) {
      const ext = getExtension(file.originalname);
      const processed = await processImage({ category: category as 'PANORAMA' | 'IMAGE' | 'LOGO', originalExt: ext, fileBuffer: file.buffer });
      fileName = processed.fileName;
      filePath = processed.originalPath;
      optimizedPath = processed.optimizedPath;
      thumbnailPath = processed.thumbnailPath;
      width = processed.width;
      height = processed.height;
    } else {
      // PDF, VIDEO, AVATAR, or AUDIO — store as-is
      const ext = getExtension(file.originalname);
      fileName = `${uuidv4()}${ext}`;
      
      let folder = 'images';
      if (category === 'PDF') {
        folder = 'documents';
      } else if (category === 'AVATAR') {
        folder = 'avatars/original';
      } else if (category === 'AUDIO') {
        folder = 'audio';
      }
      
      const subPath = `${folder}/${fileName}`;
      filePath = await storage.save(file.buffer, subPath);
    }

    const asset = projectStore.createAsset({
      originalName: file.originalname, 
      fileName, 
      mimeType: file.mimetype, 
      fileSize: file.size, 
      filePath, 
      optimizedPath, 
      thumbnailPath, 
      category, 
      tags, 
      width, 
      height
    });

    return this.toDto(asset);
  }

  async getById(id: string): Promise<AssetWithUrls> {
    const asset = projectStore.getAsset(id);
    if (!asset) throw new NotFoundError('Asset');
    return this.toDto(asset);
  }

  async update(id: string, data: { originalName?: string; tags?: string[] }): Promise<AssetWithUrls> {
    const asset = projectStore.getAsset(id);
    if (!asset) throw new NotFoundError('Asset');
    const updated = projectStore.updateAsset(id, data);
    if (!updated) throw new NotFoundError('Asset');
    return this.toDto(updated);
  }

  async delete(id: string, force = false): Promise<void> {
    const asset = projectStore.getAsset(id);
    if (!asset) throw new NotFoundError('Asset');

    if (!force) {
      const usage = await this.getUsage(id);
      if (usage.totalUsages > 0) {
        throw new ConflictError(`Asset is referenced by ${usage.totalUsages} item(s). Use force=true to delete anyway.`);
      }
    }

    if (force) {
      // Hard delete physical files from disk
      if (asset.filePath) {
        await storage.delete(asset.filePath);
      }
      if (asset.optimizedPath) {
        await storage.delete(asset.optimizedPath);
      }
      if (asset.thumbnailPath) {
        await storage.delete(asset.thumbnailPath);
      }
      // Hard delete the asset record from store
      projectStore.hardDeleteAsset(id);
    } else {
      // Soft delete the asset
      projectStore.deleteAsset(id);
    }
  }

  async getUsage(id: string): Promise<AssetUsage> {
    const asset = projectStore.getAsset(id);
    if (!asset) throw new NotFoundError('Asset');

    const usage = projectStore.getAssetUsage(asset.filePath);
    
    // Convert to shared interface format
    return {
      usedInScenes: usage.usedInScenes.map(s => ({
        sceneId: s.sceneId,
        sceneTitle: s.sceneTitle,
        projectName: 'My Project',
        field: s.field as 'panorama'
      })),
      usedInHotspots: usage.usedInHotspots.map(h => ({
        hotspotId: h.hotspotId,
        hotspotLabel: h.hotspotLabel,
        sceneTitle: h.sceneTitle,
        field: h.field as 'targetAsset'
      })),
      usedInBranding: usage.usedInBranding.map(b => ({
        projectId: 'project',
        projectName: 'My Project',
        field: b.field as 'logo' | 'cover'
      })),
      usedInAvatars: usage.usedInAvatars.map(a => ({
        avatarId: a.avatarId,
        avatarName: a.avatarName,
        projectName: 'My Project',
        field: a.field as 'original' | 'optimized' | 'thumbnail'
      })),
      totalUsages: usage.totalUsages
    };
  }

  private toDto(a: any): AssetWithUrls {
    return {
      id: a.id, 
      originalName: a.originalName, 
      fileName: a.fileName,
      mimeType: a.mimeType, 
      fileSize: a.fileSize, 
      filePath: a.filePath,
      optimizedPath: a.optimizedPath, 
      thumbnailPath: a.thumbnailPath,
      category: a.category as AssetCategory, 
      tags: a.tags, 
      width: a.width, 
      height: a.height,
      fileUrl: storage.getPublicUrl(a.filePath),
      optimizedUrl: a.optimizedPath ? storage.getPublicUrl(a.optimizedPath) : null,
      thumbnailUrl: a.thumbnailPath ? storage.getPublicUrl(a.thumbnailPath) : null,
      createdAt: a.createdAt, 
      updatedAt: a.updatedAt,
    };
  }
}

export const assetService = new AssetService();
