"use client";

import React from "react";
import { useFooter } from "./useFooter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Info, MapPin, Phone, Mail, Globe,
    Plus, Trash2, Heart, ExternalLink,
    Instagram, Facebook, MessageCircle, Twitter
} from "lucide-react";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./footer.css";

// Authentic Social Icons (Brand colors and official logos)
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18c0 1.94-1.13 3.89-3.04 4.63-1.48.57-3.4.5-4.84-.31a6.386 6.386 0 0 1-3.23-5.22c-.14-1.57.14-3.5 1.4-4.8 1.18-1.22 3.19-1.9 4.96-1.5v4.02c-1.43-.1-2.92.54-3.46 1.86-.34.82-.12 1.88.54 2.47.66.58 1.7.54 2.45.16.8-.41 1.34-1.14 1.34-2.14V0l.02.02z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="ig-gradient" x1="2" y1="22" x2="22" y2="2">
                <stop offset="0%" stopColor="#405DE6" />
                <stop offset="50%" stopColor="#E1306C" />
                <stop offset="100%" stopColor="#FFDC80" />
            </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const SOCIAL_ICONS: Record<string, any> = {
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    whatsapp: WhatsAppIcon,
    tiktok: TikTokIcon,
    twitter: Twitter
};

export const FooterSection = () => {
    const {
        address,
        setAddress,
        phones,
        addPhone,
        removePhone,
        newPhone,
        setNewPhone,
        email,
        setEmail,
        mapsEmbed,
        setMapsEmbed,
        poweredByText,
        setPoweredByText,
        poweredByLink,
        setPoweredByLink,
        socialLinks,
        addSocial,
        removeSocial,
        newPlatform,
        setNewPlatform,
        newUrl,
        setNewUrl,
        loading,
        saving,
        handleSave,
    } = useFooter();

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-sage rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="section-container fade-in !p-0">
            <header className="p-12 pb-0">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-sage">
                        <Info size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight">Identity & Reach</h1>
                        <p className="text-proper-subtitle">Curate your business presence across the digital landscape.</p>
                    </div>
                </div>
            </header>

            <BentoGrid className="p-12 grid-cols-1 lg:grid-cols-2">
                <BentoCard className="space-y-12">
                    <section>
                        <h3 className="text-[10px] font-black text-terracotta uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-terracotta/30"></span>
                            Primary Contacts
                        </h3>

                        <div className="space-y-8">
                            <div className="form-group">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
                                <div className="boutique-input-group">
                                    <Mail className="text-slate-300" size={18} />
                                    <input
                                        type="email"
                                        className="boutique-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Ex: concierge@bumianyom.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 block">Phone Numbers</label>
                                <div className="flex gap-2 mb-4">
                                    <div className="boutique-input-group flex-grow">
                                        <Phone className="text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            className="boutique-input"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value)}
                                            placeholder="+62 812..."
                                            onKeyPress={(e) => e.key === 'Enter' && addPhone()}
                                        />
                                    </div>
                                    <button
                                        onClick={addPhone}
                                        className="w-12 h-12 flex items-center justify-center bg-sage text-white rounded-xl hover:bg-sage-dark transition-all shadow-sm flex-shrink-0"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {phones.map((p, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="luxury-list-item px-4 rounded-xl"
                                            >
                                                <div className="list-item-main !grid-cols-[40px_1fr]">
                                                    <div className="w-2 h-2 rounded-full bg-sage/30"></div>
                                                    <span className="text-sm font-bold text-slate-600 tracking-tight">{p}</span>
                                                </div>
                                                <button onClick={() => removePhone(idx)} className="text-slate-200 hover:text-terracotta transition-colors px-2">
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black text-terracotta uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-terracotta/30"></span>
                            Location & Map
                        </h3>
                        <div className="space-y-6">
                            <div className="form-group">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Narrative Address</label>
                                <textarea
                                    className="w-full bg-white border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-700 min-h-[120px] outline-none focus:border-sage focus:ring-4 focus:ring-sage/5 transition-all shadow-sm resize-none"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Jl. Raya Anyer KM 12..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Google Maps Embed URL</label>
                                <div className="boutique-input-group">
                                    <MapPin className="text-slate-300" size={18} />
                                    <input
                                        type="url"
                                        className="boutique-input text-xs"
                                        value={mapsEmbed}
                                        onChange={(e) => setMapsEmbed(e.target.value)}
                                        placeholder="Paste the <iframe src='...'> url here"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 italic px-1">Copy the SRC from the Google Maps Share &gt; Embed iframe.</p>
                            </div>
                        </div>
                    </section>
                </BentoCard>
                <BentoCard className="space-y-12">
                    <section>
                        <h3 className="text-[10px] font-black text-terracotta uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-terracotta/30"></span>
                            Social Presence
                        </h3>
                        <div>
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <select
                                    className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:border-sage min-w-[150px] shadow-sm"
                                    value={newPlatform}
                                    onChange={(e) => setNewPlatform(e.target.value)}
                                >
                                    <option value="">Platform</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="twitter">X / Twitter</option>
                                </select>
                                <div className="boutique-input-group flex-grow">
                                    <input
                                        type="text"
                                        className="boutique-input"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="Full link to profile..."
                                        onKeyPress={(e) => e.key === 'Enter' && addSocial()}
                                    />
                                </div>
                                <button
                                    onClick={addSocial}
                                    className="btn-connect"
                                >
                                    Connect
                                </button>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {socialLinks.length === 0 ? (
                                        <p className="text-xs text-slate-300 italic text-center py-4">Direct your guests to your social masterpieces.</p>
                                    ) : (
                                        socialLinks.map((link, i) => {
                                            const Icon = SOCIAL_ICONS[link.platform] || Globe;
                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="luxury-list-item px-4 rounded-xl"
                                                >
                                                    <div className="icon-badge">
                                                        <Icon />
                                                    </div>
                                                    <div className="list-item-main">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{link.platform}</span>
                                                        <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] tracking-tight">{link.url}</span>
                                                    </div>
                                                    <button onClick={() => removeSocial(i)} className="text-slate-200 hover:text-terracotta transition-colors px-2">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[10px] font-black text-terracotta uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-terracotta/30"></span>
                            Master Footer Tag
                        </h3>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Branding Label</label>
                                    <div className="boutique-input-group">
                                        <input
                                            type="text"
                                            className="boutique-input"
                                            value={poweredByText}
                                            onChange={(e) => setPoweredByText(e.target.value)}
                                            placeholder="Ex: Built by Nexura Digital"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Destination Link</label>
                                    <div className="boutique-input-group">
                                        <input
                                            type="url"
                                            className="boutique-input"
                                            value={poweredByLink}
                                            onChange={(e) => setPoweredByLink(e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="powered-by-preview">
                                <div className="flex flex-col">
                                    <span className="preview-label">Live Preview</span>
                                    <div className="preview-content">
                                        {poweredByText || "Your Branding Tag"}
                                    </div>
                                </div>
                                {poweredByLink && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-md"
                                    >
                                        <ExternalLink size={20} />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </section>
                </BentoCard>
            </BentoGrid>

            <div className="p-12 pt-0 flex justify-center sticky bottom-0 bg-gradient-to-t from-slate-50/90 to-transparent pointer-events-none">
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(120, 128, 105, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary !bg-sage pointer-events-auto px-16 py-6 flex items-center gap-4 text-lg rounded-2xl shadow-xl border-none"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Heart size={22} className="fill-white/10" />
                            Synchronize Footer
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
};

