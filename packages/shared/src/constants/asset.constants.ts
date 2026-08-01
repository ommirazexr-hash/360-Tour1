import type { AssetCategory } from '../types/asset.types';

export const ASSET_CATEGORIES: Record<AssetCategory, { label: string; accept: string[]; maxSize: number }> = {
  PANORAMA: {
    label: 'Panorama',
    accept: ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  IMAGE: {
    label: 'Image',
    accept: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  VIDEO: {
    label: 'Video',
    accept: ['video/mp4', 'video/webm'],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  PDF: {
    label: 'PDF Document',
    accept: ['application/pdf'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  LOGO: {
    label: 'Logo',
    accept: ['image/png', 'image/svg+xml', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  AVATAR: {
    label: 'Spokesperson Avatar',
    accept: ['video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg', 'audio/aac'],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  AUDIO: {
    label: 'Audio File',
    accept: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/aac'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
};

export const ALLOWED_EXTENSIONS: Record<AssetCategory, string[]> = {
  PANORAMA: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  VIDEO: ['.mp4', '.webm'],
  PDF: ['.pdf'],
  LOGO: ['.png', '.svg', '.webp'],
  AVATAR: ['.mp4', '.webm', '.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga'],
  AUDIO: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga'],
};
