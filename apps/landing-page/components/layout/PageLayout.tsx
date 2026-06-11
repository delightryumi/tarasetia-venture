'use client';

import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Header } from '@/components/layout/Header';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface PageLayoutProps {
  children: React.ReactNode;
  forceScrolledState?: boolean;
}

export const PageLayout = ({ children, forceScrolledState }: PageLayoutProps) => {
  useEffect(() => {
    // Reset scroll to top immediately on page transition/mount
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();

    // Check if mobile/touch device
    const isMobile = window.matchMedia("(max-width: 768px)").matches || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);

    if (isMobile) {
      return;
    }

    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    } as any);

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fef7e5] text-[#1a1a1a] selection:bg-[#788069] selection:text-white">
      <Header forceScrolledState={forceScrolledState} />
      <main className="w-full relative z-10">
        {children}
      </main>
      {/* Footer will go here */}
    </div>
  );
};
