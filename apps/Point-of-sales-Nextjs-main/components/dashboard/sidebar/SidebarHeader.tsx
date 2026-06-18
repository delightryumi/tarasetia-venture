'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TriangleAlert, Menu, ChevronLeft } from 'lucide-react';

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
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = () => {
      const savedLogo = localStorage.getItem('shopLogo');
      setLogo(savedLogo);
    };

    fetchLogo();
    window.addEventListener('logoChanged', fetchLogo);
    return () => window.removeEventListener('logoChanged', fetchLogo);
  }, []);

  return (
    <div
      className={`flex items-center mb-6 px-3 ${
        isCollapsed ? 'justify-center px-0' : 'justify-between'
      }`}
      style={{ minHeight: "56px" }}
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
          {logo ? (
            <img 
              src={logo} 
              alt="Store Logo" 
              className="h-12 max-w-[160px] object-contain"
            />
          ) : (
            <>
              <TriangleAlert className="h-5 w-5 text-[var(--sidebar-text)]" />
              <span className="text-[var(--sidebar-text)] font-bold text-sm tracking-wide">
                {storeName || 'POS'}
              </span>
            </>
          )}
        </Link>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggleCollapse}
        className="group w-8 h-8 rounded-full bg-[var(--sidebar-link-bg)] border border-[var(--sidebar-link-border)] flex items-center justify-center cursor-pointer shadow-none hover:bg-[var(--sidebar-link-hover-bg)] hover:border-[var(--sidebar-link-hover-border)] transition-all flex-shrink-0"
      >
        {isCollapsed ? (
          <Menu size={14} className="text-[var(--sidebar-text)] transition-colors" />
        ) : (
          <ChevronLeft size={14} className="text-[var(--sidebar-text)] transition-colors" />
        )}
      </motion.button>
    </div>
  );
}
