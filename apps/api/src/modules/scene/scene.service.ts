import { projectStore } from '../../lib/project-store';
import { NotFoundError } from '../../utils/errors';
import { processImage, getExtension } from '../../lib/imageProcessor';
import { storage } from '../../lib/storage';
import { validateFileForCategory } from '../../middleware/upload.middleware';

export class SceneService {
  async listByProject() {
    const scenes = projectStore.listScenes();
    const avatars = projectStore.listAvatars().data;
    return scenes.map((s) => this.toDto(s, avatars));
  }

  async create(data: { title: string; description?: string }, file?: Express.Multer.File) {
    const sceneCount = projectStore.countScenes();
    const isFirst = sceneCount === 0;

    let panoramaPath: string | null = null;
    let thumbnailPath: string | null = null;

    if (file) {
      validateFileForCategory(file, 'PANORAMA');
      const ext = getExtension(file.originalname);
      const processed = await processImage({ category: 'PANORAMA', originalExt: ext, fileBuffer: file.buffer });

      const asset = projectStore.createAsset({
        originalName: file.originalname, fileName: processed.fileName,
        mimeType: file.mimetype, fileSize: file.size,
        filePath: processed.originalPath, optimizedPath: processed.optimizedPath,
        thumbnailPath: processed.thumbnailPath, category: 'PANORAMA',
        width: processed.width, height: processed.height, tags: [],
      });
      panoramaPath = asset.optimizedPath || asset.filePath;

      // Separate thumbnail asset record
      if (processed.thumbnailPath) {
        const thumbAsset = projectStore.createAsset({
          originalName: `thumb_${file.originalname}`, fileName: processed.fileName,
          mimeType: 'image/webp', fileSize: 0, filePath: processed.thumbnailPath,
          category: 'IMAGE', tags: [],
          optimizedPath: null, thumbnailPath: null,
          width: null, height: null,
        });
        thumbnailPath = thumbAsset.filePath;
      }
    }

    const scene = projectStore.createScene({
      title: data.title, description: data.description ?? null,
      panoramaPath, thumbnailPath,
      order: sceneCount, isStartScene: isFirst,
      defaultYaw: 0, defaultPitch: 0, defaultZoom: 50,
      defaultAvatarId: null,
      avatarPlaybackMode: null,
      avatarPosition: null,
      avatarVolume: 80,
      avatarMuted: false,
      avatarReplay: false,
      avatarPostPlaybackAction: 'DO_NOTHING',
      avatarPostPlaybackTargetSceneId: null,
      avatarPostPlaybackTargetAssetPath: null,
      avatarPostPlaybackTargetUrl: null,
      avatarPostPlaybackTargetNextAvatarId: null,
      avatarCustomPositionX: null,
      avatarCustomPositionY: null,
      avatarScale: null,
    });

    return this.toDto(scene);
  }

  async getById(id: string) {
    const scene = projectStore.getScene(id);
    if (!scene) throw new NotFoundError('Scene');

    const hotspots = projectStore.listHotspotsByScene(id);
    const avatars = projectStore.listAvatars().data;

    const dto = this.toDto(scene, avatars);
    dto.hotspots = hotspots.map((h) => this.hotspotToDto(h, avatars));
    return dto;
  }

