'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const CloudflareTurnstile: React.FC<CloudflareTurnstileProps> = ({
  onVerify,
  onExpire,
  onError,
  siteKey,
  theme = 'light',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  // Default to Cloudflare's official always-passing test sitekey if not configured yet
  const activeSiteKey =
    siteKey ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    '0x4AAAAAAFR7kv8f7w77MRby';

  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: activeSiteKey,
          callback: (token: string) => {
            if (isMounted && onVerifyRef.current) onVerifyRef.current(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpireRef.current) onExpireRef.current();
          },
          'error-callback': () => {
            if (isMounted && onErrorRef.current) onErrorRef.current();
          },
          theme,
          size: 'flexible',
        });
        widgetIdRef.current = id;
        setIsRendered(true);
      } catch (e) {
        console.warn('Turnstile render warning:', e);
      }
    };

    if (typeof window !== 'undefined') {
      if (window.turnstile) {
        renderWidget();
      } else {
        const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (isMounted) renderWidget();
          };
          document.head.appendChild(script);
        } else {
          existingScript.addEventListener('load', () => {
            if (isMounted) renderWidget();
          });
        }
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [activeSiteKey, theme]);

  return (
    <div className={`w-full flex justify-center my-2 ${className}`}>
      <div 
        ref={containerRef} 
        className="min-h-[65px] w-full flex items-center justify-center transition-all duration-200" 
      />
    </div>
  );
};
