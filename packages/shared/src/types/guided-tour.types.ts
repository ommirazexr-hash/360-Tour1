export interface GuidedTourStep {
  id: string;
  projectId: string;
  sceneId: string;
  order: number;
  duration: number;
  narrationTitle: string | null;
  narrationText: string | null;
  targetYaw: number | null;
  targetPitch: number | null;
  targetZoom: number | null;
  rotationAngle: number | null;
  rotationSpeed: number | null;
  audioUrl: string | null;
  highlightHotspotId: string | null;
  avatarId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuidedTourStepInput {
  sceneId: string;
  order: number;
  duration: number;
  narrationTitle?: string;
  narrationText?: string;
  targetYaw?: number;
  targetPitch?: number;
  targetZoom?: number;
  rotationAngle?: number;
  rotationSpeed?: number;
  audioUrl?: string;
  highlightHotspotId?: string;
  avatarId?: string | null;
}

export interface UpdateGuidedTourRequest {
  steps: GuidedTourStepInput[];
}
