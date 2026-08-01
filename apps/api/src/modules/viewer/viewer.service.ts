import { projectStore } from '../../lib/project-store';
import { NotFoundError } from '../../utils/errors';
import { storage } from '../../lib/storage';

export class ViewerService {
  /** Parse scale from avatar description tag e.g. "[scale:1.5]" */
  private parseAvatarScale(desc: string | null): number {
    if (!desc) return 1.0;
    const m = desc.match(/\[scale:([\d.]+)\]/);
    if (m && m[1]) { 
      const v = parseFloat(m[1]); 
      if (!isNaN(v)) return v; 
    }
    return 1.0;
  }

  async getTourBySlug(slug: string) {
    const raw = projectStore.getFullTourData();

    if (!raw.project) throw new NotFoundError('Tour');
    
    // Verify slug matches project slug, or allow 'preview' for homepage views
    if (slug !== 'preview' && raw.project.slug !== slug) {
      throw new NotFoundError('Tour');
    }

    // Resolve branding asset URLs
    const logoUrl = raw.branding.logoPath ? storage.getPublicUrl(raw.branding.logoPath) : null;
    const coverUrl = raw.branding.coverPath ? storage.getPublicUrl(raw.branding.coverPath) : null;

    const scenes = raw.scenes.filter((s) => !s.deletedAt).map((scene) => {
      let defaultAvatar = null;
      if (scene.defaultAvatarId) {
        const av = raw.avatars.find((a) => a.id === scene.defaultAvatarId && !a.deletedAt);
        if (av) {
          defaultAvatar = {
            ...av,
            scale: this.parseAvatarScale(av.description),
            originalUrl: av.originalAssetPath ? storage.getPublicUrl(av.originalAssetPath) : null,
            optimizedUrl: av.optimizedAssetPath ? storage.getPublicUrl(av.optimizedAssetPath) : null,
            thumbnailUrl: av.thumbnailAssetPath ? storage.getPublicUrl(av.thumbnailAssetPath) : null,
          };
        }
      }

      const hotspots = raw.hotspots.filter((h) => h.sceneId === scene.id).map((h) => {
        let av = null;
        if (h.avatarId) {
          const avatarData = raw.avatars.find((a) => a.id === h.avatarId && !a.deletedAt);
          if (avatarData) {
            av = {
              ...avatarData,
              scale: this.parseAvatarScale(avatarData.description),
              originalUrl: avatarData.originalAssetPath ? storage.getPublicUrl(avatarData.originalAssetPath) : null,
              optimizedUrl: avatarData.optimizedAssetPath ? storage.getPublicUrl(avatarData.optimizedAssetPath) : null,
              thumbnailUrl: avatarData.thumbnailAssetPath ? storage.getPublicUrl(avatarData.thumbnailAssetPath) : null,
            };
          }
        }

        return {
          id: h.id, 
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
          avatar: av,
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
        };
      });

      return {
        id: scene.id, 
        title: scene.title, 
        description: scene.description,
        panoramaPath: scene.panoramaPath,
        thumbnailPath: scene.thumbnailPath,
        panoramaUrl: scene.panoramaPath ? storage.getPublicUrl(scene.panoramaPath) : null,
        thumbnailUrl: scene.thumbnailPath ? storage.getPublicUrl(scene.thumbnailPath) : null,
        isStartScene: scene.isStartScene, 
        order: scene.order,
        defaultYaw: scene.defaultYaw, 
        defaultPitch: scene.defaultPitch, 
        defaultZoom: scene.defaultZoom,
        
        defaultAvatarId: scene.defaultAvatarId,
        defaultAvatar,
        avatarPlaybackMode: scene.avatarPlaybackMode,
        avatarPosition: scene.avatarPosition,
        avatarVolume: scene.avatarVolume,
        avatarMuted: scene.avatarMuted,
        avatarReplay: scene.avatarReplay,
        avatarPostPlaybackAction: scene.avatarPostPlaybackAction,
        avatarPostPlaybackTargetSceneId: scene.avatarPostPlaybackTargetSceneId,
        avatarPostPlaybackTargetAssetPath: scene.avatarPostPlaybackTargetAssetPath,
        avatarPostPlaybackTargetAssetUrl: scene.avatarPostPlaybackTargetAssetPath ? storage.getPublicUrl(scene.avatarPostPlaybackTargetAssetPath) : null,
        avatarPostPlaybackTargetUrl: scene.avatarPostPlaybackTargetUrl,
        avatarPostPlaybackTargetNextAvatarId: scene.avatarPostPlaybackTargetNextAvatarId,
        avatarCustomPositionX: scene.avatarCustomPositionX,
        avatarCustomPositionY: scene.avatarCustomPositionY,
        avatarScale: scene.avatarScale ?? null,
        hotspots,
      };
    });

    return {
      project: {
        id: raw.project.id,
        name: raw.project.name, 
        slug: raw.project.slug, 
        companyName: raw.project.companyName,
        description: raw.project.description, 
        guidedTourEnabled: raw.project.guidedTourEnabled,
      },
      branding: {
        id: raw.branding.id,
        logoUrl, 
        logoPath: raw.branding.logoPath,
        logoPosition: raw.branding.logoPosition, 
        logoSize: raw.branding.logoSize,
        coverUrl, 
        coverPath: raw.branding.coverPath,
        primaryColor: raw.branding.primaryColor,
        secondaryColor: raw.branding.secondaryColor, 
        backgroundColor: raw.branding.backgroundColor,
        textColor: raw.branding.textColor, 
        autoRotate: raw.branding.autoRotate,
        autoRotateSpeed: raw.branding.autoRotateSpeed, 
        showControls: raw.branding.showControls,
        showSceneMenu: raw.branding.showSceneMenu, 
        contactEmail: raw.branding.contactEmail,
        contactPhone: raw.branding.contactPhone, 
        websiteUrl: raw.branding.websiteUrl,
        welcomeTitle: raw.branding.welcomeTitle, 
        welcomeMessage: raw.branding.welcomeMessage,
      },
      scenes,
      guidedTour: raw.guidedTour.map((s) => ({
        id: s.id,
        order: s.order, 
        sceneId: s.sceneId, 
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
      })),
    };
  }
}

export const viewerService = new ViewerService();
