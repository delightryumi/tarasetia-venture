'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { useRBAC } from '@/hooks/useRBAC';
import { ArrowLeft } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { canAccess } = useRBAC();
  const [dashboardUrl, setDashboardUrl] = React.useState('https://live.mytara.id/select-module');

  React.useEffect(() => {
    const getDashboardUrl = () => {
      if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname === 'point.mytara.id') {
          return `${protocol}//live.mytara.id/select-module`;
        }

        const storedUrl = localStorage.getItem('dashboard_url');
        if (storedUrl) return storedUrl;
        
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          return process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module';
        }
        if (hostname.includes('-3001.')) {
          return `${protocol}//${hostname.replace('-3001.', '-3000.')}/select-module`;
        }
        if (hostname.startsWith('pos.')) {
          return `${protocol}//${hostname.replace('pos.', 'pms.')}/select-module`;
        }
        if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'bumianyom-web-1';
          return `${protocol}//${parts.join('--')}/select-module`;
        }
        if (hostname.includes('-3001.')) {
          return `${protocol}//${hostname.replace('-3001.', '-3000.')}/select-module`;
        }
      }
      return 'https://live.mytara.id/select-module';
    };
    setDashboardUrl(getDashboardUrl());
  }, []);

  const visibleItems = NAVBAR_ITEMS.filter(item => {
    const key = `pos_${item.title.toLowerCase()}`;
    return canAccess(key);
  });

  const primaryItems = visibleItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/95 dark:bg-zinc-950/95 border-t border-neutral-200 dark:border-white/[0.08] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)] overflow-x-auto no-scrollbar">
      <div className="flex items-center justify-start sm:justify-around h-14 px-2 min-w-max w-full">
        {primaryItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-2 h-[54px] flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'text-[#8d7a52] dark:text-[#dfd3b2] font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center shrink-0">
                {React.cloneElement(item.icon as React.ReactElement<any>, {
                  size: 18,
                  strokeWidth: isActive ? 2.2 : 1.8,
                })}
              </div>
              <span className="text-[9px] tracking-wide whitespace-nowrap">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* Arrow Left back to Select Module */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-white/10 shrink-0 mx-1" />

        <a
          href={dashboardUrl}
          target="_top"
          className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-2 h-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all duration-200"
        >
          <ArrowLeft size={18} strokeWidth={1.8} />
          <span className="text-[9px] tracking-wide whitespace-nowrap">Modul</span>
        </a>
      </div>
    </div>
  );
}
