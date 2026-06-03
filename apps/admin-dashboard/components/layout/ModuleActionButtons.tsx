'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, MoonStar, Monitor, Power } from 'lucide-react';
import styles from './ModuleActionButtons.module.css';

interface ModuleActionButtonsProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  theme: 'dark' | 'light' | 'system';
  changeTheme: (theme: 'dark' | 'light' | 'system') => void;
  signOutUser: () => void;
}

export function ModuleActionButtons({
  showGrid,
  setShowGrid,
  theme,
  changeTheme,
  signOutUser,
}: ModuleActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.panelContainer}>
      
      {/* Dropdown Backdrop to close click-outside */}
      {isOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Theme switcher toggle container */}
      <div className="relative z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.circleButton}
          title="Change theme"
        >
          {/* Rotate transitions matching POS exactly */}
          <Sun className={`w-[1.15rem] h-[1.15rem] text-amber-500 absolute transition-all duration-300 transform ${
            theme === 'light' ? 'rotate-0 scale-100' : 'rotate-95 scale-0'
          }`} />
          <MoonStar className={`w-[1.15rem] h-[1.15rem] text-indigo-400 dark:text-neutral-200 absolute transition-all duration-300 transform ${
            theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-95 scale-0'
          }`} />
          <Monitor className={`w-[1.15rem] h-[1.15rem] absolute transition-all duration-300 transform ${
            theme === 'system' ? 'rotate-0 scale-100' : 'rotate-180 scale-0'
          }`} />
          <span className="sr-only">Toggle theme</span>
        </button>

        {/* Dropdown Menu matching standard POS Dropdown exactly */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className={styles.dropdownMenu}
            >
              <button
                onClick={() => {
                  changeTheme('light');
                  setIsOpen(false);
                }}
                className={`${styles.dropdownItem} ${
                  theme === 'light' ? styles.dropdownItemActive : ''
                }`}
              >
                Light
              </button>
              <button
                onClick={() => {
                  changeTheme('dark');
                  setIsOpen(false);
                }}
                className={`${styles.dropdownItem} ${
                  theme === 'dark' ? styles.dropdownItemActive : ''
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => {
                  changeTheme('system');
                  setIsOpen(false);
                }}
                className={`${styles.dropdownItem} ${
                  theme === 'system' ? styles.dropdownItemActive : ''
                }`}
              >
                System
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout button */}
      <button
        onClick={signOutUser}
        className={styles.circleButton}
        title="Sign Out"
      >
        <Power className="w-[1.15rem] h-[1.15rem] shrink-0" />
      </button>
    </div>
  );
}
