'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, ShieldAlert, Play, ArrowRight, Shield } from 'lucide-react';
import { TourViewer } from './tour/[slug]/TourViewer';
import { getViewerDataForClient, resolveUrl } from '@/lib/standalone-db';
import { useAuth } from '@/providers/AuthProvider';
import { isStandaloneMode } from '@/lib/api-client';

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const { isAuthenticated } = useAuth();

  // Preloading states
  const [preloading, setPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [currentLoadingItem, setCurrentLoadingItem] = useState('');

  useEffect(() => {
    async function loadTour() {
      try {
        // Try to fetch backend or local fallback
        const tourData = await getViewerDataForClient();
        setData(tourData);
        setStandalone(isStandaloneMode());
      } catch (err) {
        console.error('Failed to load tour data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTour();
  }, []);

  // Listen for standalone activation event from api-client
  useEffect(() => {
    const handleStandalone = () => {
      setStandalone(true);
    };
    window.addEventListener('standalone-mode-activated', handleStandalone);
    return () => {
      window.removeEventListener('standalone-mode-activated', handleStandalone);
    };
  }, []);

  const startPreloading = async () => {
    if (!data || !data.scenes || data.scenes.length === 0) return;
    
    setPreloading(true);
    setPreloadProgress(0);
    
    const scenesToLoad = data.scenes;
    const totalItems = scenesToLoad.length;
    let loadedCount = 0;

    const updateProgress = (itemTitle: string) => {
      loadedCount++;
      const percent = Math.round((loadedCount / totalItems) * 100);
      setPreloadProgress(percent);
      setCurrentLoadingItem(`Loaded "${itemTitle}"`);
    };

    try {
      await Promise.all(
        scenesToLoad.map(async (scene: any) => {
          try {
            setCurrentLoadingItem(`Loading "${scene.title}"...`);
            const resolvedUrl = await resolveUrl(scene.panoramaUrl);
            
            await new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                updateProgress(scene.title);
                resolve();
              };
              img.onerror = () => {
                console.error(`Failed to preload panorama for scene: ${scene.title}`);
                updateProgress(scene.title); // Count it anyway so we don't hang
                resolve();
              };
              img.src = resolvedUrl;
            });
          } catch (e) {
            console.error(e);
            updateProgress(scene.title);
          }
        })
      );
    } catch (err) {
      console.error('Error preloading assets:', err);
    }

    // Give a tiny delay for visual polish (e.g. show 100% briefly)
    setTimeout(() => {
      setPreloading(false);
      setStarted(true);
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c16] flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Loading virtual tour...</p>
        </div>
      </div>
    );
  }

  // Preloading progress page
  if (preloading) {
    const startScene = data?.scenes?.find((s: any) => s.isStartScene) || data?.scenes?.[0];
    const bgImage = startScene?.panoramaUrl || '';
    
    return (
      <div className="min-h-screen bg-[#07080e] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Backdrop (Blurred) */}
        {bgImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-110 blur-xl opacity-20"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080e] via-[#07080e]/95 to-[#07080e]/85" />

        <div className="max-w-md w-full text-center relative z-10 p-8 rounded-3xl bg-[#0f111f]/60 border border-white/5 shadow-2xl backdrop-blur-xl">
          <Compass className="w-10 h-10 animate-spin text-indigo-400 mx-auto mb-6" style={{ animationDuration: '6s' }} />
          
          <h2 className="text-xl font-bold text-white mb-2">Preparing Virtual Experience</h2>
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">Please wait while we preload high-resolution 360° graphics</p>
          
          {/* Progress bar container */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mb-4 p-0.5 border border-white/5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300"
              style={{ width: `${preloadProgress}%` }}
            />
          </div>
          
          {/* Stats info */}
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-slate-400 animate-pulse">{currentLoadingItem || 'Initializing...'}</span>
            <span className="text-indigo-400 text-sm font-extrabold">{preloadProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  // If the user has started the tour, load the full immersive 360 Viewer
  if (started && data && data.scenes && data.scenes.length > 0) {
    return <TourViewer data={data} />;
  }

  // Get branding variables
  const primaryColor = data?.branding?.primaryColor || '#6366f1';
  const startScene = data?.scenes?.find((s: any) => s.isStartScene) || data?.scenes?.[0];
  const bgImage = startScene?.panoramaUrl || '';

  return (
    <div className="min-h-screen bg-[#07080e] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* 360 Panorama Backdrop (Blurred) */}
      {bgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-110 blur-xl opacity-40"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      
      {/* Dark Overlay Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080e] via-[#07080e]/80 to-[#07080e]/60" />

      {/* Standalone Status Badge */}
      {standalone && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Demo Mode (Offline)</span>
        </div>
      )}

      {/* Top Right Login/Dashboard Trigger */}
      <div className="absolute top-4 right-4 z-20">
        {isAuthenticated ? (
          <Link
            href="/builder"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl text-xs font-semibold text-indigo-400 transition-all shadow-lg shadow-indigo-600/5"
          >
            <Shield className="w-3.5 h-3.5" />
            Go to Builder
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md"
          >
            Admin Login
          </Link>
        )}
      </div>

      {/* Main Landing Card */}
      <div className="max-w-xl w-full text-center relative z-10 p-8 rounded-3xl bg-[#0f111f]/60 border border-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl animate-slide-up">
        {/* Animated Compass Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-inner mb-6 text-indigo-400 relative group">
          <Compass className="w-9 h-9 animate-pulse transition-transform duration-700 group-hover:rotate-180" />
        </div>

        {/* Project Branding Names */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
          {data?.project?.name || '360° Virtual Tour'}
        </h1>
        
        {data?.project?.companyName && (
          <p className="text-indigo-400 font-semibold text-sm tracking-wide uppercase mb-4">
            Presented by {data.project.companyName}
          </p>
        )}

        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto mb-6" />

        {/* Welcome Text */}
        <p className="text-slate-300 text-sm md:text-base mb-8 leading-relaxed max-w-md mx-auto">
          {data?.branding?.welcomeMessage || 'Explore our properties, spaces, and scenes in an immersive, high-resolution 360° view. Click hotspots to discover items and navigate the tour.'}
        </p>

        {/* Main CTA: Start Tour Button */}
        {data?.scenes && data.scenes.length > 0 ? (
          <button
            onClick={startPreloading}
            style={{ backgroundColor: primaryColor }}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-white text-base font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Tour
          </button>
        ) : (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-left">
            <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide">No Scenes Found</h4>
              <p className="text-slate-400 text-xs mt-0.5">Please log in as an administrator to upload your first 360° panorama scene and configure this tour.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer copyright */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] uppercase tracking-widest text-center">
        Powered by 360° Virtual Tour Platform
      </p>
    </div>
  );
}
