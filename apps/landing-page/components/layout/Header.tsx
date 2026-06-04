"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { gsap } from 'gsap';
import { Magnetic } from '@/components/ui/Magnetic';
import { Topbar } from '@/components/layout/Topbar';
import { useLandingSettings } from '@/services/useLandingSettings';

const NAV_LINKS = [
  { label: 'Room',        href: '/rooms' },
  { label: 'Package',     href: '/packages' },
  { label: 'Attraction',  href: '/attractions' },
  { label: 'Gallery',     href: '/gallery' },
  { label: 'Cafe & Resto',href: '/cafe-resto' },
];

// ─── Animated nav link ────────────────────────────────────────────────────────
const NavLink = ({ label, href, isScrolled }: { label: string; href: string; isScrolled: boolean }) => {
  const lineRef = useRef<HTMLSpanElement>(null);
  return (
    <Magnetic>
      <Link
        href={href}
        className="relative flex items-center px-2 py-1"
        onMouseEnter={() => gsap.to(lineRef.current, { scaleX: 1, duration: 0.3, ease: 'power3.out', transformOrigin: 'left' })}
        onMouseLeave={() => gsap.to(lineRef.current, { scaleX: 0, duration: 0.25, ease: 'power3.in', transformOrigin: 'right' })}
      >
        <span className={`text-[10.5px] font-bold uppercase tracking-[0.22em] transition-colors duration-300 ${isScrolled ? 'text-[#1a1a1a]' : 'text-white'}`}>
          {label}
        </span>
        <span
          ref={lineRef}
          className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-[#788069] scale-x-0"
          style={{ transformOrigin: 'left' }}
        />
      </Link>
    </Magnetic>
  );
};

// ─── Book button ──────────────────────────────────────────────────────────────
const BookButton = ({ isScrolled, bookingUrl }: { isScrolled: boolean; bookingUrl: string }) => {
  const bgRef = useRef<HTMLDivElement>(null);
  return (
    <Magnetic>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={() => gsap.to(bgRef.current, { y: '0%', duration: 0.4, ease: 'power3.out' })}
        onMouseLeave={() => gsap.to(bgRef.current, { y: '101%', duration: 0.35, ease: 'power3.in' })}
        className={`relative overflow-hidden flex items-center justify-center px-7 py-2.5 rounded-lg transition-colors duration-300 border ${
          isScrolled
            ? 'bg-[#1a1a1a] border-transparent text-white'
            : 'bg-white/10 backdrop-blur-md border-white/20 text-white'
        }`}
      >
        <div ref={bgRef} className="absolute inset-0 bg-[#788069] rounded-lg" style={{ transform: 'translateY(101%)' }} />
        <span className="relative z-10 text-[9.5px] font-black uppercase tracking-[0.28em]">Reserve Now</span>
      </a>
    </Magnetic>
  );
};

// ─── Main Header ──────────────────────────────────────────────────────────────
export const Header = ({ forceScrolledState = false }: { forceScrolledState?: boolean }) => {
  const { lightLogo, darkLogo, bookingEngineUrl } = useLandingSettings();
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);
  const isScrolled = internalIsScrolled || forceScrolledState;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (forceScrolledState) return;
      setInternalIsScrolled(
        window.scrollY > (document.getElementById('hero-section') ? window.innerHeight * 1.3 : 50)
      );
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [forceScrolledState]);

  useEffect(() => {
    const update = () => {
      if (headerRef.current)
        document.documentElement.style.setProperty('--header-bottom', `${headerRef.current.getBoundingClientRect().height}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isScrolled, mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo('.mobile-menu-item',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.07, ease: 'power4.out', delay: 0.2 }
      );
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.header
        ref={headerRef as any}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-700 ${
          isScrolled || mobileMenuOpen
            ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100/80'
            : 'bg-transparent'
        }`}
      >
        {/* Topbar */}
        <AnimatePresence>
          {!isScrolled && !mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
              className="w-full overflow-hidden"
            >
              <Topbar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav row */}
        <div className={`container mx-auto px-6 md:px-12 flex items-center justify-between transition-all duration-500 ${
          isScrolled || mobileMenuOpen ? 'py-3.5' : 'py-5'
        }`}>

          {/* Logo */}
          <Magnetic>
            <Link href="/" className="relative z-50 flex flex-col items-start select-none">
              {(lightLogo || darkLogo) ? (
                <img
                  src={(isScrolled || mobileMenuOpen) ? (darkLogo || lightLogo!) : (lightLogo || darkLogo!)}
                  alt="Bumi Anyom"
                  className="h-5 md:h-6 w-auto object-contain transition-all duration-300"
                />
              ) : (
                <span className={`text-sm font-black tracking-widest uppercase transition-colors duration-300 ${
                  isScrolled || mobileMenuOpen ? 'text-[#1a1a1a]' : 'text-white'
                }`}>
                  BUMI <span className="font-light">ANYOM</span>
                </span>
              )}
              <span className={`text-[6px] md:text-[7px] font-bold uppercase tracking-[0.25em] block leading-none mt-1.5 pl-2 transition-colors duration-300 ${
                (isScrolled || mobileMenuOpen) ? 'text-[#1a1a1a]/40' : 'text-white/50'
              }`}>
                manage by nexura
              </span>
            </Link>
          </Magnetic>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} label={link.label} href={link.href} isScrolled={isScrolled} />
            ))}
            <BookButton isScrolled={isScrolled} bookingUrl={bookingEngineUrl} />
          </nav>

          {/* Mobile toggle */}
          <Magnetic>
            <button
              className={`lg:hidden relative z-50 flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                isScrolled || mobileMenuOpen
                  ? 'text-[#1a1a1a] bg-gray-100/60'
                  : 'text-white bg-white/10 backdrop-blur-sm'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </Magnetic>
        </div>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
            animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            exit={{ opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
            transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 bg-[#1a1a1a] pt-28 px-8 pb-12 flex flex-col justify-between lg:hidden overflow-y-auto"
          >
            <nav className="flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#788069] mb-4">Navigation</span>
              {NAV_LINKS.map((link, i) => (
                <div key={i} className="mobile-menu-item border-b border-white/[0.06] py-5">
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-3xl font-light text-white group-hover:text-[#788069] transition-colors uppercase tracking-widest">
                      {link.label}
                    </span>
                    <ArrowUpRight size={16} className="text-white/20 group-hover:text-[#788069] transition-colors" />
                  </Link>
                </div>
              ))}
            </nav>

            <div className="mobile-menu-item mt-8">
              <a
                href={bookingEngineUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full py-4 bg-[#fef7e5] text-[#1a1a1a] text-[10px] font-black uppercase tracking-[0.3em] rounded-xl active:scale-95 transition-transform"
              >
                Reserve Your Stay
              </a>
              <div className="mt-8 flex justify-center gap-8">
                <a href="#" className="text-[9px] font-bold uppercase tracking-widest text-[#788069] hover:text-white transition-colors">Instagram</a>
                <a href="#" className="text-[9px] font-bold uppercase tracking-widest text-[#788069] hover:text-white transition-colors">Whatsapp</a>
                <a href="#" className="text-[9px] font-bold uppercase tracking-widest text-[#788069] hover:text-white transition-colors">Email</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
