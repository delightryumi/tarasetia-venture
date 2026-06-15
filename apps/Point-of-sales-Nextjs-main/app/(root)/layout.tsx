'use client';
import React, { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
interface RootLayoutProps {
  children: React.ReactNode;
}
import Link from 'next/link';
import { Menu, TriangleAlert, LogOut, ArrowLeft, ShieldAlert, ShoppingCart, RotateCcw, Settings, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import { ThemeProvider } from '@/components/theme-provider';
import { useTheme } from 'next-themes';
import Sidebar from '@/components/dashboard/Sidebar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { BillingSuspendedModal } from '@/components/dashboard/BillingSuspendedModal';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from 'react-toastify';
import axios from 'axios';
import eventBus from '@/lib/even';
import { useRouter, usePathname } from 'next/navigation';
import { registerNetworkSync, syncProductsFromServer, syncUnsyncedTransactions } from '@/lib/dexie-sync';
import { db } from '@/lib/firebase';
import { localDb } from '@/lib/dexie';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const RootLayout = ({ children }: RootLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { canAccess, role, loading: rbacLoading } = useRBAC();
  const [storeName, setStoreName] = useState<string | null>(null);
  const { setTheme } = useTheme();
  const [isHotelActive, setIsHotelActive] = useState<boolean | null>(null);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [hotelsList, setHotelsList] = useState<any[]>([]);

  const handleHotelChange = (newCode: string) => {
    if (!user) return;
    const updatedUser = { ...user, hotelCode: newCode };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    window.location.reload();
  };

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return;
    try {
      const parsedUser = JSON.parse(userJson);
      setUser(parsedUser);
      const isSuper =
        parsedUser?.role?.toLowerCase() === 'superadmin' ||
        parsedUser?.role?.toLowerCase() === 'super admin' ||
        parsedUser?.email?.toLowerCase() === 'nexura.management@gmail.com';
      setIsSuperadmin(isSuper);

      const hotelCode = parsedUser?.hotelCode || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_CODE || "87241";
      if (!hotelCode) return;

      const docRef = doc(db, 'hotels', hotelCode);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (isSuper) {
            setIsHotelActive(true);
          } else {
            setIsHotelActive(data.active !== false);
          }
          setNextDueDate(data.billing?.nextDueDate || '');
          setHotelName(data.name || 'Hotel');
          if (data.name) {
            setStoreName(data.name);
            localStorage.setItem('restoName', data.name);
          }
        }
      }, (err) => {
        console.error('Error fetching hotel status in POS RootLayout:', err);
      });

      let unsubscribeHotels: () => void = () => {};
      if (isSuper) {
        unsubscribeHotels = onSnapshot(collection(db, "hotels"), (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data());
          });
          setHotelsList(list);
        });
      }

      return () => {
        unsubscribe();
        if (isSuper) {
          unsubscribeHotels();
        }
      };
    } catch (e) {
      console.error('Error in POS active check:', e);
    }
  }, []);

  console.log('RBAC hook role:', role);
  const isAuthorized = canAccess('module_pos') || canAccess('pos');
  console.log('isAuthorized computed:', isAuthorized);


  const isRecordDetail = pathname?.startsWith('/records/') && pathname !== '/records';
  const isLexuPos = pathname === '/lexupos';

  const { formatCurrency } = useCurrency();
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [openList, setOpenList] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    let restoId = 'default-resto';
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        restoId = user.restoId || 'default-resto';
      } catch (e) {}
    }

    const q = query(
      collection(db, 'pos_held_orders'),
      where('restoId', '==', restoId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setHeldOrders(orders);
    });

    return () => unsubscribe();
  }, []);

  const handleRestore = async (order: any) => {
    try {
      localStorage.setItem('restored_held_order', JSON.stringify(order));
      await deleteDoc(doc(db, 'pos_held_orders', order.id));
      await localDb.heldOrders.delete(order.id);
      window.dispatchEvent(new Event('restore_held_order'));
      toast.success(`Mengembalikan pesanan untuk ${order.customerName || 'Guest'} ke POS`);
      if (window.location.pathname !== '/lexupos') {
        router.push('/lexupos');
      }
      setOpenList(false);
    } catch (err) {
      console.error('Failed to restore order:', err);
      toast.error('Gagal mengembalikan pesanan.');
    }
  };

  const handleDeleteHeld = async (orderId: string, customerName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pesanan held untuk "${customerName || 'Guest'}" secara permanen?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'pos_held_orders', orderId));
      await localDb.heldOrders.delete(orderId);
      toast.info(`Pesanan held untuk "${customerName}" berhasil dihapus.`);
    } catch (err) {
      console.error('Failed to delete held order:', err);
      toast.error('Gagal menghapus pesanan.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `${getDashboardUrl()}?logout=true`;
  };


  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Parse parameters from hash fragment first (more secure, never sent to server)
      let hashParams = new URLSearchParams();
      if (window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.substring(1));
      }

      // 2. Fallback to query params
      const searchParams = new URLSearchParams(window.location.search);

      const userParam = hashParams.get('user') || searchParams.get('user');
      const restoNameParam = hashParams.get('restoName') || searchParams.get('restoName');
      const activeShiftParam = hashParams.get('activeShift') || searchParams.get('activeShift');
      const themeParam = hashParams.get('theme') || searchParams.get('theme');
      const dashboardUrlParam = hashParams.get('dashboardUrl') || searchParams.get('dashboardUrl');
      
      let dataUpdated = false;
      if (userParam) {
        localStorage.setItem('user', userParam);
        dataUpdated = true;
      }
      if (restoNameParam) {
        localStorage.setItem('restoName', restoNameParam);
        dataUpdated = true;
      }
      if (activeShiftParam) {
        localStorage.setItem('active_shift', activeShiftParam);
        dataUpdated = true;
      }
      if (themeParam && (themeParam === 'light' || themeParam === 'dark')) {
        setTheme(themeParam);
        dataUpdated = true;
      }
      if (dashboardUrlParam) {
        localStorage.setItem('dashboard_url', dashboardUrlParam);
        dataUpdated = true;
      }

      // Clean the URL immediately to remove sensitive query parameters/hash from address bar, history, and referrer logs
      if (dataUpdated && (window.location.hash || window.location.search)) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    // 1. Enforce Login / Retrieve Session
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      window.location.href = getLoginGatewayUrl();
      return;
    }

    let user;
    try {
      user = JSON.parse(userJson);
      if (typeof user !== 'object' || user === null) {
        throw new Error('Invalid user format');
      }
    } catch (e) {
      console.error('Invalid user session JSON, clearing storage:', e);
      localStorage.removeItem('user');
      window.location.href = getLoginGatewayUrl();
      return;
    }


        console.log('Parsed user object:', user);
        const restoId = user.restoId;
    const cachedRestoName = localStorage.getItem('restoName') || 'POS Resto';
    setStoreName(cachedRestoName);

    // 2. Register Network sync listener for IndexedDB to cloud Postgres
    registerNetworkSync();

    // 3. Trigger initial syncs
    if (navigator.onLine && restoId) {
      syncProductsFromServer(restoId);
      syncUnsyncedTransactions();
    }

    // 4. Fetch shop data online
    const fetchShopData = async () => {
      try {
        const isOnline = navigator.onLine;

        if (!isOnline) {
          return;
        }

        const response = await axios.get('/api/shopdata');
        const shopdata = response.data.data;

        if (response.status === 200 && shopdata) {
          setStoreName(shopdata.name);
          localStorage.setItem('restoName', shopdata.name);
        }
      } catch (error: any) {
        console.error('Failed to fetch online shopdata:', error);
      }
    };

    fetchShopData();

    const handleEventBusEvent = () => {
      fetchShopData();
    };

    eventBus.on('fetchStoreData', handleEventBusEvent);

    // Clean up event listener
    return () => {
      eventBus.removeListener('fetchStoreData', handleEventBusEvent);
    };
  }, [router, setTheme]);

  const getDashboardUrl = () => {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname === 'pos.bumianyom.com') {
        return `${protocol}//pms.bumianyom.com/select-module`;
      }

      const storedUrl = localStorage.getItem('dashboard_url');
      if (storedUrl) return storedUrl;

      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        return 'http://localhost:3000/select-module';
      }
    }

    let url = 'https://pms.bumianyom.com/select-module';
    if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
      url = process.env.NEXT_PUBLIC_DASHBOARD_URL;
    } else if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname.startsWith('pos.')) {
        url = `${protocol}//${hostname.replace('pos.', 'pms.')}/select-module`;
      } else if (hostname.includes('--bumi-anyom')) {
        const parts = hostname.split('--');
        parts[0] = 'bumianyom-web-1';
        url = `${protocol}//${parts.join('--')}/select-module`;
      } else {
        url = `https://pms.bumianyom.com/select-module`;
      }
    }
    
    if (!url.endsWith('/select-module')) {
      url = url.replace(/\/$/, '') + '/select-module';
    }
    
    return url;
  };

  const getLoginGatewayUrl = () => {
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname === 'pos.bumianyom.com') {
        return `${protocol}//pms.bumianyom.com/login`;
      }

      const storedUrl = localStorage.getItem('dashboard_url');
      if (storedUrl) {
        return storedUrl.replace(/\/select-module$/, '') + '/login';
      }

      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        return 'http://localhost:3000/login';
      }
    }

    let url = 'https://pms.bumianyom.com/login';
    if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
      url = process.env.NEXT_PUBLIC_DASHBOARD_URL.replace('/select-module', '') + '/login';
    } else if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      if (hostname.startsWith('pos.')) {
        url = `${protocol}//${hostname.replace('pos.', 'pms.')}/login`;
      } else if (hostname.includes('--bumi-anyom')) {
        const parts = hostname.split('--');
        parts[0] = 'bumianyom-web-1';
        url = `${protocol}//${parts.join('--')}/login`;
      } else {
        url = `https://pms.bumianyom.com/login`;
      }
    }
    return url;
  };

  const [dashboardUrl, setDashboardUrl] = useState('https://pms.bumianyom.com/select-module');
  const [loginGatewayUrl, setLoginGatewayUrl] = useState('https://pms.bumianyom.com/login');
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setDashboardUrl(getDashboardUrl());
    setLoginGatewayUrl(getLoginGatewayUrl());
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pos_sidebar_collapsed', String(next));
      return next;
    });
  };

  const getPageTitle = (path: string) => {
    if (path.startsWith('/home')) return 'Home Dashboard';
    if (path.startsWith('/lexupos')) return 'LexuPos Workspace';
    if (path.startsWith('/cashier')) return 'Cashier Shift';
    if (path.startsWith('/product')) return 'Products Catalog';
    if (path.startsWith('/records')) return 'Transaction Records';
    if (path.startsWith('/settings')) return 'Settings Panel';
    if (path.startsWith('/technologies')) return 'Technologies Stack';
    if (path.startsWith('/orders')) return 'Order Management';
    return 'POS Workspace';
  };

  const getPageDescription = (path: string) => {
    if (path.startsWith('/home')) return 'Real-time summary of sales, shift status, and analytics.';
    if (path.startsWith('/lexupos')) return 'Manage active orders, tables, billing, and checkout.';
    if (path.startsWith('/cashier')) return 'Monitor cashier shifts, cash flows, and drawer balancing.';
    if (path.startsWith('/product')) return 'View and manage restaurant products, stocks, and categories.';
    if (path.startsWith('/records')) return 'Track order history, payment methods, and revenue types.';
    if (path.startsWith('/settings')) return 'Configure restaurant details, tax rates, and system settings.';
    if (path.startsWith('/technologies')) return 'Overview of tech stack powering the Nexura POS platform.';
    if (path.startsWith('/orders')) return 'Active orders and queue details.';
    return 'Manage your POS system.';
  };

  if (isHotelActive === false) {
    const formattedDueDate = nextDueDate
      ? new Date(nextDueDate).toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : '-';
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#08080a] font-sans">
        <BillingSuspendedModal
          hotelName={hotelName || 'Hotel'}
          formattedDueDate={formattedDueDate}
          signOutUser={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground h-screen overflow-hidden flex flex-col relative">
      {/* Header spanning 100% width across the top */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 py-2.5 px-4 lg:px-6 sticky top-0 z-20 bg-[#181818] border-none w-full select-none">
        {/* Left Side: Logo & Hotel Badge */}
        <div className="flex items-center gap-4">
          <img
            src="/channels/6.png"
            alt="Nexura Logo"
            className="h-6 md:h-7 w-auto object-contain"
          />
          
          <div className="h-6 w-px bg-[#2e2e30]" />
          
          {isSuperadmin ? (
            <div className="relative flex items-center h-9 w-[260px] md:w-[320px] bg-white dark:bg-[#222225] border border-slate-300 dark:border-white/[0.08] rounded-[6px] overflow-hidden shadow-sm text-neutral-900 dark:text-[#f4f4f5] text-[13px] font-semibold transition-all">
              <select
                value={user?.hotelCode || "87241"}
                onChange={(e) => handleHotelChange(e.target.value)}
                className="border-none pr-10 py-1 text-[13px] font-semibold focus:outline-none focus:ring-0 cursor-pointer appearance-none h-full w-full truncate rounded-[6px] text-left bg-transparent text-neutral-900 dark:text-[#f4f4f5]"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239297a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingLeft: '12px',
                }}
              >
                {hotelsList && hotelsList.length > 0 ? (
                  hotelsList.map((hotel) => (
                    <option key={hotel.hotelCode} value={hotel.hotelCode} className="bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-[#f4f4f5]">
                      [{hotel.hotelCode}] {hotel.name}
                    </option>
                  ))
                ) : (
                  <option value="87241" className="bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-[#f4f4f5]">
                    [87241] Bumi Anyom Resort
                  </option>
                )}
              </select>
            </div>
          ) : (
            <div className="flex items-center h-9 px-3 w-[260px] md:w-[320px] bg-white dark:bg-[#222225] border border-slate-300 dark:border-white/[0.08] rounded-[6px] overflow-hidden shadow-sm text-neutral-900 dark:text-[#f4f4f5] text-[13px] font-semibold">
              <span className="truncate w-full text-left text-neutral-900 dark:text-[#f4f4f5]">
                [{user?.hotelCode || "87241"}] {hotelName || "Bumi Anyom Resort"}
              </span>
            </div>
          )}
        </div>
        
        {/* Right Side: Waiting List (Cart), Theme Switcher (ModeToggle), Hamburger Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Access Waiting List Icon Button */}
          <Link
            href="/waiting-list"
            className="relative rounded-[8px] bg-[#282828] text-[#c2c2c2] hover:bg-[#333333] hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center h-8 w-8 border-none shrink-0"
            title="Daftar Tunggu (Waiting List)"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {heldOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white font-extrabold text-[8px] rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white dark:border-zinc-950 shadow-sm animate-pulse">
                {heldOrders.length}
              </span>
            )}
          </Link>
          
          <ModeToggle />

          {/* Hamburger Dropdown Menu exactly matching Select Module */}
          <div className="relative z-50">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-[8px] bg-[#282828] text-[#c2c2c2] hover:bg-[#333333] hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center cursor-pointer border-none focus:outline-none shrink-0"
              title="Menu CPanel & Akun"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40 cursor-default bg-transparent"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {/* Dropdown Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-[220px] bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/[0.08] rounded-[8px] shadow-lg p-2 z-50 flex flex-col gap-1"
                  >
                    {/* User Login Info Profile Card */}
                    {(() => {
                      const userName = user?.displayName || user?.email?.split('@')[0] || "Administrator";
                      return (
                        <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-white/[0.03] rounded-[8px] mb-2 border-none">
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
                            <span className="text-xs font-bold text-neutral-800 dark:text-[#f4f4f5] truncate">{userName}</span>
                            <span className="text-[10px] text-neutral-500 dark:text-[#a1a1aa] truncate">{user?.email}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest">System Live</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const isSuper = user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'super admin' || user?.email?.toLowerCase() === 'nexura.management@gmail.com';
                      const hasAccessCPanel = canAccess('module_cpanel') || canAccess('cpanel') || isSuper;
                      return hasAccessCPanel && (
                        <>
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              router.push(dashboardUrl.replace('/select-module', '') + '/logo?module=cpanel');
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-[#8d7a52]/10 dark:hover:bg-[#8d7a52]/15 rounded-[6px] border-none cursor-pointer flex items-center gap-3 transition-all duration-150 bg-transparent font-sans"
                          >
                            <Settings className="w-4 h-4 text-[#8d7a52]" />
                            <span>CPanel</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              router.push(dashboardUrl.replace('/select-module', '') + '/users?module=cpanel');
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-[#8d7a52]/10 dark:hover:bg-[#8d7a52]/15 rounded-[6px] border-none cursor-pointer flex items-center gap-3 transition-all duration-150 bg-transparent font-sans"
                          >
                            <Users className="w-4 h-4 text-[#8d7a52]" />
                            <span>User Settings</span>
                          </button>

                          <div className="h-px bg-neutral-200 dark:bg-white/[0.08] my-1" />
                        </>
                      );
                    })()}

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-[#aa2d00] dark:text-[#f87171] hover:text-[#aa2d00] hover:bg-[#fef2f2] dark:hover:bg-red-500/10 rounded-[6px] border-none cursor-pointer flex items-center gap-3 transition-all duration-150 bg-transparent font-sans"
                    >
                      <LogOut className="w-4 h-4 text-[#aa2d00] dark:text-[#f87171]" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main body of layout containing sidebar & children */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        {/* Sidebar */}
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggleCollapse={handleToggleCollapse} 
          storeName={storeName} 
        />

        {/* Main Content Area */}
        <div 
          className={`flex flex-col h-full overflow-hidden w-full transition-all duration-500 ${
            isCollapsed ? "md:pl-[140px]" : "md:pl-[280px]"
          }`}
        >
          <main className={`flex-1 ${isLexuPos ? 'overflow-hidden p-0 pb-[56px] md:pb-0' : 'overflow-y-auto p-4 lg:p-6 pb-[72px] md:pb-0'} bg-slate-50 dark:bg-zinc-900/10`}>
            <div
              className={`flex flex-col flex-1 ${isLexuPos ? 'h-full rounded-none overflow-hidden' : 'rounded-lg min-h-full'}`}
              x-chunk="dashboard-02-chunk-1"
            >
              {rbacLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-muted-foreground animate-pulse">Checking access...</p>
                </div>
              ) : !isAuthorized ? (
                (() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = loginGatewayUrl;
                  }
                  return (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-sm text-muted-foreground">Redirecting to login...</p>
                    </div>
                  );
                })()
              ) : (
                children
              )}
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
