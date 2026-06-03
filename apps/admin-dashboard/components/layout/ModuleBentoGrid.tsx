'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { 
  motion, 
  useMotionValue, 
  useSpring, 
  useTransform 
} from 'framer-motion';
import { 
  LucideIcon, 
  Lock, 
  ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plus_Jakarta_Sans } from 'next/font/google';
import styles from './ModuleBentoGrid.module.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

// --- Interfaces ---
export interface MenuItem {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  active: boolean;
  icon: LucideIcon;
  colSpan?: 1 | 2 | 3 | 4;
}

interface ModuleBentoGridProps {
  menus: MenuItem[];
}

// --- Luxury Color Mapping ---
const getModuleTheme = (title: string) => {
  switch (title) {
    case 'POS':
      return {
        base: 'rgba(59, 130, 246, 1)', // Blue
        glow: 'from-blue-600/30 to-cyan-500/30',
        text: 'text-blue-500 dark:text-cyan-400',
        border: 'rgba(59, 130, 246, 0.2)',
      };
    case 'Front Office':
      return {
        base: 'rgba(16, 185, 129, 1)', // Emerald
        glow: 'from-emerald-600/30 to-teal-500/30',
        text: 'text-emerald-500 dark:text-teal-400',
        border: 'rgba(16, 185, 129, 0.2)',
      };
    case 'House Keeping':
      return {
        base: 'rgba(168, 85, 247, 1)', // Purple
        glow: 'from-purple-600/30 to-fuchsia-500/30',
        text: 'text-purple-500 dark:text-fuchsia-400',
        border: 'rgba(168, 85, 247, 0.2)',
      };
    case 'Food & Beverage':
      return {
        base: 'rgba(245, 158, 11, 1)', // Amber
        glow: 'from-amber-600/30 to-orange-500/30',
        text: 'text-amber-500 dark:text-orange-400',
        border: 'rgba(245, 158, 11, 0.2)',
      };
    case 'Purchasing':
      return {
        base: 'rgba(244, 63, 94, 1)', // Rose
        glow: 'from-rose-600/30 to-pink-500/30',
        text: 'text-rose-500 dark:text-pink-400',
        border: 'rgba(244, 63, 94, 0.2)',
      };
    case 'Accounting':
      return {
        base: 'rgba(234, 179, 8, 1)', // Yellow
        glow: 'from-yellow-600/30 to-amber-500/30',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'rgba(234, 179, 8, 0.2)',
      };
    case 'CPanel':
      return {
        base: 'rgba(99, 102, 241, 1)', // Indigo
        glow: 'from-indigo-600/30 to-violet-500/30',
        text: 'text-indigo-500 dark:text-violet-400',
        border: 'rgba(99, 102, 241, 0.2)',
      };
    default:
      return {
        base: 'rgba(161, 161, 170, 1)', // Zinc
        glow: 'from-zinc-500/30 to-neutral-400/30',
        text: 'text-zinc-500 dark:text-neutral-400',
        border: 'rgba(161, 161, 170, 0.2)',
      };
  }
};

// --- Luxury Corporate Card Component ---
const LuxuryBentoCard = ({ item }: { item: MenuItem }) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = getModuleTheme(item.title);
  const Icon = item.icon;

  const CardContent = (
    <div className="relative w-full h-full rounded-lg overflow-hidden select-none">
      {/* Background with luxury corporate style */}
      <div 
        className={cn(
          "absolute inset-0 z-0 transition-all duration-500 backdrop-blur-md rounded-lg",
          "bg-white/45 dark:bg-black/35 border border-neutral-200/50 dark:border-neutral-800/40",
          item.active && isHovered && "border-[#c5a880] dark:border-[#a18a66] bg-white/70 dark:bg-neutral-900/50 shadow-[0_8px_32px_rgba(197,168,128,0.08)]"
        )}
      />

      {/* Lock status indicator at top right */}
      <div className="absolute top-2.5 right-2.5 z-20">
        {!item.active && (
          <Lock className="w-3 h-3 text-neutral-400/60 dark:text-neutral-600" />
        )}
      </div>

      {/* Content layout */}
      <div 
        className={cn(
          "relative z-10 h-full w-full px-4 py-3 flex items-center gap-3.5",
          plusJakartaSans.className
        )}
      >
        {/* Left: Icon Container */}
        <div
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-lg shrink-0 transition-all duration-300 border',
            item.active
              ? `${theme.text} bg-white/60 dark:bg-[#121212]/40 border-neutral-200/90 dark:border-neutral-800/80`
              : 'bg-neutral-100/50 dark:bg-[#161616]/40 border-transparent text-neutral-400'
          )}
          style={item.active && isHovered ? {
            borderColor: theme.base + '25',
            backgroundColor: theme.base + '08',
          } : {}}
        >
          <Icon strokeWidth={1.5} className="w-5 h-5" />
        </div>

        {/* Right: Text elements */}
        <div className="flex flex-col flex-1 min-w-0 text-left justify-center pl-0.5 transition-transform duration-300">
          <h3
            className={cn(
              'text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-1.5',
              item.active
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-400 dark:text-neutral-600'
            )}
          >
            {item.title}
            {item.active && isHovered && (
              <ArrowRight className={cn('w-3.5 h-3.5 transition-transform', theme.text)} />
            )}
          </h3>
          <p className="text-[11px] mt-1 line-clamp-2 font-medium text-neutral-500 dark:text-neutral-400 leading-normal">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );

  return item.active ? (
    <Link
      href={item.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group block relative rounded-lg h-[92px] w-full sm:w-[280px] cursor-pointer",
        "transition-all duration-300 hover:scale-[1.01]"
      )}
    >
      {CardContent}
    </Link>
  ) : (
    <div 
      className={cn(
        "relative rounded-lg h-[92px] w-full sm:w-[280px]",
        "opacity-50 cursor-not-allowed"
      )}
    >
      {CardContent}
    </div>
  );
};

// --- Main Grid Container ---
export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  return (
    <div className="w-full max-w-5xl mx-auto z-10 p-4">
      <div className={cn("flex flex-wrap justify-center gap-4 sm:gap-6 w-full", plusJakartaSans.className)}>
        {menus.map((item, idx) => (
          <div key={item.title + idx} className="w-full sm:w-auto max-w-[280px] sm:max-w-none flex justify-center relative">
            <LuxuryBentoCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
