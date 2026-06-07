'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ModuleBentoGrid } from '@/components/layout/ModuleBentoGrid';

interface MenuItem {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  active: boolean;
  icon: any;
  colSpan: 1;
}

interface WorkspaceSectionProps {
  menus: MenuItem[];
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({ menus }) => {
  return (
    <motion.div
      key="workspace-grid"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-start items-center w-full px-6 sm:px-12 pt-10 sm:pt-8 pb-10 sm:pb-12 gap-9 sm:gap-10 md:gap-12"
    >
      {/* Top Header Label */}
      <div className="text-center z-10 max-w-2xl px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 sm:mb-5"
        >
          <img
            src="/channels/nexura-logo.png"
            alt="Nexura Logo"
            className="h-10 sm:h-16 w-auto object-contain dark:brightness-0 dark:invert drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-2xl sm:text-4xl font-light text-neutral-900 dark:text-white tracking-wide font-sans"
        >
          Select <span className="font-serif italic bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-[#c5a880] to-neutral-800 dark:from-white dark:via-[#e6ccb2] dark:to-neutral-300">Workspace</span> Module
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[#c5a880] dark:text-[#d4b285] font-extrabold mt-2.5 font-sans"
        >
          Nexura Global Hospitality
        </motion.p>
      </div>

      {/* Card Grid Container - Premium Bento Grid Layout */}
      <ModuleBentoGrid menus={menus} />
    </motion.div>
  );
};
