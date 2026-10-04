import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  LucideIcon, Lock, ArrowRight, ShoppingCart, 
  Building2, BedDouble, UtensilsCrossed, ShoppingBag, 
  Calculator, Users, Globe, TrendingUp, Settings, ChevronRight
} from 'lucide-react';

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

// Per-module Apple SF iOS color palette & gradients
interface ModuleAccentDef {
  icon: React.ElementType;
  gradient: string;
  glow: string;
  accentColor: string;
  bgLight: string;
}

const MODULE_ACCENTS: Record<string, ModuleAccentDef> = {
  'POS': { 
    icon: ShoppingCart,
    gradient: 'linear-gradient(135deg, #ff2d55 0%, #ff375f 100%)', 
    glow: 'rgba(255, 45, 85, 0.45)', 
    accentColor: '#ff2d55',
    bgLight: 'rgba(255, 45, 85, 0.08)'
  },
  'Front Office': { 
    icon: Building2,
    gradient: 'linear-gradient(135deg, #007aff 0%, #0a84ff 100%)', 
    glow: 'rgba(0, 122, 255, 0.45)', 
    accentColor: '#007aff',
    bgLight: 'rgba(0, 122, 255, 0.08)'
  },
  'House Keeping': { 
    icon: BedDouble,
    gradient: 'linear-gradient(135deg, #30d158 0%, #34c759 100%)', 
    glow: 'rgba(48, 209, 88, 0.45)', 
    accentColor: '#30d158',
    bgLight: 'rgba(48, 209, 88, 0.08)'
  },
  'Food & Beverage': { 
    icon: UtensilsCrossed,
    gradient: 'linear-gradient(135deg, #ff9500 0%, #ff9f0a 100%)', 
    glow: 'rgba(255, 149, 0, 0.45)', 
    accentColor: '#ff9500',
    bgLight: 'rgba(255, 149, 0, 0.08)'
  },
  'Purchasing': { 
    icon: ShoppingBag,
    gradient: 'linear-gradient(135deg, #5856d6 0%, #5e5ce6 100%)', 
    glow: 'rgba(88, 86, 214, 0.45)', 
    accentColor: '#5856d6',
    bgLight: 'rgba(88, 86, 214, 0.08)'
  },
  'Accounting': { 
    icon: Calculator,
    gradient: 'linear-gradient(135deg, #ffd60a 0%, #ffcc00 100%)', 
    glow: 'rgba(255, 214, 10, 0.45)', 
    accentColor: '#eab308',
    bgLight: 'rgba(234, 179, 8, 0.08)'
  },
  'HRD & Absensi': { 
    icon: Users,
    gradient: 'linear-gradient(135deg, #af52de 0%, #bf5af2 100%)', 
    glow: 'rgba(175, 82, 222, 0.45)', 
    accentColor: '#af52de',
    bgLight: 'rgba(175, 82, 222, 0.08)'
  },
  'Channel Manager': { 
    icon: Globe,
    gradient: 'linear-gradient(135deg, #00c6ff 0%, #007aff 100%)', 
    glow: 'rgba(0, 198, 255, 0.45)', 
    accentColor: '#00c6ff',
    bgLight: 'rgba(0, 198, 255, 0.08)'
  },
  'Inalytics': { 
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, #32d74b 0%, #00c6ff 100%)', 
    glow: 'rgba(50, 215, 75, 0.45)', 
    accentColor: '#32d74b',
    bgLight: 'rgba(50, 215, 75, 0.08)'
  },
  'Superadmin': { 
    icon: Settings,
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
    glow: 'rgba(100, 116, 139, 0.45)', 
    accentColor: '#64748b',
    bgLight: 'rgba(100, 116, 139, 0.08)'
  },
};

const getAccent = (title: string): ModuleAccentDef =>
  MODULE_ACCENTS[title] ?? { 
    icon: Settings, 
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', 
    glow: 'rgba(100, 116, 139, 0.35)', 
    accentColor: '#64748b',
    bgLight: 'rgba(100, 116, 139, 0.08)'
  };

// --- Apple iOS Module Card Component with Rich 3D Image ---
const EnterpriseCard = ({ item }: { item: MenuItem }) => {
  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (_) {}
    }
  };

  const cardMarkup = (
    <div className={`${styles.bentoCard} ${!item.active ? styles.disabledCard : ''}`}>
      {/* Background Image Layer & Dark Gradient Vignette */}
      <div className={styles.cardImageLayer}>
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.title} 
            className={styles.cardImage} 
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className={styles.cardVignette} />
      </div>

      {/* Card Body Overlay */}
      <div className={styles.cardBody}>
        {/* Top Bar for Lock / Status Badge */}
        <div className={styles.topBar}>
          {!item.active && (
            <span className={styles.lockBadge}>
              <Lock size={10} color="#ffffff" />
              <span>Terkunci</span>
            </span>
          )}
        </div>

        {/* Bottom Floating Glass Dock (iOS Frosted Pill) */}
        <div className={styles.floatingDock}>
          <div className={styles.textGroup}>
            <span className={styles.cardTitle}>{item.title}</span>
            <span className={styles.cardSubtitle}>{item.subtitle}</span>
          </div>
          <div 
            className={item.active ? styles.actionButton : styles.actionButtonDisabled}
          >
            {item.active ? (
              <ChevronRight size={14} strokeWidth={2.5} />
            ) : (
              <Lock size={10} strokeWidth={2.5} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return item.active ? (
    <Link 
      href={item.href} 
      className={styles.cardWrapper}
      onClick={() => triggerHaptic(12)}
    >
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
