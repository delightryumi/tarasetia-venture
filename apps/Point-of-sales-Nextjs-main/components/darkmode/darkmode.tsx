"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, MoonStar, Monitor } from "lucide-react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-[8px] bg-[#282828] text-[#c2c2c2] shrink-0 flex items-center justify-center">
        <Sun className="w-[1.15rem] h-[1.15rem]" />
      </div>
    );
  }

  const changeTheme = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const getDropdownItemClass = (active: boolean) => {
    return `flex items-center w-full px-3 py-2 text-[13.5px] font-sans text-left border-none bg-transparent rounded-[8px] cursor-pointer transition-all duration-150 ${
      active
        ? "text-neutral-900 bg-neutral-100 dark:text-white dark:bg-neutral-800/80"
        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/55 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
    }`;
  };

  return (
    <div className="relative">
      {/* Dropdown Backdrop to close click-outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 cursor-default bg-transparent" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Theme switcher toggle trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-[8px] bg-[#282828] text-[#c2c2c2] hover:bg-[#333333] hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center relative z-50 cursor-pointer border-none focus:outline-none"
        title="Change theme"
      >
        <Sun className={`w-[1.15rem] h-[1.15rem] absolute transition-all duration-300 transform ${
          theme === 'light' ? 'rotate-0 scale-100' : 'rotate-95 scale-0'
        }`} />
        <MoonStar className={`w-[1.15rem] h-[1.15rem] absolute transition-all duration-300 transform ${
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
            className="absolute top-10 right-0 w-[140px] bg-white dark:bg-[#242424] border border-slate-200 dark:border-white/[0.08] rounded-[12px] shadow-lg p-[6px] z-50 flex flex-col gap-1"
          >
            <button
              onClick={() => changeTheme('light')}
              className={getDropdownItemClass(theme === 'light')}
            >
              Light
            </button>
            <button
              onClick={() => changeTheme('dark')}
              className={getDropdownItemClass(theme === 'dark')}
            >
              Dark
            </button>
            <button
              onClick={() => changeTheme('system')}
              className={getDropdownItemClass(theme === 'system')}
            >
              System
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
