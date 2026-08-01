'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Palette, Image, LogOut,
  Compass, ChevronRight, Globe, User
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/builder', label: 'Scenes', icon: LayoutDashboard },
  { href: '/builder/branding', label: 'Branding Layout', icon: Palette },
  { href: '/builder/guided-tour', label: 'Guided Tour Sequence', icon: Compass },
  { href: '/assets', label: 'Asset Library', icon: Image },
  { href: '/avatars', label: 'Avatars', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col bg-white border-r border-slate-200 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-none">VirtualTour</p>
          <p className="text-xs text-slate-500 mt-0.5">Admin Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Navigation</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === '/builder' && pathname.startsWith('/builder/scenes')) || (href !== '/builder' && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                    active
                      ? 'bg-slate-100 text-slate-900 border border-slate-200/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800')} />
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-slate-900" />}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="divider mt-4 mb-4" />

        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">Quick Actions</p>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          <Globe className="w-4 h-4 text-slate-500" />
          View Public Tours
        </Link>
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-slate-700">
              {admin?.username?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{admin?.username ?? 'Admin'}</p>
            <p className="text-[10px] text-slate-500 truncate">{admin?.email}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
