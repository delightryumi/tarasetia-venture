'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LucideIcon, Lock, ArrowRight } from 'lucide-react';

import styles from './ModuleBentoGrid.module.css';

// --- Interfaces ---
export interface MenuItem {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  active: boolean;
  icon: LucideIcon | string;
  colSpan?: 1 | 2 | 3 | 4;
}

interface ModuleBentoGridProps {
  menus: MenuItem[];
}

// Per-module accent color palette — enterprise style
const MODULE_ACCENTS: Record<string, { icon: string; bg: string; bgDark: string; border: string }> = {
  'POS':            { icon: '#e05252', bg: 'rgba(224,82,82,0.06)',    bgDark: 'rgba(224,82,82,0.1)',    border: '#e05252' },
  'Front Office':   { icon: '#3b82f6', bg: 'rgba(59,130,246,0.06)',   bgDark: 'rgba(59,130,246,0.1)',   border: '#3b82f6' },
  'House Keeping':  { icon: '#14b8a6', bg: 'rgba(20,184,166,0.06)',   bgDark: 'rgba(20,184,166,0.1)',   border: '#14b8a6' },
  'Food & Beverage':{ icon: '#f97316', bg: 'rgba(249,115,22,0.06)', bgDark: 'rgba(249,115,22,0.1)',   border: '#f97316' },
  'Purchasing':     { icon: '#8b5cf6', bg: 'rgba(139,92,246,0.06)',   bgDark: 'rgba(139,92,246,0.1)',   border: '#8b5cf6' },
  'Accounting':     { icon: '#22c55e', bg: 'rgba(34,197,94,0.06)',    bgDark: 'rgba(34,197,94,0.1)',    border: '#22c55e' },
  'HRD & Absensi':  { icon: '#ec4899', bg: 'rgba(236,72,153,0.06)',   bgDark: 'rgba(236,72,153,0.1)',   border: '#ec4899' },
  'Superadmin':     { icon: '#f59e0b', bg: 'rgba(245,158,11,0.06)',   bgDark: 'rgba(245,158,11,0.1)',   border: '#f59e0b' },
};

const getAccent = (title: string) =>
  MODULE_ACCENTS[title] ?? { icon: '#6b7280', bg: 'rgba(107,114,128,0.06)', bgDark: 'rgba(107,114,128,0.1)', border: '#6b7280' };

const getCategory = (title: string) => {
  if (title === 'Superadmin') return 'System';
  if (title === 'Accounting' || title === 'Purchasing') return 'Finance';
  if (title === 'HRD & Absensi') return 'Human Resources';
  return 'Operations';
};

// --- Enterprise Card Component ---
const EnterpriseCard = ({ item }: { item: MenuItem }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const accent = getAccent(item.title);
  const category = getCategory(item.title);

  const cardStyle = {
    '--accent-color': accent.icon,
    '--accent-border': accent.border,
    '--accent-bg-glow': accent.bg,
  } as React.CSSProperties;

  const CardInner = (
    <div
      className={`${styles.card} ${!item.active ? styles.disabled : ''}`}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.cardBody}>
        {/* Header Row: Icon + Title Block */}
        <div className={styles.headerRow}>
          <div className={styles.iconWrapper}>
            {typeof item.icon === 'string' ? (
              <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>
                {item.icon}
              </span>
            ) : (
              React.createElement(Icon as LucideIcon, { strokeWidth: 1.5, className: styles.icon })
            )}
          </div>
          <div className={styles.titleBlock}>
            <span className={styles.categoryBadge}>{category}</span>
            <h3 className={styles.title}>{item.title}</h3>
          </div>
        </div>

        {/* Subtitle / Description */}
        <p className={styles.subtitle}>{item.subtitle}</p>
      </div>

      {/* Footer Action Bar */}
      <div className={styles.cardFooter}>
        {item.active ? (
          <div className={styles.actionLink}>
            <span className={styles.actionLabel}>Akses Modul</span>
            <ArrowRight size={14} className={styles.arrowIcon} />
          </div>
        ) : (
          <div className={styles.lockedLink}>
            <Lock size={12} className={styles.lockIcon} />
            <span className={styles.lockedLabel}>Hubungi Admin</span>
          </div>
        )}
      </div>
    </div>
  );

  return item.active ? (
    <Link href={item.href} className={styles.cardWrapper}>
      {CardInner}
    </Link>
  ) : (
    <div className={styles.cardWrapper}>
      {CardInner}
    </div>
  );
};

// --- Main Grid Container ---
export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  // If <= 4, keep in single row. Otherwise, split symmetrically:
  // E.g., 7 cards -> 3 top / 4 bottom. 6 cards -> 3 top / 3 bottom.
  const shouldSplit = menus.length > 4;
  const splitIndex = shouldSplit ? Math.floor(menus.length / 2) : menus.length;

  const firstRow = menus.slice(0, splitIndex);
  const secondRow = menus.slice(splitIndex);

  return (
    <div className={styles.gridContainer}>
      {/* Desktop Layout (Symmetric Rows) */}
      <div className={styles.desktopLayout}>
        <div className={styles.row}>
          {firstRow.map((item, idx) => (
            <EnterpriseCard key={item.title + idx} item={item} />
          ))}
        </div>
        {secondRow.length > 0 && (
          <div className={styles.row}>
            {secondRow.map((item, idx) => (
              <EnterpriseCard key={item.title + idx + 'r2'} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Layout (Standard Stack) */}
      <div className={styles.mobileLayout}>
        {menus.map((item, idx) => (
          <EnterpriseCard key={item.title + 'mob' + idx} item={item} />
        ))}
      </div>
    </div>
  );
}
