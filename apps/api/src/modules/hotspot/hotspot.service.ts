import { projectStore } from '../../lib/project-store';
import { NotFoundError } from '../../utils/errors';
import { storage } from '../../lib/storage';
import type { Hotspot, CreateHotspotRequest, UpdateHotspotRequest } from '@vt/shared';

export class HotspotService {
  async listByScene(sceneId: string): Promise<Hotspot[]> {
    const scene = projectStore.getScene(sceneId);
    if (!scene) throw new NotFoundError('Scene');
    const hotspots = projectStore.listHotspotsByScene(sceneId);
    return hotspots.map((h) => this.toDto(h));
  }

  async create(sceneId: string, data: CreateHotspotRequest): Promise<Hotspot> {
    const scene = projectStore.getScene(sceneId);
    if (!scene) throw new NotFoundError('Scene');

    const rawData = data as any;
    
    // Convert targetAssetId to path if it is UUID
    let targetAssetPath = rawData.targetAssetPath || rawData.targetAssetId || null;
    if (targetAssetPath && targetAssetPath.length === 36) {
      const asset = projectStore.getAsset(targetAssetPath);
      if (asset) targetAssetPath = asset.filePath;
    }

    let avatarPostPlaybackTargetAssetPath = rawData.avatarPostPlaybackTargetAssetPath || rawData.avatarPostPlaybackTargetAssetId || null;
    if (avatarPostPlaybackTargetAssetPath && avatarPostPlaybackTargetAssetPath.length === 36) {
      const asset = projectStore.getAsset(avatarPostPlaybackTargetAssetPath);
      if (asset) avatarPostPlaybackTargetAssetPath = asset.filePath;
    }

    const hotspot = projectStore.createHotspot({
      sceneId,
      label: rawData.label,
      description: rawData.description ?? null,
      iconType: rawData.iconType ?? 'default',
      yaw: rawData.yaw ?? 0,
      pitch: rawData.pitch ?? 0,
      type: rawData.type,
      targetSceneId: rawData.targetSceneId ?? null,
      targetAssetPath,
      targetUrl: rawData.targetUrl ?? null,
      avatarId: rawData.avatarId ?? null,
      avatarPlaybackMode: rawData.avatarPlaybackMode ?? null,
      avatarPosition: rawData.avatarPosition ?? null,
      avatarVolume: rawData.avatarVolume ?? null,
      avatarMuted: rawData.avatarMuted ?? null,
      avatarReplay: rawData.avatarReplay ?? null,
      avatarPostPlaybackAction: rawData.avatarPostPlaybackAction ?? null,
      avatarPostPlaybackTargetSceneId: rawData.avatarPostPlaybackTargetSceneId ?? null,
      avatarPostPlaybackTargetAssetPath,
      avatarPostPlaybackTargetUrl: rawData.avatarPostPlaybackTargetUrl ?? null,
      avatarPostPlaybackTargetNextAvatarId: rawData.avatarPostPlaybackTargetNextAvatarId ?? null,
      avatarCustomPositionX: rawData.avatarCustomPositionX ?? null,
      avatarCustomPositionY: rawData.avatarCustomPositionY ?? null,
      avatarScale: rawData.avatarScale ?? null,
    });

    return this.toDto(hotspot);
  }

  async getById(id: string): Promise<Hotspot> {
    const hotspot = projectStore.getHotspot(id);
    if (!hotspot) throw new NotFoundError('Hotspot');
    return this.toDto(hotspot);
  }

  async update(id: string, data: UpdateHotspotRequest): Promise<Hotspot> {
    const hotspot = projectStore.getHotspot(id);
    if (!hotspot) throw new NotFoundError('Hotspot');

    const updates: any = {};
    const rawData = data as any;

    const fields = [
      'label', 'description', 'iconType', 'yaw', 'pitch', 'type',
      'targetSceneId', 'targetUrl', 'avatarId', 'avatarPlaybackMode',
      'avatarPosition', 'avatarVolume', 'avatarMuted', 'avatarReplay',
      'avatarPostPlaybackAction', 'avatarPostPlaybackTargetSceneId',
      'avatarPostPlaybackTargetUrl', 'avatarPostPlaybackTargetNextAvatarId',
      'avatarCustomPositionX', 'avatarCustomPositionY', 'avatarScale'
    ];

    for (const field of fields) {
      if (rawData[field] !== undefined) {
        updates[field] = rawData[field];
      }
    }

    // Convert targetAssetId to path if it is UUID
    if (rawData.targetAssetPath !== undefined) {
      updates.targetAssetPath = rawData.targetAssetPath;
    } else if (rawData.targetAssetId !== undefined) {
      let path = rawData.targetAssetId;
      if (path && path.length === 36) {
        const asset = projectStore.getAsset(path);
        if (asset) path = asset.filePath;
      }
      updates.targetAssetPath = path;
    }

    if (rawData.avatarPostPlaybackTargetAssetPath !== undefined) {
      updates.avatarPostPlaybackTargetAssetPath = rawData.avatarPostPlaybackTargetAssetPath;
    } else if (rawData.avatarPostPlaybackTargetAssetId !== undefined) {
      let path = rawData.avatarPostPlaybackTargetAssetId;
      if (path && path.length === 36) {
        const asset = projectStore.getAsset(path);
        if (asset) path = asset.filePath;
      }
      updates.avatarPostPlaybackTargetAssetPath = path;
    }

    const updated = projectStore.updateHotspot(id, updates);
    if (!updated) throw new NotFoundError('Hotspot');
    return this.toDto(updated);
  }

  async updatePosition(id: string, yaw: number, pitch: number): Promise<Hotspot> {
    const hotspot = projectStore.getHotspot(id);
    if (!hotspot) throw new NotFoundError('Hotspot');
    const updated = projectStore.updateHotspot(id, { yaw, pitch });
    if (!updated) throw new NotFoundError('Hotspot');
    return this.toDto(updated);
  }

  async delete(id: string): Promise<void> {
    const hotspot = projectStore.getHotspot(id);
    if (!hotspot) throw new NotFoundError('Hotspot');
    projectStore.deleteHotspot(id);
  }

  private resolveAvatarDto(avatarId: string | null): any {
    if (!avatarId) return null;
    const av = projectStore.getAvatar(avatarId);
    if (!av) return null;

    return {
      ...av,
      originalUrl: av.originalAssetPath ? storage.getPublicUrl(av.originalAssetPath) : null,
      optimizedUrl: av.optimizedAssetPath ? storage.getPublicUrl(av.optimizedAssetPath) : null,
      thumbnailUrl: av.thumbnailAssetPath ? storage.getPublicUrl(av.thumbnailAssetPath) : null,
    };
  }

  private toDto(h: any): any {
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
      avatar: this.resolveAvatarDto(h.avatarId),
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
}

export const hotspotService = new HotspotService();
