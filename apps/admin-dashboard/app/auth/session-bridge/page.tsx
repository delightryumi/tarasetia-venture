'use client';

import { useEffect } from 'react';

export default function SessionBridgePage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('auth_user');
      // Post the login status to the parent window (the POS app)
      window.parent.postMessage({ type: 'SESSION_STATUS', loggedIn: !!user }, '*');
    }
  }, []);

  return null;
}
