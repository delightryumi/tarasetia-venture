'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRBAC } from '@/hooks/useRBAC';

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = useRBAC();
  const [dashboardUrl, setDashboardUrl] = React.useState('https://pms.bumianyom.com/select-module');

  React.useEffect(() => {
    const getDashboardUrl = () => {
      if (typeof window !== 'undefined') {
        const storedUrl = localStorage.getItem('dashboard_url');
        if (storedUrl) return storedUrl;

        const { protocol, hostname } = window.location;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          return 'http://localhost:3000/select-module';
        }
      }

      let url = 'https://pms.bumianyom.com/select-module';
      if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
        url = process.env.NEXT_PUBLIC_DASHBOARD_URL;
      } else if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname.startsWith('pos.')) {
          url = `${protocol}//${hostname.replace('pos.', 'pms.')}/select-module`;
        } else {
          url = `https://pms.bumianyom.com/select-module`;
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
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        dashboardUrl = 'http://localhost:3000/select-module';
      }
    }

    if (!dashboardUrl) {
      dashboardUrl = 'https://pms.bumianyom.com/select-module';
      if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
        dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
      } else if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname.startsWith('pos.')) {
          dashboardUrl = `${protocol}//${hostname.replace('pos.', 'pms.')}/select-module`;
        } else {
          dashboardUrl = `https://pms.bumianyom.com/select-module`;
        }
      }
    }
    
    window.location.href = `${dashboardUrl}?logout=true`;
  };


  return (
    <>
      <div className="flex-1 flex flex-col justify-between h-full">
        {/* Navigation bar container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pt-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {/* Map through visibleItems to create navigation links */}
            {visibleItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto flex flex-col gap-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-neutral-500 hover:text-neutral-900 dark:hover:text-white gap-3 text-sm px-3 py-2 font-medium"
            asChild
          >
            <a href={dashboardUrl} target="_top">
              <ArrowLeft className="h-4 w-4" />
              <span>Menu Utama</span>
            </a>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-3 text-sm px-3 py-2 font-medium"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
