'use client';
import React, { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
  type MotionValue,
  type SpringOptions,
} from 'framer-motion';
import { TriangleAlert, ChevronLeft, Menu, Grid, LogOut } from 'lucide-react';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { useRBAC } from '@/hooks/useRBAC';


/* ── Dock item with magnification (matches admin dashboard) ── */
const DOCK_SPRING: SpringOptions = { mass: 0.1, stiffness: 150, damping: 12 };
const BASE_SIZE = 50;
const MAGNIFIED_SIZE = 80;
const DISTANCE = 200;

function DockNavItem({
  icon,
  label,
  isActive,
  mouseY,
  onClick,
  href,
  isExternal,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  mouseY: MotionValue<number>;
  onClick?: () => void;
  href?: string;
  isExternal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  const distanceFromMouse = useTransform(mouseY, (val) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return DISTANCE;
    return val - r.y - r.height / 2;
  });

  const sizeRaw = useTransform(
    distanceFromMouse,
    [-DISTANCE, 0, DISTANCE],
    [BASE_SIZE, MAGNIFIED_SIZE, BASE_SIZE]
  );
  const size = useSpring(sizeRaw, DOCK_SPRING);

  const handleHoverStart = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setTooltipPos({ top: r.top + r.height / 2, left: r.right + 12 });
    }
    setHovered(true);
  };

  const content = (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={handleHoverStart}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      tabIndex={0}
      role="button"
      className="relative inline-flex items-center justify-center cursor-pointer outline-none"
    >
      <div
        className={`
          w-full h-full rounded-[10px] flex items-center justify-center
          border transition-colors duration-200
          ${isActive
            ? "bg-[var(--sidebar-link-active-bg)] border-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)] shadow-[0_4px_16px_rgba(141,122,82,0.25)]"
            : "text-[var(--sidebar-text)]/60 hover:text-[var(--sidebar-text)] hover:border-[var(--sidebar-link-hover-border)]"
          }
        `}
        style={isActive ? undefined : {
          backgroundColor: "var(--sidebar-link-bg)",
          borderColor: "var(--sidebar-link-border)",
        }}
      >
        {icon}
      </div>

      {/* Floating label — fixed position to escape scroll clipping */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="px-2.5 py-1 rounded-md border text-white text-xs font-semibold whitespace-nowrap pointer-events-none"
            style={{
              position: "fixed",
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: "translateY(-50%)",
              zIndex: 9999,
              backgroundColor: "var(--sidebar-link-active-bg)",
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (href && !onClick) {
    if (isExternal) {
      return <a href={href} target="_top">{content}</a>;
    }
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/* ── Main Sidebar ── */
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
    window.location.href = `${dashboardUrl}?logout=true`;
  };

  /* ── Sidebar animation variants (matching admin dashboard) ── */
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
      className="hidden md:flex flex-col fixed left-5 top-5 bottom-5 z-50 overflow-visible"
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        borderWidth: "1px",
        borderRadius: "24px",
        boxShadow: "10px 10px 40px rgba(141, 122, 82, 0.05)",
        padding: isCollapsed ? "32px 0" : "32px 16px",
        overflowY: "hidden",
        overflowX: "visible",
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center mb-10 px-3 ${
          isCollapsed ? 'justify-center px-0' : 'justify-between'
        }`}
        style={{ height: "56px" }}
      >
        <motion.div
          animate={{
            opacity: isCollapsed ? 0 : 1,
            display: isCollapsed ? "none" : "flex",
          }}
          transition={{ duration: 0.3 }}
          className="items-center gap-2 font-semibold"
        >
          <Link href="/" className="flex items-center gap-2">
            <TriangleAlert className="h-6 w-6 text-[#8d7a52] dark:text-[#958A7A]" />
            <span className="text-[var(--sidebar-text)] font-bold text-sm tracking-wide">{storeName || 'POS'} Inc</span>
          </Link>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: isCollapsed ? 180 : 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleCollapse}
          className="group w-8 h-8 rounded-full bg-[var(--sidebar-link-bg)] border border-[var(--sidebar-link-border)] flex items-center justify-center cursor-pointer shadow-sm hover:bg-[var(--sidebar-link-active-bg)] hover:border-[var(--sidebar-link-active-bg)] transition-all flex-shrink-0"
        >
          {isCollapsed ? (
            <Menu size={15} className="text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-link-active-text)] transition-colors" />
          ) : (
            <ChevronLeft size={15} className="text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-link-active-text)] transition-colors" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      {isCollapsed ? (
        /* ── DOCK MODE (collapsed) — seamless macOS dock magnification ── */
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
            {/* Pilih Modul — at the top, styled like admin dashboard */}
            <DockNavItem
              icon={<Grid size={18} className="text-[#8d7a52] dark:text-[#958A7A]" />}
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
        /* ── EXPANDED MODE — framer-motion animated items (matching admin dashboard) ── */
        <>
          <nav
            className="flex flex-col gap-3 flex-grow overflow-y-auto overflow-x-hidden px-[3px] py-[15px] -mx-[3px]"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Pilih Modul button — matching admin dashboard style exactly */}
            <motion.a
              href={dashboardUrl}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, backgroundColor: "rgba(141, 122, 82, 0.15)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 px-6 py-3.5 rounded-[14px] text-sm font-bold cursor-pointer border whitespace-nowrap"
              style={{
                color: "#8d7a52",
                borderColor: "rgba(141, 122, 82, 0.3)",
                backgroundColor: "rgba(141, 122, 82, 0.04)",
                marginBottom: "8px",
              }}
            >
              <Grid size={18} className="text-[#8d7a52] dark:text-[#958A7A]" />
              <span>Pilih Modul</span>
            </motion.a>

            {/* Navigation items — motion.button with spring animations */}
            {visibleItems.map((item) => {
              const active = pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor: active
                      ? "var(--sidebar-link-active-bg)"
                      : "var(--sidebar-link-bg)",
                    color: active
                      ? "var(--sidebar-link-active-text)"
                      : "var(--sidebar-text)",
                    boxShadow: active
                      ? "0 8px 20px rgba(141, 122, 82, 0.25)"
                      : "none",
                  }}
                  whileHover={{
                    scale: 1.03,
                    backgroundColor: active
                      ? "var(--sidebar-link-active-bg)"
                      : "var(--sidebar-link-hover-bg)",
                    color: active
                      ? "var(--sidebar-link-active-text)"
                      : "var(--sidebar-link-hover-text)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="rounded-[14px] border cursor-pointer"
                  style={{
                    borderColor: active ? "transparent" : "var(--sidebar-link-border)",
                  }}
                  onClick={() => router.push(item.path)}
                >
                  <div className="flex items-center gap-4 px-6 py-3.5 text-sm font-medium whitespace-nowrap">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate"
                    >
                      {item.title}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </nav>

          {/* Footer — matching admin dashboard style */}
          <div
            className="mt-auto flex flex-col gap-2"
            style={{
              paddingTop: "24px",
              borderTop: "1px solid var(--sidebar-border)",
            }}
          >
            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-start gap-4 px-6 py-3.5 rounded-[14px] text-sm font-medium cursor-pointer transition-all whitespace-nowrap text-left"
              style={{
                backgroundColor: "var(--sidebar-link-bg)",
                borderWidth: "1px",
                borderColor: "var(--sidebar-link-border)",
                color: "var(--sidebar-text)",
              }}
            >
              <LogOut size={18} />
              <span>Keluar</span>
            </motion.button>
          </div>
        </>
      )}
    </motion.aside>
  );
}
