"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { usePackageById } from "@/components/sections/packages/usePackages";
import { useFooter } from "@/services/useFooter";
import { 
    Check, ArrowRight, Clock, Users, Star, 
    MapPin, Share2, Heart, MessageCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useLandingSettings } from "@/services/useLandingSettings";
import { formatExternalUrl } from "@/lib/utils";

export default function PackageDetailsPage() {
    const { id } = useParams();
    const { pkg, loading: pkgLoading } = usePackageById(id as string);
    const { data: footerData, loading: footerLoading } = useFooter();
    const { bookingEngineUrl } = useLandingSettings();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (!pkgLoading && pkg) {
            gsap.from(".reveal-item", {
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power2.out"
            });
        }
    }, [pkgLoading, pkg]);

    if (pkgLoading || footerLoading) {
        return (
            <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
                <span className="text-[#788069] tracking-widest uppercase animate-pulse">Loading Experience...</span>
            </div>
        );
    }

    if (!pkg) {
        return (
            <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-serif">Package Not Found</h1>
                    <Link href="/" className="text-[#788069] underline">Return Home</Link>
                </div>
            </div>
        );
    }

    const rawWhatsappLink = footerData?.socialLinks.find(s => s.platform.toLowerCase() === "whatsapp")?.url;
    const whatsappLink = rawWhatsappLink 
        ? formatExternalUrl(rawWhatsappLink)
        : `https://wa.me/${footerData?.phones[0]?.replace(/\D/g, '')}`;
    
    const encodedMessage = encodeURIComponent(`Halo Bumi Anyom, saya tertarik untuk memesan paket: ${pkg.name}. Bisa bantu informasi lebih lanjut?`);
    const finalWhatsAppUrl = whatsappLink.includes("?") 
        ? `${whatsappLink}&text=${encodedMessage}` 
        : `${whatsappLink}?text=${encodedMessage}`;

    const formatIDR = (p: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(p);

    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7] min-h-screen">
                
                {/* ── Hero Section ── */}
                <section className="relative h-[70vh] w-full overflow-hidden">
                    <Image 
                        src={pkg.imageUrl || "https://images.unsplash.com/photo-1542314831-c6a4d14d8c1c?auto=format&fit=crop&q=80"} 
                        alt={pkg.name}
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    
                    <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-20">
                        <div className="reveal-item space-y-4">
                            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-full inline-block">
                                {pkg.packageType || "Package"}
                            </span>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl text-white uppercase leading-[0.9]" style={{ fontFamily: 'var(--font-display), serif' }}>
                                {pkg.name.split(" ").map((word, i) => (
                                    <span key={i} className={i % 2 !== 0 ? "font-light italic" : "font-medium"}>
                                        {word}{" "}
                                    </span>
                                ))}
                            </h1>
                        </div>
                    </div>
                </section>

                {/* ── Content Grid ── */}
                <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                        
                        {/* Main Info */}
                        <div className="lg:col-span-7 space-y-16">
                            
                            {/* Description */}
                            <div className="space-y-8 reveal-item">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-[1px] bg-[#788069]" />
                                    <h2 className="text-[#788069] text-[10px] font-black tracking-[0.4em] uppercase">The Experience</h2>
                                </div>
                                <p className="text-xl md:text-2xl font-light leading-relaxed text-[#1a1a1a]/80 italic">
                                    {pkg.description}
                                </p>
                            </div>

                            {/* Features / Highlights */}
                            <div className="space-y-10 reveal-item pt-12 border-t border-black/5">
                                <h2 className="text-[#788069] text-[10px] font-black tracking-[0.4em] uppercase">What&apos;s Included</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    {pkg.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-4 group">
                                            <div className="w-6 h-6 rounded-full bg-[#788069]/10 flex items-center justify-center shrink-0 group-hover:bg-[#788069] group-hover:text-white transition-colors duration-500">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="text-lg font-light text-[#1a1a1a]/70">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / CTA */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-32 p-10 md:p-12 bg-white rounded-[3rem] border border-black/5 shadow-2xl space-y-12 reveal-item">
                                
                                <div className="space-y-6">
                                    {pkg.price && Number(pkg.price.replace(/\D/g, '')) > 0 ? (
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#788069]/60">Investment</span>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-4xl font-serif">{formatIDR(Number(pkg.price.replace(/\D/g, '')))}</h3>
                                                <span className="text-xs text-[#1a1a1a]/40 uppercase tracking-widest">/ Nett</span>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="flex flex-col gap-4 py-8 border-y border-black/5">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3 text-[#1a1a1a]/60">
                                                <Clock size={16} />
                                                <span>Duration</span>
                                            </div>
                                            <span className="font-medium">Flexible</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3 text-[#1a1a1a]/60">
                                                <Users size={16} />
                                                <span>Availability</span>
                                            </div>
                                            <span className="font-medium">Flexible</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <a 
                                        href={bookingEngineUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full py-6 bg-[#111310] text-white rounded-2xl flex items-center justify-center gap-4 group hover:bg-[#788069] transition-all duration-500 shadow-xl"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em]">Pesan Sekarang</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
                                    </a>
                                    <p className="text-[9px] text-center text-[#1a1a1a]/40 uppercase tracking-widest">
                                        Libatkan kami untuk kustomisasi khusus Anda
                                    </p>
                                </div>

                                <div className="pt-6 flex items-center justify-center gap-8 border-t border-black/5 text-[#111310]/20">
                                    <button className="hover:text-[#788069] transition-colors"><Share2 size={18} /></button>
                                    <button className="hover:text-[#788069] transition-colors"><Heart size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
