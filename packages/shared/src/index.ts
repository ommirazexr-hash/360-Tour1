// ─── Types ────────────────────────────────────────────
export type { ApiResponse, ApiError, PaginationMeta, PaginationQuery } from './types/api.types';
export type { LoginRequest, LoginResponse, AdminProfile, ChangePasswordRequest } from './types/auth.types';
export type { Project, ProjectListItem, CreateProjectRequest, UpdateProjectRequest, DuplicateProjectRequest } from './types/project.types';
export type { ProjectBranding, UpdateBrandingRequest } from './types/branding.types';
export type { Scene, SceneWithHotspots, CreateSceneRequest, UpdateSceneRequest, ReorderScenesRequest, UpdateDefaultViewRequest } from './types/scene.types';
export type { HotspotType, Hotspot, HotspotWithAssetUrl, CreateHotspotRequest, UpdateHotspotRequest, UpdateHotspotPositionRequest } from './types/hotspot.types';
export type { AssetCategory, Asset, AssetWithUrls, UploadAssetRequest, UpdateAssetRequest, AssetUsage } from './types/asset.types';
export type { Lead, LeadWithProject, CreateLeadRequest, LeadFilterQuery } from './types/lead.types';
export type { GuidedTourStep, GuidedTourStepInput, UpdateGuidedTourRequest } from './types/guided-tour.types';
export type { DashboardStats, RecentActivity } from './types/dashboard.types';
export type { Setting, UpdateSettingsRequest } from './types/settings.types';
export type { AvatarStatus, AvatarPlaybackMode, AvatarPosition, AvatarPostPlaybackAction, Avatar, AvatarWithUrls, CreateAvatarRequest, UpdateAvatarRequest } from './types/avatar.types';

// ─── Schemas ──────────────────────────────────────────
export { loginSchema, changePasswordSchema } from './schemas/auth.schema';
export { createProjectSchema, updateProjectSchema, duplicateProjectSchema } from './schemas/project.schema';
export { updateBrandingSchema } from './schemas/branding.schema';
export { createSceneSchema, updateSceneSchema, reorderScenesSchema, updateDefaultViewSchema } from './schemas/scene.schema';
export { createHotspotSchema, updateHotspotSchema, updateHotspotPositionSchema } from './schemas/hotspot.schema';
export { uploadAssetSchema, updateAssetSchema } from './schemas/asset.schema';
export { createLeadSchema } from './schemas/lead.schema';
export { updateGuidedTourSchema } from './schemas/guided-tour.schema';
export { updateSettingsSchema } from './schemas/settings.schema';
export { createAvatarSchema, updateAvatarSchema } from './schemas/avatar.schema';

// ─── Constants ────────────────────────────────────────
export { HOTSPOT_TYPES, ICON_TYPES } from './constants/hotspot.constants';
export type { IconType } from './constants/hotspot.constants';
export { ASSET_CATEGORIES, ALLOWED_EXTENSIONS } from './constants/asset.constants';
export { VIEWER_DEFAULTS, LOGO_POSITIONS, LOGO_SIZES } from './constants/viewer.constants';
export type { LogoPosition, LogoSize } from './constants/viewer.constants';
