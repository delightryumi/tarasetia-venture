'use client';
import React from 'react';
import Link from 'next/link';
import { TriangleAlert, LogOut, ArrowLeft } from 'lucide-react';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRBAC } from '@/hooks/useRBAC';

export function NavbarSheet() {
  const pathname = usePathname();
  const router = useRouter();
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
      }

      let url = 'https://live.mytara.id/select-module';
      if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
        url = process.env.NEXT_PUBLIC_DASHBOARD_URL;
      } else if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname.startsWith('pos.')) {
          url = `${protocol}//${hostname.replace('pos.', 'pms.')}/select-module`;
        } else if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'bumianyom-web-1';
          url = `${protocol}//${parts.join('--')}/select-module`;
        } else if (hostname.includes('-3001.')) {
          url = `${protocol}//${hostname.replace('-3001.', '-3000.')}/select-module`;
        } else {
          url = `https://live.mytara.id/select-module`;
        }
      }
      
      if (!url.endsWith('/select-module')) {
        url = url.replace(/\/$/, '') + '/select-module';
      }
      
      return url;
    };

    setDashboardUrl(getDashboardUrl());
  }, []);

  const visibleItems = NAVBAR_ITEMS.filter(item => {
    const key = `pos_${item.title.toLowerCase()}`;
    return canAccess(key);
  });

  const handleLogout = () => {
    localStorage.clear();
    let dashboardUrl = '';
    
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname === 'point.mytara.id') {
        dashboardUrl = `${protocol}//live.mytara.id/select-module`;
      } else {
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ? `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/select-module` : 'http://localhost:3000/select-module';
        } else if (hostname.includes('-3001.')) {
          dashboardUrl = `${protocol}//${hostname.replace('-3001.', '-3000.')}/select-module`;
        }
      }
    }

    if (!dashboardUrl) {
      dashboardUrl = 'https://live.mytara.id/select-module';
      if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
        dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
      } else if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname.startsWith('pos.')) {
          dashboardUrl = `${protocol}//${hostname.replace('pos.', 'pms.')}/select-module`;
        } else if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'bumianyom-web-1';
          dashboardUrl = `${protocol}//${parts.join('--')}/select-module`;
        } else if (hostname.includes('-3001.')) {
          dashboardUrl = `${protocol}//${hostname.replace('-3001.', '-3000.')}/select-module`;
        } else {
          dashboardUrl = `https://live.mytara.id/select-module`;
        }
      }
    }
    
    window.location.href = `${dashboardUrl}?logout=true`;
  };


  return (
    <>
      {/* SheetContent component to render the navigation content */}
      <SheetContent side="left" className="flex flex-col justify-between h-full">
        <SheetHeader className="hidden">
          <SheetTitle>POS Menu</SheetTitle>
          <SheetDescription>Navigation menu for Point of Sales</SheetDescription>
        </SheetHeader>
        
        {/* Navigation container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-4">
          <nav className="grid gap-2 text-lg font-medium">
            {/* Link for the top section with an icon */}
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <TriangleAlert className="h-6 w-6" />
              <span>POS Menu</span>
            </Link>

            {/* Map through visibleItems to create navigation links */}
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 ${
                  pathname === item.path
                    ? 'bg-muted text-foreground' // Apply active styles if current path matches item path
                    : 'text-muted-foreground hover:text-foreground' // Apply default styles otherwise
                } transition-all hover:text-primary`}
              >
                {/* Render the icon and title for each navigation item */}
                {item.icon}
                {item.title}
              </Link>
            ))}

            {/* Include ScrollAreaDemo component */}
            <ScrollAreaDemo />
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-neutral-500 hover:text-neutral-900 dark:hover:text-white gap-3 text-base px-3 py-2 font-medium"
            asChild
          >
            <a href={dashboardUrl} target="_top">
              <ArrowLeft className="h-5 w-5" />
              <span>Menu Utama</span>
            </a>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-3 text-base px-3 py-2 font-medium"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Keluar</span>
          </Button>
        </div>
      </SheetContent>
    </>
  );
}
