export type AvatarStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AvatarPlaybackMode = 'CLICK_TO_PLAY' | 'AUTO_PLAY' | 'GUIDED_TOUR';
export type AvatarPosition = 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'CENTER' | 'CUSTOM';
export type AvatarPostPlaybackAction = 'DO_NOTHING' | 'JUMP_TO_SCENE' | 'OPEN_PDF' | 'OPEN_URL' | 'PLAY_NEXT_AVATAR';

export interface Avatar {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  scale?: number;
  language: string;
  scriptNotes: string | null;
  duration: number | null;
  version: number;
  originalAssetId: string | null;
  optimizedAssetId: string | null;
  thumbnailAssetId: string | null;
  originalAssetPath?: string | null;
  optimizedAssetPath?: string | null;
  thumbnailAssetPath?: string | null;
  status: AvatarStatus;
  progress: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvatarWithUrls extends Avatar {
  originalUrl: string | null;
  optimizedUrl: string | null;
  thumbnailUrl: string | null;
}

export interface CreateAvatarRequest {
  name: string;
  description?: string;
  scale?: number;
  language?: string;
  scriptNotes?: string;
  projectId?: string;
}

export interface UpdateAvatarRequest {
  name?: string;
  description?: string;
  scale?: number;
  language?: string;
  scriptNotes?: string;
}
