import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from './logger';

// ─── Data Types ──────────────────────────────────────────

export interface ProjectMeta {
  id: string;
  name: string;
  slug: string;
  companyName: string | null;
  description: string | null;
  guidedTourEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingData {
  id: string;
  logoPath: string | null;
  logoPosition: string;
  logoSize: string;
  coverPath: string | null;
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

export interface SceneData {
  id: string;
  title: string;
  description: string | null;
  panoramaPath: string | null;
  thumbnailPath: string | null;
  order: number;
  isStartScene: boolean;
  defaultYaw: number;
  defaultPitch: number;
  defaultZoom: number;
  defaultAvatarId: string | null;
  avatarPlaybackMode: string | null;
  avatarPosition: string | null;
  avatarVolume: number | null;
  avatarMuted: boolean | null;
  avatarReplay: boolean | null;
  avatarPostPlaybackAction: string | null;
  avatarPostPlaybackTargetSceneId: string | null;
  avatarPostPlaybackTargetAssetPath: string | null;
  avatarPostPlaybackTargetUrl: string | null;
  avatarPostPlaybackTargetNextAvatarId: string | null;
  avatarCustomPositionX: number | null;
  avatarCustomPositionY: number | null;
  avatarScale: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HotspotData {
  id: string;
  sceneId: string;
  label: string;
  description: string | null;
  iconType: string;
  yaw: number;
  pitch: number;
  type: string;
  targetSceneId: string | null;
  targetAssetPath: string | null;
  targetUrl: string | null;
  avatarId: string | null;
  avatarPlaybackMode: string | null;
  avatarPosition: string | null;
  avatarVolume: number | null;
  avatarMuted: boolean | null;
  avatarReplay: boolean | null;
  avatarPostPlaybackAction: string | null;
  avatarPostPlaybackTargetSceneId: string | null;
  avatarPostPlaybackTargetAssetPath: string | null;
  avatarPostPlaybackTargetUrl: string | null;
  avatarPostPlaybackTargetNextAvatarId: string | null;
  avatarCustomPositionX: number | null;
  avatarCustomPositionY: number | null;
  avatarScale: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetData {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string; // e.g. assets/panoramas/abc123.webp (relative to projectDir)
  optimizedPath: string | null;
  thumbnailPath: string | null;
  category: string;
  tags: string[];
  width: number | null;
  height: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuidedTourStepData {
  id: string;
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

export interface AvatarData {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  language: string;
  scriptNotes: string | null;
  duration: number | null;
  version: number;
  originalAssetPath: string | null;
  optimizedAssetPath: string | null;
  thumbnailAssetPath: string | null;
  status: string;
  progress: number;
  error: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadData {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string | null;
  createdAt: string;
}

export interface ProjectFileData {
  version: number;
  project: ProjectMeta;
  branding: BrandingData;
  scenes: SceneData[];
  hotspots: HotspotData[];
  assets: AssetData[];
  guidedTour: GuidedTourStepData[];
  avatars: AvatarData[];
  leads?: LeadData[];
}

// ─── Default Data Factory ────────────────────────────────

function createDefaultProjectData(): ProjectFileData {
  const now = new Date().toISOString();
  return {
    version: 1,
    project: {
      id: uuidv4(),
      name: 'My Virtual Tour',
      slug: 'my-virtual-tour',
      companyName: null,
      description: null,
      guidedTourEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
    branding: {
      id: uuidv4(),
      logoPath: null,
      logoPosition: 'top-left',
      logoSize: 'medium',
      coverPath: null,
      primaryColor: '#6366f1',
      secondaryColor: '#818cf8',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      autoRotate: false,
      autoRotateSpeed: 1.0,
      showControls: true,
      showSceneMenu: true,
      contactEmail: null,
      contactPhone: null,
      websiteUrl: null,
      welcomeTitle: null,
      welcomeMessage: null,
      createdAt: now,
      updatedAt: now,
    },
    scenes: [],
    hotspots: [],
    assets: [],
    guidedTour: [],
    avatars: [],
    leads: [],
  };
}

// ─── ProjectStore Singleton ──────────────────────────────

class ProjectStore {
  private data!: ProjectFileData;
  private projectDir: string;
  private projectFilePath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor() {
    this.projectDir = path.resolve(env.PROJECT_DIR);
    this.projectFilePath = path.join(this.projectDir, 'project.json');
  }

  /** Initialize the store — must be called on app startup */
  init(): void {
    if (this.initialized) return;

    // Ensure project directory and asset subdirectories exist
    const assetDirs = [
      '',
      'assets',
      'assets/panoramas',
      'assets/images',
      'assets/documents',
      'assets/avatars',
      'assets/avatars/original',
      'assets/avatars/optimized',
      'assets/originals',
      'assets/optimized',
      'assets/thumbnails',
    ];
    try {
      for (const sub of assetDirs) {
        const dirPath = path.join(this.projectDir, sub);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
    } catch (err) {
      logger.warn(`⚠️ Failed to create local project asset directories: ${(err as Error).message}. This is expected in read-only environments like Vercel.`);
    }

    // Load or create project.json
    if (fs.existsSync(this.projectFilePath)) {
      try {
        const raw = fs.readFileSync(this.projectFilePath, 'utf-8');
        this.data = JSON.parse(raw) as ProjectFileData;
        if (!this.data.leads) {
          this.data.leads = [];
        }
        logger.info(`Loaded project: "${this.data.project.name}" from ${this.projectFilePath}`);
      } catch (err) {
        logger.error(`Failed to parse project.json, creating fresh project`, { error: (err as Error).message });
        this.data = createDefaultProjectData();
        this.saveSync();
      }
    } else {
      logger.info(`No project.json found at ${this.projectFilePath}, creating default project`);
      this.data = createDefaultProjectData();
      this.saveSync();
    }

    this.initialized = true;
  }

  /** Get the project directory path (for storage provider) */
  getProjectDir(): string {
    return this.projectDir;
  }

  // ─── Persistence ─────────────────────────────────────

  /** Debounced save — waits 100ms to batch rapid mutations */
  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveSync();
      this.saveTimer = null;
    }, 100);
  }

  /** Synchronous write — used for initialization and forced saves */
  private saveSync(): void {
    try {
      fs.writeFileSync(this.projectFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      logger.error(`Failed to save project.json`, { error: (err as Error).message });
    }
  }

  // ─── Project ─────────────────────────────────────────

  getProject(): ProjectMeta {
    return { ...this.data.project };
  }

  updateProject(updates: Partial<Omit<ProjectMeta, 'id' | 'createdAt'>>): ProjectMeta {
    this.data.project = {
      ...this.data.project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return { ...this.data.project };
  }

  // ─── Branding ────────────────────────────────────────

  getBranding(): BrandingData {
    return { ...this.data.branding };
  }

  updateBranding(updates: Partial<Omit<BrandingData, 'id' | 'createdAt'>>): BrandingData {
    this.data.branding = {
      ...this.data.branding,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return { ...this.data.branding };
  }

  // ─── Scenes ──────────────────────────────────────────

  listScenes(): SceneData[] {
    return this.data.scenes
      .filter((s) => !s.deletedAt)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s }));
  }

  getScene(id: string): SceneData | null {
    const scene = this.data.scenes.find((s) => s.id === id && !s.deletedAt);
    return scene ? { ...scene } : null;
  }

  createScene(input: Omit<SceneData, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): SceneData {
    const now = new Date().toISOString();
    const scene: SceneData = {
      ...input,
      id: uuidv4(),
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.scenes.push(scene);
    this.scheduleSave();
    return { ...scene };
  }

  updateScene(id: string, updates: Partial<SceneData>): SceneData | null {
    const idx = this.data.scenes.findIndex((s) => s.id === id && !s.deletedAt);
    if (idx === -1) return null;
    this.data.scenes[idx] = {
      ...this.data.scenes[idx],
      ...updates,
      id, // Prevent ID override
      updatedAt: new Date().toISOString(),
    } as SceneData;
    this.scheduleSave();
    return { ...this.data.scenes[idx] } as SceneData;
  }

  deleteScene(id: string): boolean {
    const idx = this.data.scenes.findIndex((s) => s.id === id && !s.deletedAt);
    if (idx === -1) return false;
    const scene = this.data.scenes[idx];
    if (scene) {
      scene.deletedAt = new Date().toISOString();
      this.scheduleSave();
      return true;
    }
    return false;
  }

  countScenes(): number {
    return this.data.scenes.filter((s) => !s.deletedAt).length;
  }

  /** Clear isStartScene from all scenes, then set the given one */
  setStartScene(id: string): SceneData | null {
    const target = this.data.scenes.find((s) => s.id === id && !s.deletedAt);
    if (!target) return null;
    for (const s of this.data.scenes) {
      if (!s.deletedAt) s.isStartScene = false;
    }
    target.isStartScene = true;
    target.updatedAt = new Date().toISOString();
    this.scheduleSave();
    return { ...target };
  }

  /** Set the first non-deleted scene as start if none is set */
  ensureStartScene(): void {
    const active = this.data.scenes.filter((s) => !s.deletedAt);
    if (active.length > 0 && !active.some((s) => s.isStartScene)) {
      active.sort((a, b) => a.order - b.order);
      const first = active[0];
      if (first) {
        first.isStartScene = true;
        this.scheduleSave();
      }
    }
  }

  reorderScenes(orderMap: Array<{ id: string; order: number }>): void {
    for (const { id, order } of orderMap) {
      const scene = this.data.scenes.find((s) => s.id === id);
      if (scene) scene.order = order;
    }
    this.scheduleSave();
  }

  // ─── Hotspots ────────────────────────────────────────

  listHotspotsByScene(sceneId: string): HotspotData[] {
    return this.data.hotspots
      .filter((h) => h.sceneId === sceneId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((h) => ({ ...h }));
  }

  getHotspot(id: string): HotspotData | null {
    const h = this.data.hotspots.find((h) => h.id === id);
    return h ? { ...h } : null;
  }

  createHotspot(input: Omit<HotspotData, 'id' | 'createdAt' | 'updatedAt'>): HotspotData {
    const now = new Date().toISOString();
    const hotspot: HotspotData = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.data.hotspots.push(hotspot);
    this.scheduleSave();
    return { ...hotspot };
  }

  updateHotspot(id: string, updates: Partial<HotspotData>): HotspotData | null {
    const idx = this.data.hotspots.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.data.hotspots[idx] = {
      ...this.data.hotspots[idx],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as HotspotData;
    this.scheduleSave();
    return { ...this.data.hotspots[idx] } as HotspotData;
  }

  deleteHotspot(id: string): boolean {
    const idx = this.data.hotspots.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    this.data.hotspots.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  countHotspotsByScene(sceneId: string): number {
    return this.data.hotspots.filter((h) => h.sceneId === sceneId).length;
  }

  // ─── Assets ──────────────────────────────────────────

  listAssets(opts?: { category?: string; search?: string; tags?: string; page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc' }): { data: AssetData[]; total: number } {
    let filtered = this.data.assets.filter((a) => !a.deletedAt);

    if (opts?.category && opts.category !== 'all') {
      filtered = filtered.filter((a) => a.category === opts.category);
    }
    if (opts?.search) {
      const s = opts.search.toLowerCase();
      filtered = filtered.filter((a) => a.originalName.toLowerCase().includes(s));
    }
    if (opts?.tags) {
      const tagArray = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArray.length) {
        filtered = filtered.filter((a) => tagArray.every((t) => a.tags.includes(t)));
      }
    }

    const sortBy = opts?.sortBy || 'createdAt';
    const order = opts?.order || 'desc';
    filtered.sort((a: any, b: any) => {
      const va = a[sortBy] ?? '';
      const vb = b[sortBy] ?? '';
      if (typeof va === 'string') return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return order === 'asc' ? va - vb : vb - va;
    });

    const total = filtered.length;
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 30;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map((a) => ({ ...a }));

    return { data, total };
  }

  getAsset(id: string): AssetData | null {
    const a = this.data.assets.find((a) => a.id === id && !a.deletedAt);
    return a ? { ...a } : null;
  }

  getAssetByPath(filePath: string): AssetData | null {
    const a = this.data.assets.find((a) => a.filePath === filePath && !a.deletedAt);
    return a ? { ...a } : null;
  }

  createAsset(input: Omit<AssetData, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): AssetData {
    const now = new Date().toISOString();
    const asset: AssetData = {
      ...input,
      id: uuidv4(),
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.assets.push(asset);
    this.scheduleSave();
    return { ...asset };
  }

  updateAsset(id: string, updates: Partial<AssetData>): AssetData | null {
    const idx = this.data.assets.findIndex((a) => a.id === id && !a.deletedAt);
    if (idx === -1) return null;
    this.data.assets[idx] = {
      ...this.data.assets[idx],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as AssetData;
    this.scheduleSave();
    return { ...this.data.assets[idx] } as AssetData;
  }

  deleteAsset(id: string): boolean {
    const idx = this.data.assets.findIndex((a) => a.id === id && !a.deletedAt);
    if (idx === -1) return false;
    const asset = this.data.assets[idx];
    if (asset) {
      asset.deletedAt = new Date().toISOString();
      this.scheduleSave();
      return true;
    }
    return false;
  }

  /** Find all places an asset is referenced by its relative file path */
  getAssetUsage(filePath: string): {
    usedInScenes: Array<{ sceneId: string; sceneTitle: string; field: string }>;
    usedInHotspots: Array<{ hotspotId: string; hotspotLabel: string; sceneTitle: string; field: string }>;
    usedInBranding: Array<{ field: string }>;
    usedInAvatars: Array<{ avatarId: string; avatarName: string; field: string }>;
    totalUsages: number;
  } {
    const usedInScenes: Array<{ sceneId: string; sceneTitle: string; field: string }> = [];
    const usedInHotspots: Array<{ hotspotId: string; hotspotLabel: string; sceneTitle: string; field: string }> = [];
    const usedInBranding: Array<{ field: string }> = [];
    const usedInAvatars: Array<{ avatarId: string; avatarName: string; field: string }> = [];

    for (const scene of this.data.scenes.filter((s) => !s.deletedAt)) {
      if (scene.panoramaPath === filePath) usedInScenes.push({ sceneId: scene.id, sceneTitle: scene.title, field: 'panorama' });
      if (scene.thumbnailPath === filePath) usedInScenes.push({ sceneId: scene.id, sceneTitle: scene.title, field: 'thumbnail' });
      if (scene.avatarPostPlaybackTargetAssetPath === filePath) usedInScenes.push({ sceneId: scene.id, sceneTitle: scene.title, field: 'avatarPostPlaybackTargetAsset' });
    }

    for (const h of this.data.hotspots) {
      if (h.targetAssetPath === filePath) {
        const scene = this.data.scenes.find((s) => s.id === h.sceneId);
        usedInHotspots.push({ hotspotId: h.id, hotspotLabel: h.label, sceneTitle: scene?.title || '', field: 'targetAsset' });
      }
      if (h.avatarPostPlaybackTargetAssetPath === filePath) {
        const scene = this.data.scenes.find((s) => s.id === h.sceneId);
        usedInHotspots.push({ hotspotId: h.id, hotspotLabel: h.label, sceneTitle: scene?.title || '', field: 'avatarPostPlaybackTargetAsset' });
      }
    }

    if (this.data.branding.logoPath === filePath) usedInBranding.push({ field: 'logo' });
    if (this.data.branding.coverPath === filePath) usedInBranding.push({ field: 'cover' });

    for (const av of this.data.avatars.filter((a) => !a.deletedAt)) {
      if (av.originalAssetPath === filePath) usedInAvatars.push({ avatarId: av.id, avatarName: av.name, field: 'original' });
      if (av.optimizedAssetPath === filePath) usedInAvatars.push({ avatarId: av.id, avatarName: av.name, field: 'optimized' });
      if (av.thumbnailAssetPath === filePath) usedInAvatars.push({ avatarId: av.id, avatarName: av.name, field: 'thumbnail' });
    }

    return {
      usedInScenes,
      usedInHotspots,
      usedInBranding,
      usedInAvatars,
      totalUsages: usedInScenes.length + usedInHotspots.length + usedInBranding.length + usedInAvatars.length,
    };
  }

  // ─── Guided Tour ─────────────────────────────────────

  getGuidedTour(): GuidedTourStepData[] {
    return this.data.guidedTour
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ ...s }));
  }

  replaceGuidedTour(steps: Array<Omit<GuidedTourStepData, 'id' | 'createdAt' | 'updatedAt'>>): GuidedTourStepData[] {
    const now = new Date().toISOString();
    this.data.guidedTour = steps.map((s) => ({
      ...s,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));
    this.scheduleSave();
    return this.getGuidedTour();
  }

  // ─── Avatars ─────────────────────────────────────────

  listAvatars(opts?: { search?: string; page?: number; limit?: number }): { data: AvatarData[]; total: number } {
    let filtered = this.data.avatars.filter((a) => !a.deletedAt);

    if (opts?.search) {
      const s = opts.search.toLowerCase();
      filtered = filtered.filter((a) => a.name.toLowerCase().includes(s));
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 100;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map((a) => ({ ...a }));

    return { data, total };
  }

  getAvatar(id: string): AvatarData | null {
    const av = this.data.avatars.find((a) => a.id === id && !a.deletedAt);
    return av ? { ...av } : null;
  }

  createAvatar(input: Omit<AvatarData, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): AvatarData {
    const now = new Date().toISOString();
    const avatar: AvatarData = {
      ...input,
      id: uuidv4(),
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.data.avatars.push(avatar);
    this.scheduleSave();
    return { ...avatar };
  }

  updateAvatar(id: string, updates: Partial<AvatarData>): AvatarData | null {
    const idx = this.data.avatars.findIndex((a) => a.id === id && !a.deletedAt);
    if (idx === -1) return null;
    this.data.avatars[idx] = {
      ...this.data.avatars[idx],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as AvatarData;
    this.scheduleSave();
    return { ...this.data.avatars[idx] } as AvatarData;
  }

  deleteAvatar(id: string): boolean {
    const idx = this.data.avatars.findIndex((a) => a.id === id && !a.deletedAt);
    if (idx === -1) return false;
    const av = this.data.avatars[idx];
    if (av) {
      av.deletedAt = new Date().toISOString();
      this.scheduleSave();
      return true;
    }
    return false;
  }

  /** Delete assets associated with avatar by soft-deleting them */
  deleteAvatarAssets(avatar: AvatarData): void {
    const assetPaths = [avatar.originalAssetPath, avatar.optimizedAssetPath, avatar.thumbnailAssetPath].filter(Boolean) as string[];
    for (const path of assetPaths) {
      const asset = this.data.assets.find(a => a.filePath === path && !a.deletedAt);
      if (asset) {
        this.deleteAsset(asset.id);
      }
    }
    // Also delete tagged audio assets
    const audioAssets = this.data.assets.filter(
      (a) => !a.deletedAt && a.category === 'AVATAR' && a.tags.includes('avatar-audio') && a.tags.includes(avatar.id)
    );
    for (const a of audioAssets) {
      this.deleteAsset(a.id);
    }
  }

  // ─── Leads ───────────────────────────────────────────

  listLeads(opts?: { search?: string; page?: number; limit?: number }): { data: LeadData[]; total: number } {
    if (!this.data.leads) this.data.leads = [];
    let filtered = [...this.data.leads];

    if (opts?.search) {
      const s = opts.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s) ||
          (l.message && l.message.toLowerCase().includes(s))
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 30;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).map((l) => ({ ...l }));

    return { data, total };
  }

  createLead(input: Omit<LeadData, 'id' | 'createdAt'>): LeadData {
    if (!this.data.leads) this.data.leads = [];
    const now = new Date().toISOString();
    const lead: LeadData = {
      ...input,
      id: uuidv4(),
      createdAt: now,
    };
    this.data.leads.push(lead);
    this.scheduleSave();
    return { ...lead };
  }

  // ─── Cleanup Helper Methods ──────────────────────────

  getExpiredSoftDeletedAssets(thresholdMs: number): AssetData[] {
    const now = new Date().getTime();
    return this.data.assets.filter((a) => 
      a.deletedAt && (now - new Date(a.deletedAt).getTime() > thresholdMs)
    ).map((a) => ({ ...a }));
  }

  hardDeleteAsset(id: string): boolean {
    const idx = this.data.assets.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.data.assets.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  getExpiredSoftDeletedAvatars(thresholdMs: number): AvatarData[] {
    const now = new Date().getTime();
    return this.data.avatars.filter((a) => 
      a.deletedAt && (now - new Date(a.deletedAt).getTime() > thresholdMs)
    ).map((a) => ({ ...a }));
  }

  hardDeleteAvatar(id: string): boolean {
    const idx = this.data.avatars.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.data.avatars.splice(idx, 1);
    this.scheduleSave();
    return true;
  }

  // ─── Full Tour Data (for viewer/export) ──────────────

  getFullTourData(): ProjectFileData {
    return JSON.parse(JSON.stringify(this.data));
  }
}

// Export singleton
export const projectStore = new ProjectStore();
