'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Upload, Trash2, Play, RefreshCw, X, User, Languages, FileText, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient, UPLOAD_URL } from '@/lib/api-client';
import { formatRelative, getMediaUrl } from '@/lib/utils';
import type { AvatarWithUrls } from '@vt/shared';
import { useDropzone } from 'react-dropzone';

export default function AvatarsPage() {
  const [avatars, setAvatars] = useState<AvatarWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<AvatarWithUrls | null>(null);
  const [checkeredBg, setCheckeredBg] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('en');
  const [scriptNotes, setScriptNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [scale, setScale] = useState(1.0);

  // Poll state tracker
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getWithMeta<AvatarWithUrls[]>('/avatars', { search, limit: 125 });
      setAvatars(res.data ?? []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load avatars');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Setup/Tear down polling if any avatar is PENDING or PROCESSING
  const checkAndSetupPolling = useCallback(() => {
    const hasActiveJobs = avatars.some(av => av.status === 'PENDING' || av.status === 'PROCESSING');
    
    if (hasActiveJobs) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          try {
            const res = await apiClient.getWithMeta<AvatarWithUrls[]>('/avatars', { search, limit: 125 });
            setAvatars(res.data ?? []);
          } catch (err) {
            // Silence background polling errors
          }
        }, 4000);
      }
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [avatars, search]);

  useEffect(() => {
    checkAndSetupPolling();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [checkAndSetupPolling]);

  // File drop handling
  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov'] },
    maxFiles: 1,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Spokesperson raw video file is required');
      return;
    }
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('name', name.trim());
      fd.append('description', description.trim());
      fd.append('language', language.trim());
      fd.append('scriptNotes', scriptNotes.trim());
      fd.append('scale', String(scale));
      if (selectedAudioFile) {
        fd.append('audio', selectedAudioFile);
      }

      await apiClient.upload<AvatarWithUrls>('/avatars', fd);
      toast.success('Avatar uploaded successfully! Transcoding started.');
      setIsModalOpen(false);
      
      // Reset form
      setName('');
      setDescription('');
      setLanguage('en');
      setScriptNotes('');
      setSelectedFile(null);
      setSelectedAudioFile(null);
      setScale(1.0);
      
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload spokesperson avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (av: AvatarWithUrls) => {
    if (!confirm(`Are you sure you want to delete spokesperson avatar "${av.name}"?`)) return;
    try {
      await apiClient.delete(`/avatars/${av.id}`);
      toast.success('Spokesperson deleted successfully');
      setAvatars(prev => prev.filter(item => item.id !== av.id));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete avatar');
    }
  };

  const handleRetry = async (av: AvatarWithUrls) => {
    try {
      toast.loading('Triggering reprocessing...', { id: 'retry' });
      await apiClient.post(`/avatars/${av.id}/retry`);
      toast.success('Transcoding restarted!', { id: 'retry' });
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to retry transcoding', { id: 'retry' });
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Spokesperson Avatar Library</h2>
          <p className="page-subtitle">Upload green screen videos to create transparent interactive guides</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary gap-2">
          <Upload className="w-4 h-4" /> Upload Avatar
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search spokespersons..."
            className="input pl-9"
          />
        </div>
        {avatars.some(a => a.status === 'PENDING' || a.status === 'PROCESSING') && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            Active transcoding job running...
          </span>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-xl" />
          ))}
        </div>
      ) : avatars.length === 0 ? (
        <div className="empty-state">
          <User className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">No spokespersons yet</p>
          <p className="text-slate-500 text-sm mb-4">Create your first green-screen transparent avatar guide</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">Upload Video</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {avatars.map((av) => (
            <div key={av.id} className="card p-0 group flex flex-col relative overflow-hidden border border-white/5 hover:border-indigo-500/40 transition-all duration-300">
              
              {/* Top Banner / Video Thumbnail placeholder */}
              <div className="h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-between p-3 relative">
                
                {/* Status Badges */}
                <div className="flex justify-between items-start w-full">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    av.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    av.status === 'PROCESSING' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse' :
                    av.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {av.status}
                  </span>
                  
                  <span className="text-[10px] text-slate-400 font-mono">v{av.version}</span>
                </div>

                {/* Main visualization */}
                <div className="flex items-center justify-center flex-1 my-2">
                  {av.status === 'COMPLETED' ? (
                    <button
                      onClick={() => setPreviewAvatar(av)}
                      className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                    >
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </button>
                  ) : av.status === 'PROCESSING' ? (
                    <div className="w-full px-4">
                      <div className="flex justify-between text-[11px] text-indigo-300 mb-1">
                        <span>Chroma-key filter...</span>
                        <span>{av.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${av.progress}%` }} />
                      </div>
                    </div>
                  ) : av.status === 'PENDING' ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
                      <span className="text-[10px] text-yellow-400">Waiting for worker...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center px-2">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <span className="text-[10px] text-red-400 truncate max-w-full" title={av.error || 'Failed'}>
                        {av.error || 'Failed to transcode'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Time & Size */}
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>{av.duration ? `${av.duration.toFixed(1)}s` : 'Unknown duration'}</span>
                  <span>{formatRelative(av.createdAt)}</span>
                </div>
              </div>

              {/* Info panel */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-white text-sm font-bold truncate" title={av.name}>{av.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3" title={av.description || ''}>
                    {av.description || 'No description provided.'}
                  </p>
                  
                  {/* Metadata fields */}
                  <div className="space-y-1 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 text-[11px] mb-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Languages className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-500">Language:</span>
                      <span className="font-semibold text-white uppercase">{av.language}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-pink-400"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>
                      <span className="text-slate-500">Base Scale:</span>
                      <span className="font-semibold text-white">{(av as any).scale ? `${(av as any).scale.toFixed(1)}x` : '1.0x'}</span>
                    </div>
                    {av.scriptNotes && (
                      <div className="flex items-start gap-2 text-slate-400">
                        <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-500">Script:</span>
                        <span className="text-slate-300 line-clamp-1 italic">"{av.scriptNotes}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  {av.status === 'FAILED' ? (
                    <button
                      onClick={() => handleRetry(av)}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-2.5 py-1 rounded transition-colors font-medium border border-indigo-500/20"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry Job
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  <button
                    onClick={() => handleDelete(av)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors ml-auto"
                    title="Delete Spokesperson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Upload Avatar Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#12121e] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-white text-base font-bold">Upload Spokesperson Video</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-indigo-500 bg-indigo-500/10' :
                  selectedFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className={`w-8 h-8 mx-auto mb-2 ${selectedFile ? 'text-emerald-400' : 'text-slate-500'}`} />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-white font-medium">Click or drag green-screen video file</p>
                    <p className="text-xs text-slate-500 mt-1">MP4, WebM or MOV (Green screen chroma background recommended)</p>
                  </div>
                )}
              </div>

              {/* Form Input fields */}
              <div>
                <label className="label mb-1.5 block">Spokesperson Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah (Safety Officer)"
                  className="input"
                />
              </div>

              {/* Audio file input */}
              <div>
                <label className="label mb-1.5 block">Audio Narration File (Optional)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setSelectedAudioFile(file || null);
                  }}
                  className="input py-1.5 text-xs file:bg-indigo-600/10 file:text-indigo-400 file:border-0 file:rounded-md file:px-2.5 file:py-1 file:mr-2 hover:file:bg-indigo-600/20 file:cursor-pointer"
                />
                {selectedAudioFile && (
                  <p className="text-xs text-emerald-400 mt-1">Selected: {selectedAudioFile.name} ({(selectedAudioFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                )}
                {!selectedAudioFile && (
                  <p className="text-[10px] text-slate-500 mt-1">If the spokesperson video lacks audio, upload an MP3/WAV/M4A file here to merge it.</p>
                )}
              </div>

              {/* Scale slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label">Spokesperson Base Scale</label>
                  <span className="text-xs font-mono text-indigo-400 font-bold">{scale.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Adjust the default rendering scale of this spokesperson in the scenes.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="label mb-1.5 block">Description / Notes</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Welcome message for the factory lobby"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Language Code</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="en, es, fr"
                    className="input font-semibold uppercase text-center"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">Script Notes (What is said)</label>
                <textarea
                  value={scriptNotes}
                  onChange={(e) => setScriptNotes(e.target.value)}
                  placeholder="Paste the transcription script notes here..."
                  className="input h-20 py-2 resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary gap-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading & Processing...
                    </>
                  ) : (
                    'Start Transcoding'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Transparent Preview Modal */}
      {previewAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#12121e] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <h3 className="text-white text-base font-bold">{previewAvatar.name}</h3>
                <p className="text-xs text-slate-500">Transparent optimized WebM VP9 playback</p>
              </div>
              <button onClick={() => setPreviewAvatar(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video player canvas with checkered/solid toggle */}
            <div className="relative flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 min-h-[300px]">
              
              {/* The checkered grid background indicator */}
              <div 
                className={`absolute inset-0 transition-opacity ${checkeredBg ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(45deg, #1e1b4b 25%, transparent 25%, transparent 75%, #1e1b4b 75%, #1e1b4b), linear-gradient(45deg, #1e1b4b 25%, #0f172a 25%, #0f172a 75%, #1e1b4b 75%, #1e1b4b)',
                  backgroundSize: '16px 16px, 16px 16px, 16px 16px',
                  backgroundPosition: '0 0, 0 0, 8px 8px'
                }}
              />

              <div className="relative z-10 w-64 h-64 flex items-center justify-center">
                {previewAvatar.optimizedUrl ? (
                  <video
                    src={getMediaUrl(previewAvatar.optimizedUrl)}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    webkit-playsinline="true"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-indigo-400" />
                    No optimized transparent file found.
                  </div>
                )}
              </div>

              {/* Background Control Toggle */}
              <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                <button
                  onClick={() => setCheckeredBg(!checkeredBg)}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                    checkeredBg ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {checkeredBg ? 'Solid Background' : 'Show Transparency'}
                </button>
              </div>

            </div>

            {/* Info details */}
            <div className="p-5 bg-slate-900/40 border-t border-white/5 text-xs text-slate-400 space-y-1">
              <p><strong className="text-slate-300">Name:</strong> {previewAvatar.name}</p>
              <p><strong className="text-slate-300">Codec:</strong> WebM VP9 (with alpha transparency)</p>
              {previewAvatar.scriptNotes && (
                <p className="mt-2 text-slate-300 italic">"{previewAvatar.scriptNotes}"</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
