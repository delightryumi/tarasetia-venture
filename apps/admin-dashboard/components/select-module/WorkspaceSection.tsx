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
      className="flex flex-col justify-start md:justify-center items-center w-full h-full relative z-10 overflow-y-auto"
    >
      {/* Centered Main Dashboard Container */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-5 md:gap-7 pt-6 md:pt-0 pb-16">
        
        {/* Header Section with Title */}
        <div className="text-center flex flex-col items-center gap-1 max-w-2xl px-4">
          <h1 className="text-xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            Select Module
          </h1>
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
