'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, SkipForward, SkipBack, Info, Phone, Mail, Globe, MessageSquare, ExternalLink, User, Volume2, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient, UPLOAD_URL } from '@/lib/api-client';
import { getMediaUrl } from '@/lib/utils';

interface TourData {
  project: { id: string; name: string; slug: string; companyName: string | null; description: string | null; guidedTourEnabled: boolean };
  branding: {
    logoUrl: string | null; logoPosition: string; logoSize: string; coverUrl: string | null;
    primaryColor: string; secondaryColor: string; backgroundColor: string; textColor: string;
    autoRotate: boolean; autoRotateSpeed: number; showControls: boolean; showSceneMenu: boolean;
    contactEmail: string | null; contactPhone: string | null; websiteUrl: string | null;
    welcomeTitle: string | null; welcomeMessage: string | null;
  } | null;
  scenes: Array<{
    id: string; title: string; description: string | null;
    panoramaUrl: string | null; thumbnailUrl: string | null;
    isStartScene: boolean; order: number;
    defaultYaw: number; defaultPitch: number; defaultZoom: number;
    
    // Explicit scene avatar settings
    defaultAvatarId?: string | null;
    defaultAvatar?: any | null;
    avatarPlaybackMode?: string | null;
    avatarPosition?: string | null;
    avatarVolume?: number | null;
    avatarMuted?: boolean | null;
    avatarReplay?: boolean | null;
    avatarPostPlaybackAction?: string | null;
    avatarPostPlaybackTargetSceneId?: string | null;
    avatarPostPlaybackTargetAssetUrl?: string | null;
    avatarPostPlaybackTargetUrl?: string | null;
    avatarPostPlaybackTargetNextAvatarId?: string | null;
    avatarCustomPositionX?: number | null;
    avatarCustomPositionY?: number | null;
    avatarScale?: number | null;

    hotspots: Array<{
      id: string; label: string; description: string | null; iconType: string;
      yaw: number; pitch: number; type: string;
      targetSceneId: string | null; targetAssetUrl: string | null; targetUrl: string | null; style: any;
      
      // Explicit hotspot avatar settings
      avatarId?: string | null;
      avatar?: any | null;
      avatarPlaybackMode?: string | null;
      avatarPosition?: string | null;
      avatarVolume?: number | null;
      avatarMuted?: boolean | null;
      avatarReplay?: boolean | null;
      avatarPostPlaybackAction?: string | null;
      avatarPostPlaybackTargetSceneId?: string | null;
      avatarPostPlaybackTargetAssetUrl?: string | null;
      avatarPostPlaybackTargetUrl?: string | null;
      avatarPostPlaybackTargetNextAvatarId?: string | null;
      avatarCustomPositionX?: number | null;
      avatarCustomPositionY?: number | null;
      avatarScale?: number | null;
    }>;
  }>;
  guidedTour: Array<{
    order: number; sceneId: string; duration: number;
    narrationTitle: string | null; narrationText: string | null;
    targetYaw: number | null; targetPitch: number | null; targetZoom: number | null;
    rotationAngle?: number | null;
    rotationSpeed?: number | null;
    audioUrl?: string | null;
    highlightHotspotId: string | null;
  }>;
}

interface ContactFormState { name: string; email: string; phone: string; message: string; }

const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
};

const preloadVideo = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = url;
    video.preload = 'auto';
    video.muted = true;
    video.onloadedmetadata = () => resolve();
    video.onerror = () => resolve();
  });
};

