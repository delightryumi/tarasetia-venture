"use client";

import React, { useEffect, useRef } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { useAttractions } from "@/services/useServices";
import { Navigation, ArrowRight, Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

export default function AttractionsPage() {
    const { attractions, loading } = useAttractions();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && attractions.length > 0) {
            const ctx = gsap.context(() => {
                // Hero Reveal
                gsap.from(".hero-content > *", {
                    y: 60,
                    opacity: 0,
                    duration: 1.5,
                    ease: "power4.out",
                    stagger: 0.2
                });

                // Editorial Card Reveal
                gsap.utils.toArray<HTMLElement>(".editorial-card").forEach((card) => {
                    gsap.from(card, {
                        scrollTrigger: {
                            trigger: card,
                            start: "top 85%",
                        },
                        y: 80,
                        opacity: 0,
                        duration: 1.5,
                        ease: "power2.out"
                    });
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading, attractions]);

    if (loading) return (
        <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <Compass className="w-12 h-12 text-[#788069] animate-[spin_4s_linear_infinite]" strokeWidth={1} />
                <span className="text-[#1a1a1a]/40 text-[10px] font-black tracking-[0.6em] uppercase">Curating Treasures</span>
            </div>
        </div>
    );

    return (
        <PageLayout forceScrolledState={true}>
            <main ref={containerRef} className="bg-[#fdfbf7] min-h-screen selection:bg-[#788069] selection:text-white">
                
                {/* ── Editorial Hero ── */}
                <section className="relative h-[65vh] flex flex-col items-center justify-center pt-24 px-6 text-center overflow-hidden">
                    <div className="hero-content relative z-10 space-y-8 max-w-4xl">
                        <span className="text-[#788069] text-[10px] font-black tracking-[1em] uppercase block">Surroundings</span>
                        <h1 className="text-7xl md:text-9xl font-serif italic text-[#1a1a1a] leading-tight tracking-tighter">
                            Local <br /> <span className="text-[#a8b09a]">Treasures</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-light text-[#1a1a1a]/40 italic max-w-2xl mx-auto leading-relaxed">
                            A curated journal of the most enchanting destinations <br className="hidden md:block" /> surrounding the Bumi Anyom sanctuary.
                        </p>
                    </div>
                </section>

                {/* ── Editorial Journal Layout ── */}
                <section className="max-w-7xl mx-auto px-6 pb-48">
                    <div className="space-y-48">
                        {attractions.map((attr, i) => {
                            const img = attr.images?.find(img => img.isProfile)?.url || attr.imageUrl || attr.images?.[0]?.url || "";
                            return (
                                <article 
                                    key={attr.id} 
                                    className="editorial-card group"
                                >
                                    <Link href={`/attractions/${attr.id}`} className="block relative aspect-[16/8] md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl mb-16">
                                        {img && <Image 
                                            src={img} 
                                            alt={attr.name} 
                                            fill 
                                            className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                                            priority={i === 0}
                                            unoptimized={img.includes("firebasestorage.googleapis.com")}
                                        />}
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-700" />
                                        
                                        {/* Distance Tag */}
                                        <div className="absolute top-10 right-10 flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                                            <Navigation size={14} className="text-[#a8b09a]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]">{attr.distance}</span>
                                        </div>
                                    </Link>

                                    <div className="max-w-4xl mx-auto text-center space-y-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center gap-6">
                                                <div className="w-12 h-[1px] bg-[#788069]/20" />
                                                <span className="text-[#788069] text-[10px] font-bold uppercase tracking-[0.5em]">Destinasi Lokal</span>
                                                <div className="w-12 h-[1px] bg-[#788069]/20" />
                                            </div>
                                            <h2 className="text-4xl md:text-6xl font-serif italic text-[#1a1a1a] leading-[1.1] tracking-tight hover:text-[#788069] transition-colors duration-500">
                                                <Link href={`/attractions/${attr.id}`}>{attr.name}</Link>
                                            </h2>
                                        </div>

                                        <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1a1a]/60 italic line-clamp-2 md:line-clamp-3">
                                            {attr.description}
                                        </p>

                                        <div className="pt-4 flex justify-center">
                                            <Link 
                                                href={`/attractions/${attr.id}`}
                                                className="group/btn relative px-10 py-5 rounded-full border border-black/10 flex items-center gap-6 overflow-hidden transition-all duration-700 hover:border-black hover:shadow-2xl"
                                            >
                                                <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#1a1a1a]">Explore the Story</span>
                                                <div className="relative z-10 w-8 h-8 rounded-full bg-[#111310] flex items-center justify-center text-white group-hover/btn:scale-110 transition-transform duration-500">
                                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </div>
                                                <div className="absolute inset-0 bg-white translate-y-full group-hover/btn:translate-y-0 transition-transform duration-700" />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
