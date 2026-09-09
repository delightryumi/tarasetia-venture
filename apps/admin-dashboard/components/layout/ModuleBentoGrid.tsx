'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LucideIcon, Lock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

import styles from './ModuleBentoGrid.module.css';

// --- Interfaces ---
export interface MenuItem {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  active: boolean;
  icon: LucideIcon | string;
  image?: string;
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

// --- Enterprise Card Component ---
const EnterpriseCard = ({ item }: { item: MenuItem }) => {
  const Icon = item.icon;
  const accent = getAccent(item.title);

  const cardMarkup = (
    <div className={`${styles.bentoCard} ${!item.active ? styles.disabledCard : ''}`}>
      {item.image ? (
        <div className={styles.cardImageLayer}>
          <img src={item.image} alt={item.title} className={styles.cardImage} />
          <div className={styles.cardVignette} />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center -z-0">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: accent.bgDark }}>
            {typeof item.icon === 'string' ? (
              <span className="material-symbols-rounded text-[24px] md:text-[32px]" style={{ color: accent.icon }}>{item.icon}</span>
            ) : (
              React.createElement(Icon as LucideIcon, { strokeWidth: 1.5, color: accent.icon, className: "w-6 h-6 md:w-8 md:h-8" })
            )}
          </div>
        </div>
      )}

      <div className={styles.cardBody}>
        {/* Top bar: minimal lock icon only if disabled */}
        <div className={styles.topBar}>
          {!item.active && (
            <span className={styles.lockBadge}>
              <Lock size={10} />
            </span>
          )}
        </div>

        {/* Floating Glass Dock Bottom Plate */}
        <div className={styles.floatingDock}>
          <div className={styles.textGroup}>
            <span className={styles.cardTitle}>{item.title}</span>
            <span className={styles.cardSubtitle}>{item.subtitle}</span>
          </div>
          <div className={item.active ? styles.actionButton : styles.actionButtonDisabled}>
            {item.active ? (
              <ArrowRight size={13} strokeWidth={2.5} />
            ) : (
              <Lock size={10} strokeWidth={2.5} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return item.active ? (
    <Link href={item.href} className={styles.cardWrapper}>
      {cardMarkup}
    </Link>
  ) : (
    <div className={styles.cardWrapper}>
      {cardMarkup}
    </div>
  );
};

// --- Main Grid Container ---

export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true); // Default to true, we'll check in effect
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 2); // 2px margin of error
      
      // Calculate active index for dots 
      const isMobile = window.innerWidth <= 768;
      // On desktop: 250px card + 24px gap = 274px
      // On mobile: calc(100vw - 2rem) card + 1rem gap = 100vw - 32px + 16px = window.innerWidth - 16
      const itemWidth = isMobile ? window.innerWidth - 16 : 274;
      
      const index = Math.round(scrollLeft / itemWidth);
      setActiveIndex(Math.min(index, menus.length - 1));
    }
  };

  useEffect(() => {
    checkScroll(); // Check on mount
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [menus]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollRef.current) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollRef.current.scrollLeft += e.deltaY;
        }
      }
    };

    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const scrollPrev = () => {
    // Scroll back by ~2 cards
    const newIdx = Math.max(0, activeIndex - 2);
    scrollToItem(newIdx);
  };

  const scrollNext = () => {
    // Scroll forward by ~2 cards
    const newIdx = Math.min(menus.length - 1, activeIndex + 2);
    scrollToItem(newIdx);
  };

  const scrollToItem = (idx: number) => {
    if (scrollRef.current) {
      const isMobile = window.innerWidth <= 768;
      const itemWidth = isMobile ? window.innerWidth - 16 : 274;
      const offset = idx * itemWidth;
      scrollRef.current.scrollTo({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col w-full items-center">
      <div className={styles.carouselOuterWrapper}>
        {/* Left Gradient & Button */}
        {canScrollLeft && (
          <div className={`${styles.scrollGradient} ${styles.leftGradient}`} onClick={scrollPrev}>
            <button className={styles.scrollButton} aria-label="Scroll left">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div className={styles.carouselContainer} ref={scrollRef} onScroll={checkScroll}>
          <div className={styles.carouselTrack}>
            {menus.map((item, idx) => (
              <EnterpriseCard key={item.title + idx} item={item} />
            ))}
          </div>
        </div>

        {/* Right Gradient & Button */}
        {canScrollRight && (
          <div className={`${styles.scrollGradient} ${styles.rightGradient}`} onClick={scrollNext}>
            <button className={styles.scrollButton} aria-label="Scroll right">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Pagination Dots */}
      <div className={styles.paginationContainer}>
        {menus.map((_, idx) => (
          <div
            key={`dot-${idx}`}
            className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ''}`}
            onClick={() => scrollToItem(idx)}
          />
        ))}
      </div>
    </div>
  );
}
