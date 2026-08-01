import { projectStore } from '../../lib/project-store';
import type { GuidedTourStep, UpdateGuidedTourRequest } from '@vt/shared';

export class GuidedTourService {
  async get(): Promise<GuidedTourStep[]> {
    const steps = projectStore.getGuidedTour();
    return steps.map(this.toDto);
  }

  async update(data: UpdateGuidedTourRequest): Promise<GuidedTourStep[]> {
    const stepsInput = data.steps.map((s) => ({
      sceneId: s.sceneId,
      order: s.order,
      duration: s.duration,
      narrationTitle: s.narrationTitle ?? null,
      narrationText: s.narrationText ?? null,
      targetYaw: s.targetYaw ?? null,
      targetPitch: s.targetPitch ?? null,
      targetZoom: s.targetZoom ?? null,
      rotationAngle: s.rotationAngle ?? null,
      rotationSpeed: s.rotationSpeed ?? null,
      audioUrl: s.audioUrl ?? null,
      highlightHotspotId: s.highlightHotspotId ?? null,
      avatarId: s.avatarId ?? null,
    }));
    
    projectStore.replaceGuidedTour(stepsInput);
    return this.get();
  }

  async toggle(): Promise<{ guidedTourEnabled: boolean }> {
    const project = projectStore.getProject();
    const updated = projectStore.updateProject({ guidedTourEnabled: !project.guidedTourEnabled });
    return { guidedTourEnabled: updated.guidedTourEnabled };
  }

  private toDto(s: any): GuidedTourStep {
    return {
      id: s.id,
      projectId: projectStore.getProject().id,
      sceneId: s.sceneId,
      order: s.order,
      duration: s.duration,
      narrationTitle: s.narrationTitle,
      narrationText: s.narrationText,
      targetYaw: s.targetYaw,
      targetPitch: s.targetPitch,
      targetZoom: s.targetZoom,
      rotationAngle: s.rotationAngle,
      rotationSpeed: s.rotationSpeed,
      audioUrl: s.audioUrl,
      highlightHotspotId: s.highlightHotspotId,
      avatarId: s.avatarId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }
}

export const guidedTourService = new GuidedTourService();
