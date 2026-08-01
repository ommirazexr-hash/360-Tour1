import { projectStore } from '../../lib/project-store';
import type { ProjectBranding, UpdateBrandingRequest } from '@vt/shared';
import { storage } from '../../lib/storage';

export class BrandingService {
  async get(): Promise<any> {
    const branding = projectStore.getBranding();

    const logoUrl = branding.logoPath ? storage.getPublicUrl(branding.logoPath) : null;
    const coverUrl = branding.coverPath ? storage.getPublicUrl(branding.coverPath) : null;

    return { 
      ...this.toDto(branding), 
      logoUrl, 
      coverUrl 
    };
  }

  async update(data: UpdateBrandingRequest): Promise<ProjectBranding> {
    const updates = { ...data } as any;
    
    // Support mapping older logoAssetId/coverAssetId properties to paths
    if (updates.logoAssetId !== undefined) {
      if (updates.logoAssetId && updates.logoAssetId.length === 36) {
        const asset = projectStore.getAsset(updates.logoAssetId);
        if (asset) updates.logoPath = asset.filePath;
      } else {
        updates.logoPath = updates.logoAssetId;
      }
    }
    if (updates.coverAssetId !== undefined) {
      if (updates.coverAssetId && updates.coverAssetId.length === 36) {
        const asset = projectStore.getAsset(updates.coverAssetId);
        if (asset) updates.coverPath = asset.filePath;
      } else {
        updates.coverPath = updates.coverAssetId;
      }
    }

    const branding = projectStore.updateBranding(updates);
    return this.toDto(branding);
  }

  private toDto(b: any): any {
    return {
      id: b.id, 
      projectId: projectStore.getProject().id, 
      logoAssetId: b.logoPath, // For compatibility with older frontend models
      logoPath: b.logoPath,
      logoPosition: b.logoPosition, 
      logoSize: b.logoSize, 
      coverAssetId: b.coverPath, // For compatibility with older frontend models
      coverPath: b.coverPath,
      primaryColor: b.primaryColor, 
      secondaryColor: b.secondaryColor,
      backgroundColor: b.backgroundColor, 
      textColor: b.textColor,
      autoRotate: b.autoRotate, 
      autoRotateSpeed: b.autoRotateSpeed,
      showControls: b.showControls, 
      showSceneMenu: b.showSceneMenu,
      contactEmail: b.contactEmail, 
      contactPhone: b.contactPhone,
      websiteUrl: b.websiteUrl, 
      welcomeTitle: b.welcomeTitle, 
      welcomeMessage: b.welcomeMessage,
      createdAt: b.createdAt, 
      updatedAt: b.updatedAt,
    };
  }
}

export const brandingService = new BrandingService();
