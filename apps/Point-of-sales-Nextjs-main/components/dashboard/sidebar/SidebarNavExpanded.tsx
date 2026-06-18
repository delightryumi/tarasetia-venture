'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Grid } from 'lucide-react';

interface SidebarNavExpandedProps {
  dashboardUrl: string;
  visibleItems: any[];
  pathname: string;
  router: any;
}

export function SidebarNavExpanded({
  dashboardUrl,
  visibleItems,
  pathname,
  router,
}: SidebarNavExpandedProps) {
  return (
    <nav
      className="flex flex-col gap-1.5 flex-grow overflow-y-auto overflow-x-hidden px-[3px] py-[10px] -mx-[3px]"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Pilih Modul button — matching admin dashboard style exactly */}
      <motion.a
        href={dashboardUrl}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-bold cursor-pointer border whitespace-nowrap transition-all bg-transparent text-[var(--sidebar-text)] border-[var(--sidebar-border)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)] hover:text-[var(--sidebar-link-hover-text)] mb-2"
      >
        <Grid size={18} className="text-[var(--sidebar-text)]" />
        <span>Pilih Modul</span>
      </motion.a>

      {/* Navigation items — motion.button with spring animations */}
      {visibleItems.map((item) => {
        const active = pathname === item.path;
        return (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`rounded-[6px] border cursor-pointer transition-all duration-200
              ${active 
                ? 'bg-[var(--sidebar-link-active-bg)] border-[var(--sidebar-link-active-bg)] text-[var(--sidebar-link-active-text)]' 
                : 'bg-transparent border-transparent text-[var(--sidebar-text)] hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)] hover:text-[var(--sidebar-link-hover-text)]'
              }`}
            onClick={() => router.push(item.path)}
          >
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold whitespace-nowrap">
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </div>
          </motion.div>
        );
      })}
    </nav>
  );
}
