"use client";

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight, Calendar, Users, Minus, Plus } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Magnetic } from "@/components/ui/Magnetic";
import { LuxuryCalendar } from "@/components/ui/LuxuryCalendar/LuxuryCalendar";
import { useLandingSettings } from "@/services/useLandingSettings";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/* ── Premium Background System ──────────────────────────────────────────── */

/* Bold marquee running text rows */
const MarqueeLines = () => {
    const rows = [
        { text: "BUMI ANYOM RESORT    ·    ", opacity: 0.12 },
        { text: "NEXURA GLOBAL HOSPITALITY    ·    ", opacity: 0.12 },
        { text: "#KEMBALIMEMBUMI    ·    ", opacity: 0.10 },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden flex flex-col justify-between py-12 md:py-24 h-full">
            {rows.map((row, i) => {
                // Duplicate text enough times for a seamless loop
                const words = Array.from({ length: 8 }, () => row.text);
                return (
                    <div
                        key={i}
                        className="w-full overflow-hidden flex"
                        style={{ opacity: row.opacity }}
                    >
                        {/* Track contains 2 sets of words for the sliding window effect */}
                        <div 
                            className="marquee-track flex whitespace-nowrap will-change-transform"
                            data-dir={i % 2 === 0 ? -1 : 1}
                        >
                            {/* Set 1 */}
                            {words.map((w, j) => (
                                <span key={`a-${j}`} className="text-3xl md:text-5xl lg:text-[5rem] font-black uppercase tracking-[0.25em] text-[#788069] pr-12 md:pr-20 select-none">
                                    {w}
                                </span>
                            ))}
                            {/* Set 2 (Clone for loop) */}
                            {words.map((w, j) => (
                                <span key={`b-${j}`} className="text-3xl md:text-5xl lg:text-[5rem] font-black uppercase tracking-[0.25em] text-[#788069] pr-12 md:pr-20 select-none">
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* Bold SVG gradient-arc circles */
const ArcCircles = () => (
    <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="arcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#788069" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#ffd8a6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#788069" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="arcGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd8a6" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#788069" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffd8a6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="arcGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#788069" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffd8a6" stopOpacity="0.1" />
            </linearGradient>
        </defs>

        {/* Large arc top-right */}
        <circle
            cx="1300" cy="-80" r="420"
            stroke="url(#arcGrad1)" strokeWidth="1.5" fill="none"
            style={{ animation: "arc-drift-1 22s ease-in-out infinite" }}
        />
        {/* Inner arc top-right (thinner) */}
        <circle
            cx="1300" cy="-80" r="320"
            stroke="url(#arcGrad1)" strokeWidth="0.8" fill="none"
            style={{ animation: "arc-drift-1 28s ease-in-out infinite reverse" }}
        />

        {/* Large arc bottom-left */}
        <circle
            cx="140" cy="980" r="500"
            stroke="url(#arcGrad2)" strokeWidth="1.5" fill="none"
            style={{ animation: "arc-drift-2 26s ease-in-out infinite" }}
        />
        {/* Inner arc bottom-left */}
        <circle
            cx="140" cy="980" r="370"
            stroke="url(#arcGrad2)" strokeWidth="0.6" fill="none"
            style={{ animation: "arc-drift-2 32s ease-in-out infinite reverse" }}
        />

        {/* Mid accent arc */}
        <circle
            cx="720" cy="450" r="280"
            stroke="url(#arcGrad3)" strokeWidth="0.5" fill="none"
            style={{ animation: "arc-drift-1 36s ease-in-out infinite" }}
        />

        {/* Diagonal accent line */}
        <line x1="0" y1="900" x2="1440" y2="0" stroke="rgba(120,128,105,0.06)" strokeWidth="1" />
        <line x1="0" y1="820" x2="1440" y2="0" stroke="rgba(255,216,166,0.08)" strokeWidth="0.5" />
    </svg>
);

/* Warm sand gradient blobs */
const SandBlobs = () => (
    <div className="sand-blobs absolute inset-0 pointer-events-none z-0 overflow-hidden scale-110">
        {/* Top right warm blob */}
        <div
            className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle at 55% 45%, rgba(255,216,166,0.22) 0%, rgba(254,247,229,0) 65%)" }}
        />
        {/* Bottom left warm blob */}
        <div
            className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle at 45% 55%, rgba(255,216,166,0.18) 0%, rgba(254,247,229,0) 65%)" }}
        />
        {/* Center sage tint */}
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(ellipse at center, rgba(120,128,105,0.04) 0%, transparent 70%)" }}
        />
    </div>
);

/* Keyframes */
const AnimationStyles = () => (
    <style>{`
        @keyframes arc-drift-1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33%       { transform: translate(18px, -14px) rotate(3deg); }
            66%       { transform: translate(-12px, 10px) rotate(-2deg); }
        }
        @keyframes arc-drift-2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            40%       { transform: translate(-16px, 12px) rotate(-3deg); }
            75%       { transform: translate(12px, -8px) rotate(2deg); }
        }
    `}</style>
);


export const AboutBookingSection = () => {
    const { bookingEngineUrl: bookingUrl } = useLandingSettings();
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const tagRef = useRef<HTMLParagraphElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const bodyRef = useRef<HTMLParagraphElement>(null);
    const dividerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef<HTMLDivElement>(null);

    const [guests, setGuests] = useState(2);
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);
    const [openCalendar, setOpenCalendar] = useState<"checkin" | "checkout" | null>(null);

    const formatDate = (d: Date | null) =>
        d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Select Date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);


    // GSAP animations using useGSAP for automatic cleanup and DOM stability
    useGSAP(() => {
        const mm = gsap.matchMedia();

        mm.add("(min-width: 1024px)", () => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "+=400%",
                    pin: contentRef.current,
                    scrub: 1,
                    pinSpacing: true
                }
            });

            // Marquee
            const tracks = gsap.utils.toArray(".marquee-track", sectionRef.current) as HTMLElement[];
            tracks.forEach((el, i) => {
                const dir = parseInt(el.getAttribute("data-dir") || "-1");
                tl.fromTo(el,
                    { xPercent: dir === 1 ? -50 : 0 },
                    { xPercent: dir === 1 ? 0 : -50, ease: "none" },
                    0
                );
            });

            // Sand Blobs
            tl.to(".sand-blobs", { y: 150, rotation: 3, ease: "none" }, 0);

            // Cinematic Exit with Blur (Desktop Only)
            if (innerContentRef.current) {
                tl.to(innerContentRef.current, {
                    opacity: 0,
                    scale: 0.95,
                    y: -50,
                    filter: "blur(8px)",
                    duration: 0.15,
                    ease: "power2.in"
                }, 0.85);
            }
        });

        mm.add("(max-width: 1023px)", () => {
            // No transitions on mobile as requested to prevent visibility issues
            // Content will be static and scrollable normally
        });
    }, { scope: sectionRef });

    return (
        <section
            ref={sectionRef}
            className="relative w-full min-h-screen lg:h-screen bg-[#fef7e5]" 
            style={{
                borderRadius: "3.5rem 3.5rem 0 0",
                boxShadow: "0 -30px 80px rgba(0,0,0,0.08), 0 -2px 0px rgba(255,216,166,0.3)",
                willChange: "transform",
            }}
            id="about-booking"
        >
            <AnimationStyles />
            {/* ── Content & Background (Unified Pinned Container) ── */}
            <div ref={contentRef} className="relative z-10 w-full min-h-screen lg:h-screen flex items-center px-6 md:px-12 xl:px-24 2xl:px-40 py-20 lg:py-12 overflow-hidden" style={{ transition: 'filter 0.3s ease-out' }}>
                <SandBlobs />
                <ArcCircles />
                <MarqueeLines />
                
                <div 
                    ref={innerContentRef} 
                    className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 xl:gap-36 items-center max-w-[1800px] mx-auto transform-gpu"
                    style={{ willChange: 'transform, opacity' }}
                >
                    {/* Left Column — Copy */}
                    <div className="max-w-2xl">
                        <p
                            ref={tagRef}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-md border border-[#ffd8a6] text-[10px] font-black uppercase tracking-[0.35em] text-[#788069] bg-[#ffd8a6]/30 mb-8"
                        >
                            <span className="w-1.5 h-1.5 rounded-sm bg-[#A6AE96] animate-pulse" />
                            Global Partner
                        </p>

                        <h2
                            ref={headingRef}
                            className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl leading-[1.1] text-[#1a1a1a] mb-8"
                            style={{ fontFamily: "var(--font-display), serif" }}
                        >
                            Experience{" "}
                            <span className="italic text-[#A6AE96]">five star</span>
                            <br />
                            at Bumi Anyom
                        </h2>

                        <div
                            ref={dividerRef}
                            className="w-20 h-[2px] bg-gradient-to-r from-[#A6AE96] to-transparent mb-8 origin-left"
                        />

                        <p
                            ref={bodyRef}
                            className="text-sm md:text-base lg:text-lg text-[#1a1a1a]/55 leading-relaxed max-w-lg"
                        >
                            Nestled in the serene highlands of Temanggung, Central Java,
                            Bumi Anyom Resort is a luxurious five-star retreat built with a
                            vision to provide impeccable hospitality to the discerning
                            traveler. Surrounded by breathtaking volcanic landscapes and
                            lush tea plantations, let time slow down as you immerse yourself
                            in unparalleled tranquility.
                        </p>
                    </div>

                    {/* Right Column — Booking Widget */}
                    <div ref={widgetRef} className="w-full flex lg:justify-end">
                        <div className="w-full max-w-lg bg-white border border-gray-100 rounded-2xl p-8 md:p-10 shadow-xl shadow-[#788069]/10">
                            <h3
                                className="text-3xl md:text-4xl text-[#1a1a1a] mb-10 italic"
                                style={{ fontFamily: "var(--font-display), serif" }}
                            >
                                Check Availability
                            </h3>

                            <div className="space-y-8">
                                {/* Date Row */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Check-In */}
                                    <div className="relative group cursor-pointer" onClick={() => setOpenCalendar(openCalendar === 'checkin' ? null : 'checkin')}>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#788069] mb-3 flex items-center gap-2">
                                            <Calendar size={11} /> Check-In
                                        </p>
                                        <div className={`bg-white border rounded-xl px-5 py-4 transition-colors duration-300 ${openCalendar === 'checkin' ? 'border-[#788069]' : 'border-[#ffd8a6] group-hover:border-[#788069]'}`}>
                                            <p className={`text-sm font-medium ${checkIn ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40'}`}>
                                                {formatDate(checkIn)}
                                            </p>
                                        </div>
                                        <AnimatePresence>
                                            {openCalendar === 'checkin' && (
                                                <LuxuryCalendar
                                                    selectedDate={checkIn}
                                                    onSelect={(d) => { setCheckIn(d); if (checkOut && d >= checkOut) setCheckOut(null); }}
                                                    minDate={today}
                                                    onClose={() => setOpenCalendar(null)}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    {/* Check-Out */}
                                    <div className="relative group cursor-pointer" onClick={() => setOpenCalendar(openCalendar === 'checkout' ? null : 'checkout')}>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#788069] mb-3 flex items-center gap-2">
                                            <Calendar size={11} /> Check-Out
                                        </p>
                                        <div className={`bg-white border rounded-xl px-5 py-4 transition-colors duration-300 ${openCalendar === 'checkout' ? 'border-[#788069]' : 'border-[#ffd8a6] group-hover:border-[#788069]'}`}>
                                            <p className={`text-sm font-medium ${checkOut ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40'}`}>
                                                {formatDate(checkOut)}
                                            </p>
                                        </div>
                                        <AnimatePresence>
                                            {openCalendar === 'checkout' && (
                                                <LuxuryCalendar
                                                    selectedDate={checkOut}
                                                    onSelect={(d) => setCheckOut(d)}
                                                    minDate={checkIn ?? today}
                                                    onClose={() => setOpenCalendar(null)}
                                                    alignRight
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gray-200" />

                                {/* Guests */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#788069] mb-2 flex items-center gap-2">
                                            <Users size={11} /> Guests
                                        </p>
                                        <p className="text-lg text-[#1a1a1a]">
                                            {guests} Person{guests > 1 && "s"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-[#fef7e5] rounded-xl p-1.5 border border-[#ffd8a6]">
                                        <button
                                            onClick={() =>
                                                setGuests(Math.max(1, guests - 1))
                                            }
                                            className="w-10 h-10 rounded-md bg-white border border-[#ffd8a6] flex items-center justify-center hover:bg-[#ffd8a6]/20 transition-colors text-[#1a1a1a]"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="font-bold w-5 text-center text-[#1a1a1a] text-sm">
                                            {guests}
                                        </span>
                                        <button
                                            onClick={() => setGuests(guests + 1)}
                                            className="w-10 h-10 rounded-md bg-[#788069] text-white flex items-center justify-center hover:bg-[#6a7260] transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="pt-4">
                                    <Magnetic>
                                        <a
                                            href={bookingUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group relative w-full flex items-center justify-center p-5 bg-[#788069] text-white rounded-xl overflow-hidden hover:shadow-xl hover:shadow-[#788069]/20 transition-all duration-500"
                                        >
                                            <div className="absolute inset-0 bg-[#ffd8a6] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]" />
                                            <span className="relative z-10 flex items-center gap-3 text-xs font-black uppercase tracking-[0.25em] group-hover:text-[#1a1a1a] transition-colors duration-300">
                                                Reserve Now
                                                <ArrowUpRight
                                                    className="group-hover:rotate-45 transition-transform duration-300"
                                                    size={16}
                                                />
                                            </span>
                                        </a>
                                    </Magnetic>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
