'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useMotionValue } from 'framer-motion';
import { Grid, LogOut } from 'lucide-react';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { useRBAC } from '@/hooks/useRBAC';

// Modular Sub-components
import { DockNavItem } from './sidebar/DockNavItem';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarNavExpanded } from './sidebar/SidebarNavExpanded';
import { SidebarFooterExpanded } from './sidebar/SidebarFooterExpanded';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  storeName: string | null;
}

export default function Sidebar({ isCollapsed, onToggleCollapse, storeName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { canAccess } = useRBAC();
  const mouseY = useMotionValue(Infinity);

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
    window.location.href = `${dashboardUrl}?logout=true`;
  };

  const sidebarVariants = {
    expanded: {
      width: "240px",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
    collapsed: {
      width: "100px",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <motion.aside
      className="hidden md:flex flex-col fixed left-5 top-[76px] bottom-5 z-50 overflow-visible"
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        borderWidth: "1px",
        borderRadius: "12px",
        boxShadow: "none",
        padding: isCollapsed ? "24px 0" : "20px 12px",
        overflowY: "hidden",
        overflowX: "visible",
      }}
    >
      {/* Header section */}
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        storeName={storeName}
      />

      {/* Navigation section */}
      {isCollapsed ? (
        /* Collapsed Mode (macOS Dock Toolbar) */
        <div
          className="flex-1 flex flex-col overflow-y-auto overflow-x-visible"
          style={{ scrollbarWidth: "none" }}
        >
          <motion.nav
            onMouseMove={(e) => mouseY.set(e.clientY)}
            onMouseLeave={() => mouseY.set(Infinity)}
            className="flex flex-col items-center gap-2 w-full py-2 px-1.5 mx-auto overflow-visible flex-1"
            role="toolbar"
            aria-label="Navigation dock"
          >
            {/* Pilih Modul */}
            <DockNavItem
              icon={<Grid size={18} className="text-[var(--sidebar-text)]" />}
              label="Pilih Modul"
              isActive={false}
              mouseY={mouseY}
              onClick={() => { window.location.href = dashboardUrl; }}
            />
            <div className="w-8 h-px my-1" style={{ backgroundColor: "var(--sidebar-border)" }} />

            {/* Nav items */}
            {visibleItems.map((item) => (
              <DockNavItem
                key={item.path}
                icon={item.icon}
                label={item.title}
                isActive={pathname === item.path}
                mouseY={mouseY}
                href={item.path}
                onClick={() => router.push(item.path)}
              />
            ))}

            {/* Divider */}
            <div className="w-8 h-px my-1" style={{ backgroundColor: "var(--sidebar-border)" }} />

            {/* Logout */}
            <DockNavItem
              icon={<LogOut size={18} />}
              label="Keluar"
              isActive={false}
              mouseY={mouseY}
              onClick={handleLogout}
            />
          </motion.nav>
        </div>
      ) : (
        /* Expanded Mode navigation and footer */
        <>
          <SidebarNavExpanded
            dashboardUrl={dashboardUrl}
            visibleItems={visibleItems}
            pathname={pathname}
            router={router}
          />
          <SidebarFooterExpanded
            handleLogout={handleLogout}
          />
        </>
      )}
    </motion.aside>
  );
}
