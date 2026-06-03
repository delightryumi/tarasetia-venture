'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Power } from 'lucide-react';

interface ModuleActionButtonsProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  theme: string;
  toggleTheme: () => void;
  signOutUser: () => void;
}

export function ModuleActionButtons({
  showGrid,
  setShowGrid,
  theme,
  toggleTheme,
  signOutUser,
}: ModuleActionButtonsProps) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-1.5 p-1 bg-white/80 dark:bg-[#0c0c0c]/85 border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-md select-none pointer-events-auto">
      {/* Theme switcher toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center w-8 h-8 rounded-md text-neutral-600 dark:text-neutral-450 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
        title="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>

      {/* Logout button */}
      <button
        onClick={signOutUser}
        className="flex items-center justify-center w-8 h-8 rounded-md text-neutral-600 dark:text-neutral-450 hover:text-red-650 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
        title="Sign Out"
      >
        <Power className="w-4 h-4 shrink-0" />
      </button>
    </div>
  );
}
