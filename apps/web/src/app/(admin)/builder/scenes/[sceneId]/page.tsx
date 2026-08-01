'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Target, Info,
  Link2, FileText, Video, Image as ImageIcon, Phone, Globe,
  GripVertical, Check, X, AlertCircle, Upload, User, Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import { formatBytes } from '@/lib/utils';
import type { Scene } from '@vt/shared';

interface Hotspot {
  id: string;
  label: string;
  description: string | null;
  iconType: string;
  yaw: number;
  pitch: number;
  type: string;
  targetSceneId: string | null;
  targetAssetId: string | null;
  targetUrl: string | null;
  
  // Explicit avatar configurations
  avatarId: string | null;
  avatarPlaybackMode: string | null;
  avatarPosition: string | null;
  avatarVolume: number | null;
  avatarMuted: boolean | null;
  avatarReplay: boolean | null;
  avatarPostPlaybackAction: string | null;
  avatarPostPlaybackTargetSceneId: string | null;
  avatarPostPlaybackTargetAssetId: string | null;
  avatarPostPlaybackTargetUrl: string | null;
  avatarPostPlaybackTargetNextAvatarId: string | null;
  avatarCustomPositionX: number | null;
  avatarCustomPositionY: number | null;
  avatarScale: number | null;
}

const HOTSPOT_TYPES = [
  { value: 'SCENE_LINK',   label: 'Scene Link',    icon: Link2,      color: '#6366f1' },
  { value: 'INFO_POPUP',   label: 'Info Popup',    icon: Info,       color: '#06b6d4' },
  { value: 'CONTACT_FORM', label: 'Contact Form',  icon: Phone,      color: '#10b981' },
  { value: 'EXTERNAL_URL', label: 'External URL',  icon: Globe,      color: '#f59e0b' },
  { value: 'PDF',          label: 'PDF',           icon: FileText,   color: '#ef4444' },
  { value: 'VIDEO',        label: 'Video',         icon: Video,      color: '#8b5cf6' },
  { value: 'IMAGE',        label: 'Image',         icon: ImageIcon,  color: '#ec4899' },
  { value: 'AVATAR',       label: 'Spokesperson',  icon: User,       color: '#6366f1' },
] as const;

type _HotspotType = typeof HOTSPOT_TYPES[number]['value'];

function getHotspotEmoji(iconType: string, type: string): string {
  const map: Record<string, string> = {
    arrow: '➡️', info: 'ℹ️', play: '▶️', image: '🖼️', pdf: '📄', link: '🔗', contact: '📞', default: '📍', avatar: '👤',
    SCENE_LINK: '➡️', INFO_POPUP: 'ℹ️', VIDEO: '▶️', IMAGE: '🖼️', PDF: '📄', EXTERNAL_URL: '🔗', CONTACT_FORM: '📞', AVATAR: '👤',
  };
  return map[iconType] || map[type] || '📍';
}

function getHotspotSvg(type: string): string {
  const svgStyle = 'width: 18px; height: 18px; color: #ffffff; transition: color 0.25s;';
  switch (type) {
    case 'SCENE_LINK':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>`;
    case 'INFO_POPUP':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>`;
    case 'CONTACT_FORM':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>`;
    case 'EXTERNAL_URL':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
      </svg>`;
    case 'PDF':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>`;
    case 'VIDEO':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>`;
    case 'IMAGE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>`;
    case 'AVATAR':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${svgStyle}">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>`;
  }
}

