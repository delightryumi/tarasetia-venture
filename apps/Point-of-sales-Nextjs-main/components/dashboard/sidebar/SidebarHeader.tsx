'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Storefront, CaretLeft, CaretRight } from '@phosphor-icons/react';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  storeName: string | null;
}

export function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  storeName,
}: SidebarHeaderProps) {
  return (
    <div
      className={`flex items-center mb-4 px-4 relative ${
        isCollapsed ? 'justify-center px-0' : 'justify-between'
      }`}
      style={{ minHeight: "56px" }}
    >
      {!isCollapsed ? (
        <div className="flex flex-col gap-0.5 w-full">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[var(--sidebar-text)] opacity-60">
            <Storefront size={14} weight="bold" />
            <span>Partner</span>
          </div>
          <span className="text-[12px] font-bold text-[var(--sidebar-text)] truncate max-w-[150px]">
            {storeName || 'POS'}
          </span>
        </div>
      ) : (
        <div className="flex justify-center w-full">
          <Storefront size={20} className="text-[var(--sidebar-text)]" weight="bold" />
        </div>
      )}

      {/* Toggle button matching Port 3000 absolute position */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleCollapse}
        className="sidebar-toggle"
      >
        {isCollapsed ? (
          <CaretRight size={12} weight="bold" />
        ) : (
          <CaretLeft size={12} weight="bold" />
        )}
      </motion.button>
    </div>
  );
}
