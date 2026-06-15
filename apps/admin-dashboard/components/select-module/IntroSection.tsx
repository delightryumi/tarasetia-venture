'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { TypewriterEffect } from './TypewriterEffect';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

interface IntroSectionProps {
  onOpenClick: () => void;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ onOpenClick }) => {
  const words = [
    { text: 'Optimizing' },
    { text: 'your' },
    { text: 'business' },
    { text: 'with' },
    { text: 'the' },
    { text: 'best' },
    {
      text: 'Solution.',
      className: 'text-sky-500 dark:text-sky-450 font-extrabold',
    },
  ];

  return (
    <motion.div
      key="intro-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center justify-center min-h-[60vh] w-full px-4 text-center select-none z-10"
    >
      {/* Background Soft Ambient Light (Luxury Glow) */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none z-0" />





      {/* Typewriter Effect Text Section */}
      <div className="w-full max-w-3xl z-10" style={{ minHeight: '140px', marginBottom: '24px' }}>
        <TypewriterEffect words={words} />
      </div>

      {/* Luxury Corporate CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="z-10"
        style={{ marginTop: '80px' }}
      >
        <button
          onClick={onOpenClick}
          className={cn(
            "group flex items-center justify-center gap-3 h-12 w-48 rounded-lg bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:!text-black font-extrabold uppercase tracking-[0.25em] text-xs cursor-pointer border border-neutral-800 dark:border-neutral-200 transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(255,255,255,0.05)] hover:shadow-neutral-950/20 dark:hover:shadow-white/10 active:scale-[0.97]",
            plusJakartaSans.className
          )}
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
        </button>
      </motion.div>
    </motion.div>
  );
};
