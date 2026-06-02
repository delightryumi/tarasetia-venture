"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, MapPin, Navigation } from 'lucide-react';
import { gsap } from 'gsap';
import { Magnetic } from '@/components/ui/Magnetic';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Topbar } from '@/components/layout/Topbar';
import { useLandingSettings } from '@/services/useLandingSettings';

// ─── Data types ──────────────────────────────────────────────────────────────
interface RoomType {
  id: string; name: string; description?: string;
  images?: { url: string; isProfile?: boolean }[]; bookingUrl?: string;
}
interface Package {
  id: string; name: string; description?: string;
  price?: string; imageUrl?: string; packageType?: string;
}
interface Attraction {
  id: string; name: string; description?: string;
  distance?: string; imageUrl?: string;
  images?: { url: string; isProfile?: boolean }[];
}

// ─── Shared mega-menu panel ───────────────────────────────────────────────────
function MegaPanel({ visible, label, children }: {
  visible: boolean; label: string; children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    if (visible) {
      gsap.fromTo(panelRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0 },
        { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.5, ease: 'power4.out' }
      );
      if (innerRef.current) {
        gsap.fromTo(innerRef.current.children,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out', delay: 0.12 }
        );
      }
    } else {
      gsap.to(panelRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0, duration: 0.32, ease: 'power4.in' }
      );
    }
  }, [visible]);

  return (
    <div
      ref={panelRef}
      className="absolute top-full left-0 right-0 z-[49] pointer-events-auto"
      style={{ clipPath: 'inset(0% 0% 100% 0%)', opacity: 0 }}
    >
      {/* blurred glass bar */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-2xl px-8 md:px-16 xl:px-24 py-5">
        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#788069] mb-4">{label}</p>
        <div ref={innerRef} className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-none">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Room mega card ───────────────────────────────────────────────────────────
function RoomCard({ room }: { room: RoomType }) {
  const img = room.images?.find(i => i.isProfile)?.url || room.images?.[0]?.url;
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="shrink-0 group flex flex-col w-44 rounded-md overflow-hidden border border-gray-100 hover:border-[#788069]/40 hover:shadow-md transition-all duration-300 bg-white"
    >
      <div className="w-full h-20 bg-[#fef7e5] overflow-hidden">
        {img
          ? <img src={img} alt={room.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-gradient-to-br from-[#fef7e5] to-[#ffd8a6]/40" />
        }
      </div>
      <div className="p-3 flex-grow">
        <p className="text-[11px] font-bold text-[#1a1a1a] group-hover:text-[#788069] transition-colors truncate uppercase tracking-widest">{room.name}</p>
        {room.description && <p className="text-[9px] text-[#1a1a1a]/50 mt-1 line-clamp-2 leading-relaxed italic">{room.description}</p>}
      </div>
      <div className="px-3 pb-3">
        <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#788069]">
          View Sanctuary <ArrowUpRight size={10} />
        </span>
      </div>
    </Link>
  );
}

// ─── Package mega card ────────────────────────────────────────────────────────
function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <Link
      href={`/packages/${pkg.id}`}
      className="shrink-0 group flex flex-col w-44 rounded-md overflow-hidden border border-gray-100 hover:border-[#788069]/40 hover:shadow-md transition-all duration-300 bg-white"
    >
      <div className="w-full h-20 bg-[#fef7e5] overflow-hidden relative">
        {pkg.imageUrl
          ? <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-gradient-to-br from-[#fef7e5] to-[#ffd8a6]/40" />
        }
        {pkg.packageType && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur rounded-md text-[7px] font-black uppercase tracking-widest text-[#788069]">
            {pkg.packageType}
          </span>
        )}
      </div>
      <div className="p-3 flex-grow">
        <p className="text-[11px] font-bold text-[#1a1a1a] group-hover:text-[#788069] transition-colors truncate uppercase tracking-widest">{pkg.name}</p>
        {pkg.description && <p className="text-[9px] text-[#1a1a1a]/50 mt-1 line-clamp-2 leading-relaxed italic">{pkg.description}</p>}
      </div>
      <div className="px-3 pb-3">
        <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#788069]">
          Explore <ArrowUpRight size={10} />
        </span>
      </div>
    </Link>
  );
}

// ─── Attraction mega card ─────────────────────────────────────────────────────
function AttractionCard({ attr }: { attr: Attraction }) {
  const img = attr.images?.find(i => i.isProfile)?.url || attr.images?.[0]?.url || attr.imageUrl;
  return (
    <Link
      href="/attractions"
      className="shrink-0 group flex flex-col w-44 rounded-md overflow-hidden border border-gray-100 hover:border-[#788069]/40 hover:shadow-md transition-all duration-300 bg-white"
    >
      <div className="w-full h-20 bg-[#fef7e5] overflow-hidden relative">
        {img
          ? <img src={img} alt={attr.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-gradient-to-br from-[#fef7e5] to-[#ffd8a6]/40 flex items-center justify-center">
            <MapPin size={24} className="text-[#788069]/40" />
          </div>
        }
        {attr.distance && (
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur rounded-md text-[8px] font-black uppercase tracking-widest text-[#788069] flex items-center gap-1">
            <Navigation size={8} />{attr.distance}
          </span>
        )}
      </div>
      <div className="p-3 flex-grow">
        <p className="text-[11px] font-bold text-[#1a1a1a] group-hover:text-[#788069] transition-colors truncate uppercase tracking-widest">{attr.name}</p>
        {attr.description && <p className="text-[9px] text-[#1a1a1a]/50 mt-1 line-clamp-2 leading-relaxed italic">{attr.description}</p>}
      </div>
    </Link>
  );
}

// ─── Animated nav link (GSAP underline sweep) ─────────────────────────────────
const AnimatedLink = ({
  title, href, isScrolled, onMouseEnter, onMouseLeave,
}: {
  title: string; href: string; isScrolled: boolean;
  onMouseEnter?: () => void; onMouseLeave?: () => void;
}) => {
  const lineRef = useRef<HTMLSpanElement>(null);
  return (
    <Magnetic>
      <Link
        href={href}
        className="relative flex flex-col items-start px-2 py-1"
        onMouseEnter={() => {
          gsap.to(lineRef.current, { scaleX: 1, duration: 0.35, ease: 'power3.out', transformOrigin: 'left' });
          onMouseEnter?.();
        }}
        onMouseLeave={() => {
          gsap.to(lineRef.current, { scaleX: 0, duration: 0.3, ease: 'power3.in', transformOrigin: 'right' });
          onMouseLeave?.();
        }}
      >
        <span className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isScrolled ? 'text-[#1a1a1a]' : 'text-white'}`}>
          {title}
        </span>
        <span ref={lineRef} className="absolute bottom-0 left-2 right-2 h-[1.5px] bg-[#788069] scale-x-0" style={{ transformOrigin: 'left' }} />
      </Link>
    </Magnetic>
  );
};

// ─── Book button (GSAP bg sweep) ─────────────────────────────────────────────
const BookButton = ({ isScrolled, bookingUrl }: { isScrolled: boolean; bookingUrl: string }) => {
  const bgRef = useRef<HTMLDivElement>(null);
  return (
    <Magnetic>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={() => gsap.to(bgRef.current, { y: '0%', duration: 0.45, ease: 'power3.out' })}
        onMouseLeave={() => gsap.to(bgRef.current, { y: '101%', duration: 0.4, ease: 'power3.in' })}
        className={`relative overflow-hidden flex items-center justify-center px-8 py-3 rounded-md transition-colors duration-300 border ${isScrolled
          ? 'bg-[#1a1a1a] border-transparent text-white'
          : 'bg-white/10 backdrop-blur-md border-white/20 text-white'}`}
      >
        <div ref={bgRef} className="absolute inset-0 bg-[#788069] rounded-md" style={{ transform: 'translateY(101%)' }} />
        <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.25em]">Reserve Now</span>
      </a>
    </Magnetic>
  );
};

type ActiveDropdown = 'room' | 'package' | 'attraction' | null;

// ─── Main Header ─────────────────────────────────────────────────────────────
export const Header = ({ forceScrolledState = false }: { forceScrolledState?: boolean }) => {
  const { lightLogo, darkLogo, bookingEngineUrl } = useLandingSettings();
  const [internalIsScrolled, setInternalIsScrolled] = useState(false);
  const isScrolled = internalIsScrolled || forceScrolledState;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Update CSS var so mega-panel can position itself below the header
  useEffect(() => {
    const update = () => {
      if (headerRef.current) {
        const h = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-bottom', `${h}px`);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isScrolled, mobileMenuOpen]);


  // Room types
  useEffect(() => {
    getDocs(query(collection(db, "roomTypes"), orderBy("name")))
      .then(s => setRoomTypes(s.docs.map(d => ({ id: d.id, ...d.data() })) as RoomType[]))
      .catch(console.error);
  }, []);

  // Packages
  useEffect(() => {
    getDocs(query(collection(db, "packages"), orderBy("createdAt", "desc")))
      .then(s => setPackages(s.docs.map(d => ({ id: d.id, ...d.data() })) as Package[]))
      .catch(console.error);
  }, []);

  // Attractions
  useEffect(() => {
    getDocs(collection(db, "attractions"))
      .then(s => setAttractions(s.docs.map(d => ({ id: d.id, ...d.data() })) as Attraction[]))
      .catch(console.error);
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (forceScrolledState) return;
      setInternalIsScrolled(window.scrollY > (document.getElementById('hero-section') ? window.innerHeight * 1.3 : 50));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [forceScrolledState]);

  // Mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo('.mobile-menu-item',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power4.out', delay: 0.25 }
      );
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const show = useCallback((dd: ActiveDropdown) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setActiveDropdown(dd);
  }, []);

  const hide = useCallback(() => {
    hideTimeout.current = setTimeout(() => setActiveDropdown(null), 130);
  }, []);

  const keepOpen = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  }, []);

  return (
    <>
      <motion.header
        ref={headerRef as any}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-700 ${isScrolled || mobileMenuOpen
          ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100'
          : 'bg-transparent'}`}
      >
        <AnimatePresence>
          {!isScrolled && !mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              className="w-full overflow-hidden"
            >
              <Topbar />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`container mx-auto px-6 md:px-12 flex items-center justify-between transition-all duration-700 ${isScrolled || mobileMenuOpen ? 'py-4' : 'py-6'}`}>
          <Magnetic>
            <Link href="/" className="relative z-50 flex flex-col items-start select-none">
              {(lightLogo || darkLogo) ? (
                <img
                  src={(isScrolled || mobileMenuOpen) ? (darkLogo || lightLogo!) : (lightLogo || darkLogo!)}
                  alt="Bumi Anyom" className="h-5 md:h-6 w-auto object-contain transition-all duration-300"
                />
              ) : (
                <h1 className={`text-sm font-black tracking-widest uppercase transition-colors duration-300 ${isScrolled || mobileMenuOpen ? 'text-[#1a1a1a]' : 'text-white'}`}>
                  BUMI <span className="font-light">ANYOM</span>
                </h1>
              )}
              <span className={`text-[6px] md:text-[7px] font-bold uppercase tracking-[0.25em] block leading-none mt-1.5 pl-2 transition-colors duration-300 ${(isScrolled || mobileMenuOpen) ? 'text-[#1a1a1a]' : 'text-white/60'}`}>
                manage by nexura
              </span>
            </Link>
          </Magnetic>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {/* Room */}
            <div onMouseEnter={() => show('room')} onMouseLeave={hide}>
              <AnimatedLink title="Room" href="/rooms" isScrolled={isScrolled} />
            </div>
            {/* Package */}
            <div onMouseEnter={() => show('package')} onMouseLeave={hide}>
              <AnimatedLink title="Package" href="/packages" isScrolled={isScrolled} />
            </div>
            {/* Attraction */}
            <div onMouseEnter={() => show('attraction')} onMouseLeave={hide}>
              <AnimatedLink title="Attraction" href="/attractions" isScrolled={isScrolled} />
            </div>
            {/* Static links */}
            <AnimatedLink title="Gallery" href="/gallery" isScrolled={isScrolled} />
            <AnimatedLink title="Cafe & Resto" href="/cafe-resto" isScrolled={isScrolled} />
            <BookButton isScrolled={isScrolled} bookingUrl={bookingEngineUrl} />
          </nav>

          <Magnetic>
            <button
              className={`lg:hidden relative z-50 flex items-center justify-center p-3 rounded-md transition-colors ${isScrolled || mobileMenuOpen ? 'text-[#1a1a1a] bg-gray-100/50' : 'text-white bg-white/10 backdrop-blur-sm'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </Magnetic>
        </div>

        {/* ── Room mega-menu panel ── */}
        <div onMouseEnter={keepOpen} onMouseLeave={hide}>
          <MegaPanel visible={activeDropdown === 'room'} label="Room Categories">
            {roomTypes.map(r => <RoomCard key={r.id} room={r} />)}
          </MegaPanel>
        </div>

        {/* ── Package mega-menu panel ── */}
        <div onMouseEnter={keepOpen} onMouseLeave={hide}>
          <MegaPanel visible={activeDropdown === 'package'} label="Packages & Experiences">
            {packages.map(p => <PackageCard key={p.id} pkg={p} />)}
          </MegaPanel>
        </div>

        {/* ── Attraction mega-menu panel ── */}
        <div onMouseEnter={keepOpen} onMouseLeave={hide}>
          <MegaPanel visible={activeDropdown === 'attraction'} label="Nearby Attractions">
            {attractions.map(a => <AttractionCard key={a.id} attr={a} />)}
          </MegaPanel>
        </div>

      </motion.header>

      {/* ── Mobile full-screen overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
            animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
            exit={{ opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 bg-[#1a1a1a] pt-32 px-8 pb-12 flex flex-col justify-between lg:hidden overflow-y-auto"
          >
            <nav className="flex flex-col gap-8">
              {[
                { label: 'Room', href: '/rooms' }, { label: 'Package', href: '/packages' },
                { label: 'Attraction', href: '/attractions' }, { label: 'Gallery', href: '/gallery' },
                { label: 'Cafe & Resto', href: '/cafe-resto' },
              ].map((link, i) => (
                <div key={i} className="mobile-menu-item overflow-hidden">
                  <Link href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className="block text-4xl font-light text-white hover:text-[#788069] transition-colors uppercase tracking-widest"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="mobile-menu-item mt-10">
              <a href={bookingEngineUrl} target="_blank" rel="noreferrer" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full py-5 bg-[#fef7e5] text-[#1a1a1a] text-xs font-black uppercase tracking-[0.25em] rounded-md active:scale-95 transition-transform"
              >
                Reserve Your Stay
              </a>
              <div className="mt-10 flex justify-center gap-8 text-[#788069]">
                <a href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Instagram</a>
                <a href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Whatsapp</a>
                <a href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Email</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
