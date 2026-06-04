"use client";

import React from "react";
import { usePromo } from "./usePromo";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
// No longer using framer-motion here

import { Megaphone, Save, Eye, CheckCircle2, Circle, TicketPercent, CalendarDays, FileImage } from "lucide-react";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./promo.css";

export const PromoSection = () => {
    const {
        isActive,
        setIsActive,
        title,
        setTitle,
        description,
        setDescription,
        promoCode,
        setPromoCode,
        expiryDate,
        setExpiryDate,
        imageUrl,
        setImageUrl,
        loading,
        saving,
        handleSave,
    } = usePromo();

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-terracotta rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="clean-container py-12 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage">
                            <Megaphone size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Marketing Suite</span>
                    </div>
                    <h1 className="text-proper-h1 mb-2">Special Privileges</h1>
                    <p className="text-proper-subtitle">Curate exclusive offers that define the sanctuary experience.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`status-toggle-btn ${isActive ? "active" : "inactive"}`}
                    >
                        {isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {isActive ? "CAMPAIGN LIVE" : "CAMPAIGN PAUSED"}
                    </button>
                    <button
                        className="btn-clean-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={16} />
                        <span>{saving ? "Securing..." : "Update Settings"}</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* ── Configuration Panel ── */}
                <div className="xl:col-span-7 space-y-6">
                    <BentoCard className="p-8">
                        <div className="promo-form-grid">
                            <div className="form-group">
                                <label className="label-clean flex items-center gap-2">
                                    <Megaphone size={14} />
                                    Campaign Title
                                </label>
                                <input
                                    type="text"
                                    className="input-clean font-bold"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Seasonal Sanctuary Escape"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label className="label-clean flex items-center gap-2">
                                        <TicketPercent size={14} />
                                        Voucher Code
                                    </label>
                                    <input
                                        type="text"
                                        className="input-clean font-mono uppercase tracking-wider text-[#aa2d00]"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder="SANCTUARY20"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium italic">* Leave blank if no code is required.</p>
                                </div>
                                <div className="form-group">
                                    <label className="label-clean flex items-center gap-2">
                                        <CalendarDays size={14} />
                                        Offer Validity
                                    </label>
                                    <input
                                        type="date"
                                        className="input-clean"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label-clean flex items-center gap-2">
                                    <FileImage size={14} />
                                    Atmospheric Visual (16:7 Recommended)
                                </label>
                                <ImageUpload
                                    path="promo/banner.jpg"
                                    currentUrl={imageUrl}
                                    onUploadComplete={(url) => setImageUrl(url)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label-clean flex items-center gap-2">
                                    <CheckCircle2 size={14} />
                                    The Narrative
                                </label>
                                <textarea
                                    className="input-clean min-h-[140px] leading-relaxed"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Weave a story about the exclusivity and tranquility of this offer..."
                                />
                            </div>
                        </div>
                    </BentoCard>
                </div>

                {/* ── Visual Preview ── */}
                <div className="xl:col-span-5">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Eye size={14} className="text-sage" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Appearance</span>
                        </div>
                        
                        <BentoCard className="p-0 overflow-hidden bg-white shadow-xl shadow-gray-200/50">
                            <div className="preview-banner-aspect">
                                {imageUrl ? (
                                    <img src={imageUrl} alt="Promo preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-200">
                                        <Megaphone size={40} strokeWidth={1} />
                                        <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter">Visual Required</span>
                                    </div>
                                )}
                                
                                {!isActive && (
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                        <span className="bg-white px-4 py-2 rounded-lg text-[10px] font-black tracking-widest text-red-400 border border-red-100 shadow-sm">
                                            PAUSED
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-[1px] bg-sage/30" />
                                        <span className="text-[9px] font-black uppercase tracking-[.3em] text-sage/70">Exclusive Privileges</span>
                                    </div>
                                    <h4 className="text-2xl font-serif text-rich-black leading-tight tracking-tight">
                                        {title || "Indulge in Unrivaled Sanctuary"}
                                    </h4>
                                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 italic">
                                        {description || "The story of your sanctuary offer will unfold here, enticing guests with visions of peace and luxury."}
                                    </p>
                                </div>

                                <div className="preview-overlay-info">
                                    {promoCode && (
                                        <div className="preview-badge-stack">
                                            <span className="badge-label">Unique Code</span>
                                            <span className="promo-code-display">{promoCode}</span>
                                        </div>
                                    )}
                                    {expiryDate && (
                                        <div className="preview-badge-stack">
                                            <span className="badge-label">Ends Upon</span>
                                            <span className="badge-value">
                                                {new Date(expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </BentoCard>
                        
                        <div className="p-4 rounded-xl bg-peach-light/50 border border-peach/20 flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-peach flex items-center justify-center text-terracotta shrink-0">
                                <CheckCircle2 size={10} strokeWidth={4} />
                            </div>
                            <p className="text-[10px] text-terracotta/80 leading-relaxed font-medium">
                                Changes are synchronized in real-time. Ensure your visual communicates the premium essence of the brand.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