export function TourViewer({ data }: { data: TourData }) {
  const { project, branding, scenes, guidedTour } = data;
  const viewerRef = useRef<HTMLDivElement>(null);
  const psvRef = useRef<any>(null);
  const initialSceneRef = useRef<any>(null);

  const { isAuthenticated, login, logout } = useAuth();
  const router = useRouter();

  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) return;

    setAdminLoggingIn(true);
    try {
      const result = await apiClient.post<any>('/auth/login', { username: adminUsername, password: adminPassword });
      login(result.token, result.admin);
      toast.success('Welcome to the Builder!');
      setShowAdminDrawer(false);
      router.push('/builder');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const [currentScene, setCurrentScene] = useState(scenes.find((s) => s.isStartScene) ?? scenes[0]);
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean;
    nextSceneId: string | null;
    thumbnailUrl: string | null;
    direction: 'forward' | 'backward';
  }>({
    isActive: false,
    nextSceneId: null,
    thumbnailUrl: null,
    direction: 'forward',
  });

  const changeScene = useCallback((nextScene: typeof currentScene, clickedHotspot?: any) => {
    if (!nextScene || !currentScene) return;
    if (nextScene.id === currentScene.id) return;

    const runTransition = () => {
      setTransitionState({
        isActive: true,
        nextSceneId: nextScene.id,
        thumbnailUrl: nextScene.thumbnailUrl,
        direction: 'forward',
      });
      setTimeout(() => {
        setCurrentScene(nextScene);
      }, 250);
    };

    if (clickedHotspot && psvRef.current) {
      try {
        psvRef.current.animate({
          yaw: clickedHotspot.yaw,
          pitch: clickedHotspot.pitch,
          zoom: 95,
          speed: '120deg/s',
        }).then(() => {
          runTransition();
        }).catch(() => {
          runTransition();
        });
      } catch (e) {
        runTransition();
      }
    } else {
      setTransitionState({
        isActive: true,
        nextSceneId: nextScene.id,
        thumbnailUrl: nextScene.thumbnailUrl,
        direction: 'forward',
      });
      setTimeout(() => {
        setCurrentScene(nextScene);
      }, 200);
    }
  }, [currentScene]);

  const [showWelcome, setShowWelcome] = useState(!!(branding?.welcomeTitle));
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadLabel, setPreloadLabel] = useState('Initializing tour...');
  const [userClickedEnter, setUserClickedEnter] = useState(false);

  // Preload all assets of the tour (images & videos) in parallel for zero latency transition
  useEffect(() => {
    let active = true;
    (async () => {
      // Gather all unique URLs to preload
      const imagesToLoad = new Set<string>();
      const videosToLoad = new Set<string>();

      // 1. Branding images
      if (branding?.logoUrl) imagesToLoad.add(getMediaUrl(branding.logoUrl));
      if (branding?.coverUrl) imagesToLoad.add(getMediaUrl(branding.coverUrl));

      // 2. Scenes panoramas, thumbnails and avatars
      scenes.forEach((scene) => {
        if (scene.panoramaUrl) imagesToLoad.add(getMediaUrl(scene.panoramaUrl));
        if (scene.thumbnailUrl) imagesToLoad.add(getMediaUrl(scene.thumbnailUrl));

        const sceneAvatar = (scene as any).defaultAvatar;
        if (sceneAvatar && sceneAvatar.optimizedUrl) {
          videosToLoad.add(getMediaUrl(sceneAvatar.optimizedUrl));
        }

        // 3. Hotspot media
        scene.hotspots.forEach((hs) => {
          if (hs.type === 'IMAGE' && hs.targetAssetUrl) {
            imagesToLoad.add(getMediaUrl(hs.targetAssetUrl));
          } else if (hs.type === 'VIDEO' && hs.targetAssetUrl) {
            videosToLoad.add(getMediaUrl(hs.targetAssetUrl));
          } else if (hs.type === 'AVATAR' && hs.avatar?.optimizedUrl) {
            videosToLoad.add(getMediaUrl(hs.avatar.optimizedUrl));
          }
        });
      });

      const uniqueImages = Array.from(imagesToLoad).filter(Boolean);
      const uniqueVideos = Array.from(videosToLoad).filter(Boolean);
      const totalAssets = uniqueImages.length + uniqueVideos.length;

      if (totalAssets === 0) {
        if (active) {
          setPreloadProgress(100);
          setIsPreloading(false);
        }
        return;
      }

      let loadedCount = 0;

      const incrementProgress = (url: string, type: 'image' | 'video') => {
        if (!active) return;
        loadedCount++;
        const pct = Math.round((loadedCount / totalAssets) * 100);
        setPreloadProgress(pct);
        const name = url.split('/').pop() || '';
        setPreloadLabel(`Caching ${type === 'image' ? 'image' : 'video'}: ${name.substring(0, 20)}...`);
      };

      const imagePromises = uniqueImages.map(async (url) => {
        await preloadImage(url);
        incrementProgress(url, 'image');
      });

      const videoPromises = uniqueVideos.map(async (url) => {
        await preloadVideo(url);
        incrementProgress(url, 'video');
      });

      await Promise.all([...imagePromises, ...videoPromises]);

      if (active) {
        setPreloadLabel('All assets cached successfully!');
        setPreloadProgress(100);
        // Add a small delay for visual satisfaction
        setTimeout(() => {
          if (active) setIsPreloading(false);
        }, 600);
      }
    })();

    return () => {
      active = false;
    };
  }, [scenes, branding]);

  useEffect(() => {
    if (!isPreloading && userClickedEnter) {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isPreloading, userClickedEnter]);

  // If welcome screen is disabled, silently log out on mount to clear admin session for viewer
  useEffect(() => {
    if (!showWelcome) {
      try {
        logout(false);
      } catch (e) {}
    }
  }, [showWelcome, logout]);

  const [showMenu, setShowMenu] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showInfo, setShowInfo] = useState<{ label: string; description: string } | null>(null);
  const [showMedia, setShowMedia] = useState<{ type: string; url: string; label: string } | null>(null);
  const [guided, setGuided] = useState(false);
  const guidedRef = useRef(guided);
  useEffect(() => {
    guidedRef.current = guided;
  }, [guided]);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedPaused, setGuidedPaused] = useState(false);
  const [guidedMinimized, setGuidedMinimized] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormState>({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const guidedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guidedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to avoid re-triggering the guided tour effect on scene/callback changes
  const currentSceneRef = useRef(currentScene);
  useEffect(() => { currentSceneRef.current = currentScene; }, [currentScene]);
  const changeSceneRef = useRef(changeScene);
  useEffect(() => { changeSceneRef.current = changeScene; }, [changeScene]);

  // Restore scene after guided tour ends
  useEffect(() => {
    if (!guided) {
      if (initialSceneRef.current) {
        changeScene(initialSceneRef.current);
        initialSceneRef.current = null;
      }
    }
  }, [guided, changeScene]);

  // Manage auto-rotation during guided tour
  useEffect(() => {
    if (!psvRef.current) return;
    try {
      const autorotate = psvRef.current.getPlugin('autorotate') as any;
      if (autorotate) {
        if (guided) {
          autorotate.stop();
        } else {
          // Always reset options to branding defaults on tour exit
          autorotate.setOptions({
            autorotateSpeed: (branding?.autoRotate && branding.autoRotateSpeed)
              ? `${branding.autoRotateSpeed}rpm`
              : '1.5rpm',
            autorotatePitch: null,
          });
          if (branding?.autoRotate) {
            autorotate.start();
          } else {
            autorotate.stop();
          }
        }
      }
    } catch (e) {
      console.error('Failed to toggle autorotate:', e);
    }
  }, [guided, branding?.autoRotate, branding?.autoRotateSpeed]);

  // Lock/Unlock user camera movements (drag/zoom) during guided tour
  useEffect(() => {
    if (!psvRef.current) return;
    try {
      if (guided) {
        psvRef.current.setOption('mousewheel', false);
        psvRef.current.setOption('mousemove', false);
      } else {
        psvRef.current.setOption('mousewheel', true);
        psvRef.current.setOption('mousemove', true);
      }
    } catch (e) {
      console.error('Failed to update psv mouse options:', e);
    }
  }, [guided]);

  // Toggle SCENE_LINK hotspots visibility when guided tour state changes
  useEffect(() => {
    if (!psvRef.current || !currentScene) return;
    try {
      const markersPlugin = psvRef.current.getPlugin('markers') as any;
      if (markersPlugin) {
        currentScene.hotspots.forEach((hs) => {
          if (hs.type === 'SCENE_LINK') {
            if (guided) {
              markersPlugin.hideMarker(hs.id);
            } else {
              markersPlugin.showMarker(hs.id);
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to toggle markers visibility:', e);
    }
  }, [guided, currentScene]);

  // Stop guided tour audio when tour is stopped or paused
  useEffect(() => {
    if (!guided || guidedPaused) {
      if (guidedAudioRef.current) {
        try {
          guidedAudioRef.current.pause();
        } catch (e) {
          console.error('Failed to pause guided audio:', e);
        }
        guidedAudioRef.current = null;
      }
    }
  }, [guided, guidedPaused]);

  // Update PSV navbar guided-tour button icon when tour state changes
  useEffect(() => {
    const btn = document.querySelector('.psv-custom-guided-btn');
    if (!btn) return;
    if (guided) {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; color: #ff6b6b;"><rect x="4" y="3" width="16" height="18" rx="2"/></svg>`;
      btn.setAttribute('title', 'Stop Guided Tour');
    } else {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; color: #ffffff;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      btn.setAttribute('title', 'Start Guided Tour');
    }
  }, [guided]);

  const rootRef = useRef<HTMLDivElement>(null);

  const brandingRef = useRef(branding);
  useEffect(() => { brandingRef.current = branding; }, [branding]);

  const scenesRef = useRef(scenes);
  useEffect(() => { scenesRef.current = scenes; }, [scenes]);

  const projectRef = useRef(project);
  useEffect(() => { projectRef.current = project; }, [project]);

  const guidedTourRef = useRef(guidedTour);
  useEffect(() => { guidedTourRef.current = guidedTour; }, [guidedTour]);

  const primary = branding?.primaryColor ?? '#6366f1';

  const primaryRef = useRef(primary);
  useEffect(() => { primaryRef.current = primary; }, [primary]);

  // Spokesperson Avatar Player widget state
  const [activeAvatar, setActiveAvatar] = useState<any | null>(null);
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);
  const [isAvatarMuted, setIsAvatarMuted] = useState(false);
  const [avatarVolume, setAvatarVolume] = useState(80);
  const [avatarHidden, setAvatarHidden] = useState(false);

  const toggleRootFullscreen = () => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      const btn = document.querySelector('.psv-custom-fullscreen-btn');
      if (btn) {
        btn.innerHTML = isFs 
          ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ffffff;"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>` 
          : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ffffff;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load Photo Sphere Viewer dynamically (SSR incompatible)
  useEffect(() => {
    if (!viewerRef.current || !currentScene?.panoramaUrl) return;

    let destroyed = false;
    (async () => {
      const { Viewer } = await import('@photo-sphere-viewer/core');
      const { MarkersPlugin } = await import('@photo-sphere-viewer/markers-plugin');
      const { AutorotatePlugin } = await import('@photo-sphere-viewer/autorotate-plugin');

      if (destroyed || !viewerRef.current) return;
      if (psvRef.current) { try { psvRef.current.destroy(); } catch { } }

      const plugins: any[] = [
        [MarkersPlugin, {}]
      ];

      // Always register AutorotatePlugin; config controls if/when it activates
      plugins.push([
        AutorotatePlugin,
        {
          // null = don't auto-start on a timer; we manually call .start() on 'ready'
          autostartDelay: brandingRef.current?.autoRotate ? 10000 : null,
          // After user stops interacting, wait 10 s before resuming
          autostartOnIdle: brandingRef.current?.autoRotate ?? false,
          autorotateSpeed: (brandingRef.current?.autoRotate && brandingRef.current.autoRotateSpeed)
            ? `${brandingRef.current.autoRotateSpeed}rpm`
            : '1.5rpm',
          autorotatePitch: null,
        }
      ]);

      const viewer = new Viewer({
        container: viewerRef.current!,
        panorama: currentScene.panoramaUrl!,
        defaultYaw: currentScene.defaultYaw,
        defaultPitch: currentScene.defaultPitch,
        defaultZoomLvl: currentScene.defaultZoom,
        navbar: brandingRef.current?.showControls ? [
          'zoom',
          ...(projectRef.current.guidedTourEnabled && guidedTourRef.current.length > 0 ? [{
            id: 'custom-guided-tour',
            title: 'Start Guided Tour',
            className: 'psv-custom-guided-btn',
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; color: #ffffff;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
            onClick: () => {
              // Toggle guided tour: start if not active, stop if active
              if (guidedRef.current) {
                const btn = document.getElementById('trigger-guided-stop');
                if (btn) btn.click();
              } else {
                const btn = document.getElementById('trigger-guided-start');
                if (btn) btn.click();
              }
            }
          }] : []),
          {
            id: 'custom-fullscreen',
            title: 'Toggle Fullscreen',
            className: 'psv-custom-fullscreen-btn',
            content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ffffff;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
            onClick: () => {
              toggleRootFullscreen();
            }
          }
        ] : false,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        loadingImg: undefined,
        loadingTxt: '',
        plugins
      });

      viewer.addEventListener('ready', () => {
        setTransitionState((prev) => ({ ...prev, isActive: false }));

        // If guided tour is active, lock all interactions on this new viewer
        if (guidedRef.current) {
          try {
            viewer.setOption('mousewheel', false);
            viewer.setOption('mousemove', false);
          } catch (e) {
            console.error('Failed to lock viewer during guided tour:', e);
          }
          // Hide SCENE_LINK markers during guided tour
          try {
            const mp = viewer.getPlugin(MarkersPlugin) as any;
            if (mp) {
              currentScene.hotspots.forEach((hs) => {
                if (hs.type === 'SCENE_LINK') {
                  try { mp.hideMarker(hs.id); } catch { }
                }
              });
            }
          } catch { }
          // Signal the guided tour effect that the viewer is ready for autorotation
          window.dispatchEvent(new CustomEvent('psv-guided-ready'));
        } else if (brandingRef.current?.autoRotate) {
          // Normal auto-rotate on first load
          const autorotate = viewer.getPlugin(AutorotatePlugin) as any;
          if (autorotate) autorotate.start();
        }
      }, { once: true });

      const markersPlugin = viewer.getPlugin(MarkersPlugin) as any;

      const psvMarkers = currentScene.hotspots.map((hs) => {
        // Spokesperson 3D Hotspot Avatar
        if (hs.type === 'AVATAR' && hs.avatar) {
          const avatarScale = hs.avatarScale ?? hs.avatar.scale ?? 1.0;
          const container = document.createElement('div');
          container.className = 'spokesperson-3d-container group';
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
            transform: scale(${avatarScale});
            transform-origin: bottom center;
            pointer-events: auto;
            filter: drop-shadow(0 12px 24px rgba(0,0,0,0.6));
            transition: transform 0.2s ease-out;
          `;

          const video = document.createElement('video');
          video.src = hs.avatar.optimizedUrl;
          const pbMode = hs.avatarPlaybackMode || 'CLICK_TO_PLAY';
          video.autoplay = pbMode === 'AUTO_PLAY';
          video.loop = hs.avatarReplay ?? false;
          video.muted = hs.avatarMuted ?? false;
          video.volume = (hs.avatarVolume ?? 80) / 100;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: bottom center;
            border-radius: 8px;
            display: ${pbMode === 'AUTO_PLAY' ? 'block' : 'none'};
          `;

          let playBubble: HTMLButtonElement | null = null;
          if (pbMode === 'CLICK_TO_PLAY') {
            playBubble = document.createElement('button');
            playBubble.style.cssText = `
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: rgba(15, 23, 42, 0.9);
              border: 2px solid ${primaryRef.current};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              position: relative;
              box-shadow: 0 8px 24px rgba(0,0,0,0.4);
              transition: transform 0.2s;
              margin-bottom: 110px;
            `;
            playBubble.innerHTML = `
              <span class="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-75"></span>
              <span class="absolute inset-2 rounded-full border border-indigo-500/50 animate-pulse"></span>
              <div class="flex flex-col items-center justify-center text-center text-[9px] font-bold text-white z-10">
                <svg style="width: 20px; height: 20px;" class="text-indigo-400 mb-0.5 animate-bounce" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span style="max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${hs.avatar.name}</span>
              </div>
            `;
            inner.appendChild(playBubble);

            playBubble.addEventListener('click', (e) => {
              e.stopPropagation();
              playBubble!.style.display = 'none';
              video.style.display = 'block';
              video.play().catch((err) => console.error(err));
            });
          }

          inner.appendChild(video);

          // Control Bar
          const controlBar = document.createElement('div');
          controlBar.style.cssText = `
            position: absolute;
            bottom: -35px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 20px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 10;
            pointer-events: auto;
          `;

          const playPauseBtn = document.createElement('button');
          playPauseBtn.style.cssText = 'color: #fff; border: none; background: none; cursor: pointer; display: flex; align-items: center;';
          playPauseBtn.innerHTML = video.autoplay ? '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' : '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
          playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
          });
          video.addEventListener('play', () => {
            playPauseBtn.innerHTML = '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
          });
          video.addEventListener('pause', () => {
            playPauseBtn.innerHTML = '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
          });

          const muteBtn = document.createElement('button');
          muteBtn.style.cssText = 'color: #fff; border: none; background: none; cursor: pointer; display: flex; align-items: center;';
          muteBtn.innerHTML = video.muted ? '<svg style="width:14px; height:14px;" class="text-red-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 3 3h3.586l4.707 4.707A1 1 0 0 0 22 22V2A1 1 0 0 0 20.293 1.293L15.586 6H12a3 3 0 0 0-3 3z"/></svg>' : '<svg style="width:14px; height:14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
          muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            muteBtn.innerHTML = video.muted ? '<svg style="width:14px; height:14px;" class="text-red-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 3 3h3.586l4.707 4.707A1 1 0 0 0 22 22V2A1 1 0 0 0 20.293 1.293L15.586 6H12a3 3 0 0 0-3 3z"/></svg>' : '<svg style="width:14px; height:14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
          });

          const volBar = document.createElement('input');
          volBar.type = 'range';
          volBar.min = '0';
          volBar.max = '100';
          volBar.value = String(video.volume * 100);
          volBar.style.cssText = 'width: 40px; height: 3px; cursor: pointer;';
          volBar.addEventListener('input', (e) => {
            e.stopPropagation();
            video.volume = Number((e.target as HTMLInputElement).value) / 100;
            if (video.volume > 0) video.muted = false;
          });

          controlBar.appendChild(playPauseBtn);
          controlBar.appendChild(muteBtn);
          controlBar.appendChild(volBar);
          inner.appendChild(controlBar);
          container.appendChild(inner);

          inner.addEventListener('mouseenter', () => {
            if (video.style.display !== 'none') {
              controlBar.style.opacity = '1';
            }
          });
          inner.addEventListener('mouseleave', () => {
            controlBar.style.opacity = '0';
          });

          video.addEventListener('ended', async () => {
            const action = hs.avatarPostPlaybackAction || 'DO_NOTHING';
            if (action === 'JUMP_TO_SCENE' && hs.avatarPostPlaybackTargetSceneId) {
              const target = scenesRef.current.find((s) => s.id === hs.avatarPostPlaybackTargetSceneId);
              if (target) changeSceneRef.current(target);
            } else if (action === 'OPEN_PDF' && hs.avatarPostPlaybackTargetAssetUrl) {
              setShowMedia({
                type: 'PDF',
                url: hs.avatarPostPlaybackTargetAssetUrl,
                label: `${hs.avatar.name}'s Document`,
              });
            } else if (action === 'OPEN_URL' && hs.avatarPostPlaybackTargetUrl) {
              window.open(hs.avatarPostPlaybackTargetUrl, '_blank');
            } else if (action === 'PLAY_NEXT_AVATAR' && hs.avatarPostPlaybackTargetNextAvatarId) {
              try {
                // @ts-ignore
                const av = await apiClient.get<any>(`/avatars/${hs.avatarPostPlaybackTargetNextAvatarId}`);
                if (av && av.optimizedUrl) {
                  video.src = av.optimizedUrl;
                  video.play().catch((err) => console.log(err));
                }
              } catch (err) {
                console.error('Failed to load next avatar:', err);
              }
            }
          });

          if (pbMode === 'AUTO_PLAY') {
            setTimeout(() => {
              video.play().catch((err) => console.log('Autoplay failed:', err));
            }, 100);
          }

          return {
            id: hs.id,
            position: { yaw: hs.yaw, pitch: hs.pitch },
            elementLayer: container,
            anchor: 'bottom center',
            tooltip: {
              content: hs.label || hs.avatar.name,
              position: 'top center',
            }
          };
        }

        const targetScene = hs.type === 'SCENE_LINK' ? scenesRef.current.find((s) => s.id === hs.targetSceneId) : null;
        const targetThumbnail = targetScene?.thumbnailUrl;
        const targetTitle = targetScene?.title;

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

        const isInlineVideo = hs.type === 'VIDEO' && (hs.style as any)?.playMode === 'INLINE';
        const mediaUrl = hs.targetAssetUrl || hs.targetUrl;

        const circle = document.createElement('div');
        circle.className = 'hotspot-circle hotspot-poi-glow';
        circle.style.cssText = `
          width: 50px;
          height: 50px;
          background: ${primaryRef.current}bb;
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

        let iconContainer: HTMLDivElement | null = null;
        if (isInlineVideo && mediaUrl) {
          const video = document.createElement('video');
          video.id = `video-inline-${hs.id}`;
          video.src = mediaUrl;
          video.muted = true;
          video.loop = true;
          video.autoplay = true;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            top: 0;
            left: 0;
            border-radius: 50%;
          `;
          circle.appendChild(video);
          // Play video safely
          video.play().catch((err) => console.log('Inline video play failed:', err));
        } else {
          iconContainer = document.createElement('div');
          iconContainer.className = 'hotspot-icon';
          iconContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            transition: opacity 0.3s, transform 0.3s;
          `;
          // @ts-ignore
          iconContainer.innerHTML = getHotspotSvg(hs.type);
          circle.appendChild(iconContainer);
        }

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
          circle.style.width = isInlineVideo ? '76px' : (targetThumbnail ? '76px' : '60px');
          circle.style.height = isInlineVideo ? '76px' : (targetThumbnail ? '76px' : '60px');
          circle.style.boxShadow = `0 8px 24px rgba(0,0,0,0.6), 0 0 0 6px rgba(255, 255, 255, 0.4)`;
          
          if (targetThumbnail && thumbContainer) {
            thumbContainer.style.opacity = '1';
            if (iconContainer) iconContainer.style.opacity = '0';
          } else if (!isInlineVideo) {
            circle.style.background = '#ffffff';
            if (iconContainer) {
              const svg = iconContainer.querySelector('svg');
              if (svg) svg.style.color = primaryRef.current;
            }
          }

          label.style.opacity = '1';
          label.style.transform = 'translateY(0)';
        });

        el.addEventListener('mouseleave', () => {
          circle.style.width = '50px';
          circle.style.height = '50px';
          circle.style.background = `${primaryRef.current}bb`;
          circle.style.boxShadow = '';

          if (targetThumbnail && thumbContainer) {
            thumbContainer.style.opacity = '0';
            if (iconContainer) iconContainer.style.opacity = '1';
          } else if (!isInlineVideo) {
            if (iconContainer) {
              const svg = iconContainer.querySelector('svg');
              if (svg) svg.style.color = '#ffffff';
            }
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
      }).filter(Boolean) as any[];

      // Check if scene has a default avatar that should be rendered in 3D (CENTER or CUSTOM positioning)
      const sceneDefaultAvatar = (currentScene as any).defaultAvatar;
      const sceneAvatarPos = (currentScene as any).avatarPosition || 'BOTTOM_LEFT';
      if (sceneDefaultAvatar && (currentScene as any).defaultAvatarId && !['BOTTOM_LEFT', 'BOTTOM_RIGHT'].includes(sceneAvatarPos)) {
        let yaw = currentScene.defaultYaw;
        let pitch = currentScene.defaultPitch - 0.4; // Anchor near floor

        if (sceneAvatarPos === 'CUSTOM') {
          const customX = (currentScene as any).avatarCustomPositionX ?? 50;
          const customY = (currentScene as any).avatarCustomPositionY ?? 50;
          // Map customX (0 to 100) to yaw offset (-0.8 to +0.8 radians relative to default)
          yaw = currentScene.defaultYaw + ((customX - 50) / 50) * 0.8;
          // Map customY (0 to 100) to pitch offset (-0.4 to +0.4 radians relative to floor pitch)
          pitch = (currentScene.defaultPitch - 0.4) + ((50 - customY) / 50) * 0.4;
        }

        const avatarScale = (currentScene as any).avatarScale ?? sceneDefaultAvatar.scale ?? 1.0;
        const container = document.createElement('div');
        container.className = 'spokesperson-3d-container group';
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
          transform: scale(${avatarScale});
          transform-origin: bottom center;
          pointer-events: auto;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.6));
          transition: transform 0.2s ease-out;
        `;

        const video = document.createElement('video');
        video.src = sceneDefaultAvatar.optimizedUrl;
        const pbMode = (currentScene as any).avatarPlaybackMode || 'CLICK_TO_PLAY';
        video.autoplay = pbMode === 'AUTO_PLAY';
        video.loop = (currentScene as any).avatarReplay ?? false;
        video.muted = (currentScene as any).avatarMuted ?? false;
        video.volume = ((currentScene as any).avatarVolume ?? 80) / 100;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom center;
          border-radius: 8px;
          display: ${pbMode === 'AUTO_PLAY' ? 'block' : 'none'};
        `;

        let playBubble: HTMLButtonElement | null = null;
        if (pbMode === 'CLICK_TO_PLAY') {
          playBubble = document.createElement('button');
          playBubble.style.cssText = `
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid ${primaryRef.current};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            transition: transform 0.2s;
            margin-bottom: 110px;
          `;
          playBubble.innerHTML = `
            <span class="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-75"></span>
            <span class="absolute inset-2 rounded-full border border-indigo-500/50 animate-pulse"></span>
            <div class="flex flex-col items-center justify-center text-center text-[9px] font-bold text-white z-10">
              <svg style="width: 20px; height: 20px;" class="text-indigo-400 mb-0.5 animate-bounce" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span style="max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sceneDefaultAvatar.name}</span>
            </div>
          `;
          inner.appendChild(playBubble);

          playBubble.addEventListener('click', (e) => {
            e.stopPropagation();
            playBubble!.style.display = 'none';
            video.style.display = 'block';
            video.play().catch((err) => console.error(err));
          });
        }

        inner.appendChild(video);

        // Control Bar
        const controlBar = document.createElement('div');
        controlBar.style.cssText = `
          position: absolute;
          bottom: -35px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 10;
          pointer-events: auto;
        `;

        const playPauseBtn = document.createElement('button');
        playPauseBtn.style.cssText = 'color: #fff; border: none; background: none; cursor: pointer; display: flex; align-items: center;';
        playPauseBtn.innerHTML = video.autoplay ? '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' : '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        playPauseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        });
        video.addEventListener('play', () => {
          playPauseBtn.innerHTML = '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        });
        video.addEventListener('pause', () => {
          playPauseBtn.innerHTML = '<svg style="width:14px; height:14px;" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        });

        const muteBtn = document.createElement('button');
        muteBtn.style.cssText = 'color: #fff; border: none; background: none; cursor: pointer; display: flex; align-items: center;';
        muteBtn.innerHTML = video.muted ? '<svg style="width:14px; height:14px;" class="text-red-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 3 3h3.586l4.707 4.707A1 1 0 0 0 22 22V2A1 1 0 0 0 20.293 1.293L15.586 6H12a3 3 0 0 0-3 3z"/></svg>' : '<svg style="width:14px; height:14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        muteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          video.muted = !video.muted;
          muteBtn.innerHTML = video.muted ? '<svg style="width:14px; height:14px;" class="text-red-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 3 3h3.586l4.707 4.707A1 1 0 0 0 22 22V2A1 1 0 0 0 20.293 1.293L15.586 6H12a3 3 0 0 0-3 3z"/></svg>' : '<svg style="width:14px; height:14px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
        });

        const volBar = document.createElement('input');
        volBar.type = 'range';
        volBar.min = '0';
        volBar.max = '100';
        volBar.value = String(video.volume * 100);
        volBar.style.cssText = 'width: 40px; height: 3px; cursor: pointer;';
        volBar.addEventListener('input', (e) => {
          e.stopPropagation();
          video.volume = Number((e.target as HTMLInputElement).value) / 100;
          if (video.volume > 0) video.muted = false;
        });

        controlBar.appendChild(playPauseBtn);
        controlBar.appendChild(muteBtn);
        controlBar.appendChild(volBar);
        inner.appendChild(controlBar);
        container.appendChild(inner);

        inner.addEventListener('mouseenter', () => {
          if (video.style.display !== 'none') {
            controlBar.style.opacity = '1';
          }
        });
        inner.addEventListener('mouseleave', () => {
          controlBar.style.opacity = '0';
        });

        video.addEventListener('ended', async () => {
          const action = (currentScene as any).avatarPostPlaybackAction || 'DO_NOTHING';
          if (action === 'JUMP_TO_SCENE' && (currentScene as any).avatarPostPlaybackTargetSceneId) {
            const target = scenesRef.current.find((s) => s.id === (currentScene as any).avatarPostPlaybackTargetSceneId);
            if (target) changeSceneRef.current(target);
          } else if (action === 'OPEN_PDF' && (currentScene as any).avatarPostPlaybackTargetAssetUrl) {
            setShowMedia({
              type: 'PDF',
              url: (currentScene as any).avatarPostPlaybackTargetAssetUrl,
              label: `${sceneDefaultAvatar.name}'s Document`,
            });
          } else if (action === 'OPEN_URL' && (currentScene as any).avatarPostPlaybackTargetUrl) {
            window.open((currentScene as any).avatarPostPlaybackTargetUrl, '_blank');
          } else if (action === 'PLAY_NEXT_AVATAR' && (currentScene as any).avatarPostPlaybackTargetNextAvatarId) {
            try {
              // @ts-ignore
              const av = await apiClient.get<any>(`/avatars/${(currentScene as any).avatarPostPlaybackTargetNextAvatarId}`);
              if (av && av.optimizedUrl) {
                video.src = av.optimizedUrl;
                video.play().catch((err) => console.log(err));
              }
            } catch (err) {
              console.error('Failed to load next avatar:', err);
            }
          }
        });

        psvMarkers.push({
          id: `default-scene-avatar-${sceneDefaultAvatar.id}`,
          position: { yaw, pitch },
          elementLayer: container,
          anchor: 'bottom center',
          tooltip: {
            content: sceneDefaultAvatar.name,
            position: 'top center',
          }
        });

        if (pbMode === 'AUTO_PLAY') {
          setTimeout(() => {
            video.play().catch((err) => console.log('Autoplay failed:', err));
          }, 100);
        }
      }

      markersPlugin.setMarkers(psvMarkers);

      markersPlugin.addEventListener('select-marker', (e: any) => {
        const marker = e.marker;
        const hs = currentScene.hotspots.find((h) => h.id === marker.id);
        if (hs) {
          handleHotspotRef.current(hs);
        }
      });

      if (destroyed) {
        try { viewer.destroy(); } catch {}
        return;
      }
      psvRef.current = viewer;
    })();

    return () => {
      destroyed = true;
      if (psvRef.current) { try { psvRef.current.destroy(); } catch { } psvRef.current = null; }
    };
  }, [currentScene]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Guided tour logic – uses refs for currentScene/changeScene to avoid
  // re-triggering when scene loads (which would cancel the psv-guided-ready listener)
  useEffect(() => {
    if (!guided || guidedPaused || !guidedTour.length) return;
    const step = guidedTour[guidedStep];
    if (!step) return;

    // Close any open info/media popups when step changes
    setShowInfo(null);
    setShowMedia(null);

    // Stop currently active guided audio narration
    if (guidedAudioRef.current) {
      try {
        guidedAudioRef.current.pause();
      } catch (e) {
        console.error('Failed to pause audio:', e);
      }
      guidedAudioRef.current = null;
    }

    let animTimeout: any;
    let readyHandler: (() => void) | null = null;

    // Common function to start autorotation + audio on a ready viewer
    const startStepPlayback = (psv: any, scene: any) => {
      // Stop any existing autorotation first
      try {
        const autorotate = psv.getPlugin('autorotate') as any;
        if (autorotate) autorotate.stop();
      } catch (e) {
        console.error('Failed to stop autorotate:', e);
      }

      // Lock user interactions
      try {
        psv.setOption('mousewheel', false);
        psv.setOption('mousemove', false);
      } catch (e) {
        console.error('Failed to lock controls:', e);
      }

      // Hide navigation hotspots
      try {
        const mp = psv.getPlugin('markers') as any;
        if (mp && scene) {
          scene.hotspots.forEach((hs: any) => {
            if (hs.type === 'SCENE_LINK') {
              try { mp.hideMarker(hs.id); } catch { }
            }
          });
        }
      } catch { }

      // Play audio for this step
      if (step.audioUrl) {
        const audio = new Audio(step.audioUrl);
        guidedAudioRef.current = audio;
        audio.play().catch((err) => console.warn('Audio play error:', err));
      }

      try {
        const startYaw = step.targetYaw ?? scene?.defaultYaw ?? 0;
        const startPitch = step.targetPitch ?? scene?.defaultPitch ?? 0;
        const startZoom = step.targetZoom ?? scene?.defaultZoom ?? 50;

        // Instantly orient camera to starting position
        psv.rotate({ yaw: startYaw, pitch: startPitch });
        if (startZoom !== undefined) {
          try { psv.zoom(startZoom); } catch { }
        }

        // Start autorotation after a brief delay for the camera to settle
        animTimeout = setTimeout(() => {
          if (!psvRef.current) return;
          try {
            const autorotate = psvRef.current.getPlugin('autorotate') as any;
            if (autorotate) {
              // Use configurable speed from admin UI (default 2.0 RPM)
              const speedRpm = step.rotationSpeed ?? 2.0;
              autorotate.setOptions({
                autorotateSpeed: `${speedRpm}rpm`,
                autorotatePitch: startPitch,
              });
              autorotate.start();
            }
          } catch (e) {
            console.error('Failed to start autorotate:', e);
          }
        }, 100);
      } catch (e) {
        console.error('Animation/Rotation failed:', e);
      }
    };

    // Read latest scene/changeScene from refs (NOT from closure/deps)
    const curScene = currentSceneRef.current;
    const doChangeScene = changeSceneRef.current;
    const targetScene = scenes.find((s) => s.id === step.sceneId);

    if (targetScene && targetScene.id !== curScene?.id) {
      // Different scene: change scene and wait for the new viewer's 'ready' event
      // via custom event dispatched from viewer creation useEffect
      readyHandler = () => {
        if (psvRef.current) {
          startStepPlayback(psvRef.current, targetScene);
        }
      };
      window.addEventListener('psv-guided-ready', readyHandler, { once: true });
      doChangeScene(targetScene);
    } else {
      // Same scene: viewer already exists, start playback immediately
      if (psvRef.current) {
        startStepPlayback(psvRef.current, curScene);
      }
    }

    guidedTimerRef.current = setTimeout(() => {
      if (guidedStep < guidedTour.length - 1) setGuidedStep(s => s + 1);
      else { setGuided(false); toast('Guided tour complete!'); }
    }, step.duration * 1000);

    return () => {
      if (guidedTimerRef.current) clearTimeout(guidedTimerRef.current);
      if (animTimeout) clearTimeout(animTimeout);
      if (readyHandler) {
        window.removeEventListener('psv-guided-ready', readyHandler);
      }
      if (guidedAudioRef.current) {
        try {
          guidedAudioRef.current.pause();
        } catch {}
        guidedAudioRef.current = null;
      }
      if (psvRef.current) {
        try {
          const autorotate = psvRef.current.getPlugin('autorotate') as any;
          if (autorotate) {
            autorotate.stop();
            // If exiting guided tour, restore branding auto-rotation settings
            if (!guidedRef.current) {
              autorotate.setOptions({
                autorotateSpeed: (branding?.autoRotate && branding.autoRotateSpeed)
                  ? `${branding.autoRotateSpeed}rpm`
                  : '1.5rpm',
                autorotatePitch: null,
              });
              if (branding?.autoRotate) {
                autorotate.start();
              }
            }
          }
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guided, guidedStep, guidedPaused, scenes]);

  // Load scene default avatar on scene entry
  useEffect(() => {
    if (!currentScene) return;

    // Reset current active spokesperson avatar
    setActiveAvatar(null);
    setIsAvatarPlaying(false);

    const defAvatar = (currentScene as any).defaultAvatar;
    if (defAvatar && (currentScene as any).defaultAvatarId) {
      const config = {
        id: defAvatar.id,
        name: defAvatar.name,
        optimizedUrl: defAvatar.optimizedUrl,
        // Scene avatarScale overrides the avatar's own scale, then fall back to avatar.scale
        scale: (currentScene as any).avatarScale ?? defAvatar.scale ?? 1.0,
        playbackMode: (currentScene as any).avatarPlaybackMode || 'CLICK_TO_PLAY',
        position: (currentScene as any).avatarPosition || 'BOTTOM_LEFT',
        volume: (currentScene as any).avatarVolume ?? 80,
        muted: (currentScene as any).avatarMuted ?? false,
        replay: (currentScene as any).avatarReplay ?? false,
        postPlaybackAction: (currentScene as any).avatarPostPlaybackAction || 'DO_NOTHING',
        postPlaybackTargetSceneId: (currentScene as any).avatarPostPlaybackTargetSceneId,
        postPlaybackTargetAssetUrl: (currentScene as any).avatarPostPlaybackTargetAssetUrl,
        postPlaybackTargetUrl: (currentScene as any).avatarPostPlaybackTargetUrl,
        postPlaybackTargetNextAvatarId: (currentScene as any).avatarPostPlaybackTargetNextAvatarId,
        customPositionX: (currentScene as any).avatarCustomPositionX ?? 0,
        customPositionY: (currentScene as any).avatarCustomPositionY ?? 0,
      };

      setActiveAvatar(config);
      setIsAvatarMuted(config.muted);
      setAvatarVolume(config.volume);
      setAvatarHidden(false);

      if (config.playbackMode === 'AUTO_PLAY') {
        setIsAvatarPlaying(true);
      }
    }
  }, [currentScene]);

  // Handle transparent avatar post-playback actions routing
  const handleAvatarEnded = useCallback(() => {
    if (!activeAvatar) return;
    if (activeAvatar.replay) return; // Managed by <video loop>

    setIsAvatarPlaying(false);

    const action = activeAvatar.postPlaybackAction;
    switch (action) {
      case 'JUMP_TO_SCENE': {
        if (activeAvatar.postPlaybackTargetSceneId) {
          const target = scenes.find(s => s.id === activeAvatar.postPlaybackTargetSceneId);
          if (target) {
            changeScene(target);
            toast.success(`Jumping to: ${target.title}`);
          }
        }
        break;
      }
      case 'OPEN_PDF': {
        if (activeAvatar.postPlaybackTargetAssetUrl) {
          setShowMedia({
            type: 'PDF',
            url: activeAvatar.postPlaybackTargetAssetUrl,
            label: `${activeAvatar.name}'s PDF Document`
          });
        }
        break;
      }
      case 'OPEN_URL': {
        if (activeAvatar.postPlaybackTargetUrl) {
          window.open(activeAvatar.postPlaybackTargetUrl, '_blank');
        }
        break;
      }
      case 'PLAY_NEXT_AVATAR': {
        if (activeAvatar.postPlaybackTargetNextAvatarId) {
          // Fetch the details of the next avatar
          apiClient.get<any>(`/avatars/${activeAvatar.postPlaybackTargetNextAvatarId}`)
            .then((av) => {
              if (av) {
                const config = {
                  id: av.id,
                  name: av.name,
                  optimizedUrl: av.optimizedUrl,
                  scale: av.scale ?? 1.0,
                  playbackMode: 'AUTO_PLAY', // Play immediately
                  position: activeAvatar.position, // Keep current layout location
                  volume: activeAvatar.volume,
                  muted: activeAvatar.muted,
                  replay: av.replay ?? false,
                  postPlaybackAction: 'DO_NOTHING',
                  postPlaybackTargetSceneId: null,
                  postPlaybackTargetAssetUrl: null,
                  postPlaybackTargetUrl: null,
                  postPlaybackTargetNextAvatarId: null,
                  customPositionX: activeAvatar.customPositionX,
                  customPositionY: activeAvatar.customPositionY,
                };
                setActiveAvatar(config);
                setIsAvatarPlaying(true);
              }
            })
            .catch(() => {});
        }
        break;
      }
    }
  }, [activeAvatar, scenes, changeScene]);

  const handleHotspot = useCallback((hs: any) => {
    switch (hs.type) {
      case 'SCENE_LINK': {
        const target = scenes.find((s) => s.id === hs.targetSceneId);
        if (target) changeScene(target, hs);
        break;
      }
      case 'INFO_POPUP': setShowInfo({ label: hs.label, description: hs.description || '' }); break;
      case 'CONTACT_FORM': setShowContact(true); break;
      case 'EXTERNAL_URL': if (hs.targetUrl) window.open(hs.targetUrl, '_blank'); break;
      case 'PDF': case 'IMAGE': {
        const mediaUrl = hs.targetAssetUrl || hs.targetUrl;
        if (mediaUrl) {
          setShowMedia({ type: hs.type, url: mediaUrl, label: hs.label });
        } else {
          toast.error(`No ${hs.type.toLowerCase()} file or URL is configured for this hotspot`);
        }
        break;
      }
      case 'VIDEO': {
        const isInline = hs.style?.playMode === 'INLINE';
        if (isInline) {
          const videoEl = document.getElementById(`video-inline-${hs.id}`) as HTMLVideoElement | null;
          if (videoEl) {
            videoEl.muted = !videoEl.muted;
            toast(videoEl.muted ? 'Video Muted' : 'Video Unmuted', {
              icon: videoEl.muted ? '🔇' : '🔊',
              duration: 1500,
            });
          }
        } else {
          const mediaUrl = hs.targetAssetUrl || hs.targetUrl;
          if (mediaUrl) {
            setShowMedia({ type: 'VIDEO', url: mediaUrl, label: hs.label });
          } else {
            toast.error('No video file or URL is configured for this hotspot');
          }
        }
        break;
      }
      case 'AVATAR': {
        // The AVATAR hotspot already has its own in-scene PSV marker with
        // embedded video, play button, and controls. Don't create a SECOND
        // static overlay widget — just hide the existing scene default avatar
        // overlay (if any) to avoid dual playback.
        if (activeAvatar) {
          setAvatarHidden(true);
          setIsAvatarPlaying(false);
        }
        break;
      }
    }
  }, [scenes, changeScene, activeAvatar]);

  const handleHotspotRef = useRef(handleHotspot);
  useEffect(() => {
    handleHotspotRef.current = handleHotspot;
  }, [handleHotspot]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/leads', { projectId: project.id, ...contactForm, source: `scene:${currentScene?.title}` });
      toast.success('Message sent! We will be in touch shortly.');
      setShowContact(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch { toast.error('Failed to send message'); } finally { setSubmitting(false); }
  };

  const getAvatarPositionStyles = (av: any) => {
    const pos = av.position || 'BOTTOM_LEFT';
    switch (pos) {
      case 'BOTTOM_LEFT':
        return { bottom: '0px', left: '16px', right: 'auto', top: 'auto', transform: 'none' };
      case 'BOTTOM_RIGHT':
        return { bottom: '0px', right: '16px', left: 'auto', top: 'auto', transform: 'none' };
      case 'CENTER':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bottom: 'auto', right: 'auto' };
      case 'CUSTOM':
        return { bottom: `${av.customPositionY ?? 0}%`, left: `${av.customPositionX ?? 0}%`, right: 'auto', top: 'auto', transform: 'none' };
      default:
        return { bottom: '0px', left: '16px', right: 'auto', top: 'auto', transform: 'none' };
    }
  };

  const logoSizeMap = { small: 'h-8', medium: 'h-12', large: 'h-16' };
  const logoSize = logoSizeMap[(branding?.logoSize as keyof typeof logoSizeMap) ?? 'medium'];

  return (
    <div ref={rootRef} className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Welcome Screen / Preloader Overlay */}
      {(showWelcome || isPreloading) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center transition-all duration-700"
          style={{ 
            background: `linear-gradient(135deg, ${branding?.backgroundColor ?? '#0f0f17'}ee, ${primary}22)`,
            opacity: (!isPreloading && (!showWelcome || userClickedEnter)) ? 0 : 1,
            pointerEvents: (!isPreloading && (!showWelcome || userClickedEnter)) ? 'none' : 'auto'
          }}>
          {branding?.coverUrl && (
            <img src={branding.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}

          {/* Glowing Radial Ambient Light */}
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${primary} 0%, transparent 70%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Welcome Screen Card */}
          {showWelcome && !userClickedEnter ? (
            <div className="relative z-10 text-center max-w-lg px-8 animate-slide-up">
              {branding?.logoUrl && (
                <img src={branding.logoUrl} alt="logo" className={`mx-auto mb-6 ${logoSize} object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]`} />
              )}
              <h1 className="text-4xl font-bold text-white mb-3 tracking-wide drop-shadow-md">{branding?.welcomeTitle || project.name}</h1>
              {(branding?.welcomeMessage || project.description) && (
                <p className="text-white/70 text-base mb-8 leading-relaxed font-normal">{branding?.welcomeMessage || project.description}</p>
              )}
              <button 
                onClick={() => {
                  setUserClickedEnter(true);
                  try {
                    logout(false);
                  } catch (e) {}
                  if (!isPreloading) {
                    setShowWelcome(false);
                  }
                }} 
                className="px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-all hover:scale-105 hover:shadow-lg active:scale-95 shadow-md flex items-center gap-2 mx-auto"
                style={{ 
                  background: primary,
                  boxShadow: `0 8px 24px ${primary}44`
                }}
              >
                Enter Tour
                <Play className="w-4 h-4 fill-white text-white" />
              </button>
            </div>
          ) : (
            /* Glassmorphism Preloader Panel */
            <div className="relative z-10 w-full max-w-md mx-4 p-8 rounded-3xl border border-white/10 glass-dark shadow-2xl backdrop-blur-2xl text-center animate-scale-in">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt="logo" className={`mx-auto mb-8 ${logoSize} object-contain animate-pulse`} />
              ) : (
                <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce">
                  <Globe className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">Preparing Virtual Tour</h2>
              <p className="text-xs text-white/40 mb-6 uppercase tracking-wider font-semibold">Preloading high-fidelity assets</p>
              
              {/* Progress Bar Container */}
              <div className="relative w-full h-2.5 bg-white/5 rounded-full overflow-hidden mb-4 border border-white/5">
                <div 
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${preloadProgress}%`, 
                    background: `linear-gradient(90deg, ${primary}, ${branding?.secondaryColor || '#818cf8'})`,
                    boxShadow: `0 0 12px ${primary}`
                  }}
                />
              </div>

              {/* Progress Info */}
              <div className="flex justify-between items-center text-xs text-white/50 mb-6 px-1">
                <span className="font-semibold text-white/70 truncate max-w-[250px]">{preloadLabel}</span>
                <span className="font-mono text-white/80 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">{preloadProgress}%</span>
              </div>

              {/* Visual Pulsing Circle loader */}
              <div className="flex justify-center items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panorama Viewer with transition zoom/blur styles */}
      <div className="relative w-full h-full overflow-hidden">
        <div 
          ref={viewerRef} 
          className="w-full h-full" 
          style={{
            transform: transitionState.isActive 
              ? 'scale(1.15)' 
              : 'scale(1)',
            opacity: transitionState.isActive ? 0 : 1,
            filter: transitionState.isActive ? 'blur(3px)' : 'none',
            transition: 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
        />

        {/* Matterport-like Blur Transition Overlay */}
        {transitionState.thumbnailUrl && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              opacity: transitionState.isActive ? 1 : 0,
              background: '#000000',
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            {/* Stretched blurred thumbnail */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url('${transitionState.thumbnailUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(8px) brightness(0.65)',
                transform: transitionState.isActive 
                  ? 'scale(1.05)' 
                  : 'scale(1.25)',
                transition: 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)',
              }}
            />
          </div>
        )}
      </div>

      {/* Logo overlay */}
      {!showWelcome && branding?.logoUrl && (
        <div className={`absolute z-20 ${
          branding.logoPosition === 'top-left' ? 'top-4 left-4' :
          branding.logoPosition === 'top-right' ? 'top-4 right-4' :
          branding.logoPosition === 'top-center' ? 'top-4 left-1/2 -translate-x-1/2' :
          branding.logoPosition === 'bottom-left' ? 'bottom-20 left-4' :
          'bottom-20 right-4'
        }`}>
          {branding.websiteUrl ? (
            <a href={branding.websiteUrl} target="_blank" rel="noopener noreferrer" className="block hover:scale-105 active:scale-95 transition-all">
              <img src={branding.logoUrl} alt="logo" className={`${logoSize} object-contain drop-shadow-lg`} />
            </a>
          ) : (
            <img src={branding.logoUrl} alt="logo" className={`${logoSize} object-contain drop-shadow-lg`} />
          )}
        </div>
      )}

      {/* Guided Tour Overlay */}
      {guided && guidedTour[guidedStep] && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4">
          {guidedMinimized ? (
            <button 
              onClick={() => setGuidedMinimized(false)}
              className="mx-auto flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 text-xs text-white font-semibold"
              style={{ 
                background: 'rgba(15, 23, 42, 0.75)',
                boxShadow: `0 4px 14px ${primary}33`
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Show Narration
            </button>
          ) : (
            <div className="glass-dark rounded-2xl p-5 border border-white/10 shadow-2xl backdrop-blur-xl animate-slide-up">
              {/* Progress bar */}
              <div className="flex gap-1.5 mb-4">
                {guidedTour.map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === guidedStep ? 'scale-y-125' : ''}`}
                    style={{ background: i <= guidedStep ? primary : 'rgba(255, 255, 255, 0.15)' }} />
                ))}
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">Guided Tour</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                    Step {guidedStep + 1} of {guidedTour.length}
                  </span>
                  <button
                    onClick={() => setGuidedMinimized(true)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
                    title="Hide narration panel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </button>
                </div>
              </div>

              {guidedTour[guidedStep].narrationTitle && (
                <h3 className="font-bold text-white text-base mb-1.5 tracking-wide drop-shadow-sm">{guidedTour[guidedStep].narrationTitle}</h3>
              )}
              {guidedTour[guidedStep].narrationText && (
                <p className="text-sm text-white/80 leading-relaxed font-normal">{guidedTour[guidedStep].narrationText}</p>
              )}
              {guidedTour[guidedStep].audioUrl && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/10 mt-3 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </svg>
                  <span>Audio narration playing...</span>
                </div>
              )}
              
              <div className="flex items-center justify-end mt-5 pt-3 border-t border-white/5">
                <button 
                  onClick={() => setGuided(false)} 
                  className="w-full text-center py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-all text-sm font-semibold hover:scale-[1.02] active:scale-[0.98]"
                >
                  Exit Tour
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spokesperson Avatar Widget */}
      {activeAvatar && !avatarHidden && activeAvatar.optimizedUrl && ['BOTTOM_LEFT', 'BOTTOM_RIGHT'].includes(activeAvatar.position) && (
        <div 
          className="absolute z-30 flex flex-col items-center group pointer-events-none"
          style={{
            ...getAvatarPositionStyles(activeAvatar),
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))',
            transform: `scale(${activeAvatar.scale ?? 1.0})`,
            transformOrigin: activeAvatar.position === 'BOTTOM_LEFT' ? 'bottom left' : 'bottom right',
            transition: 'transform 0.2s ease-out, bottom 0.4s, left 0.4s, right 0.4s'
          }}
        >
          {/* Main Display container */}
          <div className="relative pointer-events-auto">
            {/* Click to play profile circle bubble */}
            {!isAvatarPlaying && activeAvatar.playbackMode === 'CLICK_TO_PLAY' ? (
              <button 
                onClick={() => setIsAvatarPlaying(true)}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center relative overflow-hidden group hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
              >
                {/* Pulse wave ring */}
                <span className="absolute inset-0 rounded-full border border-indigo-400 animate-ping opacity-75" />
                <span className="absolute inset-2 rounded-full border border-indigo-500/50 animate-pulse" />
                
                {/* Standard profile/video avatar icon */}
                <div className="flex flex-col items-center justify-center text-center text-[10px] font-bold text-white z-10">
                  <User className="w-6 h-6 text-indigo-400 mb-1 animate-bounce" />
                  <span className="max-w-[70px] truncate">{activeAvatar.name}</span>
                </div>
              </button>
            ) : (
              /* The actual spokesperson transparent video playback */
              <div 
                className="relative flex items-center justify-center overflow-hidden"
                style={{
                  width: '320px',
                  height: '320px'
                }}
              >
                <video
                  ref={(el) => {
                    if (el) {
                      el.volume = avatarVolume / 100;
                      el.muted = isAvatarMuted;
                    }
                  }}
                  src={getMediaUrl(activeAvatar.optimizedUrl)}
                  autoPlay={isAvatarPlaying}
                  loop={activeAvatar.replay}
                  playsInline
                  webkit-playsinline="true"
                  className="max-w-full max-h-full object-contain"
                  style={{ objectPosition: activeAvatar.position === 'BOTTOM_LEFT' ? 'bottom left' : 'bottom right' }}
                  onEnded={handleAvatarEnded}
                  onPlay={() => setIsAvatarPlaying(true)}
                  onPause={() => setIsAvatarPlaying(false)}
                />

                {/* Floating control bar visible on hover */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-2xl">
                  {/* Play/Pause */}
                  <button 
                    onClick={() => setIsAvatarPlaying(!isAvatarPlaying)} 
                    className="p-1 rounded hover:bg-white/10 text-white transition-colors"
                  >
                    {isAvatarPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  </button>

                  {/* Mute toggle */}
                  <button 
                    onClick={() => setIsAvatarMuted(!isAvatarMuted)} 
                    className="p-1 rounded hover:bg-white/10 text-white transition-colors"
                  >
                    {isAvatarMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-red-400">
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <path d="M9 9v6a3 3 0 0 0 3 3h3.586l4.707 4.707A1 1 0 0 0 22 22V2A1 1 0 0 0 20.293 1.293L15.586 6H12a3 3 0 0 0-3 3z"/>
                      </svg>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="h-3 w-px bg-white/15" />

                  {/* Volume Slider */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isAvatarMuted ? 0 : avatarVolume}
                    onChange={(e) => {
                      setAvatarVolume(Number(e.target.value));
                      setIsAvatarMuted(false);
                    }}
                    className="w-14 accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />

                  <div className="h-3 w-px bg-white/15" />

                  {/* Close / Dismiss */}
                  <button 
                    onClick={() => setAvatarHidden(true)} 
                    className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Dismiss spokesperson"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scene Menu */}
      {!showWelcome && branding?.showSceneMenu !== false && !guided && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
          {scenes.slice(0, 8).map((scene) => (
            <button key={scene.id} onClick={() => changeScene(scene)}
              className={`flex flex-col items-center gap-1 transition-all hover:scale-105 ${scene.id === currentScene?.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
              <div className={`w-12 h-9 rounded-lg overflow-hidden border-2 ${scene.id === currentScene?.id ? '' : 'border-transparent'}`}
                style={{ borderColor: scene.id === currentScene?.id ? primary : 'transparent' }}>
                <div className="w-full h-full bg-indigo-900/60 flex items-center justify-center text-xs text-white/50">
                  {scene.order + 1}
                </div>
              </div>
              <p className="text-[9px] text-white/50 max-w-[48px] truncate">{scene.title}</p>
            </button>
          ))}

          {project.guidedTourEnabled && guidedTour.length > 0 && (
            <>
              <button 
                id="trigger-guided-start"
                onClick={() => {
                  initialSceneRef.current = currentScene;
                  if (psvRef.current) {
                    try {
                      const autorotate = psvRef.current.getPlugin('autorotate');
                      if (autorotate) autorotate.stop();
                    } catch (e) {
                      console.error('Failed to stop autorotate:', e);
                    }
                  }
                  setGuided(true);
                  setGuidedStep(0);
                }}
                className="hidden"
              />
              <button
                id="trigger-guided-stop"
                onClick={() => setGuided(false)}
                className="hidden"
              />
            </>
          )}
        </div>
      )}

      {/* Info Popup Modal */}
      {showInfo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4" onClick={() => setShowInfo(null)}>
          <div className="glass-dark rounded-2xl p-6 max-w-sm w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white">{showInfo.label}</h3>
              <button onClick={() => setShowInfo(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-sm text-white/70">{showInfo.description}</p>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContact && (
        <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setShowContact(false)}>
          <div className="glass-dark rounded-2xl p-6 max-w-sm w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Get in Touch</h3>
              <button onClick={() => setShowContact(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            {branding?.contactEmail || branding?.contactPhone ? (
              <div className="flex flex-wrap gap-3 mb-4">
                {branding.contactEmail && (
                  <a href={`mailto:${branding.contactEmail}`} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                    <Mail className="w-3.5 h-3.5" />{branding.contactEmail}
                  </a>
                )}
                {branding.contactPhone && (
                  <a href={`tel:${branding.contactPhone}`} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                    <Phone className="w-3.5 h-3.5" />{branding.contactPhone}
                  </a>
                )}
              </div>
            ) : null}
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <input required placeholder="Your Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="input-dark text-sm py-2" />
              <input required type="email" placeholder="Email Address" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="input-dark text-sm py-2" />
              <input placeholder="Phone (optional)" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="input-dark text-sm py-2" />
              <textarea placeholder="Your message..." value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} rows={2} className="input-dark text-sm py-2 resize-none" />
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl text-white font-medium text-sm" style={{ background: primary }}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {showMedia && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowMedia(null)}>
          <div className="bg-[#1a1b2e]/90 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-4xl w-full backdrop-blur-xl animate-fade-in flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white tracking-wide">{showMedia.label}</h3>
              <button 
                onClick={() => setShowMedia(null)} 
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all hover:scale-105 active:scale-95 group"
              >
                <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 overflow-auto rounded-xl bg-black/40 border border-white/5 p-2 flex items-center justify-center">
              {showMedia.type === 'VIDEO' && (
                <video src={showMedia.url} controls className="max-w-full max-h-[60vh] rounded-lg shadow-lg" autoPlay />
              )}
              {showMedia.type === 'IMAGE' && (
                <img src={showMedia.url} alt={showMedia.label} className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain" />
              )}
              {showMedia.type === 'PDF' && (
                <div className="w-full flex flex-col items-center gap-3">
                  <iframe src={showMedia.url} className="w-full h-[55vh] rounded-lg border border-white/5 bg-black/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Can't see the document preview?</span>
                    <a
                      href={showMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open PDF in New Tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Admin Quick Entry / Lock Icon (Subtle Floating Button) */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={async () => {
            if (isAuthenticated) {
              // Re-verify token is still valid before navigating
              try {
                await apiClient.get('/auth/me');
                router.push('/builder');
              } catch {
                // Token expired or invalid — show login drawer
                toast.error('Session expired. Please log in again.');
                setShowAdminDrawer(true);
              }
            } else {
              setShowAdminDrawer(true);
            }
          }}
          className="w-9 h-9 rounded-xl bg-slate-900/40 hover:bg-slate-900/95 border border-white/5 hover:border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-lg hover:scale-105 active:scale-95 group"
          title="Admin Login"
        >
          <Lock className="w-4 h-4 transition-transform group-hover:rotate-12" />
        </button>
      </div>

      {/* Admin Login Drawer */}
      {showAdminDrawer && (
        <div 
          className="absolute inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" 
          onClick={() => setShowAdminDrawer(false)}
        >
          <div 
            className="w-full max-w-sm h-full bg-[#0f0f17]/95 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Admin Access</h3>
                    <p className="text-[10px] text-slate-400">Virtual Tour Builder</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAdminDrawer(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
                  <input
                    required
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={adminLoggingIn}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wide shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                >
                  {adminLoggingIn ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : 'Sign In as Admin'}
                </button>
              </form>
            </div>

            {/* Footer info */}
            <p className="text-[10px] text-center text-slate-500">
              Single-Project Builder Admin
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getHotspotEmoji(iconType: string, type: string): string {
  const map: Record<string, string> = {
    arrow: '➡️', info: 'ℹ️', play: '▶️', image: '🖼️', pdf: '📄', link: '🔗', contact: '📞', default: '📍', avatar: '👤',
    SCENE_LINK: '➡️', INFO_POPUP: 'ℹ️', VIDEO: '▶️', IMAGE: '🖼️', PDF: '📄', EXTERNAL_URL: '🔗', CONTACT_FORM: '📞', AVATAR: '👤',
  };
  return map[iconType] || map[type] || '📍';
}

function getHotspotSvg(type: string): string {
  const svgStyle = 'width: 20px; height: 20px; color: #ffffff; transition: color 0.25s;';
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
