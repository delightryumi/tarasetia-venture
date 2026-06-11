'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LucideIcon, 
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';

const inter = Inter({
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

// --- Luxury Corporate Card Component ---
const LuxuryBentoCard = ({ item, isCenteredMobile }: { item: MenuItem; isCenteredMobile?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  const CardContent = (
    <div className="relative w-full h-full rounded-lg overflow-hidden select-none transition-all duration-300">
      
      {/* Background layer matching Nexura branding */}
      <div 
        className={cn(
          "absolute inset-0 z-0 transition-all duration-300 rounded-lg",
          item.active
            ? "bg-white border border-[#e6dfd8]/40 dark:bg-zinc-900 dark:border-white/10"
            : "bg-[#FAF6F0]/30 border border-dashed border-[#e6dfd8]/30 dark:bg-zinc-900/30 dark:border-white/5",
          item.active && isHovered && "bg-white border-[#c5a880]/30 dark:bg-zinc-850 dark:border-[#c5a880]/30 shadow-[0_8px_25px_rgba(197,168,128,0.06)]"
        )}
      />

      {/* Brand prefix indicator dot (Gold/Maroon) */}
      {item.active && (
        <span className={cn(
          "absolute top-2.5 left-2.5 w-1 h-1 rounded-full bg-[#c5a880] transition-colors duration-300",
          isHovered && "bg-[#8d7a52] dark:bg-[#c5a880]"
        )} />
      )}

      {/* Lock badge */}
      {!item.active && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <Lock className="w-3 h-3 text-neutral-400 dark:text-zinc-650" />
        </div>
      )}

      {/* Content layout */}
      <div 
        className={cn(
          "relative z-10 h-full w-full p-2.5 sm:p-4 flex flex-col items-center justify-center text-center gap-2 sm:gap-3",
          inter.className
        )}
      >
        {/* Icon container */}
        <div
          className={cn(
            'flex items-center justify-center rounded-xl shrink-0 transition-all duration-350 border w-12 h-12 sm:w-16 sm:h-16 relative overflow-hidden',
            item.active
              ? 'bg-[#FAF6F0] border-[#e6dfd8]/40 text-[#8d7a52] dark:bg-zinc-950 dark:border-white/10 dark:text-[#c5a880]'
              : 'bg-[#FAF6F0]/20 border-transparent text-neutral-450/40 dark:bg-zinc-950/20 dark:text-zinc-650'
          )}
          style={item.active && isHovered ? {
            backgroundColor: '#8d7a52',
            borderColor: '#8d7a52',
            color: '#ffffff',
            transform: 'scale(1.04)',
          } : {}}
        >
          {/* Dark Mode Specific Overwrite for Hover */}
          {item.active && isHovered && (
            <div className="absolute inset-0 bg-[#c5a880] border-[#c5a880] text-[#09090b] hidden dark:block" />
          )}
          <Icon strokeWidth={1.25} className="w-7 h-7 sm:w-9 sm:h-9 relative z-20 dark:group-hover:text-[#09090b]" />
        </div>

        {/* Text metadata */}
        <div className="flex flex-col items-center w-full gap-0.5 sm:mt-0.5">
          <h3
            className={cn(
              'text-[9.5px] sm:text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-300',
              item.active
                ? 'text-[#1A1C14] dark:text-[#faf9f5] group-hover:text-[#8d7a52] dark:group-hover:text-[#c5a880]'
                : 'text-neutral-400 dark:text-zinc-600'
            )}
          >
            {item.title}
          </h3>
          <p className="text-[8px] sm:text-[9.5px] leading-relaxed font-normal text-neutral-600 dark:text-neutral-400 line-clamp-2 max-w-[125px]">
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
        "group block relative rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] h-[115px] sm:h-[155px]",
        isCenteredMobile ? "w-[calc(50%-6px)] sm:w-[150px]" : "w-full sm:w-[150px]"
      )}
    >
      {CardContent}
    </Link>
  ) : (
    <div 
      className={cn(
        "relative rounded-lg opacity-60 cursor-not-allowed h-[115px] sm:h-[155px]",
        isCenteredMobile ? "w-[calc(50%-6px)] sm:w-[150px]" : "w-full sm:w-[150px]"
      )}
    >
      {CardContent}
    </div>
  );
};

// --- Main Grid Container ---
export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  const firstRow = menus.slice(0, 3);
  const secondRow = menus.slice(3);

  return (
    <div className="w-full max-w-5xl mx-auto z-10 p-2 sm:p-4">
      {/* Desktop Layout: 3 top, 4 bottom */}
      <div className={cn("hidden sm:flex sm:flex-col sm:items-center sm:gap-5", inter.className)}>
        {/* Row 1: 3 cards */}
        <div className="flex justify-center gap-5 w-full">
          {firstRow.map((item, idx) => (
            <div key={item.title + idx} className="w-auto flex justify-center relative">
              <LuxuryBentoCard item={item} />
            </div>
          ))}
        </div>
        {/* Row 2: 4 cards */}
        <div className="flex justify-center gap-5 w-full">
          {secondRow.map((item, idx) => (
            <div key={item.title + idx} className="w-auto flex justify-center relative">
              <LuxuryBentoCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout: 2-column grid */}
      <div className={cn("grid grid-cols-2 gap-3.5 w-full sm:hidden", inter.className)}>
        {menus.map((item, idx) => {
          const isLast = idx === menus.length - 1;
          return (
            <div 
              key={item.title + 'mob' + idx} 
              className={cn(
                "w-full flex justify-center relative",
                isLast ? "col-span-2 flex justify-center w-full" : ""
              )}
            >
              <LuxuryBentoCard item={item} isCenteredMobile={isLast} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