  async update(id: string, data: any) {
    const scene = projectStore.getScene(id);
    if (!scene) throw new NotFoundError('Scene');
    
    // Support mapping input schema where clients might send older fields
    const updates = { ...data };
    if (data.panoramaAssetId !== undefined) {
      // If client sent panoramaAssetId, convert to path if it is UUID
      if (data.panoramaAssetId && data.panoramaAssetId.length === 36) {
        const asset = projectStore.getAsset(data.panoramaAssetId);
        if (asset) updates.panoramaPath = asset.optimizedPath || asset.filePath;
      }
    }
    if (data.thumbnailAssetId !== undefined) {
      if (data.thumbnailAssetId && data.thumbnailAssetId.length === 36) {
        const asset = projectStore.getAsset(data.thumbnailAssetId);
        if (asset) updates.thumbnailPath = asset.filePath;
      }
    }
    if (data.avatarPostPlaybackTargetAssetId !== undefined) {
      if (data.avatarPostPlaybackTargetAssetId && data.avatarPostPlaybackTargetAssetId.length === 36) {
        const asset = projectStore.getAsset(data.avatarPostPlaybackTargetAssetId);
        if (asset) updates.avatarPostPlaybackTargetAssetPath = asset.filePath;
      }
    }

    const updated = projectStore.updateScene(id, updates);
    if (!updated) throw new NotFoundError('Scene');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<void> {
    const scene = projectStore.getScene(id);
    if (!scene) throw new NotFoundError('Scene');

    // If deleting the start scene, set the next scene as start
    if (scene.isStartScene) {
      const allScenes = projectStore.listScenes();
      const next = allScenes.find((s) => s.id !== id);
      if (next) {
        projectStore.updateScene(next.id, { isStartScene: true });
      }
    }
    projectStore.deleteScene(id);
  }

  async reorder(scenes: Array<{ id: string; order: number }>): Promise<void> {
    projectStore.reorderScenes(scenes);
  }

  async setStartScene(id: string) {
    const scene = projectStore.getScene(id);
    if (!scene) throw new NotFoundError('Scene');
    const updated = projectStore.setStartScene(id);
    if (!updated) throw new NotFoundError('Scene');
    return this.toDto(updated);
  }

  async updateDefaultView(id: string, data: { defaultYaw: number; defaultPitch: number; defaultZoom: number }) {
    const scene = projectStore.getScene(id);
    if (!scene) throw new NotFoundError('Scene');
    const updated = projectStore.updateScene(id, data);
    if (!updated) throw new NotFoundError('Scene');
    return this.toDto(updated);
  }

  async replacePanorama(id: string, file: Express.Multer.File) {
    const scene = projectStore.getScene(id);
    if (!scene) throw new NotFoundError('Scene');

    validateFileForCategory(file, 'PANORAMA');
    const ext = getExtension(file.originalname);
    const processed = await processImage({ category: 'PANORAMA', originalExt: ext, fileBuffer: file.buffer });

    const asset = projectStore.createAsset({
      originalName: file.originalname, fileName: processed.fileName,
      mimeType: file.mimetype, fileSize: file.size,
      filePath: processed.originalPath, optimizedPath: processed.optimizedPath,
      thumbnailPath: processed.thumbnailPath, category: 'PANORAMA',
      width: processed.width, height: processed.height, tags: [],
    });

    let thumbnailPath = scene.thumbnailPath;
    if (processed.thumbnailPath) {
      const thumbAsset = projectStore.createAsset({
        originalName: `thumb_${file.originalname}`, fileName: processed.fileName,
        mimeType: 'image/webp', fileSize: 0, filePath: processed.thumbnailPath,
        category: 'IMAGE', tags: [],
        optimizedPath: null, thumbnailPath: null,
        width: null, height: null,
      });
      thumbnailPath = thumbAsset.filePath;
    }

    const updated = projectStore.updateScene(id, { 
      panoramaPath: asset.optimizedPath || asset.filePath,
      thumbnailPath 
    });
    if (!updated) throw new NotFoundError('Scene');
    return this.toDto(updated);
  }

  private resolveAvatarDto(avatarId: string | null, avatars?: any[]): any {
    if (!avatarId) return null;
    const av = avatars?.find((a: any) => a.id === avatarId) ?? projectStore.getAvatar(avatarId);
    if (!av) return null;

    return {
      ...av,
      originalUrl: av.originalAssetPath ? storage.getPublicUrl(av.originalAssetPath) : null,
      optimizedUrl: av.optimizedAssetPath ? storage.getPublicUrl(av.optimizedAssetPath) : null,
      thumbnailUrl: av.thumbnailAssetPath ? storage.getPublicUrl(av.thumbnailAssetPath) : null,
    };
  }

  private hotspotToDto(h: any, avatars?: any[]): any {
    return {
      id: h.id,
      sceneId: h.sceneId,
      label: h.label,
      description: h.description,
      iconType: h.iconType,
      yaw: h.yaw,
      pitch: h.pitch,
      type: h.type,
      targetSceneId: h.targetSceneId,
      targetAssetPath: h.targetAssetPath,
      targetAssetUrl: h.targetAssetPath ? storage.getPublicUrl(h.targetAssetPath) : null,
      targetUrl: h.targetUrl,
      avatarId: h.avatarId,
      avatar: this.resolveAvatarDto(h.avatarId, avatars),
      avatarPlaybackMode: h.avatarPlaybackMode,
      avatarPosition: h.avatarPosition,
      avatarVolume: h.avatarVolume,
      avatarMuted: h.avatarMuted,
      avatarReplay: h.avatarReplay,
      avatarPostPlaybackAction: h.avatarPostPlaybackAction,
      avatarPostPlaybackTargetSceneId: h.avatarPostPlaybackTargetSceneId,
      avatarPostPlaybackTargetAssetPath: h.avatarPostPlaybackTargetAssetPath,
      avatarPostPlaybackTargetAssetUrl: h.avatarPostPlaybackTargetAssetPath ? storage.getPublicUrl(h.avatarPostPlaybackTargetAssetPath) : null,
      avatarPostPlaybackTargetUrl: h.avatarPostPlaybackTargetUrl,
      avatarPostPlaybackTargetNextAvatarId: h.avatarPostPlaybackTargetNextAvatarId,
      avatarCustomPositionX: h.avatarCustomPositionX,
      avatarCustomPositionY: h.avatarCustomPositionY,
      avatarScale: h.avatarScale ?? null,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    };
  }

  private toDto(s: any, avatars?: any[]) {
    const panoramaUrl = s.panoramaPath ? storage.getPublicUrl(s.panoramaPath) : null;
    const thumbnailUrl = s.thumbnailPath ? storage.getPublicUrl(s.thumbnailPath) : null;
    const defaultAvatar = this.resolveAvatarDto(s.defaultAvatarId, avatars);

    return {
      id: s.id, 
      projectId: projectStore.getProject().id, 
      title: s.title, 
      description: s.description,
      panoramaPath: s.panoramaPath, 
      thumbnailPath: s.thumbnailPath,
      panoramaUrl, 
      thumbnailUrl,
      order: s.order, 
      isStartScene: s.isStartScene,
      defaultYaw: s.defaultYaw, 
      defaultPitch: s.defaultPitch, 
      defaultZoom: s.defaultZoom,
      hotspotCount: projectStore.countHotspotsByScene(s.id),
      hotspots: undefined as any,
      defaultAvatarId: s.defaultAvatarId,
      defaultAvatar,
      avatarPlaybackMode: s.avatarPlaybackMode,
      avatarPosition: s.avatarPosition,
      avatarVolume: s.avatarVolume,
      avatarMuted: s.avatarMuted,
      avatarReplay: s.avatarReplay,
      avatarPostPlaybackAction: s.avatarPostPlaybackAction,
      avatarPostPlaybackTargetSceneId: s.avatarPostPlaybackTargetSceneId,
      avatarPostPlaybackTargetAssetPath: s.avatarPostPlaybackTargetAssetPath,
      avatarPostPlaybackTargetUrl: s.avatarPostPlaybackTargetUrl,
      avatarPostPlaybackTargetNextAvatarId: s.avatarPostPlaybackTargetNextAvatarId,
      avatarCustomPositionX: s.avatarCustomPositionX,
      avatarCustomPositionY: s.avatarCustomPositionY,
      avatarScale: s.avatarScale ?? null,
      createdAt: s.createdAt, 
      updatedAt: s.updatedAt,
    };
  }
}

export const sceneService = new SceneService();
