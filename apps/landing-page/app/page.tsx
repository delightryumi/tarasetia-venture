'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageLayout } from "@/components/layout/PageLayout";
import { WidgetSection } from "@/components/sections/widget/WidgetSection";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HeroSlide } from '../types/hero';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AboutBookingSection } from "@/components/sections/about/AboutBookingSection";
import { PromoSection } from "@/components/sections/promo/PromoSection";
import { RoomsSection } from "@/components/sections/rooms/RoomsSection";
import { PackagesSection } from "@/components/sections/packages/PackagesSection";
import { PartnersSection } from "@/components/sections/partners/PartnersSection";

import { WideLandscapeGallery } from "@/components/sections/gallery/WideLandscapeGallery";
import { FooterSection } from "@/components/sections/footer/FooterSection";

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const slidesWrapperRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const docRef = doc(db, "sections", "hero");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.slides && Array.isArray(data.slides)) {
            setSlides(data.slides);
          }
        }
      } catch (err) {
        console.error("Error fetching landing page slides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  useGSAP(() => {
    if (!containerRef.current || !slidesWrapperRef.current || slides.length === 0) return;

    const pinDuration = `${slides.length * 350}%`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${pinDuration}`,
        scrub: 1.5,
        pin: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const currentSlideIndex = Math.floor(progress * slides.length);
          const safeIndex = Math.min(currentSlideIndex, slides.length - 1);
          if (safeIndex !== activeIndex) {
            setActiveIndex(safeIndex);
          }
        }
      }
    });

    const slideNodes = gsap.utils.toArray('.gsap-slide') as HTMLElement[];

    const getAnimationProps = (type?: string) => {
      const base = { x: 0, y: 0, scale: 1, filter: 'blur(0px)' };
      switch (type) {
        case 'fade-down':
          return { start: { ...base, y: -50, filter: 'blur(10px)' }, active: { ...base }, exit: { ...base, y: 50, filter: 'blur(12px)' } };
        case 'slide-left':
          return { start: { ...base, x: 50, filter: 'blur(10px)' }, active: { ...base }, exit: { ...base, x: -50, filter: 'blur(12px)' } };
        case 'slide-right':
          return { start: { ...base, x: -50, filter: 'blur(10px)' }, active: { ...base }, exit: { ...base, x: 50, filter: 'blur(12px)' } };
        case 'zoom':
          return { start: { ...base, scale: 1.15, filter: 'blur(10px)' }, active: { ...base }, exit: { ...base, scale: 0.85, filter: 'blur(12px)' } };
        case 'fade':
          return { start: { ...base, filter: 'blur(10px)' }, active: { ...base }, exit: { ...base, filter: 'blur(12px)' } };
        case 'fade-up':
        default:
          return { start: { ...base, y: 50, filter: 'blur(10px)' }, active: { ...base }, exit: { ...base, y: -80, filter: 'blur(12px)' } };
      }
    };

    slideNodes.forEach((slide, i) => {
      const bg = slide.querySelector('.gsap-bg');
      const mg = slide.querySelector('.gsap-mg');
      const fg = slide.querySelector('.gsap-fg');
      const text = slide.querySelector('.gsap-text');
      const widget = slide.querySelector('.gsap-widget');

      const slideStart = i / slides.length;
      const slideEnd = (i + 1) / slides.length;
      const slideDuration = slideEnd - slideStart;

      const animProps = getAnimationProps(slides[i]?.textAnimation);

      const textEnterDuration = slideDuration * 0.20;
      const textHoldDuration = slideDuration * 0.45;
      const textExitDuration = slideDuration * 0.25;
      const widgetEnterDuration = slideDuration * 0.20;

      const enterStart = slideStart;
      const widgetStart = slideStart + textEnterDuration * 0.5; // widget comes in halfway through text entrance
      const exitStart = slideStart + textEnterDuration + textHoldDuration;

      // Initial state for all slides: images visible, text/widget hidden
      if (i === 0) {
        gsap.set(slide, { opacity: 1, zIndex: 1 });
        if (bg) gsap.set(bg, { scale: 1.15, y: "0vh" });
        if (mg) gsap.set(mg, { scale: 1.05, y: "0vh" });
        if (fg) gsap.set(fg, { scale: 1.1 });
        // First slide: text and widget HIDDEN at start — revealed on scroll
        if (text) gsap.set(text, { opacity: 0, y: 60, filter: 'blur(10px)' });
        if (widget) gsap.set(widget, { opacity: 0, y: 40 });
      } else {
        gsap.set(slide, { opacity: 0, zIndex: i + 1 });
        if (bg) gsap.set(bg, { scale: 1.15, y: "0vh" });
        if (mg) gsap.set(mg, { scale: 1.05, y: "0vh" });
        if (fg) gsap.set(fg, { scale: 1.1 });
        if (text) gsap.set(text, { opacity: 0, ...animProps.start });
        if (widget) gsap.set(widget, { opacity: 0, y: 40 });
      }

      // Background Parallax
      if (bg) tl.to(bg, { scale: 1.05, y: "10vh", ease: "none", duration: slideDuration }, slideStart);
      if (mg) tl.to(mg, { scale: 1.0, y: "-10vh", ease: "none", duration: slideDuration }, slideStart);
      if (fg) tl.to(fg, { scale: 1.25, ease: "none", duration: slideDuration }, slideStart);

      // Text Enter → Hold → Exit
      if (text) {
        // ALL slides (including first) animate text in on scroll
        tl.to(text, {
          opacity: 1,
          ...animProps.active,
          duration: textEnterDuration,
          ease: "power2.out"
        }, enterStart);

        if (i < slides.length - 1) {
          tl.to(text, {
            opacity: 0,
            ...animProps.exit,
            duration: textExitDuration,
            ease: "power1.inOut"
          }, exitStart);
        } else {
          tl.to(text, {
            opacity: 0,
            y: -150,
            filter: "blur(8px)",
            duration: textExitDuration,
            ease: "power2.in"
          }, exitStart);
        }
      }

      // Widget enters after text starts appearing
      if (widget) {
        tl.to(widget, {
          opacity: 1,
          y: 0,
          duration: widgetEnterDuration,
          ease: "power2.out"
        }, widgetStart);

        if (i < slides.length - 1) {
          tl.to(widget, {
            opacity: 0,
            y: -30,
            duration: textExitDuration,
            ease: "power1.inOut"
          }, exitStart);
        } else {
          tl.to(widget, {
            opacity: 0,
            y: -60,
            filter: "blur(6px)",
            duration: textExitDuration,
            ease: "power2.in"
          }, exitStart);
        }
      }

      // Background Crossfade
      if (i < slides.length - 1) {
        const nextSlide = slideNodes[i + 1];
        if (nextSlide) {
          tl.to(nextSlide, { opacity: 1, duration: textExitDuration, ease: "none" }, exitStart);
        }
      }
    });

    // ── Post-Hero GSAP Animations ──
    const select = gsap.utils.selector(mainRef);

    // MAGAZINE-OPEN EFFECT (Hero → Post-Hero Sections)
    const postHeroEl = select('.gsap-post-hero')[0] as HTMLElement;
    if (postHeroEl) {
      gsap.fromTo(postHeroEl,
        {
          rotateX: -8,
          scale: 0.95,
          opacity: 0.3,
          y: 60,
          transformOrigin: "top center",
        },
        {
          rotateX: 0,
          scale: 1,
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: postHeroEl,
            start: "top 95%",
            end: "top 40%",
            scrub: 1.5,
          },
        }
      );
    }

    // MAGAZINE STACKING EFFECT (About → Rooms)
    const aboutCardEl = select('.gsap-about-card')[0] as HTMLElement;
    const roomsTriggerEl = select('.gsap-rooms-reveal')[0] as HTMLElement;

    if (aboutCardEl && roomsTriggerEl) {
      gsap.to(aboutCardEl, {
        scale: 0.94,
        borderRadius: "2.5rem",
        ease: "none",
        scrollTrigger: {
          trigger: roomsTriggerEl,
          start: "top 100%", 
          end: "top 10%",
          scrub: 1.5,
        },
      });
    }


  }, { scope: mainRef, dependencies: [slides.length] });

  if (loading) {
    return (
      <PageLayout>
        <div className="h-screen w-full bg-[#1a1a1a]" />
      </PageLayout>
    );
  }

  if (slides.length === 0) {
    return (
      <PageLayout>
        <div className="h-screen w-full bg-[#1a1a1a] flex items-center justify-center">
          <h1 className="text-white/50 font-light tracking-widest uppercase text-center px-4">
            Landing Page Content Not Configured <br />
            Please Setup Slides in Admin Dashboard
          </h1>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout forceScrolledState={activeIndex > 0}>
      <main ref={mainRef} className="w-full bg-[#1a1a1a]">

        <div ref={containerRef} className="relative h-screen w-full bg-[#1a1a1a]">
          <div ref={slidesWrapperRef} className="absolute inset-0 w-full h-full overflow-hidden">
            {slides.map((slide, index) => (
              <div key={slide.id} className="gsap-slide absolute inset-0 w-full h-full">

                {/* Background Layer */}
                <div className="gsap-bg absolute inset-x-0 -top-[20vh] w-full h-[140vh] pointer-events-none will-change-transform">
                  {slide.backgroundImage && (
                    <img src={slide.backgroundImage} alt="Background" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Midground Layer */}
                {slide.midgroundImage && (
                  <div className="gsap-mg absolute inset-x-0 -top-[10vh] w-full h-[130vh] pointer-events-none will-change-transform origin-center">
                    <img src={slide.midgroundImage} alt="Midground" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Foreground Layer */}
                {slide.foregroundImage && (
                  <div className="gsap-fg absolute inset-x-0 bottom-0 w-full h-full pointer-events-none z-30 origin-bottom will-change-transform">
                    <img src={slide.foregroundImage} alt="Foreground" className="w-full h-full object-cover object-bottom" />
                  </div>
                )}

                {/* Typography + Widget Container */}
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                  <div className="max-w-5xl mx-auto w-full flex flex-col items-center">

                    {/* Title / Subtitle — animated by GSAP */}
                    <div className="gsap-text w-full flex flex-col items-center pointer-events-auto">
                      {slide.title && (
                        <h1
                          className="text-6xl md:text-8xl lg:text-9xl font-light italic text-white leading-[1.0] tracking-wide mb-4 drop-shadow-2xl whitespace-pre-line"
                          style={{ fontFamily: 'var(--font-display), serif' }}
                        >
                          {slide.title}
                        </h1>
                      )}
                      {slide.subtitle && (
                        <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl leading-relaxed drop-shadow-lg">
                          {slide.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Widget — animated by GSAP, appears after text */}
                    <div className="gsap-widget mt-8 w-full flex justify-center pointer-events-auto">
                      <WidgetSection insideHero={true} />
                    </div>

                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* POST-HERO SECTIONS */}
        <div className="gsap-post-hero relative w-full z-50 bg-[#fdfbf7]" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>

          {/* ── CARD 1: Promo (Reveal flow — slides over Hero) ── */}
          <div className="gsap-promo-reveal relative z-20">
            <PromoSection />
          </div>

          {/* ── CARD 2: About (Internal pinning handles scroll) ── */}
          <div className="gsap-about-card relative z-30">
            <div className="rounded-t-[2.5rem] bg-[#fef7e5]">
              <AboutBookingSection />
            </div>
          </div>

          {/* ── CARD 3: Rooms (Slides OVER About) ── */}
          <div className="gsap-rooms-reveal relative z-40 bg-[#fdfbf7] rounded-t-[1.5rem]">
            <RoomsSection />
          </div>

          {/* ── CARD 3.5: Packages ── */}
          <div className="gsap-packages-reveal relative z-40">
            <PackagesSection />
          </div>

          {/* ── CARD 4: Partners (Dark, slide-up) ── */}
          <div className="gsap-partners-reveal relative z-40 bg-[#111310]">
            <PartnersSection />
          </div>

          {/* ── NEW WIDE LANDSCAPE GALLERY (No GSAP Magazine wrapper) ── */}
          <div className="relative z-50 bg-[#111310]">
            <WideLandscapeGallery />
          </div>

          {/* ── FOOTER (Magazine Close Reveal) ── */}
          <div className="gsap-footer-reveal relative z-[70] bg-[#fdfbf7]" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
            <FooterSection />
          </div>

        </div>

      </main>
    </PageLayout>
  );
}
