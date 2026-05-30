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
  words: { text: string; className?: string }[];
  onOpenClick: () => void;
}

export const IntroSection: React.FC<IntroSectionProps> = ({ words, onOpenClick }) => {
  return (
    <motion.div
      key="intro-screen"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col items-center justify-start pt-12 md:pt-20 h-full w-full px-4"
    >
      {/* Lottie Animation: Geometry (Placed above the Nexura Logo) - Enlarged 2x and tightened */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="-mb-60 flex justify-center items-center select-none"
        style={{ height: '220px', width: '400px' }}
        dangerouslySetInnerHTML={{
          __html: `<lottie-player src="/animated/Geometry.json" background="transparent" speed="1" style="width: 100%; height: 100%;" loop autoplay></lottie-player>`
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-6 flex justify-center"
      >
        <img
          src="/channels/nexura-logo.png"
          alt="Nexura Logo"
          className="h-32 w-auto object-contain dark:brightness-0 dark:invert drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
        />
      </motion.div>
      
      <p className={cn("text-neutral-850 dark:text-neutral-200 text-xl font-bold mb-10 tracking-wide", plusJakartaSans.className)}>
        Welcome to Nexura Global Hospitality
      </p>
      
      <TypewriterEffect words={words} />

      {/* Bottom Right Floating Open Button (Large Premium CTA style) */}
      <div className="absolute bottom-6 right-6 flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenClick}
          className={cn(
            "flex items-center justify-center gap-2.5 h-12 w-40 rounded-2xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-white transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:border-neutral-200 dark:bg-white dark:hover:bg-neutral-50 dark:text-black dark:shadow-[0_4px_20px_rgba(255,255,255,0.06)] hover:shadow-neutral-900/25 dark:hover:shadow-white/10 text-xs font-extrabold uppercase tracking-widest relative overflow-hidden group",
            plusJakartaSans.className
          )}
        >
          {/* Glow overlay */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <span className="relative z-10">Open</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
        </motion.button>
      </div>
    </motion.div>
  );
};
