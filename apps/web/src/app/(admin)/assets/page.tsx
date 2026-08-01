'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Upload, Tag, Trash2, Eye, FileText, Video, ImageIcon, Globe, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient, UPLOAD_URL } from '@/lib/api-client';
import { formatBytes, formatRelative, getMediaUrl } from '@/lib/utils';
import type { AssetWithUrls, AssetCategory } from '@vt/shared';
import { useDropzone } from 'react-dropzone';

const CATEGORIES: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'PANORAMA', label: 'Panoramas', icon: Globe },
  { value: 'IMAGE', label: 'Images', icon: ImageIcon },
  { value: 'VIDEO', label: 'Videos', icon: Video },
  { value: 'PDF', label: 'PDFs', icon: FileText },
  { value: 'LOGO', label: 'Logos', icon: ImageIcon },
  { value: 'AVATAR', label: 'Avatars', icon: Video },
];

function AssetCard({ asset, onDelete }: { asset: AssetWithUrls; onDelete: () => void }) {
  const preview = asset.thumbnailUrl || asset.optimizedUrl || asset.fileUrl;
  return (
    <div className="card p-0 group relative overflow-hidden hover:border-indigo-500/40 transition-all">
      {/* Preview */}
      <div className="h-36 bg-gradient-to-br from-slate-800/60 to-slate-900/80 relative overflow-hidden">
        {['IMAGE', 'PANORAMA', 'LOGO'].includes(asset.category) && preview ? (
          <img src={getMediaUrl(preview)} alt={asset.originalName}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full">
            {['VIDEO', 'AVATAR'].includes(asset.category) ? <Video className="w-10 h-10 text-slate-500" /> :
             asset.category === 'PDF' ? <FileText className="w-10 h-10 text-slate-500" /> :
             <ImageIcon className="w-10 h-10 text-slate-500" />}
          </div>
        )}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button onClick={onDelete} className="w-7 h-7 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className="badge-blue text-[10px]">{asset.category}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-medium text-white truncate">{asset.originalName || (asset as any).name || 'Unnamed Asset'}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-slate-500">{asset.fileSize !== undefined && !isNaN(Number(asset.fileSize)) ? formatBytes(asset.fileSize) : 'unknown size'}</p>
          <p className="text-[10px] text-slate-600">{formatRelative(asset.createdAt || (asset as any).uploadedAt || new Date().toISOString())}</p>
        </div>
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] rounded">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.getWithMeta<AssetWithUrls[]>('/assets', { category: category === 'all' ? undefined : category, search, limit: 60 });
      setAssets(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [category, search]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    let uploaded = 0;
    for (const file of files) {
      try {
        const cat: AssetCategory = file.type.includes('video') ? 'VIDEO' : file.type.includes('pdf') ? 'PDF' : 'IMAGE';
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', cat);
        await apiClient.upload('/assets/upload', fd);
        uploaded++;
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    if (uploaded) { toast.success(`${uploaded} asset(s) uploaded`); load(); }
    setUploading(false);
  }, [load]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true });

  const handleDelete = async (asset: AssetWithUrls) => {
    if (!confirm(`Delete "${asset.originalName}"?`)) return;
    try {
      await apiClient.delete(`/assets/${asset.id}`);
      toast.success('Asset deleted');
      setAssets(assets.filter((a) => a.id !== asset.id));
    } catch (err: any) {
      toast.error(err?.message || 'Cannot delete — asset is in use');
    }
  };

  return (
    <div className="page-container animate-fade-in" {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="fixed inset-0 bg-indigo-600/20 border-2 border-indigo-500 border-dashed z-50 flex items-center justify-center rounded-xl">
          <div className="text-center">
            <Upload className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <p className="text-2xl font-bold text-white">Drop files to upload</p>
          </div>
        </div>
      )}

      <div className="page-header flex items-center justify-between">
        <div>
          <h2 className="page-title">Asset Library</h2>
          <p className="page-subtitle">{total} assets • Drop files anywhere to upload</p>
        </div>
        <label className={`btn-primary gap-2 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload Files</>}
          <input type="file" multiple className="hidden" onChange={(e) => onDrop(Array.from(e.target.files ?? []))} disabled={uploading} />
        </label>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setCategory(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${category === value ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets..." className="input pl-9" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-52 skeleton rounded-xl" />)}
        </div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <Upload className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">No assets yet</p>
          <p className="text-slate-500 text-sm">Upload images, panoramas, PDFs, or videos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onDelete={() => handleDelete(asset)} />
          ))}
        </div>
      )}
    </div>
  );
}
