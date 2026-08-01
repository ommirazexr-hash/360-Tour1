export const VIEWER_DEFAULTS = {
  autoRotate: false,
  autoRotateSpeed: 1.0,
  showControls: true,
  showSceneMenu: true,
  logoPosition: 'top-left' as const,
  logoSize: 'medium' as const,
  primaryColor: '#6366f1',
  secondaryColor: '#818cf8',
  backgroundColor: '#000000',
  textColor: '#ffffff',
  transitionDuration: 600, // ms
  defaultZoom: 50,
  minZoom: 10,
  maxZoom: 90,
  guidedTourAutoAdvance: true,
};

export const LOGO_POSITIONS = [
  'top-left',
  'top-right',
  'top-center',
  'bottom-left',
  'bottom-right',
] as const;

export const LOGO_SIZES = ['small', 'medium', 'large'] as const;

export type LogoPosition = (typeof LOGO_POSITIONS)[number];
export type LogoSize = (typeof LOGO_SIZES)[number];
