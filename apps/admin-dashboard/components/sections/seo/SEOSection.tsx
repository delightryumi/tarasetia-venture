"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, MessageSquare, Image as ImageIcon, Save, ShieldCheck, Twitter, ExternalLink, Link2, User, LayoutGrid } from "lucide-react";
import { useSEO } from "./useSEO";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./seo.css";

export const SEOSection = () => {
    const { seo, loading, saving, updateSEO, handleSave } = useSEO();

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-sage rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="clean-container py-12"
        >
            <header className="content-header mb-12">
                <h1 className="text-proper-h1 mb-2">SEO & Metadata</h1>
                <p className="text-proper-subtitle">Optimize how your property is discovered and presented across the digital landscape.</p>
            </header>

            <BentoGrid className="grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <BentoCard className="!p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <Search className="text-sage" size={20} />
                            Search Engine Listing
                        </h2>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="label-clean">Global Page Title</label>
                                <input
                                    type="text"
                                    className="input-clean font-bold"
                                    value={seo.title}
                                    onChange={(e) => updateSEO("title", e.target.value)}
                                    placeholder="Ex: Bumi Anyom | Luxury Resort & Villa"
                                />
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-400">Optimal: 50-60 chars</span>
                                    <span className={seo.title.length > 60 ? "text-terracotta" : "text-sage"}>
                                        {seo.title.length} chars
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="label-clean">Meta Description</label>
                                <textarea
                                    className="input-clean min-h-[120px] leading-relaxed"
                                    value={seo.description}
                                    onChange={(e) => updateSEO("description", e.target.value)}
                                    placeholder="Captivate potential guests with a summary of your property..."
                                />
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-400">Optimal: 150-160 chars</span>
                                    <span className={seo.description.length > 160 ? "text-terracotta" : "text-sage"}>
                                        {seo.description.length} chars
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="label-clean">Keywords</label>
                                <input
                                    type="text"
                                    className="input-clean"
                                    value={seo.keywords}
                                    onChange={(e) => updateSEO("keywords", e.target.value)}
                                    placeholder="resort, villa, boutique hotel, staycation..."
                                />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Separate with commas</p>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Favicons */}
                    <BentoCard className="!p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <LayoutGrid className="text-sage" size={20} />
                            Site Icons (Favicons)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="label-clean">Landing Page Icon</label>
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 p-1">
                                    <ImageUpload
                                        path="seo/favicon-landing.png"
                                        currentUrl={seo.landingFavicon}
                                        onUploadComplete={(url) => updateSEO("landingFavicon", url)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Square PNG, 32x32 or 512x512 recommended</p>
                            </div>

                            <div className="space-y-4">
                                <label className="label-clean">Dashboard Icon</label>
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 p-1">
                                    <ImageUpload
                                        path="seo/favicon-dashboard.png"
                                        currentUrl={seo.dashboardFavicon}
                                        onUploadComplete={(url) => updateSEO("dashboardFavicon", url)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Will appear in admin browser tabs</p>
                            </div>
                        </div>
                    </BentoCard>
                </div>

                <div className="space-y-6">
                    {/* Social Sharing */}
                    <BentoCard className="!p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <ImageIcon className="text-sage" size={20} />
                            Social Media Presence
                        </h2>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="label-clean">Social Display Image (Open Graph)</label>
                                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                                    <ImageUpload
                                        path="seo/og-image.jpg"
                                        currentUrl={seo.ogImage}
                                        onUploadComplete={(url) => updateSEO("ogImage", url)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recommended: 1200x630 px</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="label-clean">Shared Title (Optional)</label>
                                    <input
                                        type="text"
                                        className="input-clean text-sm"
                                        value={seo.ogTitle}
                                        onChange={(e) => updateSEO("ogTitle", e.target.value)}
                                        placeholder="Defaults to Page Title"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="label-clean">Twitter Handle</label>
                                    <div className="relative">
                                        <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="text"
                                            className="input-clean text-sm pl-11"
                                            value={seo.twitterHandle}
                                            onChange={(e) => updateSEO("twitterHandle", e.target.value)}
                                            placeholder="@yourproperty"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Advanced Verification */}
                    <BentoCard className="!p-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                            <ShieldCheck className="text-sage" size={20} />
                            Advanced Optimization
                        </h2>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="label-clean flex items-center gap-2">
                                    <Link2 size={12} /> Canonical URL
                                </label>
                                <input
                                    type="text"
                                    className="input-clean text-sm"
                                    value={seo.canonicalUrl}
                                    onChange={(e) => updateSEO("canonicalUrl", e.target.value)}
                                    placeholder="https://bumianyom.id/"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="label-clean flex items-center gap-2">
                                    <Globe size={12} /> Google Site Verification
                                </label>
                                <input
                                    type="text"
                                    className="input-clean text-sm"
                                    value={seo.googleSiteVerification}
                                    onChange={(e) => updateSEO("googleSiteVerification", e.target.value)}
                                    placeholder="Verification code from Search Console"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="label-clean flex items-center gap-2">
                                        <User size={12} /> Site Author
                                    </label>
                                    <input
                                        type="text"
                                        className="input-clean text-sm"
                                        value={seo.author}
                                        onChange={(e) => updateSEO("author", e.target.value)}
                                        placeholder="Owner or Brand Name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="label-clean flex items-center gap-2">
                                        <ImageIcon size={12} /> Twitter Card Type
                                    </label>
                                    <select
                                        className="input-clean text-sm"
                                        value={seo.twitterCard}
                                        onChange={(e) => updateSEO("twitterCard", e.target.value)}
                                    >
                                        <option value="summary">Small Image (Summary)</option>
                                        <option value="summary_large_image">Large Image (Summary Large)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Preview */}
                    <BentoCard className="!p-8 bg-slate-50/30">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <ExternalLink size={12} /> Live Google Result Preview
                        </h3>

                        <div className="max-w-[600px] space-y-2">
                            {/* Site Identity Line */}
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
                                    {seo.landingFavicon ? (
                                        <img src={seo.landingFavicon} alt="Favicon" className="w-full h-full object-contain" />
                                    ) : (
                                        <Globe size={14} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-[#202124] leading-tight">Bumi Anyom</span>
                                    <span className="text-xs text-[#5f6368] leading-tight flex items-center gap-1">
                                        {seo.canonicalUrl || "https://bumianyom.id"}
                                        <span className="text-[10px]">› ...</span>
                                    </span>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-[#1a0dab] text-[20px] font-normal leading-tight pt-1 hover:underline cursor-pointer">
                                {seo.title || "Luxury Resort & Villa in Bali | Bumi Anyom"}
                            </div>

                            {/* Snippet */}
                            <div className="text-[#4d5156] text-sm leading-[1.58] pt-1">
                                {seo.description || "Experience the ultimate luxury stay at Bumi Anyom. Our resort offers premium villas, world-class amenities, and breathtaking views for your perfect holiday."}
                            </div>
                        </div>
                    </BentoCard>
                </div>
            </BentoGrid>

            <div className="mt-16 flex justify-end border-t border-slate-100 pt-12">
                <button
                    className="btn-clean-primary px-12"
                    onClick={() => handleSave()}
                    disabled={saving}
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        "Protect SEO Metadata"
                    )}
                </button>
            </div>
        </motion.div>
    );
};

