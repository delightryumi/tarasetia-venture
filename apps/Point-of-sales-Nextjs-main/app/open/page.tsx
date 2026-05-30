'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IconBuilding,
  IconBed,
  IconCashBanknote,
  IconCoffee,
  IconShoppingBag,
  IconCalculator,
  IconSettings,
  IconLock,
  IconArrowLeft,
  IconArrowRight,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function OpenMenu() {
  const getHostUrl = (path: string) => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:3000${path}`;
    }
    return `http://localhost:3000${path}`;
  };

  const menus = [
    {
      title: 'POS',
      subtitle: 'Point of Sales',
      description: 'Open terminal register & sell',
      href: '/home',
      active: true,
      icon: IconCashBanknote,
    },
    {
      title: 'Front Office',
      subtitle: 'Reception & Desk',
      description: 'Reservations & guest services',
      href: getHostUrl('/overview?module=front-office'),
      active: true,
      icon: IconBuilding,
    },
    {
      title: 'House Keeping',
      subtitle: 'Cleaning & Status',
      description: 'Room checkouts & maintenance',
      href: getHostUrl('/overview?module=housekeeping'),
      active: true,
      icon: IconBed,
    },
    {
      title: 'Food & Beverage',
      subtitle: 'Dining & Services',
      description: 'Restaurant, room service & kitchen',
      href: '#',
      active: false,
      icon: IconCoffee,
    },
    {
      title: 'Purchasing',
      subtitle: 'Inventory & Stock',
      description: 'Suppliers, orders & materials',
      href: '#',
      active: false,
      icon: IconShoppingBag,
    },
    {
      title: 'Accounting',
      subtitle: 'Finance & Ledger',
      description: 'Balances, reports & audits',
      href: getHostUrl('/pnl?module=accounting'),
      active: true,
      icon: IconCalculator,
    },
    {
      title: 'CPanel',
      subtitle: 'System Admin',
      description: 'Configs, users & permissions',
      href: getHostUrl('/logo?module=cpanel'),
      active: true,
      icon: IconSettings,
    },
  ];

  // Framer Motion Animation Variants
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

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
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
    <div className="min-h-screen w-full dark:bg-black bg-gray-400/[0.5] dark:bg-grid-white/[0.1] bg-grid-black/[0.1] relative flex flex-col items-center justify-between overflow-y-auto overflow-x-hidden p-4 md:p-8 select-none">
      {/* Radial gradient mask matching http://localhost:3000 */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white/[0.8] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      {/* Floating Animated Background Glows */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 20, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-10 left-10 w-72 h-72 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none"
      />

      {/* Back to Landing Page Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 left-6 z-20"
      >
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-full px-4"
        >
          <Link href="/">
            <IconArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
        </Button>
      </motion.div>

      {/* Top Header */}
      <div className="text-center z-10 max-w-2xl px-4 mt-16 sm:mt-20">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-blue-600 dark:text-blue-500 font-semibold tracking-wider text-[10px] uppercase mb-1"
        >
          Lexura Enterprise Suite
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight"
        >
          Select Module
        </motion.h1>
      </div>

      {/* Cards Container Box */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-5xl z-10 px-4 mt-6 mb-auto"
      >
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
          {menus.map((item, idx) => {
            const Icon = item.icon;
            
            // Wrap inner content to avoid repetition
            const CardContent = (
              <>
                {/* Background Hover Glow */}
                <div
                  className={cn(
                    'absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    item.active
                      ? 'bg-gradient-to-r from-blue-500/10 to-transparent'
                      : 'bg-gradient-to-r from-amber-500/5 to-transparent'
                  )}
                />
                
                <div className="flex items-center gap-4 w-full">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-300',
                      item.active
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 group-hover:bg-blue-500/20 group-hover:scale-105'
                        : 'bg-white/5 dark:bg-white/5 border-neutral-200/50 dark:border-white/10 text-neutral-500 dark:text-neutral-400 group-hover:border-amber-500/30 group-hover:text-amber-500'
                    )}
                  >
                    {item.active && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                    <Icon className="w-5 h-5 transition-transform duration-300" />
                  </div>

                  {/* Texts */}
                  <div className="flex flex-col flex-grow text-left">
                    <h3
                      className={cn(
                        'text-sm font-semibold tracking-tight transition-colors duration-300',
                        item.active
                          ? 'text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          : 'text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100'
                      )}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Action Icon */}
                  <div className="flex-shrink-0 pl-2">
                    {item.active ? (
                      <IconArrowRight className="w-4 h-4 text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    ) : (
                      <IconLock className="w-4 h-4 text-neutral-400 dark:text-neutral-600 group-hover:text-amber-500/70 transition-colors duration-300" />
                    )}
                  </div>
                </div>
              </>
            );

            return (
              <motion.div
                key={idx}
                variants={cardVariants}
                whileHover={item.active ? { scale: 1.02 } : { scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'relative group overflow-hidden rounded-xl p-3 border backdrop-blur-sm transition-all duration-300 w-[280px] h-[80px] flex items-center select-none',
                  item.active
                    ? 'bg-white/80 dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md cursor-pointer'
                    : 'bg-white/40 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-80 hover:opacity-100 hover:border-amber-500/30 dark:hover:border-amber-500/30 cursor-not-allowed'
                )}
              >
                {item.active ? (
                  item.href.startsWith('http') ? (
                    <a href={item.href} target="_top" className="w-full h-full flex items-center">
                      {CardContent}
                    </a>
                  ) : (
                    <Link href={item.href} className="w-full h-full flex items-center">
                      {CardContent}
                    </Link>
                  )
                ) : (
                  <div className="w-full h-full flex items-center">
                    {CardContent}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="z-10 mt-auto pb-4 text-[11px] text-neutral-400 dark:text-neutral-500"
      >
        Lexura Platform © {new Date().getFullYear()} • All rights reserved
      </motion.div>
    </div>
  );
}
