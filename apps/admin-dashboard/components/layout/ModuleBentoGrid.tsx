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
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  const accent = getAccent(item.title);

  const getCategory = (title: string) => {
    if (['POS', 'Front Office', 'House Keeping', 'Food & Beverage'].includes(title)) return 'OPERATIONS';
    if (['Purchasing', 'Accounting'].includes(title)) return 'FINANCE';
    if (['HRD & Absensi'].includes(title)) return 'HUMAN RESOURCES';
    return 'SYSTEM';
  };

  const DesktopCard = (
    <div className="hidden md:block w-full h-full">
      <div
        className={`${styles.appleCard} ${!item.active ? styles.disabled : ''} overflow-hidden`}
        style={{ '--accent-color': accent.icon, border: item.image ? 'none' : undefined, padding: item.image ? '0' : undefined } as React.CSSProperties}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {item.image && (
          <div className="absolute inset-0 w-full h-full -z-0 pointer-events-none bg-[#050505]">
             <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-70" />
             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
          </div>
        )}
        
        <div className={`${styles.appleCardContent} relative z-10 w-full h-full flex flex-col justify-between`} style={item.image ? { padding: '2rem 1.25rem 2rem 1.25rem' } : {}}>
          
          <div className="flex flex-col items-center w-full">
             <h3 className={styles.appleTitle} style={item.image ? { color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' } : {}}>{item.title}</h3>
             <p className={styles.appleSubtitle} style={item.image ? { color: '#d4d4d4', textShadow: '0 2px 8px rgba(0,0,0,0.8)' } : {}}>{item.subtitle}</p>
          </div>
          
          <div className={`${styles.appleActionContainer} mt-auto`}>
            {item.active ? (
              <button className={styles.appleButtonPrimary} style={item.image ? { backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', borderRadius: '9999px' } : {}}>Akses Modul</button>
            ) : (
               <button className={styles.appleButtonDisabled} style={item.image ? { color: '#a3a3a3', borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: '9999px' } : {}}>
                  <Lock size={12} className="mr-1.5 inline" /> Terkunci
               </button>
            )}
          </div>

          {!item.image && (
            <div className={styles.appleIconWrapper}>
                {typeof item.icon === 'string' ? (
                  <span className={`material-symbols-rounded ${styles.materialIcon}`} style={{ color: accent.icon }}>
                    {item.icon}
                  </span>
                ) : (
                  React.createElement(Icon as LucideIcon, { strokeWidth: 1, color: accent.icon, className: `${styles.lucideIcon} ${styles.appleLargeIcon}` })
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const MobileCard = (
    <div className="block md:hidden w-full h-full">
      <div
        className={`flex flex-col rounded-[16px] p-3.5 shadow-sm min-h-[140px] h-full relative overflow-hidden ${
          !item.active ? 'opacity-50 grayscale cursor-not-allowed' : ''
        } ${item.image ? 'border-none' : 'bg-white dark:bg-[#121212] border border-gray-100 dark:border-gray-800'}`}
      >
        {item.image && (
          <div className="absolute inset-0 w-full h-full -z-0 pointer-events-none bg-[#050505]">
             <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80" />
             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80"></div>
          </div>
        )}

        <div className={`flex flex-col w-full h-full relative z-10 ${item.image ? 'justify-between items-center' : ''}`}>
           {item.image ? (
              <>
                 {/* Top Content: Centered Title & Subtitle */}
                 <div className="flex flex-col items-center text-center mt-1 w-full">
                    <h3 className="text-[14px] font-bold text-white leading-tight" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-gray-200 mt-0.5" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                      {item.subtitle}
                    </p>
                 </div>
                 
                 {/* Bottom Content: Centered Action Pill */}
                 <div className="mt-auto flex justify-center w-full mb-3">
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full shadow-md">
                       <span className="text-[10px] font-bold tracking-wide">
                         {item.active ? 'Akses Modul' : 'Terkunci'}
                       </span>
                       {item.active ? <ArrowRight size={12} strokeWidth={2.5} /> : <Lock size={10} strokeWidth={2.5} />}
                    </div>
                 </div>
              </>
           ) : (
              <>
                {/* Konten Atas: Ikon & Teks Bersebelahan */}
                <div className="flex items-center gap-3 w-full">
                   {/* Kotak Ikon */}
                   <div 
                     className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm"
                     style={{ backgroundColor: accent.bg }}
                   >
                      {typeof item.icon === 'string' ? (
                        <span className="material-symbols-rounded text-[20px]" style={{ color: accent.icon }}>
                          {item.icon}
                        </span>
                      ) : (
                        <Icon color={accent.icon} size={20} strokeWidth={1.5} />
                      )}
                   </div>
                   
                   {/* Teks Judul & Kategori */}
                   <div className="flex flex-col justify-center overflow-hidden">
                      <p className="text-[9px] font-bold tracking-widest uppercase mb-0.5 truncate text-gray-500 dark:text-gray-400">
                        {getCategory(item.title)}
                      </p>
                      <h3 className="text-[13px] font-bold leading-[1.15] line-clamp-2 text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                   </div>
                </div>
                
                {/* Spacer */}
                <div className="flex-grow"></div>
                
                {/* Baris Bawah: Deskripsi & Panah (Sejajar) */}
                <div className="flex items-end justify-between w-full mt-3">
                  <p className="text-[10px] leading-snug line-clamp-2 max-w-[70%] text-gray-500 dark:text-gray-400">
                    {item.subtitle}
                  </p>
                  <div className="flex items-center gap-1 shrink-0 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                     <span className="text-[9px] font-bold">
                       {item.active ? 'Akses' : 'Kunci'}
                     </span>
                     {item.active ? <ArrowRight size={10} strokeWidth={3} /> : <Lock size={10} strokeWidth={3} />}
                  </div>
                </div>
              </>
           )}
        </div>
      </div>
    </div>
  );

  const CardInner = (
    <>
      {DesktopCard}
      {MobileCard}
    </>
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
