export type HotspotType =
  | 'SCENE_LINK'
  | 'INFO_POPUP'
  | 'PDF'
  | 'VIDEO'
  | 'IMAGE'
  | 'EXTERNAL_URL'
  | 'CONTACT_FORM';

export interface Hotspot {
  id: string;
  sceneId: string;
  label: string;
  description: string | null;
  iconType: string;
  yaw: number;
  pitch: number;
  type: HotspotType;
  targetSceneId: string | null;
  targetAssetId: string | null;
  targetUrl: string | null;
  style: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotspotWithAssetUrl extends Hotspot {
  targetAssetUrl: string | null;
}

export interface CreateHotspotRequest {
  label: string;
  description?: string;
  iconType?: string;
  yaw: number;
  pitch: number;
  type: HotspotType;
  targetSceneId?: string;
  targetAssetId?: string;
  targetUrl?: string;
  style?: Record<string, unknown>;
}

export interface UpdateHotspotRequest {
  label?: string;
  description?: string;
  iconType?: string;
  yaw?: number;
  pitch?: number;
  type?: HotspotType;
  targetSceneId?: string | null;
  targetAssetId?: string | null;
  targetUrl?: string | null;
  style?: Record<string, unknown> | null;
}

export interface UpdateHotspotPositionRequest {
  yaw: number;
  pitch: number;
}
