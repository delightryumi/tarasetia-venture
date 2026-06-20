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
    if (!activeHotelCode || activeHotelCode === "0") {
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
            modules = ['pos', 'front-office', 'housekeeping', 'food-beverage', 'purchasing', 'accounting', 'hrd', 'cpanel-full'];
          }
        }
        setActiveModules(modules);
      }
    }, (err) => {
      console.error('Error listening to hotel plan in select-module:', err);
    });
    return () => unsubscribe();
  }, [activeHotelCode, isSuperadmin]);

  // Skip Firestore hotel query saat superadmin tanpa preview
  useEffect(() => {
    if (isSuperadmin && (!activeHotelCode || activeHotelCode === "0")) {
      setActiveModules(null);
      setIsHotelActive(true);
    }
  }, [isSuperadmin, activeHotelCode]);


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

    // Listener to sync theme state on focus or local storage changes
    const syncThemeState = () => {
      const currentTheme = (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'system';
      setTheme(currentTheme);
    };
    window.addEventListener('focus', syncThemeState);
    window.addEventListener('storage', syncThemeState);

    // Check if intro is requested
    const urlParams = new URLSearchParams(window.location.search);
    const isIntro = urlParams.get('intro') === 'true';
    setShowGrid(!isIntro);

    return () => {
      window.removeEventListener('focus', syncThemeState);
      window.removeEventListener('storage', syncThemeState);
    };
  }, []);

  const fetchPermissions = async () => {
    if (!user?.email) {
      setLoadingPerms(false);
      return;
    }

    // Fallback cepat: jika AuthContext sudah konfirmasi superadmin
    if ((user as any).role === "superadmin") {
      setIsSuperadmin(true);
      setLoadingPerms(false);
      return;
    }

    try {
      const userDocId = user.email.toLowerCase().replace(/[@.]/g, '_');
      const userSnap = await getDoc(
        doc(getHotelCollection(db, "users_master"), userDocId)
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
    document.cookie = `shared_theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
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
    // Active modules restrictions if loaded (CPanel is always allowed for basic settings)
    if (activeModules !== null && moduleKey !== 'cpanel') {
      if (!activeModules.includes(moduleKey)) {
        return false;
      }
    }

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
      case 'hrd':
        return userPermissions['module_hrd'] !== undefined
          ? !!userPermissions['module_hrd']
          : userPermissions['hrd'] !== false;
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
      icon: 'point_of_sale',
      image: '/images/modules/pos.png',
      colSpan: 1 as const,
    },
    {
      title: 'Front Office',
      subtitle: 'Reception & Desk',
      description: 'Reservations & guest services',
      href: '/overview?module=front-office',
      active: hasAccess('front-office'),
      icon: 'domain',
      image: '/images/modules/fo.png',
      colSpan: 1 as const,
    },
    {
      title: 'House Keeping',
      subtitle: 'Cleaning & Status',
      description: 'Room checkouts & maintenance',
      href: '/overview?module=housekeeping',
      active: hasAccess('housekeeping'),
      icon: 'cleaning_services',
      image: '/images/modules/hk.png',
      colSpan: 1 as const,
    },
    {
      title: 'Food & Beverage',
      subtitle: 'Dining & Services',
      description: 'Restaurant, room service & kitchen',
      href: '/food-beverage/product?module=food-beverage',
      active: hasAccess('food-beverage'),
      icon: 'restaurant',
      image: '/images/modules/fb.png',
      colSpan: 1 as const,
    },
    {
      title: 'Purchasing',
      subtitle: 'Inventory & Stock',
      description: 'Suppliers, orders & materials',
      href: '/purchasing',
      active: hasAccess('purchasing'),
      icon: 'inventory',
      image: '/images/modules/purchasing.png',
      colSpan: 1 as const,
    },
    {
      title: 'Accounting',
      subtitle: 'Finance & Ledger',
      description: 'Balances, reports & audits',
      href: '/pnl?module=accounting',
      active: hasAccess('accounting'),
      icon: 'calculate',
      image: '/images/modules/accounting.png',
      colSpan: 1 as const,
    },
    {
      title: 'HRD & Absensi',
      subtitle: 'Staff & Shift',
      description: 'Manage staff, attendance & payroll',
      href: '/hrd?module=hrd',
      active: hasAccess('hrd'),
      icon: 'badge',
      image: '/images/modules/hrd.png',
      colSpan: 1 as const,
    },
  ];

  // Tambahkan kartu Superadmin secara dinamis hanya untuk superadmin
  if (isSuperadmin) {
    menus.push({
      title: 'Superadmin',
      subtitle: 'Central Registry',
      description: 'Manage hotel partners & systems',
      href: '/superadmin',
      active: true,
      icon: 'admin_panel_settings',
      image: '/images/modules/superadmin.png',
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
      <header className={styles.headerBar}>
        <div className={styles.headerInner}>
          {/* Left Side: Nexura Logo & Hotel Badge/Selector */}
          <div className={styles.logoArea}>
            <img
              src="/channels/6.png"
              alt="Nexura Logo"
              className={styles.logoImage}
            />

            {/* Divider line */}
            {(activeHotelCode || isSuperadmin) && (
              <div className={`${styles.dividerLine} hidden sm:block`} />
            )}

            {/* Hotel Selector / Badge */}
            {isSuperadmin ? (
              <div className={`relative hidden sm:flex items-center h-9 w-[260px] md:w-[320px] rounded-[6px] overflow-hidden shadow-sm text-[13px] transition-all ${styles.hotelBadge}`}>
                <select
                  value={activeHotelCode}
                  onChange={(e) => {
                    setActiveHotelCode(e.target.value);
                    window.location.reload();
                  }}
                  className={`border-none pr-8 sm:pr-10 py-1 text-[11px] sm:text-[13px] font-medium focus:outline-none focus:ring-0 cursor-pointer appearance-none h-full w-full truncate rounded-[6px] text-left ${styles.hotelSelect}`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239297a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '16px',
                    paddingLeft: '12px',
                  }}
                >
                  <option value="0">— Superadmin (tidak ada preview) —</option>
                  {hotelsList && hotelsList.length > 0 && (
                    hotelsList.map((hotel) => (
                      <option key={hotel.hotelCode} value={hotel.hotelCode}>
                        [{hotel.hotelCode}] {hotel.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              activeHotelCode && (
                <div
                  className={`hidden sm:flex items-center h-9 pr-3 w-[260px] md:w-[320px] rounded-[6px] overflow-hidden shadow-sm text-[11px] sm:text-[13px] font-semibold ${styles.hotelBadge}`}
                  style={{ paddingLeft: '8px' }}
                >
                  <span className="truncate w-full text-left" style={{ paddingLeft: '4px' }}>
                    [{activeHotelCode || "0"}] {activeHotelName || 'Memuat...'}
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
                      {/* User Login Info Profile Card */}
                      {(() => {
                        const userName = user?.displayName || user?.email?.split('@')[0] || "Administrator";
                        return (
                          <div className={styles.menuUserCard}>
                            <div 
                              className="w-10 h-10 rounded-full overflow-hidden border border-[#8d7a52]/40 flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: ['rgba(141, 122, 82, 0.15)', 'rgba(120, 128, 105, 0.15)', '#f3e8ff', '#e0e7ff', '#dcfce7', '#fee2e2', '#fef3c7'][((userName || "U").charCodeAt(0) || 0) % 7] }}
                            >
                              <img 
                                src={`/avatar/memo_${((((userName || "U").charCodeAt(0) || 0) + 5) % 35) + 1}.png`} 
                                alt={userName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className={`truncate ${styles.menuUserName}`}>{userName}</span>
                              <span className={`truncate ${styles.menuUserEmail}`}>{user?.email}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest">System Live</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Active Hotel Info (Mobile only) */}
                      <div className="px-3 py-2 bg-[#f8fafc] dark:bg-white/[0.03] rounded-[10px] mb-2 flex flex-col gap-0.5 border-t border-slate-200 dark:border-white/[0.08] pt-2 mt-1 sm:hidden">
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Active Hotel</span>
                        {isSuperadmin ? (
                          <select
                            value={activeHotelCode}
                            onChange={(e) => {
                              setActiveHotelCode(e.target.value);
                              window.location.reload();
                            }}
                            className="w-full mt-1 border border-slate-300 dark:border-white/[0.08] rounded-[6px] py-1 px-2 text-xs bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-[#f4f4f5] focus:outline-none"
                          >
                            <option value="0">— Superadmin (tidak ada preview) —</option>
                            {hotelsList && hotelsList.length > 0 && (
                              hotelsList.map((hotel) => (
                                <option key={hotel.hotelCode} value={hotel.hotelCode}>
                                  [{hotel.hotelCode}] {hotel.name}
                                </option>
                              ))
                            )}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-neutral-850 dark:text-[#f4f4f5] truncate">
                            {activeHotelCode === "0" || !activeHotelCode
                              ? "Superadmin"
                              : `[${activeHotelCode}] ${activeHotelName || '—'}`}
                          </span>
                        )}
                      </div>

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
      <div className={`flex-grow flex flex-col items-center relative overflow-hidden w-full h-full z-10 pt-[80px] pb-8 ${showGrid ? 'justify-start md:justify-center' : 'justify-center'}`}>
        {showGrid ? (
          <WorkspaceSection
            menus={menus.filter(m => m.active)}
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
