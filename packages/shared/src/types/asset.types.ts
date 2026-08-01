export type AssetCategory = 'PANORAMA' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LOGO' | 'AVATAR' | 'AUDIO';

export interface Asset {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  optimizedPath: string | null;
  thumbnailPath: string | null;
  category: AssetCategory;
  tags: string[];
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetWithUrls extends Asset {
  fileUrl: string;
  optimizedUrl: string | null;
  thumbnailUrl: string | null;
}

export interface UploadAssetRequest {
  category: AssetCategory;
  tags?: string;
}

export interface UpdateAssetRequest {
  originalName?: string;
  tags?: string[];
}

export interface AssetUsage {
  usedInScenes: Array<{
    sceneId: string;
    sceneTitle: string;
    projectName: string;
    field: string;
  }>;
  usedInHotspots: Array<{
    hotspotId: string;
    hotspotLabel: string;
    sceneTitle: string;
    field: string;
  }>;
  usedInBranding: Array<{
    projectId: string;
    projectName: string;
    field: string;
  }>;
  usedInAvatars: Array<{
    avatarId: string;
    avatarName: string;
    projectName: string | null;
    field: string;
  }>;
  totalUsages: number;
}
