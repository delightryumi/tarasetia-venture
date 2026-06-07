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
const LuxuryBentoCard = ({ item, isCenteredMobile }: { item: MenuItem; isCenteredMobile?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = getModuleTheme(item.title);
  const Icon = item.icon;

  const CardContent = (
    <div className="relative w-full h-full rounded-2xl overflow-hidden select-none">
      {/* Background with luxury corporate style */}
      <div 
        className={cn(
          "absolute inset-0 z-0 transition-all duration-500 backdrop-blur-xl rounded-2xl",
          "bg-white/55 dark:bg-[#0c0c0e]/40 border border-neutral-200/50 dark:border-white/[0.04]",
          item.active && isHovered && "border-[#c5a880] dark:border-[#a18a66] bg-white/80 dark:bg-[#121215]/60 shadow-[0_8px_32px_rgba(197,168,128,0.06)]"
        )}
      />

      {/* Lock status indicator at top right */}
      <div className="absolute top-3 right-3 z-20">
        {!item.active && (
          <Lock className="w-3.5 h-3.5 text-neutral-400/50 dark:text-neutral-600" />
        )}
      </div>

      {/* Content layout */}
      <div 
        className={cn(
          "relative z-10 h-full w-full px-3 sm:px-4 py-3.5 sm:py-3 flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 text-center sm:text-left",
          plusJakartaSans.className
        )}
      >
        {/* Left: Icon Container */}
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl shrink-0 transition-all duration-300 border relative overflow-hidden w-12 h-12 mb-1 sm:mb-0 sm:w-11 sm:h-11 shadow-sm',
            item.active
              ? `${theme.text} bg-white dark:bg-[#18181b]/90 border-neutral-200/80 dark:border-zinc-800/80`
              : 'bg-neutral-100/50 dark:bg-zinc-950/40 border-transparent text-neutral-400'
          )}
          style={item.active && isHovered ? {
            borderColor: theme.base + '25',
          } : {}}
        >
          {item.active && (
            <div 
              className={cn("absolute inset-0 opacity-[0.08] dark:opacity-[0.14] bg-gradient-to-tr", theme.glow)}
            />
          )}
          <Icon strokeWidth={1.5} className="w-5 h-5 relative z-10" />
        </div>

        {/* Right: Text elements */}
        <div className="flex flex-col flex-1 min-w-0 justify-center transition-transform duration-300 w-full items-center text-center sm:items-start sm:text-left">
          <h3
            className={cn(
              'text-[10px] sm:text-[11px] font-black tracking-[0.12em] sm:tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-1.5 justify-center sm:justify-start w-full',
              item.active
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-400 dark:text-neutral-600'
            )}
          >
            {item.title}
            {item.active && isHovered && (
              <ArrowRight className={cn('w-3.5 h-3.5 transition-transform hidden sm:block', theme.text)} />
            )}
          </h3>
          <p className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2 font-medium text-neutral-500 dark:text-neutral-400 leading-normal hidden sm:block">
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
        "group block relative rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.96] h-[110px] sm:h-[92px]",
        isCenteredMobile ? "w-[calc(50%-5px)] sm:w-[280px]" : "w-full sm:w-[280px]"
      )}
    >
      {CardContent}
    </Link>
  ) : (
    <div 
      className={cn(
        "relative rounded-2xl opacity-50 cursor-not-allowed h-[110px] sm:h-[92px]",
        isCenteredMobile ? "w-[calc(50%-5px)] sm:w-[280px]" : "w-full sm:w-[280px]"
      )}
    >
      {CardContent}
    </div>
  );
};

// --- Main Grid Container ---
export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  return (
    <div className="w-full max-w-5xl mx-auto z-10 p-2 sm:p-4">
      <div className={cn("grid grid-cols-2 gap-2.5 w-full sm:flex sm:flex-wrap sm:justify-center sm:gap-6", plusJakartaSans.className)}>
        {menus.map((item, idx) => {
          const isLastAndOdd = idx === menus.length - 1 && menus.length % 2 !== 0;
          return (
            <div 
              key={item.title + idx} 
              className={cn(
                "w-full sm:w-auto flex justify-center relative",
                isLastAndOdd ? "col-span-2 flex justify-center w-full sm:col-span-1 sm:w-auto" : ""
              )}
            >
              <LuxuryBentoCard item={item} isCenteredMobile={isLastAndOdd} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
