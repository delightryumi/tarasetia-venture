"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

const OTA_LOGOS = [
    { name: "Booking.com",  src: "/ota-logo/bcom.png" },
    { name: "Agoda",        src: "/ota-logo/agoda.png" },
    { name: "Traveloka",    src: "/ota-logo/traveloka.png" },
    { name: "Expedia",      src: "/ota-logo/expedia.png" },
    { name: "Tiket.com",    src: "/ota-logo/tiket.png" },
    { name: "Trip.com",     src: "/ota-logo/trip.png" },
    { name: "MG Bedbank",   src: "/ota-logo/MG.png" },
    { name: "TrustYou",     src: "/ota-logo/trustyou.png" },
    { name: "Xendit",       src: "/ota-logo/xendit.png" },
    { name: "YCS",          src: "/ota-logo/ycs.png" },
];

// Split into two rows for visual balance
const ROW_1 = OTA_LOGOS.slice(0, 5);
const ROW_2 = OTA_LOGOS.slice(5);

// Duplicate each row so the infinite marquee loops seamlessly
const track = (row: typeof ROW_1) => [...row, ...row, ...row];

export const PartnersSection = () => {
    const sectionRef   = useRef<HTMLElement>(null);
    const tagRef       = useRef<HTMLSpanElement>(null);
    const titleRef     = useRef<HTMLHeadingElement>(null);
    const row1Ref      = useRef<HTMLDivElement>(null);
    const row2Ref      = useRef<HTMLDivElement>(null);
    const dividerRef   = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            // ─── Header reveal using FROM ───

            // ─── Header reveal on scroll ───
            gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 95%", // Trigger earlier
                    toggleActions: "play none none reverse", // Changed to not reverse on every scroll back if it flickers
                }
            })
            .from(tagRef.current,     { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" })
            .from(titleRef.current,   { y: 40, opacity: 0, duration: 1.1, ease: "expo.out" }, "-=0.5")
            .from(dividerRef.current, { y: 20, opacity: 0, duration: 1.0, ease: "power2.out" }, "-=0.6");

            // ─── Infinite marquee row 1 (left) ───
            const row1 = row1Ref.current;
            if (row1) {
                const w = row1.scrollWidth / 3;
                gsap.fromTo(row1,
                    { x: 0 },
                    { x: -w, duration: 30, ease: "none", repeat: -1 }
                );
            }

            // ─── Infinite marquee row 2 (right, opposite direction) ───
            const row2 = row2Ref.current;
            if (row2) {
                const w = row2.scrollWidth / 3;
                gsap.fromTo(row2,
                    { x: -w },
                    { x: 0, duration: 26, ease: "none", repeat: -1 }
                );
            }

            // ─── Animated Ambient Background ───
            const orbs = gsap.utils.toArray('.gsap-ambient-orb') as HTMLElement[];
            orbs.forEach((orb, i) => {
                gsap.to(orb, {
                    x: "random(-100, 100, 5)",
                    y: "random(-50, 50, 5)",
                    scale: "random(0.8, 1.2)",
                    rotation: "random(-30, 30)",
                    duration: "random(8, 15)",
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: i * -2 // Offset starting times
                });
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative w-full bg-[#fdfbf7] py-12 md:py-16 overflow-hidden"
            id="partners"
        >
            {/* ── Animated Ambient Background ── */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                {/* Orb 1: Sage Green */}
                <div className="gsap-ambient-orb absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] min-w-[300px] min-h-[300px] rounded-full bg-[#788069]/10 blur-[80px] md:blur-[120px]" />
                {/* Orb 2: Warm Sand */}
                <div className="gsap-ambient-orb absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] min-w-[400px] min-h-[400px] rounded-full bg-[#ffd8a6]/25 blur-[100px] md:blur-[140px]" />
                {/* Orb 3: Terracotta hint */}
                <div className="gsap-ambient-orb absolute top-[20%] right-[15%] w-[30vw] h-[30vw] min-w-[200px] min-h-[200px] rounded-full bg-[#788069]/5 blur-[80px] md:blur-[100px]" />
            </div>

            {/* Subtle noise texture over background */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}
            />

            <div className="relative z-10 container mx-auto px-4 md:px-8 mb-8 md:mb-10 flex flex-col items-center text-center">
                <span
                    ref={tagRef}
                    className="inline-block text-[#788069] font-black text-[10px] md:text-xs tracking-[0.4em] uppercase mb-6 border-b border-[#788069]/30 pb-3"
                >
                    Trusted Network
                </span>
                <h2
                    ref={titleRef}
                    className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-[#1a1a1a] font-light leading-[0.95] uppercase mb-8"
                    style={{ fontFamily: "var(--font-display), serif" }}
                >
                    Global Partners
                </h2>

                {/* Animated divider */}
                <div ref={dividerRef} className="flex items-center gap-4">
                    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#788069]/40" />
                    <div className="w-1.5 h-1.5 rounded-sm bg-[#788069] rotate-45" />
                    <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#788069]/40" />
                </div>
            </div>

            {/* ── Marquee Track Area ── */}
            <div className="relative z-10 flex flex-col gap-6 overflow-hidden select-none">

                {/* Fade edges */}
                <div className="absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-[#fdfbf7] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-[#fdfbf7] to-transparent z-10 pointer-events-none" />

                {/* Row 1 — scrolls left */}
                <div className="overflow-hidden py-2">
                    <div ref={row1Ref} className="flex gap-6 will-change-transform" style={{ width: "max-content" }}>
                        {track(ROW_1).map((logo, i) => (
                            <LogoCard key={i} logo={logo} />
                        ))}
                    </div>
                </div>

                {/* Row 2 — scrolls right */}
                <div className="overflow-hidden py-2">
                    <div ref={row2Ref} className="flex gap-6 will-change-transform" style={{ width: "max-content" }}>
                        {track(ROW_2).map((logo, i) => (
                            <LogoCard key={i} logo={logo} />
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom count stat */}
            <div className="relative z-10 container mx-auto px-4 md:px-8 mt-8 md:mt-10 flex justify-center">
                <p className="text-[#788069]/50 text-xs tracking-[0.3em] uppercase font-medium">
                    Distributing across 10+ global platforms
                </p>
            </div>

            {/* Bottom separator */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#788069]/20 to-transparent" />
        </section>
    );
};

/* ── Logo Card Sub-component — light theme ── */
const LogoCard = ({ logo }: { logo: { name: string; src: string } }) => (
    <div className="group flex items-center justify-center px-8 py-5 rounded-2xl border border-[#788069]/10 bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-white hover:border-[#788069]/30 transition-all duration-500 ease-out cursor-pointer shrink-0 w-[180px]">
        <div className="w-28 h-9 flex items-center justify-center">
            <img
                src={logo.src}
                alt={logo.name}
                // Grayscale base, full color on hover. Added saturate fallback. No invert needed for light bg.
                className="max-w-full max-h-full w-auto h-auto object-contain filter grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 ease-out"
                style={{ maxWidth: "112px", maxHeight: "36px" }}
                draggable={false}
            />
        </div>
    </div>
);
