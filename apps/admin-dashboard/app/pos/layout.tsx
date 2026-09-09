'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PosSplashLoader from '@/components/loader/PosSplashLoader';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Determine target POS base url dynamically
      const getPosUrl = () => {
        if (hostname === 'live.mytara.id') {
          return `${protocol}//point.mytara.id`;
        }
        if (process.env.NEXT_PUBLIC_POS_URL) {
          return process.env.NEXT_PUBLIC_POS_URL;
        }
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          return `${protocol}//${hostname}:3001`;
        }
        if (hostname.includes('-3000.')) {
          return `${protocol}//${hostname.replace('-3000.', '-3001.')}`;
        }
        if (hostname.startsWith('pms.')) {
          return `${protocol}//${hostname.replace('pms.', 'pos.')}`;
        }
        if (hostname.startsWith('dashboard.')) {
          return `${protocol}//${hostname.replace('dashboard.', 'pos.')}`;
        }
        if (hostname.startsWith('live.')) {
          return `${protocol}//${hostname.replace('live.', 'point.')}`;
        }
        if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'pos';
          return `${protocol}//${parts.join('--')}`;
        }
        return `https://point.mytara.id`;
      };
      const basePosUrl = getPosUrl().replace(/\/+$/, '');


      // Map admin-dashboard paths to the original POS app paths
      let targetPath = '/home';
      if (pathname === '/pos') {
        targetPath = '/home';
      } else if (pathname === '/pos/home') {
        targetPath = '/home';
      } else if (pathname === '/pos/history') {
        targetPath = '/cashier';
      } else if (pathname === '/pos/inventory') {
        targetPath = '/product';
      } else if (pathname === '/pos/orders') {
        targetPath = '/records';
      } else if (pathname === '/pos/settings') {
        targetPath = '/settings';
      } else if (pathname === '/pos/technologies') {
        targetPath = '/technologies';
      }

      // Collect session state
      const params = new URLSearchParams();
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const authUserObj = JSON.parse(storedUser);
          const localHotelCode = localStorage.getItem('active_hotel_code');
          const posUserObj = {
            id: authUserObj.uid,
            name: authUserObj.displayName,
            username: authUserObj.email?.split('@')[0],
            email: authUserObj.email,
            role: authUserObj.role || 'WORKER',
            restoId: 'default-resto',
            hotelCode: localHotelCode || authUserObj.hotelCode || ''
          };
          params.set('user', JSON.stringify(posUserObj));
        } catch (e) {
          params.set('user', storedUser);
        }
      } else if (user) {
        const email = user.email || '';
        const name = user.displayName || email.split('@')[0];
        const localHotelCode = localStorage.getItem('active_hotel_code');
        const posUserObj = {
          id: user.uid,
          name: name,
          username: email.split('@')[0],
          email: email,
          role: user.role || 'WORKER',
          restoId: 'default-resto',
          hotelCode: localHotelCode || user.hotelCode || ''
        };
        params.set('user', JSON.stringify(posUserObj));
      }

      const restoName = localStorage.getItem('restoName');
      if (restoName) params.set('restoName', restoName);

      const theme = localStorage.getItem('theme');
      if (theme) params.set('theme', theme);

      // Perform a clean redirect to the target POS application page using hash parameters for safety
      try {
        const url = new URL(targetPath, basePosUrl);
        url.hash = params.toString();
        window.location.href = url.toString();
      } catch (e) {
        window.location.href = `${basePosUrl}${targetPath}#${params.toString()}`;
      }
    }
  }, [pathname, user]);

  useEffect(() => {
    // Sync document element class with selected theme
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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

    // Suppress unhandled lottie-player/script error events from triggering Next.js HMR overlay
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

  return <PosSplashLoader />;
}
