import type { HotspotType } from '../types/hotspot.types';

export const HOTSPOT_TYPES: Record<HotspotType, { label: string; icon: string; description: string }> = {
  SCENE_LINK: {
    label: 'Scene Navigation',
    icon: 'arrow',
    description: 'Navigate to another scene in the tour',
  },
  INFO_POPUP: {
    label: 'Information Popup',
    icon: 'info',
    description: 'Display informational text in a popup',
  },
  PDF: {
    label: 'PDF Document',
    icon: 'pdf',
    description: 'Open a PDF document',
  },
  VIDEO: {
    label: 'Video',
    icon: 'play',
    description: 'Play a video in a modal',
  },
  IMAGE: {
    label: 'Image',
    icon: 'image',
    description: 'Display an image in a lightbox',
  },
  EXTERNAL_URL: {
    label: 'External Link',
    icon: 'link',
    description: 'Open an external website',
  },
  CONTACT_FORM: {
    label: 'Contact Form',
    icon: 'contact',
    description: 'Show a contact inquiry form',
  },
};

export const ICON_TYPES = [
  'default',
  'arrow',
  'info',
  'play',
  'image',
  'pdf',
  'link',
  'contact',
] as const;

export type IconType = (typeof ICON_TYPES)[number];
