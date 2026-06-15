'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function POSPage() {
  const { user, activeHotelCode } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Determine target POS base url dynamically
      const getPosUrl = () => {
        if (hostname === 'pms.bumianyom.com') {
          return `${protocol}//pos.bumianyom.com`;
        }
        if (process.env.NEXT_PUBLIC_POS_URL) {
          return process.env.NEXT_PUBLIC_POS_URL;
        }
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        if (isLocal) {
          return `${protocol}//${hostname}:3001`;
        }
        if (hostname.startsWith('pms.')) {
          return `${protocol}//${hostname.replace('pms.', 'pos.')}`;
        }
        if (hostname.startsWith('dashboard.')) {
          return `${protocol}//${hostname.replace('dashboard.', 'pos.')}`;
        }
        if (hostname.includes('--bumi-anyom')) {
          const parts = hostname.split('--');
          parts[0] = 'pos';
          return `${protocol}//${parts.join('--')}`;
        }
        return `https://pos.bumianyom.com`;
      };
      const basePosUrl = getPosUrl().replace(/\/+$/, '');


      // Collect session state to forward to the POS app
      const params = new URLSearchParams();
      
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        // Map auth_user fields to pos expected fields
        try {
          const authUserObj = JSON.parse(storedUser);
          const posUserObj = {
            id: authUserObj.uid,
            name: authUserObj.displayName,
            username: authUserObj.email?.split('@')[0],
            email: authUserObj.email,
            role: authUserObj.role || 'WORKER',
            restoId: 'default-resto',
            hotelCode: activeHotelCode || authUserObj.hotelCode || '87241'
          };
          params.set('user', JSON.stringify(posUserObj));
        } catch (e) {
          params.set('user', storedUser);
        }
      } else if (user) {
        // Fallback user state structure
        const email = user.email || '';
        const name = user.displayName || email.split('@')[0];
        const posUserObj = {
          id: user.uid,
          name: name,
          username: email.split('@')[0],
          email: email,
          role: user.role || 'WORKER',
          restoId: 'default-resto',
          hotelCode: activeHotelCode || user.hotelCode || '87241'
        };
        params.set('user', JSON.stringify(posUserObj));
      }

      const restoName = localStorage.getItem('restoName');
      if (restoName) params.set('restoName', restoName);

      const activeShift = localStorage.getItem('active_shift');
      if (activeShift) params.set('activeShift', activeShift);

      // Pass the dashboard's current URL for redirection back
      params.set('dashboardUrl', window.location.origin + '/select-module');

      // Perform a clean redirect to the POS Home screen using hash parameters for safety
      try {
        const url = new URL('/home', basePosUrl);
        url.hash = params.toString();
        window.location.href = url.toString();
      } catch (e) {
        window.location.href = `${basePosUrl}/home#${params.toString()}`;
      }
    }
  }, [user, activeHotelCode]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white font-sans">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wider text-blue-500 animate-pulse uppercase">
          Redirecting to POS Terminal...
        </p>
      </div>
    </div>
  );
}
