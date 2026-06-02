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
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showGrid, setShowGrid] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'dark' | 'light');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Add Lottie Player CDN script dynamically
    const scriptId = 'lottie-player-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Suppress unhandled lottie-player/CDN script error events from triggering Next.js HMR overlay
    const handleRuntimeError = (event: ErrorEvent) => {
      if (
        !event.message ||
        event.message === 'Script error.' ||
        event.filename?.includes('lottie') ||
        event.message?.includes('lottie')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('error', handleRuntimeError);
    return () => {
      window.removeEventListener('error', handleRuntimeError);
    };
  }, []);

  useEffect(() => {
    if (showTransition) {
      let resolved = false;
      const handleComplete = () => {
        if (!resolved) {
          resolved = true;
          setShowTransition(false);
          setShowGrid(true);
        }
      };

      // Fallback timer ALWAYS runs to guarantee transition after 3.2 seconds
      const fallback = setTimeout(handleComplete, 3200);

      // Attempt to attach complete event listener on next tick after player element is rendered in DOM
      const attachTimer = setTimeout(() => {
        const player = document.getElementById('transition-player');
        if (player) {
          player.addEventListener('complete', handleComplete);
        }
      }, 150);

      return () => {
        clearTimeout(fallback);
        clearTimeout(attachTimer);
        const player = document.getElementById('transition-player');
        if (player) {
          player.removeEventListener('complete', handleComplete);
        }
      };
    }
  }, [showTransition]);

  useEffect(() => {
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

    fetchPermissions();
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
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

  const words = [
    {
      text: 'Optimizing',
    },
    {
      text: 'your',
    },
    {
      text: 'business',
    },
    {
      text: 'with',
    },
    {
      text: 'the',
    },
    {
      text: 'best',
    },
    {
      text: 'Solution .',
      className: 'text-blue-500 dark:text-blue-500',
    },
  ];

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
    return <LoginSection />;
  }

  return (
    <div className={styles.container}>
      
      {/* Radial gradient mask matching open/page.tsx */}
      <div className={styles.radialMask}></div>

      {/* Floating Animated Lottie (Bottom Right Corner - Behind Cards - Shown only in Workspace Module View) */}
      {showGrid && (
        <div
          className="absolute bottom-[-100px] right-[-100px] pointer-events-none z-0 opacity-[0.35] select-none"
          style={{ width: '480px', height: '480px' }}
          dangerouslySetInnerHTML={{
            __html: `<lottie-player src="/animated/Female Employee Working on Data Security.json" background="transparent" speed="1.1" style="width: 100%; height: 100%;" loop autoplay></lottie-player>`
          }}
        />
      )}

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
        className={styles.glowBlue}
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
        className={styles.glowIndigo}
      />

      {/* Modular Action Buttons (Matched to POS page spacing) */}
      <ModuleActionButtons
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        theme={theme}
        toggleTheme={toggleTheme}
        signOutUser={signOutUser}
      />

      {/* Main viewport body content */}
      <div className="flex-1 flex flex-col justify-center items-center relative overflow-y-auto w-full z-10 py-6">
        <AnimatePresence mode="wait">
          {showTransition ? (
            <TransitionSection />
          ) : !showGrid ? (
            <IntroSection words={words} onOpenClick={() => setShowTransition(true)} />
          ) : (
            <WorkspaceSection menus={menus} />
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
