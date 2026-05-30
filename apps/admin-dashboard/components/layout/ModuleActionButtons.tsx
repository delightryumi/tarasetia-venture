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
    <div
      className="w-full flex justify-between items-center z-20 shrink-0 select-none"
      style={{
        paddingTop: '20px',
        paddingRight: '24px',
        paddingLeft: '24px',
        marginBottom: '16px',
      }}
    >
      {/* Left Side: Back button */}
      <div>
        <AnimatePresence mode="wait">
          {showGrid && (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowGrid(false)}
              className="flex items-center justify-center gap-2 h-9 w-28 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:border-black/[0.12] dark:hover:border-white/[0.16] text-neutral-750 dark:text-neutral-300 transition-all cursor-pointer shadow-sm backdrop-blur-md text-xs font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Right Side: Theme toggle & Logout */}
      <div className="flex items-center gap-3">
        {/* Theme switcher toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-zinc-900/30 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:border-black/[0.12] dark:hover:border-white/[0.16] text-neutral-750 dark:text-neutral-300 transition-all cursor-pointer shadow-sm backdrop-blur-md"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-amber-500" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-neutral-600" />
          )}
        </button>

        {/* Logout (Red themed glass deck button) */}
        <button
          onClick={signOutUser}
          className="flex items-center justify-center gap-2 h-9 w-28 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-zinc-900/30 hover:bg-red-50/80 dark:hover:bg-red-950/20 hover:border-red-200/60 dark:hover:border-red-900/30 text-neutral-750 dark:text-neutral-300 hover:text-red-650 dark:hover:text-red-400 font-medium transition-all text-xs cursor-pointer shadow-sm backdrop-blur-md"
        >
          <Power className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
