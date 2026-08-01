export interface ProjectBranding {
  id: string;
  projectId: string;
  logoAssetId: string | null;
  logoPosition: string;
  logoSize: string;
  coverAssetId: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
  showControls: boolean;
  showSceneMenu: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  welcomeTitle: string | null;
  welcomeMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandingRequest {
  logoAssetId?: string | null;
  logoPosition?: string;
  logoSize?: string;
  coverAssetId?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  showControls?: boolean;
  showSceneMenu?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  welcomeTitle?: string | null;
  welcomeMessage?: string | null;
}
