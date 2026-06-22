'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { SquaresFour } from '@phosphor-icons/react';

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
      className="flex flex-col gap-1.5 flex-grow overflow-y-auto overflow-x-hidden px-3"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Pilih Modul button — matching admin dashboard style exactly */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => { window.location.href = dashboardUrl; }}
        className="pos-nav-item select-module-btn border border-[var(--sidebar-border)] mb-2"
      >
        <SquaresFour size={18} className="text-[var(--sidebar-text)]" weight="bold" />
        <span>Pilih Modul</span>
      </motion.button>

      {/* Navigation items — motion.button with spring animations */}
      {visibleItems.map((item) => {
        const active = pathname === item.path;
        return (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`pos-nav-item ${active ? 'active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.title}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
