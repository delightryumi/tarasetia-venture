'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LucideIcon, Lock } from 'lucide-react';
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

// Per-module accent color palette — enterprise style
const MODULE_ACCENTS: Record<string, { icon: string; bg: string; bgDark: string; border: string }> = {
  'POS':          { icon: '#e05252', bg: 'rgba(224,82,82,0.08)',    bgDark: 'rgba(224,82,82,0.12)',    border: '#e05252' },
  'Front Office': { icon: '#3b82f6', bg: 'rgba(59,130,246,0.08)',   bgDark: 'rgba(59,130,246,0.12)',   border: '#3b82f6' },
  'House Keeping':{ icon: '#14b8a6', bg: 'rgba(20,184,166,0.08)',   bgDark: 'rgba(20,184,166,0.12)',   border: '#14b8a6' },
  'Food & Beverage':{ icon: '#f97316', bg: 'rgba(249,115,22,0.08)', bgDark: 'rgba(249,115,22,0.12)',   border: '#f97316' },
  'Purchasing':   { icon: '#8b5cf6', bg: 'rgba(139,92,246,0.08)',   bgDark: 'rgba(139,92,246,0.12)',   border: '#8b5cf6' },
  'Accounting':   { icon: '#22c55e', bg: 'rgba(34,197,94,0.08)',    bgDark: 'rgba(34,197,94,0.12)',    border: '#22c55e' },
  'Superadmin':   { icon: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   bgDark: 'rgba(245,158,11,0.12)',   border: '#f59e0b' },
};

const getAccent = (title: string) =>
  MODULE_ACCENTS[title] ?? { icon: '#6b7280', bg: 'rgba(107,114,128,0.08)', bgDark: 'rgba(107,114,128,0.12)', border: '#6b7280' };

// --- Enterprise Card Component ---
const EnterpriseCard = ({ item, isCenteredMobile }: { item: MenuItem; isCenteredMobile?: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const accent = getAccent(item.title);

  const sizeClass = isCenteredMobile
    ? 'w-[calc(50%-6px)] sm:w-[140px]'
    : 'w-full sm:w-[140px]';

  const CardInner = (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden select-none transition-all duration-250 flex flex-col items-center justify-center text-center gap-3 p-4',
        'h-[110px] sm:h-[140px]',
        inter.className,
        // Light mode base
        'bg-white border border-neutral-200/80',
        // Dark mode base
        'dark:bg-neutral-900 dark:border-neutral-800/60',
        item.active
          ? 'cursor-pointer'
          : 'opacity-55 cursor-not-allowed',
      )}
      style={{
        // Elevated shadow on hover
        boxShadow: item.active && isHovered
          ? '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        // Top accent stripe on hover
        borderTopColor: item.active && isHovered ? accent.border : undefined,
        borderTopWidth: item.active && isHovered ? '2px' : '1px',
        transform: item.active && isHovered ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Lock badge */}
      {!item.active && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <Lock className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
        </div>
      )}

      {/* Icon box — large, accent bg */}
      <div
        className="flex items-center justify-center rounded-xl w-12 h-12 sm:w-14 sm:h-14 shrink-0 transition-all duration-250"
        style={{
          backgroundColor: isHovered
            ? accent.bg
            : 'transparent',
          color: item.active ? accent.icon : '#9ca3af',
        }}
      >
        <Icon
          strokeWidth={1.5}
          className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-250"
          style={{ transform: item.active && isHovered ? 'scale(1.10)' : 'scale(1)' }}
        />
      </div>

      {/* Title + Description */}
      <div className="flex flex-col items-center gap-0.5">
        <h3
          className={cn(
            'text-[11px] sm:text-[12px] font-bold tracking-wide leading-tight transition-colors duration-250',
            item.active
              ? 'text-neutral-800 dark:text-neutral-100'
              : 'text-neutral-400 dark:text-neutral-600',
          )}
          style={{ color: item.active && isHovered ? accent.icon : undefined }}
        >
          {item.title}
        </h3>
        <p className="text-[8.5px] sm:text-[9.5px] font-normal text-neutral-500 dark:text-neutral-500 leading-tight line-clamp-1 max-w-[110px]">
          {item.subtitle}
        </p>
      </div>
    </div>
  );

  return item.active ? (
    <Link
      href={item.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('block relative rounded-xl', sizeClass)}
    >
      {CardInner}
    </Link>
  ) : (
    <div className={cn('relative rounded-xl', sizeClass)}>
      {CardInner}
    </div>
  );
};

// --- Divider with label ---
const RowDivider = ({ label }: { label?: string }) =>
  label ? (
    <div className="flex items-center gap-3 w-full max-w-[620px] px-1">
      <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-600 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
    </div>
  ) : null;

// --- Main Grid Container ---
export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  const splitIndex = menus.length >= 7 ? 4 : 3;
  const firstRow = menus.slice(0, splitIndex);
  const secondRow = menus.slice(splitIndex);
  const isOdd = menus.length % 2 !== 0;

  return (
    <div className={cn('w-full max-w-3xl mx-auto z-10 px-2 sm:px-4', inter.className)}>
      {/* ─── Desktop Layout ─── */}
      <div className="hidden sm:flex sm:flex-col sm:items-center gap-4">
        {/* Row 1 */}
        <div className="flex justify-center gap-4 w-full">
          {firstRow.map((item, idx) => (
            <EnterpriseCard key={item.title + idx} item={item} />
          ))}
        </div>

        {secondRow.length > 0 && (
          <>
            <RowDivider />
            {/* Row 2 */}
            <div className="flex justify-center gap-4 w-full">
              {secondRow.map((item, idx) => (
                <EnterpriseCard key={item.title + idx + 'r2'} item={item} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Mobile Layout: 2-column grid ─── */}
      <div className="grid grid-cols-2 gap-3 w-full sm:hidden">
        {menus.map((item, idx) => {
          const isLast = idx === menus.length - 1;
          const shouldBeCentered = isLast && isOdd;
          return (
            <div
              key={item.title + 'mob' + idx}
              className={cn(
                'w-full flex justify-center',
                shouldBeCentered ? 'col-span-2 flex justify-center' : ''
              )}
            >
              <EnterpriseCard item={item} isCenteredMobile={shouldBeCentered} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
