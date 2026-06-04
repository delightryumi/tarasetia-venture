"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  CheckCircle2
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePackages, Package } from "./usePackages";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const AUTO_PLAY_DURATION = 6;

export function PackagesSection() {
  const { packages, loading } = usePackages();

  /* ---------------- STATE ---------------- */
  const [items, setItems] = useState<Package[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* ---------------- REFS ---------------- */
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressTween = useRef<gsap.core.Tween | null>(null);

  /* ---------------- INIT ---------------- */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (packages?.length) setItems(packages);
  }, [packages]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => ScrollTrigger.refresh(), 100);
    }
  }, [loading, items.length]);

  /* ---------------- ANIMATIONS ---------------- */
  const { contextSafe } = useGSAP({ scope: containerRef });

  const animateTextIn = contextSafe(() => {
    if (!textRef.current) return;
    gsap.fromTo(
      textRef.current.children,
      { y: 40, opacity: 0, filter: "blur(10px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
      }
    );
  });

  const animateBgReveal = contextSafe(() => {
    if (!bgImageRef.current) return;
    
    gsap.killTweensOf(bgImageRef.current);
    
    gsap.fromTo(
      bgImageRef.current,
      { 
        scale: 1.15,
        opacity: 0, 
        filter: "blur(10px)"
      },
      {
        scale: 1,
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.5,
        ease: "power2.out",
      }
    );
  });

  const updateCarousel = contextSafe(() => {
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      gsap.to(card, {
        xPercent: i * (isMobile ? 105 : 120),
        scale: 1 - i * 0.1,
        opacity: i === 0 ? 1 : 1 - i * 0.3,
        zIndex: 10 - i,
        filter: i === 0 ? "blur(0px)" : `blur(${i * 2}px)`,
        duration: 0.8,
        ease: "power3.inOut",
      });
    });
  });

  const resetProgressBar = contextSafe(() => {
    if (!progressRef.current) return;
    if (progressTween.current) progressTween.current.kill();

    gsap.set(progressRef.current, { scaleX: 0, transformOrigin: "left" });

    progressTween.current = gsap.to(progressRef.current, {
      scaleX: 1,
      duration: AUTO_PLAY_DURATION,
      ease: "none",
      onComplete: () => handleNext(),
    });
  });

  /* ---------------- HANDLERS ---------------- */
  const handleNext = useCallback(() => {
    if (isAnimating || items.length < 2) return;
    setIsAnimating(true);

    gsap.to(textRef.current?.children || [], {
      y: -20,
      opacity: 0,
      filter: "blur(5px)",
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.in",
    });

    setTimeout(() => {
      setItems((prev) => {
        const p = [...prev];
        const first = p.shift();
        if (first) p.push(first);
        return p;
      });
      setIsAnimating(false);
    }, 400);
  }, [items, isAnimating]);

  const handlePrev = useCallback(() => {
    if (isAnimating || items.length < 2) return;
    setIsAnimating(true);
    
    gsap.to(textRef.current?.children || [], { opacity: 0, duration: 0.2 });

    setTimeout(() => {
      setItems((prev) => {
        const p = [...prev];
        const last = p.pop();
        if (last) p.unshift(last);
        return p;
      });
      setIsAnimating(false);
    }, 200);
  }, [items, isAnimating]);

  /* ---------------- TRIGGER ---------------- */
  useGSAP(() => {
    if (items.length > 0 && !loading) {
      animateTextIn();
      animateBgReveal();
      updateCarousel();
      resetProgressBar();
    }
  }, [items, loading]);

  /* ---------------- HELPER ---------------- */
  const renderTwoToneTitle = (text: string) => {
    const words = text.split(" ");
    if (words.length < 2) return <span className="text-[#fef7e5]">{text}</span>;
    const firstWord = words[0];
    const restWords = words.slice(1).join(" ");
    return (
      <>
        <span className="text-[#fef7e5] font-medium">{firstWord}</span>{" "}
        <span className="text-[#ffd8a6] font-light italic">{restWords}</span>
      </>
    );
  };

  const formatIDR = (priceString: string) => {
    // If it's already formatted or non-numeric, just return
    const num = parseInt(priceString.replace(/\D/g, ''), 10);
    if (isNaN(num)) return priceString;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  /* ---------------- RENDER ---------------- */
  if (loading) return null;
  if (!items.length) return null;
  
  const active = items[0];
  const fallbackImg = "https://images.unsplash.com/photo-1542314831-c6a4d14d8c1c?auto=format&fit=crop&q=80";

  return (
    <section ref={containerRef} className="relative w-full min-h-[100vh] overflow-hidden bg-[#111310] text-white rounded-t-[1.5rem]">
      
      {/* === 1. BACKGROUND LAYER (CINEMATIC REVEAL) === */}
      <div className="absolute inset-0 z-0">
         <div ref={bgImageRef} className="absolute inset-0 w-full h-full">
            <Image
                src={active.imageUrl || fallbackImg}
                alt={active.name}
                fill
                priority
                className="object-cover"
            />
         </div>

         {/* Overlay Gradient (Left to Right) */}
         <div className="absolute inset-0 bg-gradient-to-r from-[#111310]/95 via-[#111310]/60 to-transparent z-10" />
         
         {/* Vignette */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(17,19,16,0.6)_100%)] z-10" />
      </div>


      {/* === 2. CONTENT CONTAINER === */}
      <div className="relative z-30 max-w-[1400px] mx-auto px-6 md:px-12 min-h-[100vh] flex flex-col pt-32 pb-12">
        
        {/* --- SECTION HEADER --- */}
        <div className="w-full mb-8 md:mb-12 z-40">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-12 h-[2px] bg-[#ffd8a6]"></div>
             <span className="text-[#ffd8a6] text-[10px] font-bold tracking-[0.3em] uppercase">
               Exclusive Offers
             </span>
           </div>
           <h2 className="text-[#fef7e5]/90 font-light text-xl md:text-3xl tracking-widest uppercase opacity-90 leading-relaxed" style={{ fontFamily: 'var(--font-heading), serif' }}>
             Lengkapi Perjalanan Anda
           </h2>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="flex-grow grid md:grid-cols-12 gap-10 items-center w-full">
          
          {/* --- LEFT: INFO --- */}
          <div className="md:col-span-7 lg:col-span-6">
            <div ref={textRef} className="space-y-6 md:space-y-8">
              
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] bg-[#ffd8a6] text-[#111310] rounded-sm">
                  {active.packageType || "Package"}
                </span>
                <div className="flex gap-1 text-[#ffd8a6]">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl uppercase leading-[0.9] tracking-tight drop-shadow-2xl" style={{ fontFamily: 'var(--font-heading), serif' }}>
                {renderTwoToneTitle(active.name)}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-[#fef7e5]/90 text-sm font-medium border-l-2 border-[#ffd8a6] pl-4">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#ffd8a6]" /> 
                    <span>Bumi Anyom</span>
                </div>
              </div>

              <div className="space-y-4">
                {active.price && parseInt(active.price.replace(/\D/g, ''), 10) > 0 ? (
                  <div className="flex flex-col">
                     <p className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Starting From</p>
                     <p className="text-3xl md:text-4xl text-[#ffd8a6] font-medium" style={{ fontFamily: 'var(--font-heading), serif' }}>
                        {formatIDR(active.price)}
                     </p>
                  </div>
                ) : null}
                
                <p className="text-white/70 text-sm max-w-lg line-clamp-3 leading-relaxed font-light border-t border-white/10 pt-4">
                  {active.description}
                </p>

                {active.features && active.features.length > 0 && (
                  <ul className="grid grid-cols-2 gap-2 mt-4 max-w-lg">
                    {active.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/80 font-light">
                        <CheckCircle2 size={14} className="text-[#788069] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-2 flex gap-4 items-center">
                <Link
                  href={`/packages/${active.id}`}
                  className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-white font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg hover:shadow-[#788069]/30 border border-white/10"
                  style={{ background: 'linear-gradient(135deg, #788069 0%, #5a614e 100%)' }}
                >
                  Explore Details
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex gap-3 ml-2">
                    <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all text-white backdrop-blur-sm group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button onClick={handleNext} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all text-white backdrop-blur-sm group">
                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: CAROUSEL STACK --- */}
          <div className="md:col-span-5 lg:col-span-6 relative h-[300px] md:h-[400px] flex items-center justify-center md:justify-end mt-8 md:mt-0">
             
             <div ref={carouselRef} className="relative w-[200px] md:w-[240px] h-[280px] md:h-[340px]">
                {items.slice(1, 5).map((pkg, i) => (
                  <div
                    key={pkg.id}
                    ref={(el) => { if (el) cardsRef.current[i] = el; }}
                    className="absolute top-0 right-0 w-full h-full origin-bottom-right cursor-pointer"
                    onClick={handleNext}
                  >
                     <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#111310] group">
                      <Image
                        src={pkg.imageUrl || fallbackImg}
                        alt={pkg.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Gradient Overlay pada Kartu */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                      
                      <div className="absolute bottom-5 left-5 right-5 z-20">
                        <p className="text-[8px] uppercase tracking-widest text-[#ffd8a6] mb-1 font-bold">Next</p>
                        <h3 className="text-sm font-bold uppercase leading-tight text-white line-clamp-2 drop-shadow-md" style={{ fontFamily: 'var(--font-heading), serif' }}>
                          {pkg.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
             </div>

             {/* Auto-Scroll Progress Bar */}
             <div className="absolute bottom-0 right-0 w-[200px] md:w-[240px] h-[2px] bg-white/10 rounded-full overflow-hidden mt-6">
                 <div ref={progressRef} className="h-full bg-[#ffd8a6] w-full origin-left scale-x-0 shadow-[0_0_10px_#ffd8a6]" />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
