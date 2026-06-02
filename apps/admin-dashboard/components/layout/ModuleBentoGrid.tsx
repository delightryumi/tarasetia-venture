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
        text: 'text-yellow-600 dark:text-yellow-450',
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

// --- Premium Card Component with 3D Tilt & Spotlight ---
const LuxuryBentoCard = ({ item }: { item: MenuItem }) => {
  const ref = useRef<HTMLAnchorElement | HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const theme = getModuleTheme(item.title);
  const Icon = item.icon;

  // Mouse position values for 3D effect and Spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for fluid animation (Apple-like)
  const smoothMouseX = useSpring(mouseX, { damping: 25, stiffness: 150 });
  const smoothMouseY = useSpring(mouseY, { damping: 25, stiffness: 150 });

  // Calculate 3D rotation based on mouse position
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-4, 4]);

  // Unconditionally declare the spotlight background motion value to satisfy Rules of Hooks
  const spotlightBg = useTransform(
    [smoothMouseX, smoothMouseY],
    ([x, y]) => `radial-gradient(120px circle at ${(x as number + 0.5) * 100}% ${(y as number + 0.5) * 100}%, ${theme.base}22, transparent 65%)`
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Normalize coordinates from -0.5 to 0.5
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset position gently
    mouseX.set(0);
    mouseY.set(0);
  };

  const CardContent = (
    <>
      {/* 1. Base Bento Grid styled Background with Premium Glassmorphism */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl z-0 transition-all duration-300",
          "bg-gradient-to-br from-white/90 to-neutral-50/50 dark:from-neutral-900/70 dark:to-neutral-950/40"
        )}
      />

      {/* 2. Soft Accent Background Glow (Shines on hover) */}
      <div 
        className="absolute inset-0 rounded-2xl z-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: item.active
            ? `radial-gradient(circle at 80% 80%, ${theme.base}12, transparent 65%)`
            : undefined,
          opacity: isHovered ? 1.0 : 0.6
        }}
      />

      {/* 3. Glassy Frost Overlay (giving the premium transparent "kaca" look) */}
      <div className="absolute inset-[1px] bg-white/70 dark:bg-black/45 backdrop-blur-xl rounded-[15px] z-10" />

      {/* 4. The Spotlight Border effect that follows mouse */}
      {item.active && isHovered && (
        <motion.div
          className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
          style={{
            background: spotlightBg
          }}
        />
      )}

      {/* 5. Static Border for structure */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl border z-20 pointer-events-none transition-all duration-500",
          item.active 
            ? "border-neutral-200/80 dark:border-white/[0.12]" 
            : "border-neutral-100 dark:border-white/[0.04]"
        )} 
        style={item.active && isHovered ? { 
          borderColor: theme.base + '66', 
          boxShadow: `inset 0 0 8px ${theme.base}08` 
        } : {}}
      />

      {/* 6. Lock / Active status indicator at top right */}
      <div className="absolute top-2.5 right-2.5 z-40">
        {item.active ? (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
          </span>
        ) : (
          <Lock className="w-2.5 h-2.5 text-neutral-400/80" />
        )}
      </div>

      {/* --- Actual Content Layer in Horizontal Row layout for 82px height --- */}
      <div 
        className={cn(
          "relative z-30 h-full w-full px-4 py-3.5 flex items-center gap-3.5 select-none transition-all duration-300",
          plusJakartaSans.className
        )}
      >
        {/* Left: Enlarged Icon Container with Floating animation */}
        <motion.div
          animate={item.active ? {
            y: [0, -2, 0],
          } : {}}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut"
          }}
          className={cn(
            'relative flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-all duration-500 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3)]',
            item.active
              ? `${theme.text}`
              : 'bg-neutral-100/50 dark:bg-neutral-900/30 border border-transparent text-neutral-400'
          )}
          style={item.active ? {
            backgroundColor: `${theme.base}12`,
            border: `1px solid ${theme.base}25`,
          } : {}}
        >
          {/* Glowing dot inside icon for active items */}
          {item.active && (
            <div 
              className="absolute inset-0 rounded-xl blur-sm opacity-25 z-[-1]" 
              style={{ backgroundColor: theme.base }} 
            />
          )}
          <Icon strokeWidth={1.5} className="w-6 h-6" />
        </motion.div>

        {/* Right: Title & Description with Hover shift and Text Shadow */}
        <div className="flex flex-col flex-1 min-w-0 text-left justify-center pl-0.5 transition-transform duration-300 group-hover:translate-x-1">
          <h3
            className={cn(
              'text-[13px] font-extrabold tracking-tight transition-all duration-300 flex items-center gap-1.5',
              item.active
                ? 'text-neutral-900 dark:text-white'
                : 'text-neutral-400'
            )}
            style={item.active && isHovered ? { textShadow: `0 0 8px ${theme.base}44` } : {}}
          >
            {item.title}
            {item.active && (
              <motion.div
                initial={{ x: -8, opacity: 0 }}
                animate={{ x: isHovered ? 0 : -4, opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ArrowRight className={cn('w-3 h-3', theme.text)} />
              </motion.div>
            )}
          </h3>
          <p className="text-[10.5px] mt-0.5 line-clamp-1 font-bold text-neutral-500 dark:text-neutral-400/90 leading-tight">
            {item.description}
          </p>
        </div>
      </div>
    </>
  );

  // Return conditionally rendered outer layouts to keep hook sequences identical
  return item.active ? (
    <Link
      href={item.href}
      ref={ref as React.RefObject<HTMLAnchorElement>}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1000,
      }}
      className={cn(
        "group block relative rounded-2xl h-[82px] w-full sm:w-[256px] cursor-pointer",
        "transition-all duration-500"
      )}
    >
      <motion.div
        animate={{
          y: isHovered ? -6 : 0,
          scale: isHovered ? 1.035 : 1,
          boxShadow: isHovered 
            ? `0 20px 40px -12px ${theme.base}33, 0 8px 16px -6px ${theme.base}20` 
            : '0 4px 20px -10px rgba(0,0,0,0.05)',
        }}
        whileTap={{ scale: 0.98 }} // Apple-like click effect
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-full h-full relative"
      >
        {CardContent}
      </motion.div>
    </Link>
  ) : (
    <div 
      className={cn(
        "relative rounded-2xl h-[82px] w-full sm:w-[256px]",
        "opacity-60 grayscale-[50%] cursor-not-allowed border border-dashed border-neutral-250 dark:border-white/[0.08]"
      )}
    >
      {CardContent}
    </div>
  );
};

// --- Main Grid Container ---
export function ModuleBentoGrid({ menus }: ModuleBentoGridProps) {
  // Staggering entrance animation yang sangat elegan
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-5xl mx-auto z-10 p-4"
    >
      {/* Symmetric wrapped layout centered on page with standard Tailwind gap classes */}
      <div className={cn("flex flex-wrap justify-center gap-x-6 gap-y-12 sm:gap-y-16 w-full", plusJakartaSans.className)}>
        {menus.map((item, idx) => (
          <motion.div 
            key={item.title + idx} 
            variants={itemVariants} 
            className="relative"
            style={{ zIndex: 1 }}
            whileHover={{ zIndex: 50 }}
          >
            <LuxuryBentoCard item={item} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
