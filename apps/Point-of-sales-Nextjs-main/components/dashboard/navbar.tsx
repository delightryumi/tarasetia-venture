'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRBAC } from '@/hooks/useRBAC';
import { ModeToggle } from '@/components/darkmode/darkmode';

function Navbar({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = useRBAC();
  const [dashboardUrl, setDashboardUrl] = React.useState('https://pms.bumianyom.com/select-module');

  React.useEffect(() => {
    const getDashboardUrl = () => {
      if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname === 'pos.bumianyom.com') {
          return `${protocol}//pms.bumianyom.com/select-module`;
        }

        const storedUrl = localStorage.getItem('dashboard_url');
        if (storedUrl) return storedUrl;

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
        } else if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'bumianyom-web-1';
          url = `${protocol}//${parts.join('--')}/select-module`;
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
      if (hostname === 'pos.bumianyom.com') {
        dashboardUrl = `${protocol}//pms.bumianyom.com/select-module`;
      } else {
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          dashboardUrl = 'http://localhost:3000/select-module';
        }
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
        } else if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'bumianyom-web-1';
          dashboardUrl = `${protocol}//${parts.join('--')}/select-module`;
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
          <nav className={`grid items-start ${isCollapsed ? 'px-1.5 gap-3' : 'px-4 gap-3'}`}>
            {/* Map through visibleItems to create navigation links */}
            {visibleItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={item.title}
                  className={`flex items-center transition-all ${
                    isCollapsed 
                      ? `justify-center w-12 h-12 mx-auto rounded-[10px] ${
                          active 
                            ? 'bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)] shadow-[0_4px_16px_rgba(141,122,82,0.25)] border-transparent' 
                            : 'text-[var(--sidebar-text)] hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)] bg-[var(--sidebar-link-bg)] border border-[var(--sidebar-link-border)]'
                        }`
                      : `gap-4 rounded-[14px] px-6 py-3.5 text-sm font-medium ${
                          active
                            ? 'bg-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)] shadow-[0_8px_20px_rgba(141,122,82,0.25)] border border-transparent'
                            : 'text-[var(--sidebar-text)] hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)] border border-[var(--sidebar-link-border)] bg-[var(--sidebar-link-bg)]'
                        }`
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
            {/* Include ScrollAreaDemo component */}
            {!isCollapsed && <ScrollAreaDemo />}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t mt-auto flex flex-col gap-2 border-[var(--sidebar-border)]">
          <div className="flex justify-center mb-1">
            <ModeToggle />
          </div>
          <Button
            variant="ghost"
            title="Menu Utama"
            className={`w-full text-[var(--sidebar-text)] hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)] border border-[var(--sidebar-link-border)] bg-[var(--sidebar-link-bg)] font-medium transition-all ${
              isCollapsed 
                ? 'justify-center h-12 w-12 mx-auto rounded-[10px] p-0' 
                : 'justify-start gap-4 text-sm rounded-[14px] px-6 py-3.5 h-auto'
            }`}
            asChild
          >
            <a href={dashboardUrl} target="_top">
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>Menu Utama</span>}
            </a>
          </Button>
          
          <Button
            variant="ghost"
            title="Keluar"
            className={`w-full text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-[#fbe3e3] dark:hover:bg-red-500/10 hover:border-[#f5c2c2] dark:hover:border-red-500/30 border border-[var(--sidebar-link-border)] bg-[var(--sidebar-link-bg)] font-medium transition-all ${
              isCollapsed 
                ? 'justify-center h-12 w-12 mx-auto rounded-[10px] p-0' 
                : 'justify-start gap-4 text-sm rounded-[14px] px-6 py-3.5 h-auto'
            }`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Keluar</span>}
          </Button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
