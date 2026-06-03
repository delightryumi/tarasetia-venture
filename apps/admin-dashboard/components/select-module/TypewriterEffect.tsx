'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

interface Word {
  text: string;
  className?: string;
}

export const TypewriterEffect: React.FC<{ words: Word[] }> = ({ words }) => {
  const wordsArray = words.map((word) => {
    return {
      ...word,
      text: word.text.split(''),
    };
  });

  return (
    <div className={cn("flex flex-wrap justify-center text-center font-extrabold text-3xl sm:text-4xl md:text-6xl tracking-tight mb-8 gap-x-3.5 sm:gap-x-4 gap-y-2", plusJakartaSans.className)}>
      {wordsArray.map((word, idx) => {
        return (
          <div key={`word-${idx}`} className="flex whitespace-nowrap">
            {word.text.map((char, index) => (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.08, delay: (idx * 6 + index) * 0.04 }}
                key={`char-${index}`}
                className={cn('text-neutral-900 dark:text-white', word.className)}
              >
                {char}
              </motion.span>
            ))}
          </div>
        );
      })}
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ repeat: Infinity, duration: 0.8, repeatType: 'reverse' }}
        className="w-[3px] md:w-[4px] h-[32px] md:h-[48px] bg-sky-500 dark:bg-sky-400 inline-block ml-1 align-middle"
      />
    </div>
  );
};
