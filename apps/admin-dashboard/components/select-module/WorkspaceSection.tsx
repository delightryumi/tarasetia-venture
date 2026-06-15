'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ModuleBentoGrid, MenuItem } from '@/components/layout/ModuleBentoGrid';
import { WorkspaceFooter } from './WorkspaceFooter';

interface WorkspaceSectionProps {
  menus: MenuItem[];
  user: {
    displayName: string;
    email: string;
    role?: string;
  } | null;
  isSuperadmin: boolean;
  onRefresh: () => Promise<void>;
  onSignOut: () => void;
  isRefreshing?: boolean;
}

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  menus,
  onRefresh,
  onSignOut,
  isRefreshing = false,
}) => {
  return (
    <motion.div
      key="workspace-grid"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col justify-center items-center w-full h-full relative z-10"
    >
      {/* Centered Main Dashboard Container */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6 md:gap-7 mb-32 md:mb-40 mt-8 md:mt-0">
        
        {/* Header Section with Title */}
        <div className="text-center flex flex-col items-center gap-1.5 max-w-2xl px-4 mt-4">
          <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-neutral-400 dark:text-neutral-500">
            Workspace
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            Select Module
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 font-normal">
            Choose a module to access the workspace
          </p>
        </div>

        {/* Bento Menu grid cards */}
        <ModuleBentoGrid menus={menus} />
      </div>

      {/* Modular Floating Bottom Corporate Footer */}
      <WorkspaceFooter
        onRefresh={onRefresh}
        onSignOut={onSignOut}
        isRefreshing={isRefreshing}
      />
    </motion.div>
  );
};
