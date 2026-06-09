'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  BedDouble,
  Banknote,
  Coffee,
  ShoppingBag,
  Calculator,
  Settings,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ModuleActionButtons } from '@/components/layout/ModuleActionButtons';
import { LoginSection } from '@/components/sections/login/LoginSection';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Import newly created modular components
import { IntroSection } from '@/components/select-module/IntroSection';
import { TransitionSection } from '@/components/select-module/TransitionSection';
import { WorkspaceSection } from '@/components/select-module/WorkspaceSection';
import styles from './select-module.module.css';

export default function SelectModulePage() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'dark';
    setTheme(savedTheme);
    let resolved = savedTheme;
    if (savedTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Check if intro is requested
    const urlParams = new URLSearchParams(window.location.search);
    const isIntro = urlParams.get('intro') === 'true';
    setShowGrid(!isIntro);
  }, []);

  const fetchPermissions = async () => {
    if (!user?.email) {
      setLoadingPerms(false);
      return;
    }

    try {
      const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
      const userSnap = await getDoc(doc(db, "users_master", userDocId));
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const role = userData.role;
        
        if (role === "superadmin") {
          setIsSuperadmin(true);
          setLoadingPerms(false);
          return;
        }

        setUserPermissions(userData.permissions || {});
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setLoadingPerms(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const changeTheme = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    let resolved = newTheme;
    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const hasAccess = (moduleKey: string) => {
    if (isSuperadmin) return true;
    if (!userPermissions) return false;
    
    switch (moduleKey) {
      case 'pos':
        return userPermissions['module_pos'] !== undefined 
          ? !!userPermissions['module_pos'] 
          : userPermissions['pos'] !== false;
      case 'front-office':
        return userPermissions['module_front_office'] !== undefined 
          ? !!userPermissions['module_front_office'] 
          : (userPermissions['overview'] !== false || userPermissions['forecast'] !== false || userPermissions['invoice'] !== false);
      case 'housekeeping':
        return userPermissions['module_housekeeping'] !== undefined 
          ? !!userPermissions['module_housekeeping'] 
          : (userPermissions['overview'] !== false || userPermissions['forecast'] !== false);
      case 'accounting':
        return userPermissions['module_accounting'] !== undefined 
          ? !!userPermissions['module_accounting'] 
          : userPermissions['pnl'] !== false;
      case 'purchasing':
        return userPermissions['module_purchasing'] !== undefined 
          ? !!userPermissions['module_purchasing'] 
          : userPermissions['purchasing'] !== false;
      case 'food-beverage':
        return userPermissions['module_food_beverage'] !== undefined 
          ? !!userPermissions['module_food_beverage'] 
          : userPermissions['food-beverage'] !== false;
      case 'cpanel':
        return userPermissions['module_cpanel'] !== undefined 
          ? !!userPermissions['module_cpanel'] 
          : userPermissions['users'] !== false;
      default:
        return false;
    }
  };

  const menus = [
    {
      title: 'POS',
      subtitle: 'Point of Sales',
      description: 'Open terminal register & sell',
      href: '/pos',
      active: hasAccess('pos'),
      icon: Banknote,
      colSpan: 1 as const,
    },
    {
      title: 'Front Office',
      subtitle: 'Reception & Desk',
      description: 'Reservations & guest services',
      href: '/overview?module=front-office',
      active: hasAccess('front-office'),
      icon: Building2,
      colSpan: 1 as const,
    },
    {
      title: 'House Keeping',
      subtitle: 'Cleaning & Status',
      description: 'Room checkouts & maintenance',
      href: '/overview?module=housekeeping',
      active: hasAccess('housekeeping'),
      icon: BedDouble,
      colSpan: 1 as const,
    },
    {
      title: 'Food & Beverage',
      subtitle: 'Dining & Services',
      description: 'Restaurant, room service & kitchen',
      href: '/food-beverage/product?module=food-beverage',
      active: hasAccess('food-beverage'),
      icon: Coffee,
      colSpan: 1 as const,
    },
    {
      title: 'Purchasing',
      subtitle: 'Inventory & Stock',
      description: 'Suppliers, orders & materials',
      href: '/purchasing',
      active: hasAccess('purchasing'),
      icon: ShoppingBag,
      colSpan: 1 as const,
    },
    {
      title: 'Accounting',
      subtitle: 'Finance & Ledger',
      description: 'Balances, reports & audits',
      href: '/pnl?module=accounting',
      active: hasAccess('accounting'),
      icon: Calculator,
      colSpan: 1 as const,
    },
    {
      title: 'CPanel',
      subtitle: 'System Admin',
      description: 'Configs, users & permissions',
      href: '/logo?module=cpanel',
      active: hasAccess('cpanel'),
      icon: Settings,
      colSpan: 1 as const,
    },
  ];

  if (!mounted) {
    return null;
  }

  if (authLoading || loadingPerms) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-50 dark:bg-black text-neutral-800 dark:text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-neutral-450 uppercase animate-pulse">Loading auth session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Decorative Vector Elements (Circles, Grid & Fluid Blobs) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none overflow-hidden">
        {/* Living Mesh Gradient Blobs (Light Mode Only) */}
        <div className={`${styles.blob} ${styles.blob1} dark:hidden`} />
        <div className={`${styles.blob} ${styles.blob2} dark:hidden`} />
        <div className={`${styles.blob} ${styles.blob3} dark:hidden`} />

        {/* Faint Luxury Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.03] pointer-events-none z-0" />

        {/* Concentric Rotating Glass Rings (Aesthetic lens) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-dashed border-white/30 animate-[spin_180s_linear_infinite] pointer-events-none dark:hidden" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-white/10 pointer-events-none dark:hidden" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-white/20 pointer-events-none dark:hidden" />

        {/* Aesthetic Dot Matrix Patterns */}
        <div className="absolute top-[12%] right-[8%] w-[120px] h-[160px] bg-dot-white opacity-60 dark:hidden" />
        <div className="absolute bottom-[18%] left-[6%] w-[120px] h-[140px] bg-dot-white opacity-40 dark:hidden" />

        {/* Soft white/sunlight ambient glow */}
        <div className="absolute top-[10%] right-[20%] w-[350px] h-[350px] rounded-full bg-white/10 blur-[100px] dark:hidden" />

        {/* Luxury Grain Overlay for Depth */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay dark:hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* Dark theme background image */}
        <img
          src="/luxury-bg-dark.png"
          alt="Luxury Abstract Background Dark"
          className="w-full h-full object-cover hidden dark:block opacity-70 transition-opacity duration-700"
        />
        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-white/5 dark:bg-[#060606]/35 backdrop-blur-[0.5px] pointer-events-none" />
      </div>

      {/* Aurora Lights (Dynamic Luxury Glows) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Light Mode Glows (Updated to soft white/cream with amber/maroon blushes) */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-white/35 to-amber-100/10 blur-[120px] dark:hidden" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-white/25 to-red-100/5 blur-[120px] dark:hidden" />
        
        {/* Dark Mode Glows */}
        <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-indigo-950/20 to-purple-950/10 blur-[150px] hidden dark:block" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-emerald-950/15 to-teal-950/10 blur-[150px] hidden dark:block" />
      </div>

      {/* Modular Action Buttons (Now floating bottom-left) */}
      <ModuleActionButtons
        showGrid={false}
        setShowGrid={setShowGrid}
        theme={theme}
        changeTheme={changeTheme}
        signOutUser={signOutUser}
      />

      {/* Main viewport body content */}
      <div className={`flex-grow flex flex-col items-center relative overflow-y-auto overflow-x-hidden w-full h-full z-10 ${showGrid ? 'justify-start md:justify-center pt-8 pb-32 md:py-0' : 'justify-center pt-8 md:py-0'}`}>
        {showGrid ? (
          <WorkspaceSection
            menus={menus}
            user={user}
            isSuperadmin={isSuperadmin}
            onRefresh={fetchPermissions}
            onSignOut={signOutUser}
            isRefreshing={loadingPerms}
          />
        ) : (
          <IntroSection onOpenClick={() => setShowGrid(true)} />
        )}
      </div>
    </div>
  );
}
