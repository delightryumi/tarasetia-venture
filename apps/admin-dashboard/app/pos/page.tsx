'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function POSPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Determine target POS base url
      const basePosUrl = process.env.NEXT_PUBLIC_POS_URL || `${protocol}//${hostname}:3001`;

      // Collect session state to forward to the POS app
      const params = new URLSearchParams();
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        params.set('user', storedUser);
      } else if (user) {
        // Fallback user state structure
        const email = user.email || '';
        const name = user.displayName || email.split('@')[0];
        const posUserObj = {
          id: user.uid,
          name: name,
          username: email.split('@')[0],
          role: 'WORKER',
          restoId: 'default-resto'
        };
        params.set('user', JSON.stringify(posUserObj));
      }

      const restoName = localStorage.getItem('restoName');
      if (restoName) params.set('restoName', restoName);

      const activeShift = localStorage.getItem('active_shift');
      if (activeShift) params.set('activeShift', activeShift);

      // Perform a clean redirect to the POS Home screen
      window.location.href = `${basePosUrl}/home?${params.toString()}`;
    }
  }, [user]);

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
