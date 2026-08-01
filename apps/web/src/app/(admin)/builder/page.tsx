'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Palette, Map, Plus, Upload, Trash2, Edit2, Globe, Eye, Settings, Compass, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient, isStandaloneMode } from '@/lib/api-client';
import type { Project, Scene } from '@vt/shared';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function BuilderPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editMeta, setEditMeta] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        apiClient.get<Project>('/project'),
        apiClient.get<Scene[]>('/project/scenes'),
      ]);
      setProject(p);
      setName(p.name);
      setCompanyName(p.companyName || '');
      setDescription(p.description || '');
      setScenes(s);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await apiClient.put<Project>('/project', {
        name,
        companyName: companyName || null,
        description: description || null,
      });
      setProject(updated);
      setEditMeta(false);
      toast.success('Project details updated!');
    } catch {
      toast.error('Failed to update details');
    }
  };

  const handleSceneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('panorama', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    setUploading(true);
    try {
      await apiClient.upload<Scene>('/project/scenes', formData);
      toast.success('Panorama uploaded!');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteScene = async (sceneId: string, title: string) => {
    if (!confirm(`Delete scene "${title}"?`)) return;
    try {
      await apiClient.delete(`/scenes/${sceneId}`);
      toast.success('Scene deleted');
      setScenes(scenes.filter((s) => s.id !== sceneId));
    } catch {
      toast.error('Failed to delete scene');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading('Generating offline virtual tour package...');
    try {
      if (isStandaloneMode()) {
        const { getTourExportPackage } = await import('@/lib/standalone-db');
        const JSZip = (await import('jszip')).default;
        
        const pkg = await getTourExportPackage();
        const zip = new JSZip();
        
        // Add tour-data.json
        zip.file('tour-data.json', pkg.json);
        
        // Add uploaded assets (panoramas, logos, etc.)
        const uploadsFolder = zip.folder('uploads');
        if (uploadsFolder) {
          for (const asset of pkg.assets) {
            uploadsFolder.file(asset.name, asset.blob);
          }
        }
        
        const content = await zip.generateAsync({ type: 'blob' });
        const downloadUrl = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'tour-git-deploy.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        toast.success('Git deploy package exported successfully!', { id: toastId });
        
        toast.success('Offline tour exported! Signing out to secure your session...');
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 1500);
        return;
      }

      const res = await apiClient.post<{ success: boolean; downloadUrl: string }>('/export');
      toast.success('Tour package exported successfully!', { id: toastId });
      
      // Auto-trigger download
      const downloadLink = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}${res.downloadUrl}`;
      window.open(downloadLink, '_blank');

      // Automatically sign out after publishing/exporting to secure the session
      toast.success('Offline tour exported! Signing out to secure your session...');
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate export package', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        {/* Info */}
        <div className="flex-1">
          {editMeta ? (
            <form onSubmit={handleUpdateMeta} className="space-y-4 max-w-xl bg-slate-900/50 p-6 rounded-2xl border border-white/5">
              <div>
                <label className="label">Tour Title</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Company / Brand Name</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input" placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="input resize-none" placeholder="Provide a brief summary..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary py-2 text-xs">Save Changes</button>
                <button type="button" onClick={() => setEditMeta(false)} className="btn-secondary py-2 text-xs">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="group relative">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="page-title">{project.name}</h2>
                <button onClick={() => setEditMeta(true)} className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {project.companyName && <p className="text-slate-400 text-sm font-medium">{project.companyName}</p>}
              {project.description && <p className="text-slate-500 text-sm mt-1 max-w-3xl leading-relaxed">{project.description}</p>}
            </div>
          )}
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href="/" target="_blank" className="btn-secondary gap-2 text-sm">
            <Eye className="w-4 h-4" /> Preview Live
          </a>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary gap-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
          >
            {exporting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Exporting...</>
            ) : (
              <><Download className="w-4 h-4" /> Export Tour Zip</>
            )}
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit border border-white/5">
        {[
          { label: 'Scenes & Hotspots', icon: Map, href: '/builder' },
          { label: 'Branding Layout', icon: Palette, href: '/builder/branding' },
          { label: 'Guided Tour Sequence', icon: Compass, href: '/builder/guided-tour' },
        ].map((tab) => (
          <Link 
            key={tab.href} 
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
              tab.href === '/builder' 
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' 
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Scenes Title Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">Tour Scenes</h3>
          <p className="text-xs text-slate-500 mt-0.5">Define panoramic spots & link them using hotspots</p>
        </div>
        <label className={`btn-primary btn-sm gap-1.5 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
          ) : (
            <><Upload className="w-3.5 h-3.5" /> Add Panorama Scene</>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleSceneUpload} disabled={uploading} />
        </label>
      </div>

      {scenes.length === 0 ? (
        <div className="card border-dashed border-white/5 bg-[#121324]/40 py-20 text-center rounded-2xl">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Upload className="w-5 h-5 text-slate-500 animate-bounce" />
          </div>
          <p className="text-slate-300 font-semibold text-sm">No scenes uploaded yet</p>
          <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">Upload your first 360° panorama image (.jpg or .png) to populate this virtual tour builder.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scenes.map((scene) => (
            <div key={scene.id} className="card group relative p-0 overflow-hidden hover:border-indigo-500/40 transition-all duration-300 bg-[#161726] border border-white/5 rounded-2xl flex flex-col justify-between">
              {/* Panorama Thumbnail Preview */}
              <div className="h-44 bg-gradient-to-br from-[#1b1c30] to-[#121320] relative overflow-hidden">
                {(scene as any).thumbnailUrl ? (
                  <img
                    src={(scene as any).thumbnailUrl}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : null}
                {scene.isStartScene && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="badge-blue text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-md shadow-indigo-600/10">Start Scene</span>
                  </div>
                )}
              </div>

              {/* Info panel */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{scene.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">Scene {scene.order + 1}</p>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/builder/scenes/${scene.id}`} className="btn-icon p-2 bg-slate-900 border border-white/5 hover:border-white/20 rounded-xl">
                    <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-white transition-colors" />
                  </Link>
                  <button onClick={() => handleDeleteScene(scene.id, scene.title)} className="btn-icon p-2 bg-slate-900 border border-white/5 hover:border-red-500/20 rounded-xl">
                    <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
