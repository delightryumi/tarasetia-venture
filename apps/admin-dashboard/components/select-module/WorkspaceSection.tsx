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
        
        {/* Header Section with Centered Nexura Logo */}
        <div className="text-center flex flex-col items-center gap-2 max-w-2xl px-4 mt-6">
          
          {/* Centered Nexura Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-3"
          >
            <img
              src="/channels/nexura-logo.png"
              alt="Nexura Logo"
              className="h-14 sm:h-20 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </motion.div>

          {/* Title and Subtitle */}
          <h1 className="text-3xl sm:text-4xl font-normal text-[#1A1C14] dark:text-[#faf9f5] tracking-tight font-serif leading-snug">
            Select <span className="font-serif italic font-light text-[#8d7a52] dark:text-[#e2d6b5]">Workspace</span> Module
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
