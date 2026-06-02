'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Determine target POS base url dynamically
      const getPosUrl = () => {
        if (process.env.NEXT_PUBLIC_POS_URL) {
          return process.env.NEXT_PUBLIC_POS_URL;
        }
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          return `${protocol}//${hostname}:3001`;
        }
        if (hostname.startsWith('dashboard.')) {
          return `${protocol}//${hostname.replace('dashboard.', 'pos.')}`;
        }
        if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'pos';
          return `${protocol}//${parts.join('--')}`;
        }
        return `${protocol}//${hostname}`;
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
          const posUserObj = {
            id: authUserObj.uid,
            name: authUserObj.displayName,
            username: authUserObj.email?.split('@')[0],
            email: authUserObj.email,
            role: authUserObj.role || 'WORKER',
            restoId: 'default-resto'
          };
          params.set('user', JSON.stringify(posUserObj));
        } catch (e) {
          params.set('user', storedUser);
        }
      } else if (user) {
        const email = user.email || '';
        const name = user.displayName || email.split('@')[0];
        const posUserObj = {
          id: user.uid,
          name: name,
          username: email.split('@')[0],
          email: email,
          role: user.role || 'WORKER',
          restoId: 'default-resto'
        };
        params.set('user', JSON.stringify(posUserObj));
      }

      const restoName = localStorage.getItem('restoName');
      if (restoName) params.set('restoName', restoName);

      const activeShift = localStorage.getItem('active_shift');
      if (activeShift) params.set('activeShift', activeShift);

      // Perform a clean redirect to the target POS application page
      try {
        const url = new URL(targetPath, basePosUrl);
        url.search = params.toString();
        window.location.href = url.toString();
      } catch (e) {
        window.location.href = `${basePosUrl}${targetPath}?${params.toString()}`;
      }
    }
  }, [pathname, user]);

  useEffect(() => {
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

  return (
    <div className="h-screen w-screen bg-black dark:bg-grid-white/[0.15] bg-grid-white/[0.05] relative flex flex-col items-center justify-center overflow-hidden font-sans select-none z-0">
      {/* Radial gradient mask to fade the edges of the grid */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] z-0"></div>

      {/* Floating background blur glows */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none z-0" />

      <div className="flex flex-col items-center justify-center z-10 space-y-6">
        {/* Lottie Animation container */}
        <div
          style={{ height: '280px', width: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          dangerouslySetInnerHTML={{
            __html: `<lottie-player src="/animated/b6a540ac-904f-11ee-9286-2bc689aa3dbc.json" background="transparent" speed="1.2" style="width: 100%; height: 100%;" loop autoplay></lottie-player>`
          }}
        />

        {/* Status text */}
        <div className="text-center flex flex-col items-center gap-2">
          <p className="text-blue-500 text-[10px] font-extrabold tracking-[0.25em] uppercase animate-pulse">
            Connecting...
          </p>
          <h2 className="text-neutral-200 text-lg font-bold tracking-wide">
            Redirecting to POS Terminal
          </h2>
          <p className="text-neutral-500 text-xs">
            Synchronizing data master. Please wait.
          </p>
        </div>
      </div>
    </div>
  );
}
