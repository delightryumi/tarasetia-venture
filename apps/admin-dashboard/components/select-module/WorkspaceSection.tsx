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
  user,
  isSuperadmin,
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
      className="flex flex-col items-center justify-start w-full h-full relative z-10 overflow-y-auto custom-scrollbar bg-[#f5f5f7] dark:bg-black transition-colors duration-300"
    >
      {/* Expanded Main Dashboard Container */}
      <div className="w-full flex flex-col justify-center items-center gap-8 h-full flex-grow">
        
        {/* Carousel Layout for Apple Aesthetic (Edge-to-edge) */}
        <div className="flex flex-col items-center w-full justify-center overflow-hidden h-full">
          <ModuleBentoGrid menus={menus} />
        </div>
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
