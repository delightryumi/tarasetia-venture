"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Mail } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useFooter } from "@/services/useFooter";
import { useLandingSettings } from "@/services/useLandingSettings";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

// ─── Social SVGs ─────────────────────────────────────────────────────────────
const SocialIcons = {
    WhatsApp: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408 0 12.044c0 2.123.54 4.197 1.57 6.05L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.634 0 12.043-5.41 12.048-12.047a11.851 11.851 0 00-3.659-8.403z"/>
        </svg>
    ),
    Instagram: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.31.975.975 1.247 2.242 1.31 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.31 3.608-.975.975-2.242 1.247-3.608 1.31-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.31-.975-.975-1.247-2.242-1.31-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.31-3.608.975-.975 2.242-1.247 3.608-1.31 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
    ),
    TikTok: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.31-.75.42-1.24 1.25-1.31 2.1-.05.56.06 1.15.34 1.61.43.7 1.24 1.16 2.1 1.17.9 0 1.71-.53 2.15-1.31.28-.48.33-1.05.33-1.6v-14.71z"/>
        </svg>
    ),
    Facebook: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
    ),
};

const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
        case "whatsapp":  return <SocialIcons.WhatsApp />;
        case "instagram": return <SocialIcons.Instagram />;
        case "tiktok":    return <SocialIcons.TikTok />;
        case "facebook":  return <SocialIcons.Facebook />;
        default:          return <ArrowUpRight size={12} />;
    }
};

const NAV_COL = [
    { label: "Kamar",      href: "/rooms" },
    { label: "Paket",      href: "/packages" },
    { label: "Atraksi",    href: "/attractions" },
    { label: "Galeri",     href: "/gallery" },
    { label: "Cafe & Resto", href: "/cafe-resto" },
];

const LEGAL_COL = [
    { label: "Privasi",    href: "/privacy" },
    { label: "Kebijakan",  href: "/terms" },
];

export const FooterSection = () => {
    const { data, loading } = useFooter();
    const { bookingEngineUrl } = useLandingSettings();
    const footerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (loading || !data || !footerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(".ft-item",
                { y: 24, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: "power2.out",
                    scrollTrigger: { trigger: footerRef.current, start: "top 88%" }
                }
            );
        }, footerRef);
        return () => ctx.revert();
    }, [loading, data]);

    if (loading || !data) return null;

    // Extract iframe src cleanly
    const mapSrc = data.mapsEmbed?.includes('src="')
        ? data.mapsEmbed.split('src="')[1].split('"')[0]
        : data.mapsEmbed;

    return (
        <footer
            ref={footerRef}
            className="w-full bg-[#111310] text-white overflow-hidden selection:bg-[#788069] selection:text-white"
        >
            {/* ── CTA Banner ─────────────────────────────────────────────── */}
            <div className="border-b border-white/[0.06] px-6 md:px-14 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 ft-item">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.55em] text-[#788069] mb-3">Siap Kembali Membumi?</p>
                    <h2 className="text-3xl md:text-4xl font-extralight italic leading-tight text-white/90">
                        Rasakan ketenangan yang<br className="hidden md:block" /> sesungguhnya.
                    </h2>
                </div>
                <a
                    href={bookingEngineUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group shrink-0 flex items-center gap-3 border border-white/15 hover:border-[#788069] hover:bg-[#788069]/10 rounded-xl px-7 py-3.5 transition-all duration-400"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Reservasi Sekarang</span>
                    <ArrowUpRight size={14} className="text-[#788069] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
            </div>

            {/* ── Main content grid ───────────────────────────────────────── */}
            <div className="px-6 md:px-14 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/[0.06]">

                {/* Brand col */}
                <div className="lg:col-span-1 ft-item flex flex-col gap-6">
                    <div>
                        <Link href="/">
                            <h3 className="text-2xl font-extralight tracking-[-0.02em] uppercase leading-tight">
                                Bumi <span className="italic text-[#788069]">Anyom</span>
                            </h3>
                        </Link>
                        <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/20 mt-1">Manage by Nexura</p>
                    </div>
                    <p className="text-[12px] font-light text-white/40 leading-relaxed">
                        Merajut keselarasan raga dengan alam. Tempat di mana waktu tak lagi dikejar, namun dirasakan.
                    </p>
                    {/* Social */}
                    <div className="flex items-center gap-3 mt-auto">
                        {data.socialLinks.map((s, i) => (
                            <a
                                key={i}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.platform}
                                className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-300"
                            >
                                {getSocialIcon(s.platform)}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Nav col */}
                <div className="ft-item">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#788069] mb-6">Jelajahi</p>
                    <ul className="flex flex-col gap-3">
                        {NAV_COL.map((n) => (
                            <li key={n.href}>
                                <Link
                                    href={n.href}
                                    className="group flex items-center gap-2 text-[12px] font-light text-white/50 hover:text-white transition-colors duration-200"
                                >
                                    <span className="w-3 h-px bg-white/10 group-hover:bg-[#788069] group-hover:w-5 transition-all duration-300" />
                                    {n.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact col */}
                <div className="ft-item">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#788069] mb-6">Hubungi Kami</p>
                    <div className="flex flex-col gap-4">
                        {data.phones.map((phone, i) => (
                            <a
                                key={i}
                                href={`tel:${phone}`}
                                className="group flex items-center gap-3 text-[12px] font-light text-white/50 hover:text-white transition-colors"
                            >
                                <Phone size={11} className="text-[#788069] shrink-0" />
                                {phone}
                            </a>
                        ))}
                        <a
                            href={`mailto:${data.email}`}
                            className="group flex items-center gap-3 text-[12px] font-light text-white/50 hover:text-white transition-colors break-all"
                        >
                            <Mail size={11} className="text-[#788069] shrink-0" />
                            {data.email}
                        </a>
                    </div>
                </div>

                {/* Location col — maps mini embed + address */}
                <div className="ft-item">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-[#788069] mb-6">Lokasi</p>
                    <div className="flex flex-col gap-4">
                        {/* Mini map */}
                        {mapSrc && (
                            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/[0.07] grayscale contrast-110 opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                                <iframe
                                    src={mapSrc}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <MapPin size={11} className="text-[#788069] shrink-0 mt-0.5" />
                            <p className="text-[11px] font-light text-white/40 leading-relaxed">
                                {data.address}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ─────────────────────────────────────────────── */}
            <div className="px-6 md:px-14 py-6 flex flex-col md:flex-row items-center justify-between gap-4 ft-item">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/15">
                    © {new Date().getFullYear()} Bumi Anyom — Kembali Membumi
                </p>

                <div className="flex items-center gap-6">
                    {LEGAL_COL.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20 hover:text-white/60 transition-colors"
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/15">
                    <span className="font-normal lowercase">Powered by</span>
                    {data.poweredByLink ? (
                        <a
                            href={data.poweredByLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#788069] hover:text-white transition-colors"
                        >
                            {data.poweredByText}
                        </a>
                    ) : (
                        <span className="text-[#788069]">{data.poweredByText}</span>
                    )}
                </div>
            </div>
        </footer>
    );
};
