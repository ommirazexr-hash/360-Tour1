import type { Project, Scene, SceneWithHotspots, Hotspot, HotspotWithAssetUrl, ProjectBranding, GuidedTourStep } from '@vt/shared';

export type StandaloneScene = Omit<SceneWithHotspots, 'hotspots'> & { hotspots: HotspotWithAssetUrl[] };

// ─── IndexedDB Setup for Binary Assets ──────────────────────────────────────

const DB_NAME = 'virtualtour_assets_db';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

interface StoredAsset {
  id: string;
  name: string;
  category: string;
  file: Blob;
  uploadedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in the browser'));
      return;
    }
    
    const timeoutId = setTimeout(() => {
      reject(new Error('IndexedDB open operation timed out'));
    }, 1000);

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        clearTimeout(timeoutId);
        reject(request.error);
      };
      request.onsuccess = () => {
        clearTimeout(timeoutId);
        resolve(request.result);
      };
      request.onupgradeneeded = (e) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onblocked = () => {
        clearTimeout(timeoutId);
        reject(new Error('IndexedDB open blocked'));
      };
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
}

export async function saveAsset(id: string, name: string, category: string, file: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(transaction.objectStoreNames[0] || STORE_NAME);
    const asset: StoredAsset = {
      id,
      name,
      category,
      file,
      uploadedAt: new Date().toISOString(),
    };
    const request = store.put(asset);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });

  // Sync to localStorage project metadata
  const data = getRawTourData();
  if (!data.assets) data.assets = [];
  data.assets = data.assets.filter((a: any) => a.id !== id);
  data.assets.push({
    id,
    name,
    category,
    fileSize: file.size,
    createdAt: new Date().toISOString(),
  });
  saveRawTourData(data);
}

export async function getAssetBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(transaction.objectStoreNames[0] || STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredAsset | undefined;
      resolve(result ? result.file : null);
    };
  });
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(transaction.objectStoreNames[0] || STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });

  // Remove from localStorage project metadata
  const data = getRawTourData();
  if (data.assets) {
    data.assets = data.assets.filter((a: any) => a.id !== id);
    saveRawTourData(data);
  }
}

export async function listAssets(category?: string): Promise<any[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(transaction.objectStoreNames[0] || STORE_NAME);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let results = request.result as StoredAsset[];
      if (category) {
        results = results.filter(a => a.category === category);
      }
      resolve(results.map(a => ({
        id: a.id,
        name: a.name,
        originalName: a.name,
        fileSize: a.file ? a.file.size : 0,
        category: a.category,
        url: `/uploads/${a.id}`,
        uploadedAt: a.uploadedAt,
      })));
    };
  });
}

// Map to cache active Object URLs so we don't recreate them continuously
const objectUrlCache = new Map<string, string>();

/**
 * Resolves virtual URLs like /uploads/asset_xxx to temporary Blob URLs.
 */
export async function resolveUrl(url: string | null | undefined, customAssets?: any[]): Promise<string> {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Extract ID from path (e.g. /uploads/asset_123 -> asset_123)
  const parts = url.split('/');
  let id = parts[parts.length - 1];
  if (!id) return url;

  // Strip extension if it exists to query IndexedDB with the raw ID
  const extIdx = id.indexOf('.');
  if (extIdx !== -1) {
    id = id.substring(0, extIdx);
  }

  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }

  try {
    const blob = await getAssetBlob(id);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      objectUrlCache.set(id, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.error(`Failed to resolve asset Blob for key: ${id}`, err);
  }

  // Fallback: If loading statically from the public folder, look up the asset in the assets list
  // to find its actual filename with the correct extension.
  if (url.startsWith('/uploads/')) {
    const assets = customAssets || getRawTourData()?.assets || [];
    const asset = assets.find((a: any) => a.id === id);
    if (asset) {
      return `/uploads/${asset.name}`;
    }
    
    // Secondary fallback: if it has no dot, assume it's a panorama and append .jpg
    if (!id.includes('.')) {
      return `/uploads/${id}.jpg`;
    }
  }

  return url;
}

// ─── LocalStorage Tour Schema ───────────────────────────────────────────────

const TOUR_DATA_KEY = 'vt_standalone_tour_data';

export interface StandaloneTourData {
  project: Project;
  branding: ProjectBranding & { logoUrl: string | null; coverUrl: string | null };
  scenes: StandaloneScene[];
  guidedTour: GuidedTourStep[];
  assets: any[];
}

