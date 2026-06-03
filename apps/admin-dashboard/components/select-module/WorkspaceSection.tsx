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
      className="flex flex-col justify-start items-center w-full px-4 pt-8 pb-32 sm:pb-12 gap-6 md:gap-8"
    >
      {/* Top Header Label */}
      <div className="text-center z-10 max-w-2xl px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-3"
        >
          <img
            src="/channels/nexura-logo.png"
            alt="Nexura Logo"
            className="h-16 w-auto object-contain dark:brightness-0 dark:invert drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-normal text-neutral-900 dark:text-white tracking-wide italic"
          style={{ fontFamily: 'Playfair Display, Georgia, Garamond, serif' }}
        >
          Select Workspace Module
        </motion.h1>
      </div>

      {/* Card Grid Container - Premium Bento Grid Layout */}
      <ModuleBentoGrid menus={menus} />
    </motion.div>
  );
};
