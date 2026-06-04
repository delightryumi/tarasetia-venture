"use client";

import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { useFooter } from "@/services/useFooter";
import { Mail, Phone, MapPin, Globe, ArrowUpRight } from "lucide-react";
import gsap from "gsap";

export default function ContactPage() {
    const { data, loading } = useFooter();

    if (loading || !data) return (
        <div className="h-screen w-full bg-[#fdfbf7] flex items-center justify-center">
            <span className="text-[#788069] tracking-widest uppercase animate-pulse font-body">Opening Channels...</span>
        </div>
    );

    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7] min-h-screen">
                {/* Hero */}
                <section className="relative h-[60vh] flex flex-col items-center justify-center pt-24 px-6 text-center border-b border-black/5">
                     <span className="text-[#788069] text-[10px] font-black tracking-[0.5em] uppercase mb-6">Connect With Us</span>
                     <h1 className="text-6xl md:text-8xl font-serif italic text-[#1a1a1a] mb-8">Get In Touch</h1>
                     <p className="max-w-xl text-lg md:text-xl font-light text-[#1a1a1a]/50 italic leading-relaxed">
                        Mulailah perjalanan batin Anda bersama kami. Sampaikan pesan, pertanyaan, atau sekadar salam hangat dari Anda.
                     </p>
                </section>

                {/* Contact Grid */}
                <section className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                        
                        {/* Info */}
                        <div className="lg:col-span-5 space-y-16">
                            <div className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-[1px] bg-[#788069]" />
                                    <h2 className="text-[#788069] text-[10px] font-black tracking-[0.4em] uppercase">Information</h2>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <span className="text-[10px] items-center gap-2 flex font-bold uppercase tracking-widest text-black/30"><MapPin size={12} /> Address</span>
                                        <p className="text-2xl font-light leading-relaxed italic pr-12">{data.address}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] items-center gap-2 flex font-bold uppercase tracking-widest text-black/30"><Mail size={12} /> Email</span>
                                        <a href={`mailto:${data.email}`} className="text-2xl font-light hover:text-[#788069] transition-colors">{data.email}</a>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] items-center gap-2 flex font-bold uppercase tracking-widest text-black/30"><Phone size={12} /> Phone</span>
                                        {data.phones.map((phone, i) => (
                                            <a key={i} href={`tel:${phone}`} className="block text-2xl font-light hover:text-[#788069] transition-colors">{phone}</a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-16 border-t border-black/5">
                                <div className="flex items-center gap-8">
                                    {data.socialLinks.map((social, i) => (
                                        <a 
                                            key={i} 
                                            href={social.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-xs font-black uppercase tracking-[0.3em] hover:text-[#788069] transition-all"
                                        >
                                            {social.platform}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Map or Form (Currently using the refined Map) */}
                        <div className="lg:col-span-7 h-[400px] lg:h-[600px] rounded-[3rem] overflow-hidden bg-gray-100 shadow-2xl relative group">
                            <iframe 
                                src={data.mapsEmbed?.includes('src="') ? data.mapsEmbed.split('src="')[1].split('"')[0] : data.mapsEmbed}
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                allowFullScreen 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                className="grayscale contrast-125 opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                            />
                            <div className="absolute bottom-12 right-12 flex flex-col items-end gap-2 text-white mix-blend-difference opacity-40 select-none">
                                <h4 className="text-[8px] font-medium tracking-[0.8em] uppercase text-right leading-none">#kembalimembumi</h4>
                                <Globe size={80} strokeWidth={0.2} className="animate-[spin_30s_linear_infinite]" />
                            </div>
                        </div>
                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
