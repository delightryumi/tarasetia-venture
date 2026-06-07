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
      {/* Fixed Luxury Background Image Layers */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none overflow-hidden">
        <img
          src="/luxury-bg.png"
          alt="Luxury Bohemian Background Light"
          className="w-full h-full object-cover dark:hidden opacity-85 transition-opacity duration-700"
        />
        <img
          src="/luxury-bg-dark.png"
          alt="Luxury Abstract Background Dark"
          className="w-full h-full object-cover hidden dark:block opacity-70 transition-opacity duration-700"
        />
        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-white/10 dark:bg-[#060606]/35 backdrop-blur-[0.5px] pointer-events-none" />
      </div>

      {/* Aurora Lights (Dynamic Luxury Glows) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Light Mode Glows */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-blue-200/35 to-purple-200/20 blur-[120px] dark:hidden" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-amber-100/35 to-rose-100/20 blur-[120px] dark:hidden" />
        
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
      <div className="flex-1 flex flex-col justify-start md:justify-center items-center relative overflow-y-auto w-full z-10 py-6">
        {showGrid ? (
          <WorkspaceSection menus={menus} />
        ) : (
          <IntroSection onOpenClick={() => setShowGrid(true)} />
        )}
      </div>
    </div>
  );
}
