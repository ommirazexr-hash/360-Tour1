'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import type { ProjectBranding } from '@vt/shared';

const logoPositions = ['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right'];
const logoSizes = ['small', 'medium', 'large'];

export default function BrandingPage() {
  const [branding, setBranding] = useState<Partial<ProjectBranding> & { logoUrl?: string | null; coverUrl?: string | null }>({
    primaryColor: '#6366f1', secondaryColor: '#818cf8', backgroundColor: '#0f0f17', textColor: '#ffffff',
    autoRotate: false, autoRotateSpeed: 2, showControls: true, showSceneMenu: true,
    logoPosition: 'top-left', logoSize: 'medium',
    contactEmail: '', contactPhone: '', websiteUrl: '',
    welcomeTitle: '', welcomeMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get<any>('/project/branding').then((data) => {
      setBranding(data);
    }).catch((err: any) => {
      console.error('Failed to load branding data:', err);
      toast.error('Failed to load branding details');
    }).finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: unknown) => setBranding((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { logoUrl, coverUrl, id, createdAt, updatedAt, projectId, ...payload } = branding as any;
      await apiClient.put('/project/branding', payload);
      toast.success('Branding saved successfully!');
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl animate-fade-in">
      <Link href="/builder" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Builder
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="page-title text-xl font-bold">Branding Settings</h2>
            <p className="page-subtitle text-xs text-slate-500 mt-0.5">Customize public tour layout, colors, and behaviors</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Branding
        </button>
      </div>

      <div className="space-y-6">
        {/* Colors */}
        <div className="card bg-[#161726] border border-white/5 p-6 rounded-2xl">
          <h3 className="section-title text-sm font-bold text-white mb-4">Color Palette</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'primaryColor', label: 'Primary Color' },
              { key: 'secondaryColor', label: 'Secondary Color' },
              { key: 'backgroundColor', label: 'Background Color' },
              { key: 'textColor', label: 'Text Color' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label text-xs font-medium text-slate-400 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={(branding as any)[key] ?? '#000000'} onChange={(e) => set(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                  <input type="text" value={(branding as any)[key] ?? ''} onChange={(e) => set(key, e.target.value)}
                    className="input flex-1 font-mono text-xs" placeholder="#000000" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="card bg-[#161726] border border-white/5 p-6 rounded-2xl">
          <h3 className="section-title text-sm font-bold text-white mb-4">Logo Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Logo Position</label>
              <select className="input text-xs" value={branding.logoPosition ?? 'top-left'} onChange={(e) => set('logoPosition', e.target.value)}>
                {logoPositions.map((p) => <option key={p} value={p}>{p.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Logo Size</label>
              <select className="input text-xs" value={branding.logoSize ?? 'medium'} onChange={(e) => set('logoSize', e.target.value)}>
                {logoSizes.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="label text-xs font-medium text-slate-400 mb-1">Branding Logo (Relative File Path)</label>
            <input type="text" className="input text-xs font-mono" value={branding.logoAssetId ?? ''} onChange={(e) => set('logoAssetId', e.target.value)} placeholder="assets/images/logo.png" />
          </div>

          <div className="mt-4">
            <label className="label text-xs font-medium text-slate-400 mb-1">Cover Image (Relative File Path)</label>
            <input type="text" className="input text-xs font-mono" value={branding.coverAssetId ?? ''} onChange={(e) => set('coverAssetId', e.target.value)} placeholder="assets/images/cover.jpg" />
          </div>
          
          <p className="text-[10px] text-slate-500 mt-4">
            Upload files in the <Link href="/assets" className="text-indigo-400 hover:underline">Asset Library</Link> and copy their relative paths to assign them to branding assets.
          </p>
        </div>

        {/* Viewer Defaults */}
        <div className="card bg-[#161726] border border-white/5 p-6 rounded-2xl">
          <h3 className="section-title text-sm font-bold text-white mb-4">Viewer Behavior</h3>
          <div className="space-y-4">
            {[
              { key: 'autoRotate', label: 'Auto Rotate', desc: 'Automatically rotate the panorama on load' },
              { key: 'showControls', label: 'Show Controls', desc: 'Show zoom and fullscreen controls' },
              { key: 'showSceneMenu', label: 'Show Scene Switcher', desc: 'Show scene preview menu at the bottom' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                </div>
                <button onClick={() => set(key, !(branding as any)[key])}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${(branding as any)[key] ? 'bg-indigo-600' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${(branding as any)[key] ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
            {branding.autoRotate && (
              <div className="pt-2">
                <label className="label text-xs font-medium text-slate-400 mb-1">Auto Rotate Speed (deg/s)</label>
                <input type="range" min={0.01} max={5} step={0.05} value={branding.autoRotateSpeed ?? 2}
                  onChange={(e) => set('autoRotateSpeed', parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                <p className="text-[10px] text-slate-500 mt-1">{branding.autoRotateSpeed} deg/s</p>
              </div>
            )}
          </div>
        </div>

        {/* Welcome Screen */}
        <div className="card bg-[#161726] border border-white/5 p-6 rounded-2xl">
          <h3 className="section-title text-sm font-bold text-white mb-4">Welcome Screen</h3>
          <div className="space-y-4">
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Welcome Title</label>
              <input className="input text-xs" value={branding.welcomeTitle ?? ''} onChange={(e) => set('welcomeTitle', e.target.value)} placeholder="Welcome to our virtual tour" />
            </div>
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Welcome Message</label>
              <textarea rows={3} className="input text-xs resize-none" value={branding.welcomeMessage ?? ''} onChange={(e) => set('welcomeMessage', e.target.value)} placeholder="Take an interactive 360° tour..." />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="card bg-[#161726] border border-white/5 p-6 rounded-2xl">
          <h3 className="section-title text-sm font-bold text-white mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Contact Email</label>
              <input type="email" className="input text-xs" value={branding.contactEmail ?? ''} onChange={(e) => set('contactEmail', e.target.value)} placeholder="hello@company.com" />
            </div>
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Contact Phone</label>
              <input type="text" className="input text-xs" value={branding.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="label text-xs font-medium text-slate-400 mb-1">Website URL</label>
              <input type="url" className="input text-xs" value={branding.websiteUrl ?? ''} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://company.com" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