const DEFAULT_BRANDING: ProjectBranding & { logoUrl: string | null; coverUrl: string | null } = {
  id: 'branding-default',
  projectId: 'project-default',
  logoAssetId: null,
  logoUrl: null,
  logoPosition: 'top-left',
  logoSize: 'medium',
  coverAssetId: null,
  coverUrl: null,
  primaryColor: '#6366f1',
  secondaryColor: '#4f46e5',
  backgroundColor: '#0f172a',
  textColor: '#ffffff',
  autoRotate: true,
  autoRotateSpeed: 1.5,
  showControls: true,
  showSceneMenu: true,
  contactEmail: 'demo@example.com',
  contactPhone: '+1 234 567 890',
  websiteUrl: 'https://virtualtour.com',
  welcomeTitle: 'Immersive 360° Virtual Tour',
  welcomeMessage: 'Welcome! Experience our spaces in full 360° interactive view. Use hotspots to navigate and click info tags to learn more.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SCENES: StandaloneScene[] = [
  {
    id: 'scene-1',
    projectId: 'project-default',
    title: 'Cozy Living Room',
    description: 'A premium, modern design living space with natural lighting and lounge decor.',
    panoramaPath: null,
    thumbnailPath: null,
    panoramaUrl: 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg',
    thumbnailUrl: 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg',
    isStartScene: true,
    order: 0,
    defaultYaw: 0,
    defaultPitch: 0,
    defaultZoom: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hotspots: [
      {
        id: 'hs-1-to-2',
        sceneId: 'scene-1',
        label: 'Go to Modern Office',
        description: null,
        iconType: 'SCENE_LINK',
        yaw: 0.17,
        pitch: -0.15,
        type: 'SCENE_LINK',
        targetSceneId: 'scene-2',
        targetAssetId: null,
        targetAssetUrl: null,
        targetUrl: null,
        style: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hs-living-info',
        sceneId: 'scene-1',
        label: 'Premium Finishes',
        description: 'Features customized, hand-stitched leather upholstery, architectural glass framing, and micro-brushed metal accents.',
        iconType: 'INFO',
        yaw: -0.85,
        pitch: 0.05,
        type: 'INFO_POPUP',
        targetSceneId: null,
        targetAssetId: null,
        targetAssetUrl: null,
        targetUrl: null,
        style: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  },
  {
    id: 'scene-2',
    projectId: 'project-default',
    title: 'Modern Office Room',
    description: 'Sleek creative workspace with modern desk setup and panoramic window views.',
    panoramaPath: null,
    thumbnailPath: null,
    panoramaUrl: 'https://photo-sphere-viewer-data.netlify.app/assets/hotel.jpg',
    thumbnailUrl: 'https://photo-sphere-viewer-data.netlify.app/assets/hotel.jpg',
    isStartScene: false,
    order: 1,
    defaultYaw: 0,
    defaultPitch: 0,
    defaultZoom: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hotspots: [
      {
        id: 'hs-2-to-1',
        sceneId: 'scene-2',
        label: 'Return to Living Room',
        description: null,
        iconType: 'SCENE_LINK',
        yaw: -0.75,
        pitch: -0.1,
        type: 'SCENE_LINK',
        targetSceneId: 'scene-1',
        targetAssetId: null,
        targetAssetUrl: null,
        targetUrl: null,
        style: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hs-office-info',
        sceneId: 'scene-2',
        label: 'Workstation Setup',
        description: 'Ergonomic smartdesk equipped with dual color-calibrated 4K screens and ambient bias lighting.',
        iconType: 'INFO',
        yaw: 0.45,
        pitch: 0.15,
        type: 'INFO_POPUP',
        targetSceneId: null,
        targetAssetId: null,
        targetAssetUrl: null,
        targetUrl: null,
        style: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ]
  }
];

const DEFAULT_GUIDED_TOUR: GuidedTourStep[] = [
  {
    id: 'step-1',
    projectId: 'project-default',
    sceneId: 'scene-1',
    order: 0,
    duration: 8,
    narrationTitle: 'Welcome to the Cozy Living Room',
    narrationText: 'This is the starting point of our tour. Take a moment to look around at the premium design and natural lighting.',
    targetYaw: 0,
    targetPitch: 0,
    targetZoom: 50,
    highlightHotspotId: null,
    rotationAngle: null,
    rotationSpeed: null,
    audioUrl: null,
    avatarId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'step-2',
    projectId: 'project-default',
    sceneId: 'scene-2',
    order: 1,
    duration: 10,
    narrationTitle: 'Modern Creative Office',
    narrationText: 'Next, we move to the office workstation. This space is optimized for focus and productivity.',
    targetYaw: 0.45,
    targetPitch: 0.15,
    targetZoom: 50,
    highlightHotspotId: 'hs-office-info',
    rotationAngle: null,
    rotationSpeed: null,
    audioUrl: null,
    avatarId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Helper to seed or get the baseline data
export function getRawTourData(): StandaloneTourData {
  if (typeof window === 'undefined') {
    return {
      project: { id: 'project-default', name: '360° Virtual Tour', slug: 'tour', companyName: 'VirtualTour Corp', description: '', guidedTourEnabled: true, isPublished: true, publishedAt: null, createdAt: '', updatedAt: '' },
      branding: DEFAULT_BRANDING,
      scenes: DEFAULT_SCENES,
      guidedTour: DEFAULT_GUIDED_TOUR,
      assets: []
    };
  }

  const stored = localStorage.getItem(TOUR_DATA_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as StandaloneTourData;
    } catch (e) {
      console.error('Failed to parse stored tour data', e);
    }
  }

  // Attempt to load from a committed file if it exists, otherwise seed the default dummy tour
  const initialData: StandaloneTourData = {
    project: {
      id: 'project-default',
      name: 'Interactive Virtual Tour',
      slug: 'default-tour',
      companyName: 'VirtualTour Platform',
      description: 'Interact with high-quality 360° equirectangular scenes and experience custom multimedia hotspots.',
      guidedTourEnabled: true,
      isPublished: true,
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    branding: DEFAULT_BRANDING,
    scenes: DEFAULT_SCENES,
    guidedTour: DEFAULT_GUIDED_TOUR,
    assets: [],
  };

  localStorage.setItem(TOUR_DATA_KEY, JSON.stringify(initialData));
  return initialData;
}

export function saveRawTourData(data: StandaloneTourData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOUR_DATA_KEY, JSON.stringify(data));
  }
}

export async function initializeStandaloneDb(): Promise<void> {
  if (typeof window === 'undefined') return;

  const isSeeded = localStorage.getItem('vt_storage_seeded');
  if (isSeeded) return; // Already seeded, don't overwrite user's local edits

  try {
    const res = await fetch('/tour-data.json');
    if (res.ok) {
      const json = await res.json();
      if (json && json.project) {
        // Seed localStorage
        localStorage.setItem(TOUR_DATA_KEY, JSON.stringify({
          project: json.project,
          branding: json.branding || DEFAULT_BRANDING,
          scenes: json.scenes || [],
          guidedTour: json.guidedTour || [],
          assets: json.assets || []
        }));
        
        // Mark as seeded so we don't fetch and overwrite again
        localStorage.setItem('vt_storage_seeded', 'true');
        console.log('Successfully seeded local builder storage from server static tour-data.json');
      }
    }
  } catch (e) {
    console.warn('Failed to seed local builder storage from server static tour-data.json', e);
  }
}

// ─── API Emulation Operations ───────────────────────────────────────────────

export async function getProject(): Promise<Project> {
  return getRawTourData().project;
}

export async function updateProject(payload: Partial<Project>): Promise<Project> {
  const data = getRawTourData();
  data.project = {
    ...data.project,
    ...payload,
    updatedAt: new Date().toISOString()
  };
  saveRawTourData(data);
  return data.project;
}

export async function getBranding(): Promise<ProjectBranding & { logoUrl: string | null; coverUrl: string | null }> {
  const data = getRawTourData();
  return data.branding;
}

export async function updateBranding(payload: Partial<ProjectBranding & { logoUrl?: string | null; coverUrl?: string | null }>): Promise<ProjectBranding & { logoUrl: string | null; coverUrl: string | null }> {
  const data = getRawTourData();
  data.branding = {
    ...data.branding,
    ...payload,
    updatedAt: new Date().toISOString()
  } as ProjectBranding & { logoUrl: string | null; coverUrl: string | null };
  saveRawTourData(data);
  return data.branding;
}

export async function getScenes(): Promise<StandaloneScene[]> {
  const data = getRawTourData();
  // Resolve panorama and thumbnail URLs for scenes
  const resolvedScenes = await Promise.all(data.scenes.map(async (scene) => {
    const panoramaUrl = await resolveUrl(scene.panoramaUrl);
    const thumbnailUrl = await resolveUrl(scene.thumbnailUrl);
    const resolvedHotspots = scene.hotspots ? await Promise.all(scene.hotspots.map(async (hs) => {
      const targetAssetUrl = await resolveUrl(hs.targetAssetUrl || hs.targetUrl);
      return {
        ...hs,
        targetAssetUrl,
        targetUrl: targetAssetUrl
      };
    })) : [];
    return {
      ...scene,
      panoramaUrl,
      thumbnailUrl,
      hotspots: resolvedHotspots
    };
  }));
  return resolvedScenes;
}

export async function getSceneById(id: string): Promise<StandaloneScene> {
  const scenes = await getScenes();
  const scene = scenes.find(s => s.id === id);
  if (!scene) throw new Error('Scene not found');
  return scene;
}

export async function uploadScene(title: string, file: Blob): Promise<StandaloneScene> {
  const id = `scene_${Math.random().toString(36).substr(2, 9)}`;
  const virtualUrl = `/uploads/${id}`;

  // Store file in IndexedDB
  await saveAsset(id, `${title}.jpg`, 'PANORAMA', file);

  const data = getRawTourData();
  const nextOrder = data.scenes.length;

  const newScene: StandaloneScene = {
    id,
    projectId: 'project-default',
    title,
    description: '',
    panoramaPath: null,
    thumbnailPath: null,
    panoramaUrl: virtualUrl,
    thumbnailUrl: virtualUrl,
    isStartScene: data.scenes.length === 0,
    order: nextOrder,
    defaultYaw: 0,
    defaultPitch: 0,
    defaultZoom: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hotspots: []
  };

  data.scenes.push(newScene);
  saveRawTourData(data);
  return getSceneById(id);
}

export async function updateScene(id: string, payload: Partial<StandaloneScene>): Promise<StandaloneScene> {
  const data = getRawTourData();
  const idx = data.scenes.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Scene not found');

  data.scenes[idx] = {
    ...data.scenes[idx],
    ...payload,
    updatedAt: new Date().toISOString()
  } as StandaloneScene;

  saveRawTourData(data);
  return getSceneById(id);
}

export async function deleteScene(id: string): Promise<void> {
  const data = getRawTourData();
  data.scenes = data.scenes.filter(s => s.id !== id);
  // Reorder remaining scenes
  data.scenes.forEach((s, idx) => {
    s.order = idx;
  });
  saveRawTourData(data);
  await deleteAsset(id).catch(() => {});
}

// ─── Hotspot Operations ─────────────────────────────────────────────────────

export async function getHotspots(sceneId: string): Promise<HotspotWithAssetUrl[]> {
  const scene = await getSceneById(sceneId);
  return scene.hotspots || [];
}

export async function createHotspot(sceneId: string, payload: Partial<HotspotWithAssetUrl>): Promise<HotspotWithAssetUrl> {
  const data = getRawTourData();
  const sceneIdx = data.scenes.findIndex(s => s.id === sceneId);
  if (sceneIdx === -1) throw new Error('Scene not found');

  const id = `hotspot_${Math.random().toString(36).substr(2, 9)}`;
  const newHotspot: HotspotWithAssetUrl = {
    id,
    sceneId,
    label: payload.label || 'New Hotspot',
    description: payload.description || null,
    iconType: payload.iconType || 'INFO',
    yaw: payload.yaw ?? 0,
    pitch: payload.pitch ?? 0,
    type: payload.type || 'INFO_POPUP',
    targetSceneId: payload.targetSceneId || null,
    targetAssetId: payload.targetAssetId || null,
    targetAssetUrl: payload.targetAssetUrl || null,
    targetUrl: payload.targetUrl || null,
    style: payload.style || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!data.scenes[sceneIdx]!.hotspots) {
    data.scenes[sceneIdx]!.hotspots = [];
  }
  data.scenes[sceneIdx]!.hotspots.push(newHotspot);
  saveRawTourData(data);
  return newHotspot;
}

export async function updateHotspot(id: string, payload: Partial<HotspotWithAssetUrl>): Promise<HotspotWithAssetUrl> {
  const data = getRawTourData();
  let updatedHotspot: HotspotWithAssetUrl | null = null;

  for (const scene of data.scenes) {
    if (!scene.hotspots) continue;
    const hsIdx = scene.hotspots.findIndex(h => h.id === id);
    if (hsIdx !== -1) {
      scene.hotspots[hsIdx] = {
        ...scene.hotspots[hsIdx],
        ...payload,
        updatedAt: new Date().toISOString()
      } as any;
      updatedHotspot = scene.hotspots[hsIdx]!;
      break;
    }
  }

  if (!updatedHotspot) throw new Error('Hotspot not found');
  saveRawTourData(data);
  return updatedHotspot;
}

export async function deleteHotspot(id: string): Promise<void> {
  const data = getRawTourData();
  for (const scene of data.scenes) {
    if (!scene.hotspots) continue;
    const origLength = scene.hotspots.length;
    scene.hotspots = scene.hotspots.filter(h => h.id !== id);
    if (scene.hotspots.length !== origLength) {
      break;
    }
  }
  saveRawTourData(data);
}

// ─── Guided Tour Operations ─────────────────────────────────────────────────

export async function getGuidedTour(): Promise<GuidedTourStep[]> {
  const steps = getRawTourData().guidedTour;
  const resolvedSteps = await Promise.all(steps.map(async (step) => {
    const audioUrl = await resolveUrl(step.audioUrl);
    return {
      ...step,
      audioUrl
    };
  }));
  return resolvedSteps;
}

export async function updateGuidedTour(steps: GuidedTourStep[]): Promise<GuidedTourStep[]> {
  const data = getRawTourData();
  data.guidedTour = steps.map((s, idx) => ({
    ...s,
    order: idx,
    updatedAt: new Date().toISOString()
  }));
  saveRawTourData(data);
  return data.guidedTour;
}

export async function toggleGuidedTour(enabled: boolean): Promise<boolean> {
  const data = getRawTourData();
  data.project.guidedTourEnabled = enabled;
  saveRawTourData(data);
  return enabled;
}

// ─── Full Viewer Data Exporter ──────────────────────────────────────────────

export async function getViewerData(): Promise<any> {
  const project = await getProject();
  const branding = await getBranding();
  const scenes = await getScenes();
  const guidedTour = await getGuidedTour();
  return {
    project,
    branding,
    scenes,
    guidedTour
  };
}

/**
 * Returns a static representation of all files needed to make the tour offline-capable.
 * This is used by the ZIP exporter.
 */
export async function getTourExportPackage(): Promise<{ json: string; assets: Array<{ id: string; name: string; blob: Blob }> }> {
  const data = getRawTourData();
  const assets: Array<{ id: string; name: string; blob: Blob }> = [];

  // Query all assets directly from IndexedDB to ensure no files are missed
  const dbAssets = await listAssets();

  // Rebuild the assets metadata list dynamically from IndexedDB database
  const dataAssets = dbAssets.map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    fileSize: a.file ? a.file.size : 0,
    createdAt: a.uploadedAt || new Date().toISOString()
  }));

  // Package all files with their correct names and extensions
  for (const a of dbAssets) {
    if (a.file) {
      if (a.category === 'PANORAMA') {
        assets.push({ id: a.id, name: `${a.id}.jpg`, blob: a.file });
      } else {
        assets.push({ id: a.id, name: a.name, blob: a.file });
      }
    }
  }

  return {
    json: JSON.stringify({
      project: data.project,
      branding: data.branding,
      scenes: data.scenes,
      guidedTour: data.guidedTour,
      assets: dataAssets
    }, null, 2),
    assets
  };
}

