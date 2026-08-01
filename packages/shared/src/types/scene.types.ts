import type { AvatarPlaybackMode, AvatarPosition, AvatarPostPlaybackAction } from './avatar.types';

export interface Scene {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  panoramaPath: string | null;
  thumbnailPath: string | null;
  order: number;
  isStartScene: boolean;
  defaultYaw: number;
  defaultPitch: number;
  defaultZoom: number;
  createdAt: string;
  updatedAt: string;

  // Scene-level default Avatar assignment & Explicit columns
  defaultAvatarId?: string | null;
  avatarPlaybackMode?: AvatarPlaybackMode | null;
  avatarPosition?: AvatarPosition | null;
  avatarVolume?: number | null;
  avatarMuted?: boolean | null;
  avatarReplay?: boolean | null;
  avatarPostPlaybackAction?: AvatarPostPlaybackAction | null;
  avatarPostPlaybackTargetSceneId?: string | null;
  avatarPostPlaybackTargetAssetPath?: string | null;
  avatarPostPlaybackTargetUrl?: string | null;
  avatarPostPlaybackTargetNextAvatarId?: string | null;
  avatarCustomPositionX?: number | null;
  avatarCustomPositionY?: number | null;
}

export interface SceneWithHotspots extends Scene {
  hotspots: import('./hotspot.types').Hotspot[];
  panoramaUrl: string | null;
  thumbnailUrl: string | null;
}

export interface CreateSceneRequest {
  title: string;
  description?: string;
}

export interface UpdateSceneRequest {
  title?: string;
  description?: string | null;
  defaultAvatarId?: string | null;
  avatarPlaybackMode?: AvatarPlaybackMode | null;
  avatarPosition?: AvatarPosition | null;
  avatarVolume?: number | null;
  avatarMuted?: boolean | null;
  avatarReplay?: boolean | null;
  avatarPostPlaybackAction?: AvatarPostPlaybackAction | null;
  avatarPostPlaybackTargetSceneId?: string | null;
  avatarPostPlaybackTargetAssetId?: string | null;
  avatarPostPlaybackTargetUrl?: string | null;
  avatarPostPlaybackTargetNextAvatarId?: string | null;
  avatarCustomPositionX?: number | null;
  avatarCustomPositionY?: number | null;
}

export interface ReorderScenesRequest {
  scenes: Array<{ id: string; order: number }>;
}

export interface UpdateDefaultViewRequest {
  defaultYaw: number;
  defaultPitch: number;
  defaultZoom: number;
}

