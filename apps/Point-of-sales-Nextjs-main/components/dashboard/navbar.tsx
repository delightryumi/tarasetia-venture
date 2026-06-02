'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    let dashboardUrl = 'https://bumianyom-web-1--bumi-anyom.asia-southeast1.hosted.app/select-module';
    if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
      dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
    } else if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        dashboardUrl = 'https://bumianyom-web-1--bumi-anyom.asia-southeast1.hosted.app/select-module';
      } else if (hostname.startsWith('pos.')) {
        dashboardUrl = `${protocol}//${hostname.replace('pos.', 'dashboard.')}/select-module`;
      } else if (hostname.includes('--bumi-anyom')) {
        const parts = hostname.split('--');
        parts[0] = 'bumianyom-web-1';
        dashboardUrl = `${protocol}//${parts.join('--')}/select-module`;
      } else if (hostname.includes('pos')) {
        dashboardUrl = `${protocol}//${hostname.replace('pos', 'bumianyom-web-1')}/select-module`;
      } else {
        dashboardUrl = `${protocol}//${hostname}/select-module`;
      }
    }
    window.location.href = dashboardUrl;
  };


  return (
    <>
      <div className="flex-1 flex flex-col justify-between h-full">
        {/* Navigation bar container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 pt-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {/* Map through NAVBAR_ITEMS to create navigation links */}
            {NAVBAR_ITEMS.map((item) => (
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
        
        {/* Logout Button at the bottom of the sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
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
