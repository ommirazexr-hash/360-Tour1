'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Play, Plus, Trash2, Upload, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import type { GuidedTourStep, Scene } from '@vt/shared';

export default function GuidedTourPage() {
  const [steps, setSteps] = useState<GuidedTourStep[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [audioAssets, setAudioAssets] = useState<any[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingStep, setUploadingStep] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<GuidedTourStep[]>('/project/guided-tour'),
      apiClient.get<Scene[]>('/project/scenes'),
      apiClient.get<any>('/project'),
      apiClient.get<any[]>('/assets', { category: 'AUDIO' }).catch(() => []),
    ]).then(([t, s, p, audios]) => {
      setSteps(t);
      setScenes(s);
      setEnabled(p.guidedTourEnabled ?? false);
      setAudioAssets(audios);
    }).catch((err: any) => {
      console.error('Failed to load guided tour data:', err);
      toast.error('Failed to load guided tour details');
    }).finally(() => setLoading(false));
  }, []);

  const addStep = () => {
    const newStep: any = {
      sceneId: scenes[0]?.id ?? '', order: steps.length, duration: 10,
      narrationTitle: '', narrationText: '',
      targetYaw: 0, targetPitch: 0, targetZoom: 50,
      audioUrl: '',
      rotationSpeed: 2.0,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, key: string, value: unknown) => {
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  };

  const handleAudioUpload = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'AUDIO');

    setUploadingStep(i);
    try {
      const res = await apiClient.upload<any>('/assets/upload', fd);
      toast.success('Audio uploaded!');
      const url = res.fileUrl || res.optimizedUrl || res.filePath || res.url;
      updateStep(i, 'audioUrl', url);
      // Refresh list of audio assets so it shows up in dropdowns
      const updatedList = await apiClient.get<any[]>('/assets', { category: 'AUDIO' });
      setAudioAssets(updatedList);
    } catch {
      toast.error('Failed to upload audio');
    } finally {
      setUploadingStep(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/project/guided-tour', {
        steps: steps.map((s, i) => ({
          sceneId: s.sceneId,
          order: i,
          duration: s.duration,
          narrationTitle: s.narrationTitle || null,
          narrationText: s.narrationText || null,
          targetYaw: s.targetYaw,
          targetPitch: s.targetPitch,
          targetZoom: s.targetZoom,
          audioUrl: s.audioUrl || null,
          rotationSpeed: s.rotationSpeed ?? 2.0,
          highlightHotspotId: null,
        })),
      });
      toast.success('Guided tour saved!');
    } catch {
      toast.error('Failed to save guided tour');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    try {
      const res = await apiClient.patch<{ guidedTourEnabled: boolean }>('/project/guided-tour/toggle');
      setEnabled(res.guidedTourEnabled);
      toast.success(res.guidedTourEnabled ? 'Guided tour enabled' : 'Guided tour disabled');
    } catch {
      toast.error('Failed to toggle guided tour');
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
            <Compass className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="page-title text-xl font-bold">Guided Tour</h2>
            <p className="page-subtitle text-xs text-slate-500 mt-0.5">Configure step-by-step auto-narrated guided tour sequence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161726] border border-white/5 rounded-xl">
            <span className="text-xs text-slate-400">{enabled ? 'Enabled' : 'Disabled'}</span>
            <button onClick={handleToggle}
              className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/10">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Sequence
          </button>
        </div>
      </div>

      {scenes.length === 0 ? (
        <div className="card text-center py-16 bg-[#161726] border border-white/5 rounded-2xl">
          <p className="text-slate-400 font-medium">Please add scenes first before configuring a guided tour.</p>
        </div>
      ) : (
        <>
          {/* Steps */}
          <div className="space-y-4 mb-6">
            {steps.map((step, i) => (
              <div key={i} className="card relative bg-[#161726] border border-white/5 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">{i + 1}</div>
                  <h4 className="font-bold text-white text-sm">Step {i + 1}</h4>
                  <button onClick={() => removeStep(i)} className="ml-auto p-1.5 text-slate-500 hover:text-red-400 transition-colors bg-slate-900 border border-white/5 rounded-xl hover:border-red-500/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-medium text-slate-400 mb-1">Target Scene</label>
                    <select className="input text-xs" value={step.sceneId} onChange={(e) => updateStep(i, 'sceneId', e.target.value)}>
                      {scenes.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs font-medium text-slate-400 mb-1">Duration (seconds)</label>
                    <input type="number" min={1} max={300} className="input text-xs" value={step.duration}
                      onChange={(e) => updateStep(i, 'duration', parseInt(e.target.value) || 10)} />
                  </div>

                  <div className="col-span-2">
                    <label className="label text-xs font-medium text-slate-400 mb-1">Audio Narration File</label>
                    <div className="flex gap-2">
                      <select
                        className="input text-xs flex-1"
                        value={step.audioUrl ?? ''}
                        onChange={(e) => updateStep(i, 'audioUrl', e.target.value)}
                      >
                        <option value="">No Audio (Silent / Subtitles Only)</option>
                        {audioAssets.map((asset) => (
                          <option key={asset.id} value={asset.fileUrl || asset.optimizedUrl || asset.filePath || asset.url}>
                            {asset.originalName || asset.name}
                          </option>
                        ))}
                        {step.audioUrl && !audioAssets.some(a => (a.fileUrl || a.optimizedUrl || a.filePath || a.url) === step.audioUrl) && (
                          <option value={step.audioUrl}>
                            {step.audioUrl.substring(step.audioUrl.lastIndexOf('/') + 1)}
                          </option>
                        )}
                      </select>

                      <label className="btn-secondary text-xs font-semibold cursor-pointer flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 border border-white/5 hover:border-white/20 rounded-xl">
                        {uploadingStep === i ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        Upload Audio
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => handleAudioUpload(i, e)}
                          disabled={uploadingStep !== null}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="label text-xs font-medium text-slate-400 mb-1">Narration Title (Subtitles)</label>
                    <input className="input text-xs" value={step.narrationTitle ?? ''} onChange={(e) => updateStep(i, 'narrationTitle', e.target.value)} placeholder="e.g. Welcome to the Reception Area" />
                  </div>

                  <div className="col-span-2">
                    <label className="label text-xs font-medium text-slate-400 mb-1">Narration Description text</label>
                    <textarea rows={3} className="input text-xs resize-none" value={step.narrationText ?? ''} onChange={(e) => updateStep(i, 'narrationText', e.target.value)} placeholder="Provide detailed subtitles or script description..." />
                  </div>

                  <div className="col-span-2">
                    <label className="label text-xs font-medium text-slate-400 flex items-center justify-between mb-1">
                      <span>Rotation Speed</span>
                      <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{(step as any).rotationSpeed ?? 2.0} RPM</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={10}
                      step={0.5}
                      className="w-full accent-indigo-500 h-1.5 rounded-full bg-white/10 cursor-pointer"
                      value={(step as any).rotationSpeed ?? 2.0}
                      onChange={(e) => updateStep(i, 'rotationSpeed', parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Slow (0.5 RPM)</span>
                      <span>Fast (10 RPM)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={addStep} className="btn-secondary w-full justify-center gap-2 text-xs font-semibold py-3 border border-white/5 hover:border-white/20 bg-slate-900/60 rounded-xl transition-all hover:scale-[1.01]">
            <Plus className="w-4 h-4" /> Add Guided Step
          </button>
        </>
      )}
    </div>
  );
}