export default function SceneEditorPage() {
  const params = useParams();
  const sceneId = params?.sceneId as string;

  const viewerRef = useRef<HTMLDivElement>(null);
  const psvRef    = useRef<any>(null);

  const [scene, setScene]       = useState<Scene | null>(null);
  const [scenes, setScenes]     = useState<Scene[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading]   = useState(true);

  // Reusable avatar library & pdf library lists
  const [avatars, setAvatars] = useState<any[]>([]);
  const [pdfAssets, setPdfAssets] = useState<any[]>([]);
  
  // Placement mode: clicking the viewer places a new hotspot
  const [placing, setPlacing]   = useState(false);
  const [pendingPos, setPendingPos] = useState<{ yaw: number; pitch: number } | null>(null);

  // Selected hotspot for editing
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [editForm, setEditForm] = useState<Partial<Hotspot>>({});
  const [saving, setSaving]     = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  const [assets, setAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  // Scene default avatar config form state
  const [sceneAvatarForm, setSceneAvatarForm] = useState<any>({
    defaultAvatarId: '',
    avatarPlaybackMode: 'CLICK_TO_PLAY',
    avatarPosition: 'BOTTOM_LEFT',
    avatarVolume: 80,
    avatarMuted: false,
    avatarReplay: false,
    avatarPostPlaybackAction: 'DO_NOTHING',
    avatarPostPlaybackTargetSceneId: '',
    avatarPostPlaybackTargetAssetId: '',
    avatarPostPlaybackTargetUrl: '',
    avatarPostPlaybackTargetNextAvatarId: '',
    avatarCustomPositionX: 0,
    avatarCustomPositionY: 0,
    avatarScale: 1.0,
  });
  const [savingSceneAvatar, setSavingSceneAvatar] = useState(false);

  // Load avatar and pdf libraries on mount
  useEffect(() => {
    (async () => {
      try {
        const [avs, pdfs] = await Promise.all([
          apiClient.get<any[]>('/avatars', { limit: 100 }),
          apiClient.get<any[]>('/assets', { category: 'PDF', limit: 100 })
        ]);
        setAvatars(avs);
        setPdfAssets(pdfs);
      } catch (err) {
        console.error('Failed to load library resources', err);
      }
    })();
  }, []);

  useEffect(() => {
    const type = editForm.type;
    if (type && type !== 'AVATAR' && ['IMAGE', 'VIDEO', 'PDF'].includes(type)) {
      (async () => {
        setLoadingAssets(true);
        try {
          const items = await apiClient.get<any[]>('/assets', { category: type });
          setAssets(items);
        } catch {
          toast.error('Failed to load assets from library');
        } finally {
          setLoadingAssets(false);
        }
      })();
    } else {
      setAssets([]);
    }
  }, [editForm.type]);

  const handleDirectAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = editForm.type;
    if (!file || !type) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', type);

    setUploadingAsset(true);
    try {
      const createdAsset = await apiClient.upload<any>('/assets/upload', formData);
      toast.success('Asset uploaded successfully!');
      
      setAssets((prev) => [createdAsset, ...prev]);

      setEditForm((f) => ({
        ...f,
        targetAssetId: createdAsset.id,
        targetUrl: createdAsset.optimizedUrl || createdAsset.fileUrl || createdAsset.url,
      }));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload asset');
    } finally {
      setUploadingAsset(false);
      e.target.value = '';
    }
  };

  // State refs to prevent stale closures in viewer event handlers without recreating the viewer
  const placingRef = useRef(placing);
  const hotspotsRef = useRef(hotspots);
  const selectHotspotRef = useRef<(hs: Hotspot) => void>(() => {});

  useEffect(() => { placingRef.current = placing; }, [placing]);
  useEffect(() => { hotspotsRef.current = hotspots; }, [hotspots]);
  useEffect(() => { selectHotspotRef.current = selectHotspot; }, [selected, editForm, hotspots]); // Bind after selectHotspot is declared

  // ── Load data ────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!sceneId || sceneId === 'undefined') {
      return;
    }
    setLoading(true);
    try {
      const [sc, allScenes, hs] = await Promise.all([
        apiClient.get<Scene>(`/scenes/${sceneId}`),
        apiClient.get<Scene[]>('/project/scenes'),
        apiClient.get<Hotspot[]>(`/scenes/${sceneId}/hotspots`),
      ]);
      setScene(sc);
      setScenes(allScenes);
      setHotspots(hs);

      // Populate scene avatar config form
      setSceneAvatarForm({
        defaultAvatarId: (sc as any).defaultAvatarId ?? '',
        avatarPlaybackMode: (sc as any).avatarPlaybackMode ?? 'CLICK_TO_PLAY',
        avatarPosition: (sc as any).avatarPosition ?? 'BOTTOM_LEFT',
        avatarVolume: (sc as any).avatarVolume ?? 80,
        avatarMuted: (sc as any).avatarMuted ?? false,
        avatarReplay: (sc as any).avatarReplay ?? false,
        avatarPostPlaybackAction: (sc as any).avatarPostPlaybackAction ?? 'DO_NOTHING',
        avatarPostPlaybackTargetSceneId: (sc as any).avatarPostPlaybackTargetSceneId ?? '',
        avatarPostPlaybackTargetAssetId: (sc as any).avatarPostPlaybackTargetAssetPath || (sc as any).avatarPostPlaybackTargetAssetId || '',
        avatarPostPlaybackTargetUrl: (sc as any).avatarPostPlaybackTargetUrl ?? '',
        avatarPostPlaybackTargetNextAvatarId: (sc as any).avatarPostPlaybackTargetNextAvatarId ?? '',
        avatarCustomPositionX: (sc as any).avatarCustomPositionX ?? 0,
        avatarCustomPositionY: (sc as any).avatarCustomPositionY ?? 0,
        avatarScale: (sc as any).avatarScale ?? 1.0,
      });

    } catch (err: any) {
      console.error('Failed to load scene data:', err);
      toast.error('Failed to load scene details');
    }
    finally { setLoading(false); }
  }, [sceneId]);

  useEffect(() => { load(); }, [load]);

  // ── Initialize PSV viewer ─────────────────────────────────
  useEffect(() => {
    if (!scene) return;
    const panoramaUrl = (scene as any).panoramaUrl as string | null;
    if (!viewerRef.current || !panoramaUrl) return;

    let destroyed = false;

    (async () => {
      try {
        const { Viewer } = await import('@photo-sphere-viewer/core');
        const { MarkersPlugin } = await import('@photo-sphere-viewer/markers-plugin');
        if (destroyed || !viewerRef.current) return;
        if (psvRef.current) { try { psvRef.current.destroy(); } catch {} }

        const viewer = new Viewer({
          container: viewerRef.current!,
          panorama: panoramaUrl,
          defaultZoomLvl: 50,
          navbar: ['zoom', 'fullscreen'],
          touchmoveTwoFingers: false,
          mousewheelCtrlKey: false,
          loadingTxt: 'Loading panorama...',
          plugins: [
            [MarkersPlugin, {}]
          ]
        });

        // Click to place hotspot
        viewer.addEventListener('click', (e: any) => {
          if (!placingRef.current) return;
          
          const yaw = e.data.yaw;
          const pitch = e.data.pitch;
          
          setPendingPos({ yaw, pitch });
          setPlacing(false);
          setSelected(null);
          setEditForm({
            type: 'SCENE_LINK',
            label: 'New Hotspot',
            description: '',
            iconType: 'default',
            yaw,
            pitch,
            avatarPlaybackMode: 'CLICK_TO_PLAY',
            avatarPosition: 'BOTTOM_LEFT',
            avatarVolume: 80,
            avatarMuted: false,
            avatarReplay: false,
            avatarPostPlaybackAction: 'DO_NOTHING',
            avatarScale: 1.0,
          });
        });

        // Select hotspot on marker click
        const markersPlugin = viewer.getPlugin(MarkersPlugin);
        markersPlugin.addEventListener('select-marker', (e: any) => {
          const marker = e.marker;
          const hs = hotspotsRef.current.find((h: any) => h.id === marker.id);
          if (hs) {
            selectHotspotRef.current(hs);
          }
        });

        if (destroyed) {
          try { viewer.destroy(); } catch {}
          return;
        }
        psvRef.current = viewer;
        setViewerReady(true);
      } catch (err) {
        console.error('Failed to initialize Photo Sphere Viewer:', err);
      }
    })();

    return () => {
      destroyed = true;
      setViewerReady(false);
      if (psvRef.current) { try { psvRef.current.destroy(); } catch {} psvRef.current = null; }
    };
  }, [scene]);

  // ── Synchronize Hotspot Markers ──────────────────────────
  useEffect(() => {
    if (!viewerReady || !psvRef.current) return;
    const viewer = psvRef.current;

    (async () => {
      const { MarkersPlugin } = await import('@photo-sphere-viewer/markers-plugin');
      const markersPlugin = viewer.getPlugin(MarkersPlugin) as any;
      if (!markersPlugin) return;

      const psvMarkers = hotspots.map((hs) => {
        const t = typeInfo(hs.type);
        const targetScene = hs.type === 'SCENE_LINK' ? scenes.find((s) => s.id === hs.targetSceneId) : null;
        const targetThumbnail = (targetScene as any)?.thumbnailUrl;
        const targetTitle = targetScene?.title;

        // ── AVATAR hotspots: render live video preview ──
        if (hs.type === 'AVATAR' && hs.avatarId) {
          const avatar = avatars.find((a: any) => a.id === hs.avatarId);
          const videoUrl = avatar?.optimizedUrl;
          const avatarName = avatar?.name || hs.label || 'Spokesperson';
          const scale = hs.avatarScale ?? 1.0;

          const container = document.createElement('div');
          container.className = 'avatar-preview-marker';
          container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            position: relative;
            cursor: pointer;
            width: 300px;
            height: 300px;
            pointer-events: none;
          `;

          const inner = document.createElement('div');
          inner.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            position: relative;
            width: 300px;
            height: 300px;
            transform: scale(${scale});
            transform-origin: bottom center;
            pointer-events: auto;
            filter: drop-shadow(0 8px 20px rgba(0,0,0,0.5));
            transition: transform 0.2s ease-out;
          `;

          if (videoUrl) {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.setAttribute('playsinline', 'true');
            video.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: contain;
              object-position: bottom center;
              border-radius: 8px;
            `;
            inner.appendChild(video);
            video.play().catch(() => {});
          } else {
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
              width: 80px; height: 80px; border-radius: 50%;
              background: rgba(15, 23, 42, 0.9); border: 2px solid #6366f1;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 8px 24px rgba(0,0,0,0.4);
              margin-bottom: 110px;
            `;
            placeholder.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
              <svg style="width:24px;height:24px;color:#818cf8;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span style="font-size:9px;color:#fff;margin-top:4px;">${avatarName}</span>
            </div>`;
            inner.appendChild(placeholder);
          }

          if (scale !== 1.0) {
            const badge = document.createElement('div');
            badge.style.cssText = `
              position: absolute; top: -6px; right: -6px;
              background: rgba(99, 102, 241, 0.95); color: #fff;
              font-size: 9px; font-weight: 700; padding: 2px 5px;
              border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);
              pointer-events: none;
            `;
            badge.textContent = `${scale.toFixed(1)}\u00d7`;
            inner.appendChild(badge);
          }

          const avatarLabel = document.createElement('div');
          avatarLabel.style.cssText = `
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(99, 102, 241, 0.4);
            color: #ffffff;
            font-size: 10px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 6px;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          `;
          avatarLabel.textContent = hs.label || avatarName;
          inner.appendChild(avatarLabel);

          container.appendChild(inner);

          return {
            id: hs.id,
            position: { yaw: hs.yaw, pitch: hs.pitch },
            elementLayer: container,
            anchor: 'bottom center',
            tooltip: { content: `${hs.label || avatarName} (${scale.toFixed(1)}\u00d7)`, position: 'top center' }
          };
        }

        // ── All other hotspot types: standard icon circle ──
        const el = document.createElement('div');
        el.className = 'hotspot-marker-wrapper';
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
        `;

        const circle = document.createElement('div');
        circle.className = 'hotspot-circle hotspot-poi-glow';
        circle.style.cssText = `
          width: 48px;
          height: 48px;
          background: ${t.color}bb;
          border: 2px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
          overflow: hidden;
          position: relative;
        `;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'hotspot-icon';
        iconContainer.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          transition: opacity 0.3s, transform 0.3s;
        `;
        iconContainer.innerHTML = getHotspotSvg(hs.type);
        circle.appendChild(iconContainer);

        let thumbContainer: HTMLDivElement | null = null;
        if (targetThumbnail) {
          thumbContainer = document.createElement('div');
          thumbContainer.className = 'hotspot-thumbnail';
          thumbContainer.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-image: url('${targetThumbnail}');
            background-size: cover;
            background-position: center;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
          `;
          circle.appendChild(thumbContainer);
        }

        el.appendChild(circle);

        const label = document.createElement('div');
        label.className = 'hotspot-label';
        label.style.cssText = `
          margin-top: 8px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          transform: translateY(6px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
        `;
        label.textContent = hs.label || targetTitle || 'Next Scene';
        el.appendChild(label);

        el.addEventListener('mouseenter', () => {
          circle.style.width = targetThumbnail ? '72px' : '58px';
          circle.style.height = targetThumbnail ? '72px' : '58px';
          circle.style.boxShadow = `0 8px 24px rgba(0,0,0,0.6), 0 0 0 6px rgba(255, 255, 255, 0.4)`;
          
          if (targetThumbnail && thumbContainer) {
            thumbContainer.style.opacity = '1';
            iconContainer.style.opacity = '0';
          } else {
            circle.style.background = '#ffffff';
            const svg = iconContainer.querySelector('svg');
            if (svg) svg.style.color = t.color;
          }

          label.style.opacity = '1';
          label.style.transform = 'translateY(0)';
        });

        el.addEventListener('mouseleave', () => {
          circle.style.width = '48px';
          circle.style.height = '48px';
          circle.style.background = `${t.color}bb`;
          circle.style.boxShadow = '';

          if (targetThumbnail && thumbContainer) {
            thumbContainer.style.opacity = '0';
            iconContainer.style.opacity = '1';
          } else {
            const svg = iconContainer.querySelector('svg');
            if (svg) svg.style.color = '#ffffff';
          }

          label.style.opacity = '0';
          label.style.transform = 'translateY(6px)';
        });

        return {
          id: hs.id,
          position: { yaw: hs.yaw, pitch: hs.pitch },
          elementLayer: el,
          tooltip: {
            content: hs.label,
            position: 'top center',
          }
        };
      });

      if (pendingPos) {
        const el = document.createElement('div');
        el.className = 'hotspot-marker pending animate-pulse';
        el.style.cssText = `
          width:48px;height:48px;
          background:rgba(99, 102, 241, 0.6);
          border:2px dashed #ffffff;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.8);
        `;
        el.innerHTML = getHotspotSvg('DEFAULT');

        psvMarkers.push({
          id: 'pending-marker',
          position: { yaw: pendingPos.yaw, pitch: pendingPos.pitch },
          elementLayer: el,
          tooltip: {
            content: 'Placing here...',
            position: 'top center',
            visible: true,
          }
        } as any);
      }

      // ── Render Scene Default Avatar preview inside 3D space ──
      if (sceneAvatarForm.defaultAvatarId && !['BOTTOM_LEFT', 'BOTTOM_RIGHT'].includes(sceneAvatarForm.avatarPosition)) {
        const avatar = avatars.find((a: any) => a.id === sceneAvatarForm.defaultAvatarId);
        if (avatar) {
          const avatarName = avatar.name || 'Default Scene Avatar';
          const scale = sceneAvatarForm.avatarScale ?? 1.0;

          const container = document.createElement('div');
          container.className = 'avatar-preview-marker default-scene-avatar-preview';
          container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            position: relative;
            cursor: pointer;
            width: 300px;
            height: 300px;
            pointer-events: none;
          `;

          const inner = document.createElement('div');
          inner.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            position: relative;
            width: 300px;
            height: 300px;
            transform: scale(${scale});
            transform-origin: bottom center;
            pointer-events: auto;
            filter: drop-shadow(0 8px 20px rgba(0,0,0,0.5));
            transition: transform 0.2s ease-out;
          `;

          const videoUrl = avatar.optimizedUrl;
          if (videoUrl) {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.setAttribute('playsinline', 'true');
            video.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: contain;
              object-position: bottom center;
              border-radius: 8px;
            `;
            inner.appendChild(video);
            video.play().catch(() => {});
          }

          const avatarLabel = document.createElement('div');
          avatarLabel.style.cssText = `
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(99, 102, 241, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          `;
          avatarLabel.textContent = `Scene Avatar: ${avatarName}`;
          inner.appendChild(avatarLabel);

          container.appendChild(inner);

          let yaw = scene?.defaultYaw ?? 0;
          let pitch = (scene?.defaultPitch ?? 0) - 0.4;

          if (sceneAvatarForm.avatarPosition === 'CUSTOM') {
            const customX = sceneAvatarForm.avatarCustomPositionX ?? 50;
            const customY = sceneAvatarForm.avatarCustomPositionY ?? 50;
            yaw = (scene?.defaultYaw ?? 0) + ((customX - 50) / 50) * 0.8;
            pitch = ((scene?.defaultPitch ?? 0) - 0.4) + ((50 - customY) / 50) * 0.4;
          }

          psvMarkers.push({
            id: `default-scene-avatar-preview`,
            position: { yaw, pitch },
            elementLayer: container,
            anchor: 'bottom center',
            tooltip: { content: `Scene Avatar: ${avatarName}`, position: 'top center' }
          } as any);
        }
      }

      markersPlugin.setMarkers(psvMarkers);
    })();
  }, [viewerReady, hotspots, pendingPos, avatars, sceneAvatarForm, scene, scenes]);

  // ── Save hotspot (create or update) ──────────────────────
  const handleSaveHotspot = async () => {
    if (!editForm.label?.trim()) { toast.error('Label is required'); return; }
    if (editForm.type === 'AVATAR' && !editForm.avatarId) { toast.error('Please select a Spokesperson from the list'); return; }
    
    setSaving(true);
    try {
      // Sanitize fields before sending
      const payload: any = {
        label: editForm.label,
        description: editForm.description,
        iconType: editForm.iconType,
        type: editForm.type,
        targetSceneId: editForm.type === 'SCENE_LINK' ? editForm.targetSceneId : null,
        targetAssetId: ['PDF', 'IMAGE', 'VIDEO'].includes(editForm.type ?? '') ? editForm.targetAssetId : null,
        targetUrl: ['EXTERNAL_URL', 'PDF', 'IMAGE', 'VIDEO'].includes(editForm.type ?? '') ? editForm.targetUrl : null,
        
        // Spokesperson configurations
        avatarId: editForm.type === 'AVATAR' ? editForm.avatarId : null,
        avatarPlaybackMode: editForm.type === 'AVATAR' ? editForm.avatarPlaybackMode : null,
        avatarPosition: editForm.type === 'AVATAR' ? editForm.avatarPosition : null,
        avatarVolume: editForm.type === 'AVATAR' ? Number(editForm.avatarVolume ?? 80) : null,
        avatarMuted: editForm.type === 'AVATAR' ? !!editForm.avatarMuted : null,
        avatarReplay: editForm.type === 'AVATAR' ? !!editForm.avatarReplay : null,
        avatarPostPlaybackAction: editForm.type === 'AVATAR' ? editForm.avatarPostPlaybackAction : null,
        avatarPostPlaybackTargetSceneId: (editForm.type === 'AVATAR' && editForm.avatarPostPlaybackAction === 'JUMP_TO_SCENE') ? editForm.avatarPostPlaybackTargetSceneId : null,
        avatarPostPlaybackTargetAssetId: (editForm.type === 'AVATAR' && editForm.avatarPostPlaybackAction === 'OPEN_PDF') ? editForm.avatarPostPlaybackTargetAssetId : null,
        avatarPostPlaybackTargetUrl: (editForm.type === 'AVATAR' && editForm.avatarPostPlaybackAction === 'OPEN_URL') ? editForm.avatarPostPlaybackTargetUrl : null,
        avatarPostPlaybackTargetNextAvatarId: (editForm.type === 'AVATAR' && editForm.avatarPostPlaybackAction === 'PLAY_NEXT_AVATAR') ? editForm.avatarPostPlaybackTargetNextAvatarId : null,
        avatarCustomPositionX: (editForm.type === 'AVATAR' && editForm.avatarPosition === 'CUSTOM') ? Number(editForm.avatarCustomPositionX ?? 0) : null,
        avatarCustomPositionY: (editForm.type === 'AVATAR' && editForm.avatarPosition === 'CUSTOM') ? Number(editForm.avatarCustomPositionY ?? 0) : null,
        avatarScale: editForm.type === 'AVATAR' ? Number(editForm.avatarScale ?? 1.0) : null,
      };

      if (selected) {
        // Update existing
        const updated = await apiClient.put<Hotspot>(`/hotspots/${selected.id}`, payload);
        setHotspots(hs => hs.map(h => h.id === selected.id ? updated : h));
        toast.success('Hotspot updated');
        setSelected(updated);
      } else {
        // Create new at pending position
        const createPayload = { ...payload, yaw: pendingPos?.yaw ?? 0, pitch: pendingPos?.pitch ?? 0 };
        const created = await apiClient.post<Hotspot>(`/scenes/${sceneId}/hotspots`, createPayload);
        setHotspots(hs => [...hs, created]);
        toast.success('Hotspot created');
        setSelected(created);
        setEditForm(created);
        setPendingPos(null);
      }
    } catch (err: any) { toast.error(err?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteHotspot = async (hotspotId: string) => {
    if (!confirm('Delete this hotspot?')) return;
    try {
      await apiClient.delete(`/hotspots/${hotspotId}`);
      setHotspots(hs => hs.filter(h => h.id !== hotspotId));
      if (selected?.id === hotspotId) { setSelected(null); setEditForm({}); }
      toast.success('Hotspot deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const selectHotspot = (hs: Hotspot) => {
    setSelected(hs);
    setEditForm({ ...hs });
    setPendingPos(null);
    setPlacing(false);
  };

  const cancelEdit = () => {
    setSelected(null);
    setEditForm({});
    setPendingPos(null);
  };

  // ── Save Default Scene Avatar Config ─────────────────────
  const handleSaveSceneAvatar = async () => {
    setSavingSceneAvatar(true);
    try {
      const payload = {
        defaultAvatarId: sceneAvatarForm.defaultAvatarId || null,
        avatarPlaybackMode: sceneAvatarForm.defaultAvatarId ? sceneAvatarForm.avatarPlaybackMode : null,
        avatarPosition: sceneAvatarForm.defaultAvatarId ? sceneAvatarForm.avatarPosition : null,
        avatarVolume: sceneAvatarForm.defaultAvatarId ? Number(sceneAvatarForm.avatarVolume) : null,
        avatarMuted: sceneAvatarForm.defaultAvatarId ? !!sceneAvatarForm.avatarMuted : null,
        avatarReplay: sceneAvatarForm.defaultAvatarId ? !!sceneAvatarForm.avatarReplay : null,
        avatarPostPlaybackAction: sceneAvatarForm.defaultAvatarId ? sceneAvatarForm.avatarPostPlaybackAction : null,
        avatarPostPlaybackTargetSceneId: (sceneAvatarForm.defaultAvatarId && sceneAvatarForm.avatarPostPlaybackAction === 'JUMP_TO_SCENE') ? sceneAvatarForm.avatarPostPlaybackTargetSceneId : null,
        avatarPostPlaybackTargetAssetId: (sceneAvatarForm.defaultAvatarId && sceneAvatarForm.avatarPostPlaybackAction === 'OPEN_PDF') ? sceneAvatarForm.avatarPostPlaybackTargetAssetId : null,
        avatarPostPlaybackTargetUrl: (sceneAvatarForm.defaultAvatarId && sceneAvatarForm.avatarPostPlaybackAction === 'OPEN_URL') ? sceneAvatarForm.avatarPostPlaybackTargetUrl : null,
        avatarPostPlaybackTargetNextAvatarId: (sceneAvatarForm.defaultAvatarId && sceneAvatarForm.avatarPostPlaybackAction === 'PLAY_NEXT_AVATAR') ? sceneAvatarForm.avatarPostPlaybackTargetNextAvatarId : null,
        avatarCustomPositionX: (sceneAvatarForm.defaultAvatarId && sceneAvatarForm.avatarPosition === 'CUSTOM') ? Number(sceneAvatarForm.avatarCustomPositionX) : null,
        avatarCustomPositionY: (sceneAvatarForm.defaultAvatarId && sceneAvatarForm.avatarPosition === 'CUSTOM') ? Number(sceneAvatarForm.avatarCustomPositionY) : null,
        avatarScale: sceneAvatarForm.defaultAvatarId ? Number(sceneAvatarForm.avatarScale ?? 1.0) : null,
      };

      await apiClient.put(`/scenes/${sceneId}`, payload);
      toast.success('Scene default spokesperson settings updated!');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update scene spokesperson settings');
    } finally {
      setSavingSceneAvatar(false);
    }
  };

  const typeInfo = (type: string) => HOTSPOT_TYPES.find(t => t.value === type) ?? HOTSPOT_TYPES[0]!;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!scene) return null;

  const isPanelOpen = !!selected || !!pendingPos;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/builder" className="btn-icon p-2 bg-slate-900 border border-white/5 hover:border-white/20 rounded-xl">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Link>
        <div>
          <h2 className="page-title text-xl font-bold mb-0">{scene.title}</h2>
          <p className="text-slate-500 text-xs mt-0.5">Scene Editor · {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setPlacing(p => !p); if (selected || pendingPos) cancelEdit(); }}
            className={`btn gap-2 text-xs font-semibold py-2 px-3.5 ${placing ? 'btn-primary ring-2 ring-indigo-400' : 'btn-secondary'}`}
          >
            <Target className="w-4 h-4" />
            {placing ? 'Click panorama to place…' : 'Place Hotspot'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        
        {/* ── Left Column ─────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Viewer container */}
          <div className={`relative rounded-2xl overflow-hidden border ${placing ? 'border-indigo-500 ring-2 ring-indigo-500/30 cursor-crosshair' : 'border-white/10'}`}
            style={{ height: 520 }}>
            {!(scene as any).panoramaUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
                <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">No panorama uploaded for this scene</p>
                <p className="text-slate-500 text-sm mt-1">Go back and upload a 360° image first</p>
              </div>
            )}
            <div ref={viewerRef} className="w-full h-full" />

            {/* Live static screen overlay preview for Default Scene Avatar */}
            {sceneAvatarForm.defaultAvatarId && ['BOTTOM_LEFT', 'BOTTOM_RIGHT'].includes(sceneAvatarForm.avatarPosition) && (() => {
              const avatar = avatars.find((a: any) => a.id === sceneAvatarForm.defaultAvatarId);
              if (!avatar) return null;
              const scale = sceneAvatarForm.avatarScale ?? 1.0;
              const isLeft = sceneAvatarForm.avatarPosition === 'BOTTOM_LEFT';
              
              return (
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    bottom: '0px',
                    left: isLeft ? '16px' : 'auto',
                    right: isLeft ? 'auto' : '16px',
                    width: '240px',
                    height: '240px',
                    transform: `scale(${scale})`,
                    transformOrigin: isLeft ? 'bottom left' : 'bottom right',
                    transition: 'transform 0.2s ease-out, bottom 0.3s, left 0.3s, right 0.3s',
                    zIndex: 10,
                  }}
                >
                  {avatar.optimizedUrl ? (
                    <video
                      src={avatar.optimizedUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain rounded-lg drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
                      style={{ objectPosition: isLeft ? 'bottom left' : 'bottom right' }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-900/90 border-2 border-indigo-500 flex items-center justify-center text-center p-2 text-white text-[9px] font-bold">
                      {avatar.name}
                    </div>
                  )}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-600/95 text-[9px] text-white font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap">
                    Static Avatar Preview ({scale.toFixed(1)}×)
                  </div>
                </div>
              );
            })()}

            {/* Placement hint overlay */}
            {placing && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-full font-medium shadow-lg animate-bounce">
                Click anywhere on the panorama to place the hotspot
              </div>
            )}

            {/* Hotspot markers count overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur rounded-lg px-3 py-2 text-xs text-white/60">
              {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''} placed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hotspot list */}
            <div className="card h-fit bg-[#161726] border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm">Hotspots</h3>
                <button onClick={() => { setPlacing(true); cancelEdit(); }} className="btn-secondary btn-sm gap-1.5 text-xs font-semibold py-1.5 px-3">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {hotspots.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-8">
                  No hotspots yet. Click "Place Hotspot" and click the panorama.
                </p>
              ) : (
                <div className="space-y-2">
                  {hotspots.map((hs) => {
                    const t = typeInfo(hs.type);
                    const TIcon = t.icon;
                    const isSelected = selected?.id === hs.id;
                    return (
                      <div
                        key={hs.id}
                        onClick={() => selectHotspot(hs)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${isSelected ? 'bg-indigo-600/20 border border-indigo-500/40' : 'hover:bg-white/5 border border-transparent'}`}
                      >
                        <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${t.color}22`, border: `1.5px solid ${t.color}66` }}>
                          <TIcon className="w-4 h-4" style={{ color: t.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{hs.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.label} · Yaw {hs.yaw.toFixed(1)}° Pitch {hs.pitch.toFixed(1)}°</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteHotspot(hs.id); }}
                          className="btn-icon p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/5 rounded-lg hover:border-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Default Scene Avatar Config */}
            <div className="card h-fit space-y-4 bg-[#161726] border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" /> Scene default spokesperson
                </h3>
              </div>

              <div>
                <label className="label text-xs">Spokesperson Avatar</label>
                <select
                  className="input mt-1.5 text-xs"
                  value={sceneAvatarForm.defaultAvatarId}
                  onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, defaultAvatarId: e.target.value }))}
                >
                  <option value="">— None (No spokesperson on scene entry) —</option>
                  {avatars.filter(a => a.status === 'COMPLETED').map((av) => (
                    <option key={av.id} value={av.id}>{av.name} ({av.language.toUpperCase()})</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Assign an avatar that plays automatically when visitors enter this scene.
                </p>
              </div>

              {sceneAvatarForm.defaultAvatarId && (
                <div className="space-y-4 pt-2 border-t border-white/5 animate-fade-in">
                  
                  {/* Playback Mode */}
                  <div>
                    <label className="label text-xs">Playback Trigger</label>
                    <select
                      className="input mt-1.5 text-xs"
                      value={sceneAvatarForm.avatarPlaybackMode}
                      onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPlaybackMode: e.target.value }))}
                    >
                      <option value="CLICK_TO_PLAY">Click To Play (Icon overlay)</option>
                      <option value="AUTO_PLAY">Auto Play (Play immediately on entry)</option>
                      <option value="GUIDED_TOUR">Guided Tour (Managed step-by-step)</option>
                    </select>
                  </div>

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label text-xs">Screen Position</label>
                      <select
                        className="input mt-1.5 text-xs"
                        value={sceneAvatarForm.avatarPosition}
                        onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPosition: e.target.value }))}
                      >
                        <option value="BOTTOM_LEFT">Bottom Left</option>
                        <option value="BOTTOM_RIGHT">Bottom Right</option>
                        <option value="CENTER">Center Overlay</option>
                        <option value="CUSTOM">Custom Offset</option>
                      </select>
                    </div>

                    {/* Audio Controls */}
                    <div className="flex flex-col justify-end space-y-1.5 pb-0.5">
                      <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sceneAvatarForm.avatarMuted}
                          onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarMuted: e.target.checked }))}
                          className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                        />
                        <span>Mute Audio</span>
                      </label>
                      <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sceneAvatarForm.avatarReplay}
                          onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarReplay: e.target.checked }))}
                          className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                        />
                        <span>Loop / Replay</span>
                      </label>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Volume</span>
                      <span className="font-semibold">{sceneAvatarForm.avatarVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sceneAvatarForm.avatarVolume}
                      onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarVolume: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Scale Slider - Scene default config */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1.5">🔍 Display Scale</span>
                      <span className="font-semibold text-indigo-300">{Number(sceneAvatarForm.avatarScale ?? 1.0).toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.05}
                      value={sceneAvatarForm.avatarScale ?? 1.0}
                      onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarScale: Number(e.target.value) }))}
                      className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                      <span>0.5×</span>
                      <span className="text-slate-500">1.0× (default)</span>
                      <span>5.0×</span>
                    </div>
                  </div>

                  {/* Custom Position sliders */}
                  {sceneAvatarForm.avatarPosition === 'CUSTOM' && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-3">
                      <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Custom Screen Offsets</p>
                      
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Horizontal (X): {sceneAvatarForm.avatarCustomPositionX}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={sceneAvatarForm.avatarCustomPositionX}
                          onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarCustomPositionX: Number(e.target.value) }))}
                          className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Bottom Margin (Y): {sceneAvatarForm.avatarCustomPositionY}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={sceneAvatarForm.avatarCustomPositionY}
                          onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarCustomPositionY: Number(e.target.value) }))}
                          className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Post Playback Action */}
                  <div className="pt-2 border-t border-white/5">
                    <label className="label text-xs">Post-Playback Action</label>
                    <select
                      className="input mt-1.5 text-xs"
                      value={sceneAvatarForm.avatarPostPlaybackAction}
                      onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPostPlaybackAction: e.target.value }))}
                    >
                      <option value="DO_NOTHING">Do Nothing</option>
                      <option value="JUMP_TO_SCENE">Jump To Scene</option>
                      <option value="OPEN_PDF">Open PDF Manual</option>
                      <option value="OPEN_URL">Open External Link</option>
                      <option value="PLAY_NEXT_AVATAR">Play Next Avatar</option>
                    </select>
                  </div>

                  {/* Post Playback Conditional Inputs */}
                  {sceneAvatarForm.avatarPostPlaybackAction === 'JUMP_TO_SCENE' && (
                    <div>
                      <label className="label text-[10px] text-slate-400">Target Scene</label>
                      <select
                        className="input mt-1 text-xs"
                        value={sceneAvatarForm.avatarPostPlaybackTargetSceneId}
                        onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPostPlaybackTargetSceneId: e.target.value }))}
                      >
                        <option value="">— Select scene —</option>
                        {scenes.filter(s => s.id !== sceneId).map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sceneAvatarForm.avatarPostPlaybackAction === 'OPEN_PDF' && (
                    <div>
                      <label className="label text-[10px] text-slate-400">Select PDF Document</label>
                      <select
                        className="input mt-1 text-xs"
                        value={sceneAvatarForm.avatarPostPlaybackTargetAssetId}
                        onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPostPlaybackTargetAssetId: e.target.value }))}
                      >
                        <option value="">— Select PDF —</option>
                        {pdfAssets.map(pdf => (
                          <option key={pdf.id} value={pdf.filePath || pdf.id}>{pdf.originalName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sceneAvatarForm.avatarPostPlaybackAction === 'OPEN_URL' && (
                    <div>
                      <label className="label text-[10px] text-slate-400">External URL Target</label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={sceneAvatarForm.avatarPostPlaybackTargetUrl}
                        onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPostPlaybackTargetUrl: e.target.value }))}
                        className="input mt-1 text-xs"
                      />
                    </div>
                  )}

                  {sceneAvatarForm.avatarPostPlaybackAction === 'PLAY_NEXT_AVATAR' && (
                    <div>
                      <label className="label text-[10px] text-slate-400">Next Spokesperson Guide</label>
                      <select
                        className="input mt-1 text-xs"
                        value={sceneAvatarForm.avatarPostPlaybackTargetNextAvatarId}
                        onChange={(e) => setSceneAvatarForm((prev: any) => ({ ...prev, avatarPostPlaybackTargetNextAvatarId: e.target.value }))}
                      >
                        <option value="">— Select spokesperson —</option>
                        {avatars.filter(a => a.id !== sceneAvatarForm.defaultAvatarId && a.status === 'COMPLETED').map(av => (
                          <option key={av.id} value={av.id}>{av.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                </div>
              )}

              <button
                type="button"
                onClick={handleSaveSceneAvatar}
                disabled={savingSceneAvatar}
                className="btn-primary w-full gap-2 text-xs py-2 mt-2 bg-indigo-600 hover:bg-indigo-500"
              >
                {savingSceneAvatar ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Save Spokesperson Config
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Edit Panel ──────────────────────────────────── */}
        {isPanelOpen ? (
          <div className="card space-y-5 h-fit sticky top-6 max-h-[85vh] overflow-y-auto bg-[#161726] border border-white/5 p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">{selected ? 'Edit Hotspot' : 'New Hotspot'}</h3>
              <button onClick={cancelEdit} className="btn-icon p-1.5"><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            {/* Type selector */}
            <div>
              <label className="label text-xs mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {HOTSPOT_TYPES.map((t) => {
                  const TIcon = t.icon;
                  const isActive = editForm.type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setEditForm(f => ({ ...f, type: t.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all ${isActive ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                    >
                      <TIcon className="w-3.5 h-3.5" style={{ color: isActive ? t.color : undefined }} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Label */}
            <div>
              <label className="label text-xs">Label *</label>
              <input
                className="input mt-1 text-xs"
                placeholder="e.g. Go to Reception"
                value={editForm.label ?? ''}
                onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="label text-xs">Description</label>
              <textarea
                className="input mt-1 text-xs resize-none"
                rows={3}
                placeholder="Optional description shown in popup"
                value={editForm.description ?? ''}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Conditional fields */}
            {editForm.type === 'SCENE_LINK' && (
              <div>
                <label className="label text-xs">Target Scene</label>
                <select
                  className="input mt-1 text-xs"
                  value={editForm.targetSceneId ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, targetSceneId: e.target.value || null }))}
                >
                  <option value="">— Select scene —</option>
                  {scenes.filter(s => s.id !== sceneId).map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            {editForm.type === 'EXTERNAL_URL' && (
              <div>
                <label className="label text-xs">URL</label>
                <input
                  className="input mt-1 text-xs"
                  type="url"
                  placeholder="https://example.com"
                  value={editForm.targetUrl ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, targetUrl: e.target.value }))}
                />
              </div>
            )}

            {(editForm.type === 'PDF' || editForm.type === 'VIDEO' || editForm.type === 'IMAGE') && (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs flex items-center justify-between">
                    <span>Select {editForm.type} Asset</span>
                    {loadingAssets && (
                      <span className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    )}
                  </label>
                  <select
                    className="input mt-1 text-xs"
                    value={editForm.targetAssetId ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      const selectedAsset = assets.find(a => a.id === val || a.filePath === val);
                      setEditForm(f => ({
                        ...f,
                        targetAssetId: val || null,
                        targetUrl: selectedAsset ? (selectedAsset.optimizedUrl || selectedAsset.fileUrl || selectedAsset.filePath || selectedAsset.url) : null
                      }));
                    }}
                  >
                    <option value="">— Select from library —</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.filePath || asset.id}>
                        {asset.originalName || asset.name || 'Unnamed Asset'} ({asset.fileSize !== undefined && !isNaN(Number(asset.fileSize)) ? formatBytes(asset.fileSize) : 'unknown size'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="btn-secondary btn-sm gap-2 cursor-pointer flex-1 justify-center py-2.5 border border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all text-xs font-semibold rounded-xl">
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    {uploadingAsset ? 'Uploading...' : `Upload New ${editForm.type}`}
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        editForm.type === 'IMAGE' ? 'image/*' :
                        editForm.type === 'VIDEO' ? 'video/*' :
                        '.pdf,application/pdf'
                      }
                      disabled={uploadingAsset}
                      onChange={handleDirectAssetUpload}
                    />
                  </label>
                </div>

                <div className="pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Or Custom Asset URL / Path</span>
                    {(editForm.targetAssetId || editForm.targetUrl) && (
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({ ...f, targetAssetId: null, targetUrl: '' }))}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                  <input
                    className="input text-xs"
                    placeholder={`e.g. assets/panos/file.${editForm.type?.toLowerCase()}`}
                    value={editForm.targetUrl ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, targetUrl: e.target.value, targetAssetId: null }))}
                  />
                </div>
              </div>
            )}

            {/* EXPLICIT AVATAR CONFIG FOR AVATAR HOTSPOT */}
            {editForm.type === 'AVATAR' && (
              <div className="space-y-4 pt-3 border-t border-white/5 animate-fade-in">
                
                {/* Spokesperson select */}
                <div>
                  <label className="label text-xs">Spokesperson Avatar *</label>
                  <select
                    className="input mt-1.5 text-xs"
                    value={editForm.avatarId ?? ''}
                    onChange={e => setEditForm(f => ({ 
                      ...f, 
                      avatarId: e.target.value || null,
                      avatarPlaybackMode: f.avatarPlaybackMode || 'CLICK_TO_PLAY',
                      avatarPosition: f.avatarPosition || 'BOTTOM_LEFT',
                      avatarVolume: f.avatarVolume || 80,
                      avatarMuted: f.avatarMuted ?? false,
                      avatarReplay: f.avatarReplay ?? false,
                      avatarPostPlaybackAction: f.avatarPostPlaybackAction || 'DO_NOTHING',
                    }))}
                  >
                    <option value="">— Select spokesperson —</option>
                    {avatars.filter(a => a.status === 'COMPLETED').map(av => (
                      <option key={av.id} value={av.id}>{av.name} ({av.language.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                {editForm.avatarId && (
                  <>
                    {/* Playback trigger */}
                    <div>
                      <label className="label text-xs">Playback Trigger</label>
                      <select
                        className="input mt-1.5 text-xs"
                        value={editForm.avatarPlaybackMode ?? 'CLICK_TO_PLAY'}
                        onChange={e => setEditForm(f => ({ ...f, avatarPlaybackMode: e.target.value }))}
                      >
                        <option value="CLICK_TO_PLAY">Click To Play (Icon overlay)</option>
                        <option value="AUTO_PLAY">Auto Play (Immediately on trigger)</option>
                        <option value="GUIDED_TOUR">Guided Tour (Managed sequence)</option>
                      </select>
                    </div>

                    {/* Audio check */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 flex gap-6">
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editForm.avatarMuted}
                          onChange={(e) => setEditForm(prev => ({ ...prev, avatarMuted: e.target.checked }))}
                          className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        />
                        <span>Mute Audio</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!editForm.avatarReplay}
                          onChange={(e) => setEditForm(prev => ({ ...prev, avatarReplay: e.target.checked }))}
                          className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                        />
                        <span>Loop / Replay</span>
                      </label>
                    </div>

                    {/* Volume Slider */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Volume</span>
                        <span className="font-semibold">{editForm.avatarVolume ?? 80}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editForm.avatarVolume ?? 80}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatarVolume: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Scale Slider - Hotspot config */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5">🔍 Display Scale</span>
                        <span className="font-semibold text-indigo-300">{Number(editForm.avatarScale ?? 1.0).toFixed(2)}×</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.05}
                        value={editForm.avatarScale ?? 1.0}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatarScale: Number(e.target.value) }))}
                        className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                        <span>0.5×</span>
                        <span className="text-slate-500">1.0× (default)</span>
                        <span>5.0×</span>
                      </div>
                    </div>

                    {/* Post Playback Action */}
                    <div className="pt-2 border-t border-white/5">
                      <label className="label text-xs">Post-Playback Action</label>
                      <select
                        className="input mt-1.5 text-xs"
                        value={editForm.avatarPostPlaybackAction ?? 'DO_NOTHING'}
                        onChange={e => setEditForm(f => ({ ...f, avatarPostPlaybackAction: e.target.value }))}
                      >
                        <option value="DO_NOTHING">Do Nothing</option>
                        <option value="JUMP_TO_SCENE">Jump To Scene</option>
                        <option value="OPEN_PDF">Open PDF Manual</option>
                        <option value="OPEN_URL">Open External Link</option>
                        <option value="PLAY_NEXT_AVATAR">Play Next Avatar</option>
                      </select>
                    </div>

                    {/* Post Playback Targets */}
                    {editForm.avatarPostPlaybackAction === 'JUMP_TO_SCENE' && (
                      <div>
                        <label className="label text-[10px] text-slate-400">Target Scene</label>
                        <select
                          className="input mt-1 text-xs"
                          value={editForm.avatarPostPlaybackTargetSceneId ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, avatarPostPlaybackTargetSceneId: e.target.value }))}
                        >
                          <option value="">— Select scene —</option>
                          {scenes.filter(s => s.id !== sceneId).map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editForm.avatarPostPlaybackAction === 'OPEN_PDF' && (
                      <div>
                        <label className="label text-[10px] text-slate-400">Select PDF Document</label>
                        <select
                          className="input mt-1 text-xs"
                          value={editForm.avatarPostPlaybackTargetAssetId ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, avatarPostPlaybackTargetAssetId: e.target.value }))}
                        >
                          <option value="">— Select PDF —</option>
                          {pdfAssets.map(pdf => (
                            <option key={pdf.id} value={pdf.filePath || pdf.id}>{pdf.originalName}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editForm.avatarPostPlaybackAction === 'OPEN_URL' && (
                      <div>
                        <label className="label text-[10px] text-slate-400">External URL Target</label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={editForm.avatarPostPlaybackTargetUrl ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, avatarPostPlaybackTargetUrl: e.target.value }))}
                          className="input mt-1 text-xs"
                        />
                      </div>
                    )}

                    {editForm.avatarPostPlaybackAction === 'PLAY_NEXT_AVATAR' && (
                      <div>
                        <label className="label text-[10px] text-slate-400">Next Spokesperson Guide</label>
                        <select
                          className="input mt-1 text-xs"
                          value={editForm.avatarPostPlaybackTargetNextAvatarId ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, avatarPostPlaybackTargetNextAvatarId: e.target.value }))}
                        >
                          <option value="">— Select spokesperson —</option>
                          {avatars.filter(a => a.id !== editForm.avatarId && a.status === 'COMPLETED').map(av => (
                            <option key={av.id} value={av.id}>{av.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                  </>
                )}

              </div>
            )}

            {/* Position display */}
            <div className="bg-white/5 rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300 mb-2">Position</p>
              <p>Yaw: {(editForm.yaw ?? pendingPos?.yaw ?? 0).toFixed(2)}°</p>
              <p>Pitch: {(editForm.pitch ?? pendingPos?.pitch ?? 0).toFixed(2)}°</p>
            </div>

            {/* Save / Delete */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveHotspot}
                disabled={saving}
                className="btn-primary flex-1 gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2.5 text-xs font-bold"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {selected ? 'Update' : 'Create'} Hotspot
              </button>
              {selected && (
                <button
                  onClick={() => handleDeleteHotspot(selected.id)}
                  className="btn-secondary border-red-500/30 text-red-400 hover:bg-red-500/10 px-3 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card border-dashed border-white/10 bg-[#161726]/40 flex flex-col items-center justify-center py-16 text-center h-fit rounded-2xl">
            <Target className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium text-xs">Select a hotspot marker</p>
            <p className="text-slate-600 text-[10px] mt-1">or click "Place Hotspot" above to add</p>
          </div>
        )}
      </div>
    </div>
  );
}
