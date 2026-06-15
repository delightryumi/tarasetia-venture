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
  ShieldAlert,
  Menu,
  Users,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ModuleActionButtons } from '@/components/layout/ModuleActionButtons';
import { LoginSection } from '@/components/sections/login/LoginSection';
import { db } from '@/lib/firebase';
import { getHotelCollection } from '@/lib/firestoreHelper';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Import newly created modular components
import { IntroSection } from '@/components/select-module/IntroSection';
import { TransitionSection } from '@/components/select-module/TransitionSection';
import { WorkspaceSection } from '@/components/select-module/WorkspaceSection';
import { BillingAlertModal } from '@/components/layout/BillingAlertModal';
import { BillingSuspendedModal } from '@/components/layout/BillingSuspendedModal';
import styles from './select-module.module.css';

export default function SelectModulePage() {
  const { 
    user, 
    loading: authLoading, 
    signOutUser,
    activeHotelCode,
    activeHotelName,
    hotelsList,
    setActiveHotelCode 
  } = useAuth();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
  const [showGrid, setShowGrid] = useState(false);
  const [activeModules, setActiveModules] = useState<string[] | null>(null);
  const [isHotelActive, setIsHotelActive] = useState<boolean | null>(null);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);



  useEffect(() => {
    if (!activeHotelCode || isSuperadmin) {
      setActiveModules(null);
      setIsHotelActive(true);
      return;
    }
    const docRef = doc(db, 'hotels', activeHotelCode);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsHotelActive(data.active !== false);
        setNextDueDate(data.billing?.nextDueDate || '');
        let modules = data.billing?.activeModules || [];
        // Map old cpanel key to cpanel-full or cpanel-only
        if (modules.includes('cpanel')) {
          modules = modules.filter(m => m !== 'cpanel');
          const plan = data.billing?.plan || 'premium';
          if (plan === 'basic') {
            if (!modules.includes('cpanel-only')) modules.push('cpanel-only');
          } else {
            if (!modules.includes('cpanel-full')) modules.push('cpanel-full');
          }
        }
        if (modules.length === 0) {
          const plan = data.billing?.plan || 'premium';
          if (plan === 'basic') {
            modules = ['pos', 'cpanel-only'];
          } else {
            modules = ['pos', 'front-office', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'cpanel-full'];
          }
        }
        setActiveModules(modules);
      }
    }, (err) => {
      console.error('Error listening to hotel plan in select-module:', err);
    });
    return () => unsubscribe();
  }, [activeHotelCode, isSuperadmin]);

  useEffect(() => {
    setMounted(true);
    // Load theme
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'system';
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
      const isSuper = (user as any).role === "superadmin" || user.email.toLowerCase() === "nexura.management@gmail.com";
      const userSnap = await getDoc(
        isSuper 
          ? doc(db, "users_master", userDocId) 
          : doc(getHotelCollection(db, "users_master"), userDocId)
      );
      
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
    
    // Active modules restrictions if loaded (CPanel is always allowed for basic settings)
    if (activeModules !== null && moduleKey !== 'cpanel') {
      if (!activeModules.includes(moduleKey)) {
        return false;
      }
    }

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
  ];

  // Tambahkan kartu Superadmin secara dinamis hanya untuk superadmin
  if (isSuperadmin) {
    menus.push({
      title: 'Superadmin',
      subtitle: 'Central Registry',
      description: 'Manage hotel tenants & systems',
      href: '/superadmin',
      active: true,
      icon: ShieldAlert,
      colSpan: 1 as const,
    });
  }

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

  if (isHotelActive === false) {
    const formattedDueDate = nextDueDate
      ? new Date(nextDueDate).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '-';
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#08080a] font-sans">
        <BillingSuspendedModal
          hotelName={activeHotelName || 'Hotel'}
          formattedDueDate={formattedDueDate}
          signOutUser={signOutUser}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Header Bar Container */}
      <header className="w-full py-3.5 z-30 border-b border-slate-200/50 dark:border-zinc-800/45 bg-[#212121] dark:bg-zinc-950 select-none">
        <div className="w-full flex justify-between items-center pl-[60px] pr-[60px] md:pl-[120px] md:pr-[120px] lg:pl-[180px] lg:pr-[180px]">
          {/* Left Side: Nexura Logo & Hotel Badge/Selector */}
          <div className="flex items-center gap-4">
            <img
              src="/channels/nexura-logo.png"
              alt="Nexura Logo"
              className="h-10 md:h-12 w-auto object-contain ml-4"
            />
            
            {/* Divider line */}
            {(activeHotelCode || isSuperadmin) && (
              <div className="h-6 w-[1px] bg-zinc-800" />
            )}

            {/* Hotel Selector / Badge */}
            {isSuperadmin ? (
              <div className="relative flex items-center h-9 w-[260px] md:w-[320px] bg-white dark:bg-[#1a1a1c] border border-slate-300 dark:border-neutral-800 rounded-md overflow-hidden shadow-sm text-[13px] text-neutral-900 dark:text-neutral-200 transition-all">
                <select
                  value={activeHotelCode}
                  onChange={(e) => setActiveHotelCode(e.target.value)}
                  className="bg-transparent text-neutral-900 dark:text-neutral-200 border-none pr-10 py-1 text-[13px] font-medium focus:outline-none focus:ring-0 cursor-pointer appearance-none h-full w-full truncate rounded-md text-left"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239297a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px',
                    paddingLeft: '48px',
                  }}
                >
                  {hotelsList && hotelsList.length > 0 ? (
                    hotelsList.map((hotel) => (
                      <option key={hotel.hotelCode} value={hotel.hotelCode} className="bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-white">
                        [{hotel.hotelCode}] {hotel.name}
                      </option>
                    ))
                  ) : (
                    <option value="87241" className="bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-white">
                      [87241] Bumi Anyom Resort
                    </option>
                  )}
                </select>
              </div>
            ) : (
              activeHotelCode && (
                <div 
                  className="flex items-center h-9 pr-3 w-[260px] md:w-[320px] bg-white dark:bg-[#1a1a1c] border border-slate-300 dark:border-neutral-800 rounded-md overflow-hidden shadow-sm text-neutral-900 dark:text-neutral-200 text-[13px] font-semibold"
                  style={{ paddingLeft: '48px' }}
                >
                  <span className="truncate w-full text-left">
                    [{activeHotelCode}] {activeHotelName || 'Bumi Anyom Resort'}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Right Side: Action Buttons (Theme Switcher, Hamburger Menu, Logout) */}
          <div className="flex items-center gap-3">
            <ModuleActionButtons
              showGrid={false}
              setShowGrid={setShowGrid}
              theme={theme}
              changeTheme={changeTheme}
            />

            {/* Hamburger Menu (Garis 3) */}
            <div className={styles.menuWrapper}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={styles.menuButton}
                title="Menu CPanel & Akun"
              >
                <Menu className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className={styles.backdrop}
                      onClick={() => setIsMenuOpen(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className={styles.dropdownMenu}
                    >
                      {hasAccess('cpanel') && (
                        <>
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              router.push('/logo?module=cpanel');
                            }}
                            className={styles.dropdownItem}
                          >
                            <Settings className={styles.dropdownIcon} />
                            <span>CPanel</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              router.push('/users?module=cpanel');
                            }}
                            className={styles.dropdownItem}
                          >
                            <Users className={styles.dropdownIcon} />
                            <span>User Settings</span>
                          </button>

                          <div className={styles.dropdownDivider} />
                        </>
                      )}

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOutUser();
                        }}
                        className={styles.dropdownItemDanger}
                      >
                        <LogOut className={styles.dropdownIcon} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Decorative Vector Elements (Circles, Grid & Fluid Blobs) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none overflow-hidden">
        {/* Faint Luxury Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.03] pointer-events-none z-0" />

        {/* Soft overlay to ensure readability */}
        <div className="absolute inset-0 bg-white/5 dark:bg-black/10 backdrop-blur-[0.5px] pointer-events-none" />
      </div>

      {/* Aurora Lights (Dynamic Luxury Glows) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Light & Dark Mode Glows disabled for clean flat corporate design */}
      </div>

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
      <BillingAlertModal />
    </div>
  );
}
