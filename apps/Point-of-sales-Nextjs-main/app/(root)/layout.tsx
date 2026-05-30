'use client';
import React, { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
interface RootLayoutProps {
  children: React.ReactNode;
}
import Link from 'next/link';
import { Menu, TriangleAlert, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/dashboard/navbar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import { toast } from 'react-toastify';
import axios from 'axios';
import eventBus from '@/lib/even';
import { useRouter, usePathname } from 'next/navigation';
import { registerNetworkSync, syncProductsFromServer, syncUnsyncedTransactions } from '@/lib/dexie-sync';

const RootLayout = ({ children }: RootLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [storeName, setStoreName] = useState<string | null>(null);

  const isRecordDetail = pathname?.startsWith('/records/') && pathname !== '/records';

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = dashboardUrl;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      const restoNameParam = urlParams.get('restoName');
      const activeShiftParam = urlParams.get('activeShift');
      
      if (userParam) {
        localStorage.setItem('user', userParam);
      }
      if (restoNameParam) {
        localStorage.setItem('restoName', restoNameParam);
      }
      if (activeShiftParam) {
        localStorage.setItem('active_shift', activeShiftParam);
      }
    }

    // 1. Enforce Login / Retrieve Session
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      window.location.href = loginGatewayUrl;
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
      window.location.href = loginGatewayUrl;
      return;
    }


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
  }, [router]);

  const getDashboardUrl = () => {
    if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
      return process.env.NEXT_PUBLIC_DASHBOARD_URL;
    }
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        return `${protocol}//${hostname}:3000/select-module`;
      }
      if (hostname.startsWith('pos.')) {
        return `${protocol}//${hostname.replace('pos.', 'dashboard.')}/select-module`;
      }
      return `${protocol}//${hostname}/select-module`;
    }
    return 'http://localhost:3000/select-module';
  };

  const getLoginGatewayUrl = () => {
    if (process.env.NEXT_PUBLIC_DASHBOARD_URL) {
      return process.env.NEXT_PUBLIC_DASHBOARD_URL.replace('/select-module', '');
    }
    if (typeof window !== 'undefined') {
      const { protocol, hostname } = window.location;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
      if (isLocal) {
        return `${protocol}//${hostname}:3000`;
      }
      if (hostname.startsWith('pos.')) {
        return `${protocol}//${hostname.replace('pos.', 'dashboard.')}`;
      }
      return `${protocol}//${hostname}`;
    }
    return 'http://localhost:3000';
  };

  const dashboardUrl = getDashboardUrl();
  const loginGatewayUrl = getLoginGatewayUrl();

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
        <div className="flex flex-col h-full overflow-hidden">
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
              
              {isRecordDetail ? (
                <Button asChild variant="ghost" size="sm" className="h-9 px-3 gap-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-white/10 shrink-0">
                  <Link href="/records" className="flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Back</span>
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" className="h-9 px-3 gap-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-white/10 shrink-0">
                  <a href={dashboardUrl} target="_top" className="flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Menu Utama</span>
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-zinc-900/10">
            <div
              className="flex flex-col flex-1 rounded-lg min-h-full"
              x-chunk="dashboard-02-chunk-1"
            >
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <NextTopLoader showSpinner={false} />
                {children}
              </ThemeProvider>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
