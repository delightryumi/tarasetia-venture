"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { useAttraction } from "@/services/useServices";
import { 
    MapPin, Navigation, ArrowLeft, ArrowUpRight, 
    Compass, Camera, Share2, Globe 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";

export default function AttractionDetailsPage() {
    const { id } = useParams();
    const { attraction, loading } = useAttraction(id as string);

    useEffect(() => {
        if (!loading && attraction) {
            gsap.from(".reveal-item", {
                y: 40,
                opacity: 0,
                duration: 1.5,
                stagger: 0.15,
                ease: "power3.out"
            });

            gsap.from(".hero-img", {
                scale: 1.1,
                duration: 2.5,
                ease: "power2.out"
            });
        }
    }, [loading, attraction]);

    if (loading) {
        return (
            <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-t-2 border-[#788069] rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#788069]">Discovering...</span>
                </div>
            </div>
        );
    }

    if (!attraction) {
        return (
            <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center space-y-6">
                    <h1 className="text-5xl font-serif italic">Lost Heritage</h1>
                    <Link href="/attractions" className="text-[#788069] text-xs font-black uppercase tracking-widest underline">Return to Journal</Link>
                </div>
            </div>
        );
    }

    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7] min-h-screen selection:bg-[#788069] selection:text-white">
                
                {/* ── Cinematic Hero ── */}
                <section className="relative h-[80vh] w-full overflow-hidden">
                    <div className="absolute inset-0">
                        <Image 
                            src={attraction.imageUrl} 
                            alt={attraction.name}
                            fill
                            priority
                            unoptimized={attraction.imageUrl.includes("firebasestorage.googleapis.com")}
                            className="hero-img object-cover brightness-75 contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#fdfbf7]" />
                    </div>

                    <Link 
                        href="/attractions"
                        className="absolute top-32 left-8 md:left-12 z-20 flex items-center gap-4 text-white group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-opacity">Back to Journal</span>
                    </Link>
                    
                    <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-24 text-center items-center">
                        <div className="reveal-item space-y-6">
                             <div className="flex items-center justify-center gap-6">
                                <div className="w-12 h-[1px] bg-white/40" />
                                <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.8em]">Destination</span>
                                <div className="w-12 h-[1px] bg-white/40" />
                            </div>
                            <h1 className="text-6xl md:text-9xl text-white font-serif italic leading-[0.8] tracking-tighter uppercase">
                                {attraction.name}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-white/60">
                                <Navigation size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{attraction.distance} from Resort</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Editorial Story ── */}
                <article className="max-w-4xl mx-auto px-6 py-24 md:py-32">
                    <div className="space-y-16">
                        <div className="reveal-item space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sage/5 rounded-2xl text-[#788069]">
                                    <Compass size={24} strokeWidth={1} />
                                </div>
                                <h2 className="text-[#788069] text-[10px] font-black tracking-[0.4em] uppercase">The Story</h2>
                            </div>
                            <p className="text-2xl md:text-3xl font-light leading-relaxed text-[#1a1a1a]/80 italic first-letter:text-6xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-[#788069]">
                                {attraction.description}
                            </p>
                        </div>

                        {/* Additional Content / Call to Action */}
                        <div className="reveal-item pt-16 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-12">
                             <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1a1a]">Plan Your Visit</h4>
                                <p className="text-sm text-[#1a1a1a]/40 italic">Minta resepsionis kami untuk mengatur transportasi Anda.</p>
                             </div>

                             <div className="flex items-center gap-6">
                                 <button className="p-4 rounded-full border border-black/5 hover:bg-[#111310] hover:text-white transition-all duration-500">
                                     <Share2 size={18} />
                                 </button>
                                 <button className="px-8 py-4 bg-[#788069] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-4 hover:shadow-2xl transition-all duration-500 active:scale-95">
                                     <ArrowUpRight size={16} />
                                     View Route
                                 </button>
                             </div>
                        </div>
                    </div>
                </article>

                {/* ── Gallery Preview (Optional / Mocked for Expert feel) ── */}
                <section className="bg-black py-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
                         <div className="space-y-6">
                            <Camera size={24} className="mx-auto text-[#a8b09a]" strokeWidth={1} />
                            <h2 className="text-4xl text-white font-serif italic">Destination Frames</h2>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="aspect-[4/5] relative rounded-[2rem] overflow-hidden group">
                                    <Image 
                                        src={attraction.imageUrl} 
                                        alt="Attraction Detail"
                                        fill
                                        loading="lazy"
                                        unoptimized={attraction.imageUrl.includes("firebasestorage.googleapis.com")}
                                        className="object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>
                            ))}
                         </div>
                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
