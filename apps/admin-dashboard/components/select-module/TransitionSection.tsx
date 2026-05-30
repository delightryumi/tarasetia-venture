'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const TransitionSection: React.FC = () => {
  return (
    <motion.div
      key="transition-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full px-4 -translate-y-28"
    >
      <div
        style={{ height: '360px', width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        dangerouslySetInnerHTML={{
          __html: `<lottie-player id="transition-player" src="/animated/Building Evolution Animation.json" background="transparent" speed="1.15" style="width: 100%; height: 100%;" autoplay></lottie-player>`
        }}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className={cn("text-blue-500/80 dark:text-blue-450 text-[10px] font-extrabold tracking-[0.2em] uppercase mt-2 animate-pulse", plusJakartaSans.className)}
      >
        Initializing Systems...
      </motion.p>
    </motion.div>
  );
};
