'use client';
import Link from 'next/link';
import { TriangleAlert, LogOut } from 'lucide-react';
import { ScrollAreaDemo } from '../scrollarea/scrollarea';
import { SheetContent } from '@/components/ui/sheet';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useRBAC } from '@/hooks/useRBAC';

export function NavbarSheet() {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = useRBAC();

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
      {/* SheetContent component to render the navigation content */}
      <SheetContent side="left" className="flex flex-col justify-between h-full">
        {/* Navigation container */}
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

        {/* Logout Button at the bottom of the sheet */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
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
