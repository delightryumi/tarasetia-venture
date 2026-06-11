"use client";

import React from "react";
import { MapPin, Mail, Phone, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useFooter } from "@/services/useFooter";
import { formatExternalUrl } from "@/lib/utils";

// Precise Brand SVGs (Synchronized with Footer)
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
    )
};

const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
        case "whatsapp": return <SocialIcons.WhatsApp />;
        case "instagram": return <SocialIcons.Instagram />;
        case "tiktok": return <SocialIcons.TikTok />;
        case "facebook": return <SocialIcons.Facebook />;
        default: return <ArrowUpRight size={14} />;
    }
};

export const Topbar = () => {
    const { data, loading } = useFooter();

    if (loading || !data) return (
        <div className="w-full bg-[#788069] h-[40px] animate-pulse relative z-[60]" />
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full bg-[#788069] text-[#fef7e5] text-[10px] uppercase font-bold tracking-[0.2em] py-3 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between z-[60] relative overflow-hidden"
        >
            {/* Left / Location */}
            <div className="flex items-center gap-2 mb-2 md:mb-0">
                {data.address && (
                    <motion.div variants={itemVariants} className="flex items-center gap-3 hover:text-[#ffd8a6] transition-colors cursor-default">
                        <MapPin size={12} className="opacity-50" />
                        <span className="truncate max-w-[250px] md:max-w-md">{data.address}</span>
                    </motion.div>
                )}
            </div>

            {/* Right / Contacts & Socials */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
                {data.email && (
                    <motion.a variants={itemVariants} href={`mailto:${data.email}`} className="flex items-center gap-3 hover:text-[#ffd8a6] transition-colors lowercase font-normal italic">
                        <Mail size={12} className="opacity-50" />
                        <span>{data.email}</span>
                    </motion.a>
                )}
                
                {data.phones.map((phone, idx) => (
                    <motion.a variants={itemVariants} key={idx} href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-[#ffd8a6] transition-colors">
                        <Phone size={12} className="opacity-50" />
                        <span>{phone}</span>
                    </motion.a>
                ))}

                {data.socialLinks.length > 0 && (
                    <motion.div variants={itemVariants} className="flex items-center gap-5 border-l border-[#fef7e5]/30 pl-6 md:pl-10">
                        {data.socialLinks.map((social, idx) => (
                            <a 
                                key={idx} 
                                href={formatExternalUrl(social.url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-[#ffd8a6] hover:scale-110 transition-all flex items-center justify-center"
                                aria-label={social.platform}
                            >
                                {getSocialIcon(social.platform)}
                            </a>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
