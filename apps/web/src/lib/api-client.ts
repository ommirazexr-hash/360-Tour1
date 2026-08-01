import axios from 'axios';
import { getToken, clearToken } from './auth';
import type { ApiResponse } from '@vt/shared';
import * as db from './standalone-db';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4000/uploads';

export { UPLOAD_URL };

const axiosInstance = axios.create({ baseURL: BASE_URL, timeout: 30000 });

// Attach JWT on every request
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
axiosInstance.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Standalone Mode Detection ──────────────────────────────────────────────

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Force normal mode only if explicitly configured to false
  if (process.env.NEXT_PUBLIC_STANDALONE === 'false') return false;
  if (localStorage.getItem('vt_standalone_force') === 'false') return false;
  
  // Otherwise, default to Standalone Mode (database-less local storage & Next.js serverless)
  return true;
}

function isNetworkError(err: any): boolean {
  return !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || err.code === 'ECONNREFUSED');
}

function enableStandaloneMode() {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__STANDALONE_MODE__ = true;
    localStorage.setItem('vt_standalone_active', 'true');
    window.dispatchEvent(new Event('standalone-mode-activated'));
  }
}

// ─── Standalone Mock Handlers ───────────────────────────────────────────────

async function handleStandaloneGet<T>(path: string, params?: any): Promise<T> {
  // Auto-seed database from server's static tour-data.json if this is a new browser/device
  await db.initializeStandaloneDb();

  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  if (cleanPath === 'project') {
    return (await db.getProject()) as T;
  }
  if (cleanPath === 'project/scenes') {
    return (await db.getScenes()) as T;
  }
  if (cleanPath === 'project/branding') {
    return (await db.getBranding()) as T;
  }
  if (cleanPath === 'project/guided-tour') {
    return (await db.getGuidedTour()) as T;
  }
  if (cleanPath.startsWith('scenes/')) {
    const parts = cleanPath.split('/');
    if (parts.length === 3 && parts[2] === 'hotspots') {
      return (await db.getHotspots(parts[1]!)) as T;
    }
    if (parts.length === 2) {
      return (await db.getSceneById(parts[1]!)) as T;
    }
  }
  if (cleanPath === 'viewer/preview' || cleanPath.startsWith('viewer/')) {
    return (await db.getViewerData()) as T;
  }
  if (cleanPath === 'assets') {
    const category = params?.category;
    return (await db.listAssets(category)) as T;
  }
  if (cleanPath === 'avatars') {
    return [] as T;
  }
  if (cleanPath === 'auth/me') {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${getToken() || ''}`
      }
    });
    if (!res.ok) {
      throw { response: { status: 401, data: { error: { message: 'Unauthorized' } } } };
    }
    const json = await res.json();
    return json.data as T;
  }
  
  throw new Error(`Standalone mode: GET path "${path}" not implemented`);
}

async function handleStandalonePost<T>(path: string, body?: any): Promise<T> {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  if (cleanPath.startsWith('scenes/') && cleanPath.endsWith('/hotspots')) {
    const parts = cleanPath.split('/');
    return (await db.createHotspot(parts[1]!, body)) as T;
  }
  if (cleanPath === 'auth/login') {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!res.ok) {
      throw { response: { status: res.status, data: json } };
    }
    return json.data as T;
  }
  if (cleanPath === 'export') {
    return { success: true, downloadUrl: '#local-zip-export' } as T;
  }
  
  throw new Error(`Standalone mode: POST path "${path}" not implemented`);
}

async function handleStandalonePut<T>(path: string, body?: any): Promise<T> {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  if (cleanPath === 'project') {
    return (await db.updateProject(body)) as T;
  }
  if (cleanPath === 'project/branding') {
    return (await db.updateBranding(body)) as T;
  }
  if (cleanPath === 'project/guided-tour') {
    return (await db.updateGuidedTour(body.steps)) as T;
  }
  if (cleanPath.startsWith('scenes/')) {
    const parts = cleanPath.split('/');
    return (await db.updateScene(parts[1]!, body)) as T;
  }
  if (cleanPath.startsWith('hotspots/')) {
    const parts = cleanPath.split('/');
    return (await db.updateHotspot(parts[1]!, body)) as T;
  }
  
  throw new Error(`Standalone mode: PUT path "${path}" not implemented`);
}

async function handleStandaloneDelete(path: string, params?: any): Promise<void> {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  if (cleanPath.startsWith('scenes/')) {
    const parts = cleanPath.split('/');
    await db.deleteScene(parts[1]!);
    return;
  }
  if (cleanPath.startsWith('hotspots/')) {
    const parts = cleanPath.split('/');
    await db.deleteHotspot(parts[1]!);
    return;
  }
  
  throw new Error(`Standalone mode: DELETE path "${path}" not implemented`);
}

async function handleStandalonePatch<T>(path: string, body?: any): Promise<T> {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  if (cleanPath === 'project/guided-tour/toggle') {
    const data = db.getRawTourData();
    const nextVal = !data.project.guidedTourEnabled;
    await db.toggleGuidedTour(nextVal);
    return { guidedTourEnabled: nextVal } as T;
  }
  throw new Error(`Standalone mode: PATCH path "${path}" not implemented`);
}

async function handleStandaloneUpload<T>(path: string, formData: FormData): Promise<T> {
  const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
  
  if (cleanPath === 'project/scenes') {
    const file = formData.get('panorama') as File | Blob;
    const title = formData.get('title') as string || 'New Scene';
    return (await db.uploadScene(title, file)) as T;
  }
  if (cleanPath === 'assets/upload') {
    const file = formData.get('file') as File | Blob;
    const category = formData.get('category') as string || 'AUDIO';
    const id = `asset_${Math.random().toString(36).substr(2, 9)}`;
    const name = (file as any).name || 'upload.mp3';
    await db.saveAsset(id, name, category, file);
    return {
      id,
      name,
      category,
      url: `/uploads/${id}`,
      uploadedAt: new Date().toISOString()
    } as T;
  }
  
  throw new Error(`Standalone mode: UPLOAD path "${path}" not implemented`);
}

// ─── API Client Wrapper ─────────────────────────────────────────────────────

export const apiClient = {
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    if (isStandaloneMode()) {
      return handleStandaloneGet<T>(path, params);
    }
    try {
      const res = await axiosInstance.get<ApiResponse<T>>(path, { params });
      if (!res.data.success) throw new Error(res.data.error?.message || 'Request failed');
      return res.data.data as T;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        return handleStandaloneGet<T>(path, params);
      }
      throw err;
    }
  },
  async getWithMeta<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    if (isStandaloneMode()) {
      const data = await handleStandaloneGet<T>(path, params);
      return { success: true, data };
    }
    try {
      const res = await axiosInstance.get<ApiResponse<T>>(path, { params });
      return res.data;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        const data = await handleStandaloneGet<T>(path, params);
        return { success: true, data };
      }
      throw err;
    }
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    if (isStandaloneMode()) {
      return handleStandalonePost<T>(path, body);
    }
    try {
      const res = await axiosInstance.post<ApiResponse<T>>(path, body);
      if (!res.data.success) throw new Error(res.data.error?.message || 'Request failed');
      return res.data.data as T;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        return handleStandalonePost<T>(path, body);
      }
      throw err;
    }
  },
  async put<T>(path: string, body?: unknown): Promise<T> {
    if (isStandaloneMode()) {
      return handleStandalonePut<T>(path, body);
    }
    try {
      const res = await axiosInstance.put<ApiResponse<T>>(path, body);
      if (!res.data.success) throw new Error(res.data.error?.message || 'Request failed');
      return res.data.data as T;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        return handleStandalonePut<T>(path, body);
      }
      throw err;
    }
  },
  async patch<T>(path: string, body?: unknown): Promise<T> {
    if (isStandaloneMode()) {
      return handleStandalonePatch<T>(path, body);
    }
    try {
      const res = await axiosInstance.patch<ApiResponse<T>>(path, body);
      if (!res.data.success) throw new Error(res.data.error?.message || 'Request failed');
      return res.data.data as T;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        return handleStandalonePatch<T>(path, body);
      }
      throw err;
    }
  },
  async delete(path: string, params?: Record<string, unknown>): Promise<void> {
    if (isStandaloneMode()) {
      await handleStandaloneDelete(path, params);
      return;
    }
    try {
      await axiosInstance.delete(path, { params });
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        await handleStandaloneDelete(path, params);
        return;
      }
      throw err;
    }
  },
  async upload<T>(path: string, formData: FormData): Promise<T> {
    if (isStandaloneMode()) {
      return handleStandaloneUpload<T>(path, formData);
    }
    try {
      const res = await axiosInstance.post<ApiResponse<T>>(path, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      if (!res.data.success) throw new Error(res.data.error?.message || 'Upload failed');
      return res.data.data as T;
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.warn('Backend server is down. Falling back to Standalone (Offline) mode.');
        enableStandaloneMode();
        return handleStandaloneUpload<T>(path, formData);
      }
      throw err;
    }
  },
  async downloadBlob(path: string, params?: Record<string, unknown>): Promise<Blob> {
    if (isStandaloneMode()) {
      const cleanPath = path.replace(/^\//, '').replace(/\/$/, '');
      if (cleanPath === 'export') {
        const pkg = await db.getTourExportPackage();
        // Return a mock blob for export ZIP
        return new Blob([pkg.json], { type: 'application/json' });
      }
      throw new Error(`Standalone mode: downloadBlob for path "${path}" not implemented`);
    }
    const res = await axiosInstance.get(path, { params, responseType: 'blob' });
    return res.data;
  },
};
