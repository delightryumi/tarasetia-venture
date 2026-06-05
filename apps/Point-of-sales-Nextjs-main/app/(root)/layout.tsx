'use client';
import React, { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
interface RootLayoutProps {
  children: React.ReactNode;
}
import Link from 'next/link';
import { Menu, TriangleAlert, LogOut, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import { ThemeProvider } from '@/components/theme-provider';
import { useTheme } from 'next-themes';
import Navbar from '@/components/dashboard/navbar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { NAVBAR_ITEMS } from '@/constant/navbarMenu';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from 'react-toastify';
import axios from 'axios';
import eventBus from '@/lib/even';
import { useRouter, usePathname } from 'next/navigation';
import { registerNetworkSync, syncProductsFromServer, syncUnsyncedTransactions } from '@/lib/dexie-sync';

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
      const storedUrl = localStorage.getItem('dashboard_url');
      if (storedUrl) return storedUrl;

      const { protocol, hostname } = window.location;
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
      const storedUrl = localStorage.getItem('dashboard_url');
      if (storedUrl) {
        return storedUrl.replace(/\/select-module$/, '') + '/login';
      }

      const { protocol, hostname } = window.location;
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

  useEffect(() => {
    setDashboardUrl(getDashboardUrl());
    setLoginGatewayUrl(getLoginGatewayUrl());
    setIsMounted(true);
  }, []);

  return (
    <div className="bg-gray-300 dark:bg-black h-screen overflow-hidden">
      <div className="grid h-full w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        
        {/* Sidebar */}
        <div className="hidden border-r bg-muted/40 md:flex flex-col h-full overflow-hidden">
          <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <TriangleAlert className="h-6 w-6" />
              <span className="">{storeName} Inc</span>
            </Link>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <Navbar />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col h-full overflow-hidden relative">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
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
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
            </div>
          </header>
          
          <main className={`flex-1 ${isLexuPos ? 'overflow-hidden p-0 pb-[56px] md:pb-0' : 'overflow-y-auto p-4 lg:p-6 pb-[72px] md:pb-0'} bg-slate-50 dark:bg-zinc-900/10`}>
            <div
              className={`flex flex-col flex-1 ${isLexuPos ? 'h-full rounded-none overflow-hidden' : 'rounded-lg min-h-full'}`}
              x-chunk="dashboard-02-chunk-1"
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <NextTopLoader showSpinner={false} />
                {/* Iframe session-bridge disabled in production due to modern browser storage partitioning
                isMounted && (
                  <iframe
                    src={`${dashboardUrl.replace('/select-module', '')}/auth/session-bridge`}
                    className="hidden"
                    style={{ display: 'none' }}
                  />
                )*/}
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
              </ThemeProvider>
            </div>
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
