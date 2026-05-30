"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TicketPercent, CalendarDays, ArrowRight } from "lucide-react";
import { Magnetic } from "@/components/ui/Magnetic";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface PromoData {
    isActive: boolean;
    title: string;
    description: string;
    promoCode: string;
    expiryDate: string;
    imageUrl: string;
}

export const PromoSection = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const tagRef = useRef<HTMLParagraphElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);
    const codeRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);

    // Header Refs
    const headerSuperRef = useRef<HTMLSpanElement>(null);
    const headerTitleRef = useRef<HTMLHeadingElement>(null);
    const headerDescRef = useRef<HTMLParagraphElement>(null);

    const [promo, setPromo] = useState<PromoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPromo = async () => {
            try {
                const docSnap = await getDoc(doc(db, "sections", "promo"));
                if (docSnap.exists()) {
                    setPromo(docSnap.data() as PromoData);
                }
            } catch (err) {
                console.error("Failed to load promo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPromo();
    }, []);

    useEffect(() => {
        if (loading || !promo?.isActive || !sectionRef.current) return;

        const ctx = gsap.context(() => {

            // ─── Pre-position elements below their final position ───
            gsap.set(
                [headerSuperRef.current, headerTitleRef.current, headerDescRef.current],
                { y: 60 }
            );
            gsap.set(containerRef.current, { y: 100 });
            gsap.set([tagRef.current, titleRef.current, descRef.current, detailsRef.current], { y: 30 });

            // ─── Header: velocity staggered timeline ───
            const headerTl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 85%",
                    toggleActions: "play reverse play reverse",
                }
            });
            headerTl
                .to(headerSuperRef.current, { y: 0, duration: 0.8, ease: "power3.out" })
                .to(headerTitleRef.current, { y: 0, duration: 1.1, ease: "expo.out" }, "-=0.5")
                .to(headerDescRef.current, { y: 0, duration: 0.9, ease: "power2.out" }, "-=0.6");

            // ─── Card: rise in as a unit, then inner elements cascade ───
            const cardTl = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top 80%",
                    toggleActions: "play reverse play reverse",
                }
            });
            cardTl
                .to(containerRef.current, { y: 0, duration: 1.4, ease: "expo.out" })
                .to([tagRef.current, titleRef.current, descRef.current, detailsRef.current],
                    { y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" },
                    "-=0.9"
                );

            // ─── Parallax: image drifts in the opposite direction to scroll ───
            if (imageRef.current && containerRef.current) {
                gsap.fromTo(imageRef.current,
                    { yPercent: -12, scale: 1.1 },
                    {
                        yPercent: 12,
                        scale: 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: 1,
                        }
                    }
                );
            }

            // ─── Promo code pulsing float ───
            if (codeRef.current) {
                gsap.to(codeRef.current, {
                    y: -7, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut"
                });
            }

        }, sectionRef);

        return () => ctx.revert();
    }, [loading, promo]);

    useEffect(() => {
        if (!loading) {
            setTimeout(() => ScrollTrigger.refresh(), 100);
        }
    }, [loading, promo?.isActive]);

    if (loading) return null;
    if (!promo?.isActive) return null;

    return (
        <section
            ref={sectionRef}
            className="w-full relative bg-[#fef7e5] rounded-t-[2.5rem] py-24 md:py-32 overflow-hidden flex flex-col items-center"
            id="special-offers"
        >
            <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center">
                
                {/* Minimal Header */}
                <div className="mb-16 text-center">
                    <span ref={headerSuperRef} className="text-sage font-bold text-[10px] tracking-[0.5em] uppercase mb-4 block">Exclusive Privileges</span>
                    <h2 ref={headerTitleRef} className="text-5xl md:text-6xl text-[#1a1a1a] font-light uppercase" style={{ fontFamily: "var(--font-display), serif" }}>
                        Seasonal <span className="italic font-normal">Rewards</span>
                    </h2>
                </div>

                {/* THE 70/30 REFINED TICKET */}
                <div className="relative w-full max-w-[1100px] flex flex-col items-center">
                    <div
                        ref={containerRef}
                        className="relative w-full flex flex-col md:flex-row bg-white rounded-3xl shadow-[0_30px_70px_rgba(120,128,105,0.12)] border border-[#ffd8a6]/40 overflow-hidden h-auto md:h-[360px]"
                    >
                        {/* 70% AREA: Pure Visual + Glass Effect */}
                        <div className="w-full md:w-[70%] relative overflow-hidden group">
                            {promo.imageUrl ? (
                                <img
                                    ref={imageRef}
                                    src={promo.imageUrl}
                                    alt={promo.title}
                                    className="w-full h-full object-cover transition-all duration-[2s] group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#fef7e5]" />
                            )}
                            
                            {/* Glass Shimmer Interaction Layer */}
                            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] -translate-x-full group-hover:translate-x-[200%] transition-transform duration-[1.5s] ease-in-out" />
                            </div>

                            <div className="absolute top-6 left-6 z-20">
                                <div ref={tagRef} className="flex items-center gap-2 px-3 py-1.5 bg-black/10 backdrop-blur-md rounded-full border border-white/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffd8a6] animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Privileged</span>
                                </div>
                            </div>
                        </div>

                        {/* THE PERFORATION / PUNCHES (at 70%) */}
                        <div className="hidden md:flex flex-col items-center justify-between absolute left-[70%] top-0 bottom-0 -translate-x-1/2 py-4 z-20 pointer-events-none">
                            <div className="w-8 h-8 bg-[#fef7e5] rounded-full border border-[#ffd8a6]/30 -mt-8 shadow-inner" />
                            <div className="flex-1 border-l-2 border-dashed border-[#ffd8a6]/40 my-4" />
                            <div className="w-8 h-8 bg-[#fef7e5] rounded-full border border-[#ffd8a6]/30 -mb-8 shadow-inner" />
                        </div>

                        {/* 30% AREA: Title + Code Stub */}
                        <div className="w-full md:w-[30%] p-10 flex flex-col items-center justify-center bg-white relative border-t md:border-t-0 md:border-l border-[#ffd8a6]/20">
                            <h3
                                ref={titleRef}
                                className="text-2xl md:text-3xl lg:text-4xl text-[#1a1a1a] leading-tight text-center mb-8"
                                style={{ fontFamily: "var(--font-display), serif" }}
                            >
                                {promo.title}
                            </h3>

                            <div className="w-12 h-[1px] bg-[#ffd8a6]/40 mb-8" />

                            {promo.promoCode && (
                                <div
                                    ref={codeRef}
                                    className="w-full text-center group/code cursor-pointer"
                                    onClick={() => {
                                        navigator.clipboard.writeText(promo.promoCode);
                                    }}
                                >
                                    <span className="text-[10px] block uppercase tracking-[0.2em] text-[#788069]/60 mb-3 font-bold">Unlocking Code</span>
                                    <div className="py-4 px-2 bg-[#fef7e5]/50 border border-[#ffd8a6]/30 rounded-xl relative overflow-hidden mb-4 group-hover/code:bg-[#788069] group-hover/code:text-white transition-all duration-500">
                                        <span className="text-2xl font-serif tracking-[0.15em] uppercase">{promo.promoCode}</span>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-40 transition-opacity">
                                            <TicketPercent size={12} className="text-white" />
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[#788069]/40 group-hover/code:text-[#ffd8a6] transition-colors">Tap to Copy</span>
                                </div>
                            )}
                            
                            {promo.expiryDate && (
                                <div className="mt-8 flex items-center gap-2 text-[9px] font-bold text-[#788069]/50 uppercase tracking-widest">
                                    <CalendarDays size={12} className="text-[#788069]/40" />
                                    <span>Until {new Date(promo.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BELOW TICKET: Description */}
                    <div ref={detailsRef} className="mt-12 md:mt-16 text-center max-w-2xl px-4 flex flex-col items-center">
                        <p
                            ref={descRef}
                            className="text-[#1a1a1a]/60 text-base md:text-lg font-light leading-relaxed mb-4 italic"
                        >
                            " {promo.description} "
                        </p>
                    </div>
                </div>

                <div className="mt-16 opacity-30 text-[9px] font-bold uppercase tracking-[0.4em] text-[#1a1a1a]">
                    Bumi Anyom Resort • By Nexura Global Hospitality
                </div>
            </div>
        </section>
    );
};
