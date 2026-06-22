'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useMotionValue } from 'framer-motion';
import { SquaresFour, SignOut } from '@phosphor-icons/react';
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
      width: "200px",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
    collapsed: {
      width: "100px",
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <motion.aside
      className={`hidden md:flex flex-col fixed left-0 top-[56px] bottom-0 z-50 overflow-visible ${isCollapsed ? 'collapsed' : ''}`}
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        borderRightWidth: "0px",
        borderLeftWidth: "0px",
        borderTopWidth: "0px",
        borderBottomWidth: "0px",
        borderRadius: "0px",
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
              icon={<SquaresFour size={18} className="text-[var(--sidebar-text)]" weight="bold" />}
              label="Pilih Modul"
              isActive={false}
              mouseY={mouseY}
              onClick={() => { window.location.href = dashboardUrl; }}
            />

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
          </motion.nav>
        </div>
      ) : (
        /* Expanded Mode navigation */
        <SidebarNavExpanded
          dashboardUrl={dashboardUrl}
          visibleItems={visibleItems}
          pathname={pathname}
          router={router}
        />
      )}

      {/* Footer section at the very bottom */}
      {isCollapsed ? (
        <div className="flex items-center justify-center py-2 border-t-0 mt-auto" style={{ borderTop: "none" }}>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-none outline-none cursor-pointer text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-link-hover-text)] hover:bg-[var(--sidebar-link-hover-bg)]"
          >
            <div className="sidebar-dock-icon flex items-center justify-center">
              <SignOut size={18} weight="bold" />
            </div>
          </button>
        </div>
      ) : (
        <SidebarFooterExpanded
          handleLogout={handleLogout}
        />
      )}
    </motion.aside>
  );
}
