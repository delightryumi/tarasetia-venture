'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ModuleBentoGrid, MenuItem } from '@/components/layout/ModuleBentoGrid';
import { WorkspaceFooter } from './WorkspaceFooter';
import { DynamicIslandGreeting } from './DynamicIslandGreeting';
import { SpotlightSearchBar } from './SpotlightSearchBar';
import styles from './WorkspaceSection.module.css';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenus = useMemo(() => {
    if (!searchQuery.trim()) return menus;
    const q = searchQuery.toLowerCase().trim();
    return menus.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [menus, searchQuery]);

  return (
    <motion.div
      key="workspace-grid"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={styles.workspaceWrapper}
    >
      {/* Expanded Main Dashboard Container */}
      <div className={styles.mainContainer}>
        {/* iOS Dynamic Glass Greeting & Spotlight Search Widget Stack */}
        <div className={styles.widgetStack}>
          <DynamicIslandGreeting user={user} moduleCount={menus.length} />
          <SpotlightSearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Carousel / Grid Layout for Modules */}
        <div className={styles.gridContainer}>
          {filteredMenus.length > 0 ? (
            <ModuleBentoGrid menus={filteredMenus} />
          ) : (
            <div className={styles.emptyState}>
              Modul tidak ditemukan untuk kata kunci "{searchQuery}"
            </div>
          )}
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
