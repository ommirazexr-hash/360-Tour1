'use client';

import { usePathname } from 'next/navigation';
import { Eye } from 'lucide-react';
import Link from 'next/link';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/builder': { title: 'Scenes', subtitle: 'Manage panorama scenes and hotspots' },
  '/builder/branding': { title: 'Branding', subtitle: 'Customize tour colors, logo, and layout' },
  '/builder/guided-tour': { title: 'Guided Tour', subtitle: 'Configure narration and scene sequences' },
  '/assets': { title: 'Asset Library', subtitle: 'All uploaded media files' },
  '/avatars': { title: 'Avatars', subtitle: 'Manage virtual 3D or 2D avatars' },
};

export function Topbar() {
  const pathname = usePathname();

  const pageInfo = Object.entries(PAGE_TITLES).find(
    ([key]) => pathname === key || (key === '/builder' && pathname.startsWith('/builder/scenes')) || (key !== '/builder' && pathname.startsWith(key + '/'))
  )?.[1] ?? { title: 'Virtual Tour Builder' };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-slate-200 z-30 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-slate-900">{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p className="text-xs text-slate-500 leading-none mt-0.5">{pageInfo.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/" target="_blank" className="btn-primary btn-sm gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Preview Tour
        </Link>
      </div>
    </header>
  );
}