export async function getViewerDataForClient(): Promise<any> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/tour-data.json');
      if (res.ok) {
        const json = await res.json();
        if (json && json.scenes) {
          // Resolve panorama and thumbnail URLs (in case they point to LocalStorage/IndexedDB blobs)
          const resolvedScenes = await Promise.all(json.scenes.map(async (scene: any) => {
            const panoramaUrl = await resolveUrl(scene.panoramaUrl, json.assets);
            const thumbnailUrl = await resolveUrl(scene.thumbnailUrl, json.assets);
            const resolvedHotspots = scene.hotspots ? await Promise.all(scene.hotspots.map(async (hs: any) => {
              const targetUrl = hs.targetAssetUrl || hs.targetUrl;
              const targetAssetUrl = await resolveUrl(targetUrl, json.assets);
              return {
                ...hs,
                targetAssetUrl,
                targetUrl: targetAssetUrl
              };
            })) : [];
            return {
              ...scene,
              panoramaUrl,
              thumbnailUrl,
              hotspots: resolvedHotspots
            };
          }));

          // Resolve guided tour audio steps
          const resolvedGuidedTour = json.guidedTour ? await Promise.all(json.guidedTour.map(async (step: any) => {
            const audioUrl = await resolveUrl(step.audioUrl, json.assets);
            return {
              ...step,
              audioUrl
            };
          })) : [];

          return {
            ...json,
            scenes: resolvedScenes,
            guidedTour: resolvedGuidedTour
          };
        }
      }
    } catch (e) {
      console.warn('Could not fetch static /tour-data.json, loading local standalone storage.', e);
    }
  }

  // Fallback to client local database (LocalStorage / IndexedDB)
  return getViewerData();
}
