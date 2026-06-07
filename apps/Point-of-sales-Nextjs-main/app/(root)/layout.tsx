'use client';
import React, { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
interface RootLayoutProps {
  children: React.ReactNode;
}
import Link from 'next/link';
import { Menu, TriangleAlert, LogOut, ArrowLeft, ShieldAlert, ShoppingCart, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import { ThemeProvider } from '@/components/theme-provider';
import { useTheme } from 'next-themes';
import Sidebar from '@/components/dashboard/Sidebar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
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

  return (
    <div className="bg-background text-foreground h-screen overflow-hidden flex relative">
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
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 lg:px-6 sticky top-0 z-20 bg-transparent border-0 w-full">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden rounded-xl border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 shadow-sm"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <NavbarSheet />
            </Sheet>
            
            {isRecordDetail && (
              <Button asChild variant="ghost" size="sm" className="h-9 px-3 gap-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-white/10 shrink-0">
                <Link href="/records" className="flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Back</span>
                </Link>
              </Button>
            )}

            {/* Page Title & Subtitle */}
            <div className="flex flex-col select-none">
              <h1 className="text-sm md:text-base font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                {getPageTitle(pathname)}
              </h1>
              <p className="hidden sm:block text-[10px] text-neutral-400">
                {getPageDescription(pathname)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Quick Access Waiting List Icon Button */}
            <Link
              href="/waiting-list"
              className="relative p-2.5 rounded-xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center h-9 w-9"
              title="Daftar Tunggu (Waiting List)"
            >
              <ShoppingCart className="h-4 w-4" />
              {heldOrders.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white font-extrabold text-[8px] rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white dark:border-zinc-950 shadow-sm animate-pulse">
                  {heldOrders.length}
                </span>
              )}
            </Link>
            <ModeToggle />
          </div>
        </header>
        
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
  );
};

export default RootLayout;
