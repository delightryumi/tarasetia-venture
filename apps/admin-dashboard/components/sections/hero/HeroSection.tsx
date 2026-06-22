"use client";

import React from "react";
import { useHero } from "./useHero";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Layout, Image as ImageIcon, Type, Sparkles, Save, Layers, Eye } from "lucide-react";

/* ─── Framer Motion variants ──────────────────── */
const FADE_UP = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.22, 0.8, 0.36, 1] },
});

export const HeroSection = () => {
    const {
        slides,
        activeSlideId,
        setActiveSlideId,
        updateActiveSlide,
        addNewSlide,
        deleteSlide,
        loading,
        saving,
        handleSave,
    } = useHero();

    /* ─── Parallax State ──────────────────────── */
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    /* ─── Active Slide Helper ─────────────────── */
    const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];

    /* ─── Parallax State (Moved above Active Slide) ──────────────────────── */

    const springConfig = { damping: 25, stiffness: 150 };
    const smx = useSpring(mouseX, springConfig);
    const smy = useSpring(mouseY, springConfig);

    const bgX = useTransform(smx, [0, 1], ["2%", "-2%"]);
    const bgY = useTransform(smy, [0, 1], ["2%", "-2%"]);
    const mgX = useTransform(smx, [0, 1], ["4%", "-4%"]);
    const mgY = useTransform(smy, [0, 1], ["4%", "-4%"]);
    const fgX = useTransform(smx, [0, 1], ["8%", "-8%"]);
    const fgY = useTransform(smy, [0, 1], ["8%", "-8%"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

    if (loading || !activeSlide) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-[#788069] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    /* ─── Shared card classes ─────────────────── */
    /* ─── Shared card classes ─────────────────── */
    const card = "builder-box-clean";

    /* ─── Layer card classes ──────────────────── */
    const layerCard = "builder-box-clean !p-5 flex-1";

    return (
        <div className="flex flex-col gap-6 pb-24">

            {/* ── Page Header ─────────────────────────────── */}
            <motion.header {...FADE_UP(0)} className="content-header">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-sage/10 rounded-lg text-sage">
                        <Sparkles size={24} />
                    </div>
                    <h1 className="content-title">Hero Management</h1>
                </div>
                <p className="content-subtitle">Control the first impression of your property's website</p>
            </motion.header>

            {/* ═══════════════════════════════════════════════════════
                ROW 0 · SLIDE NAVIGATION BAR
            ═══════════════════════════════════════════════════════ */}
            <motion.div {...FADE_UP(0.04)} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => setActiveSlideId(slide.id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap min-w-max border ${activeSlideId === slide.id
                            ? "bg-[#181d26] text-white border-transparent"
                            : "bg-white text-gray-600 border-[#dddddd] hover:bg-gray-50"
                            }`}
                    >
                        Slide {index + 1}
                    </button>
                ))}

                <button
                    onClick={addNewSlide}
                    className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border border-dashed border-emerald-300 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors"
                    title="Add new revolution slide"
                >
                    <span className="text-xs font-bold leading-none">+ Add Slide</span>
                </button>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════
                ROW 1 · LIVE PREVIEW (full-width, premium card)
            ═══════════════════════════════════════════════════════ */}
            <motion.div {...FADE_UP(0.06)} className={`${card} !p-6 gap-4`}>

                {/* Card header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Eye size={15} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-gray-800 leading-none">Live Preview</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">Reflects uploaded images &amp; text in real-time</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full uppercase tracking-wider border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </span>
                </div>

                {/* ── Cinematic Preview Canvas ─────────────── */}
                <div
                    className="relative w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden bg-gray-950 ring-1 ring-black/10 shadow-xl"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >

                    {/* Background layer */}
                    <motion.div
                        style={{ x: bgX, y: bgY }}
                        className="absolute inset-0 scale-[1.15] will-change-transform bg-gray-900 flex items-center justify-center"
                    >
                        {activeSlide.backgroundImage ? (
                            <img
                                src={activeSlide.backgroundImage}
                                alt="Background"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-600">
                                <ImageIcon size={32} className="opacity-50" />
                                <span className="text-sm font-medium tracking-wide uppercase opacity-70">No Background</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Midground layer */}
                    {activeSlide.midgroundImage && (
                        <motion.div
                            style={{ x: mgX, y: mgY }}
                            className="absolute inset-0 scale-[1.10] will-change-transform z-[2]"
                        >
                            <img src={activeSlide.midgroundImage} alt="Midground" className="w-full h-full object-cover" />
                        </motion.div>
                    )}

                    {/* Foreground layer */}
                    {activeSlide.foregroundImage && (
                        <motion.div
                            style={{ x: fgX, y: fgY }}
                            className="absolute inset-0 scale-[1.05] will-change-transform z-[3]"
                        >
                            <img src={activeSlide.foregroundImage} alt="Foreground" className="w-full h-full object-cover" />
                        </motion.div>
                    )}

                    {/* Gradient atmosphere */}
                    <div className="absolute inset-0 z-[4] bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 z-[4] bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

                    {/* Text overlay - Centered */}
                    <div className="absolute inset-0 z-[5] flex flex-col justify-center items-center text-center px-6 md:px-12 pointer-events-none">
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/70 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
                                Luxury Resort
                            </span>
                        </div>
                        <h2 className="text-white font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.1] drop-shadow-2xl max-w-4xl">
                            {activeSlide.title || "Welcome to Our Resort"}
                        </h2>
                        <p className="mt-4 text-white/80 text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-2xl drop-shadow-md">
                            {activeSlide.subtitle || "Experience luxury in the heart of nature."}
                        </p>
                        {/* Subtle bottom rule */}
                        <div className="mt-8 flex items-center gap-3">
                            <div className="h-px w-12 bg-white/40" />
                            <span className="text-white/40 text-[11px] tracking-widest uppercase">Explore More</span>
                            <div className="h-px w-12 bg-white/40" />
                        </div>
                    </div>

                    {/* Corner watermark / hint */}
                    <div className="absolute top-4 right-4 z-[6] px-2.5 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-white/60 text-[10px] font-medium flex items-center gap-1">
                            <Layout size={9} />
                            Hero Preview
                        </span>
                    </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center">
                    Upload images below to see them reflected here. Parallax depth is simulated on the live site.
                </p>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════
                ROW 2 · IMAGE LAYERS (3 equal columns)
            ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Background */}
                <motion.div {...FADE_UP(0.1)} className={layerCard}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={15} className="text-sky-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 leading-none truncate">Background</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">Base layer · far depth</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[220px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <ImageUpload
                            path={`hero/background_${activeSlideId}.png`}
                            currentUrl={activeSlide.backgroundImage}
                            onUploadComplete={(url) => { updateActiveSlide({ backgroundImage: url }); }}
                        />
                    </div>
                </motion.div>

                {/* Midground */}
                <motion.div {...FADE_UP(0.15)} className={layerCard}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#788069]/10 flex items-center justify-center flex-shrink-0">
                            <Layers size={15} className="text-[#788069]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 leading-none truncate">Midground</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">Middle layer · optional</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[220px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <ImageUpload
                            path={`hero/midground_${activeSlideId}.png`}
                            currentUrl={activeSlide.midgroundImage || ""}
                            onUploadComplete={(url) => { updateActiveSlide({ midgroundImage: url }); }}
                        />
                    </div>
                </motion.div>

                {/* Foreground */}
                <motion.div {...FADE_UP(0.2)} className={layerCard}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Sparkles size={15} className="text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-800 leading-none truncate">Foreground</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">Front layer · use transparent PNG</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[220px] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <ImageUpload
                            path={`hero/foreground_${activeSlideId}.png`}
                            currentUrl={activeSlide.foregroundImage || ""}
                            onUploadComplete={(url) => { updateActiveSlide({ foregroundImage: url }); }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* ═══════════════════════════════════════════════════════
                ROW 3 · TYPOGRAPHY & COPY + SAVE BUTTON
            ═══════════════════════════════════════════════════════ */}
            <motion.div {...FADE_UP(0.25)} className={`${card} !p-8`}>

                {/* Section label */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#788069]/10 flex items-center justify-center">
                            <Type size={15} className="text-[#788069]" />
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-gray-800 leading-none">Typography &amp; Copy</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">Title and subtitle shown in the hero preview</p>
                        </div>
                    </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="flex flex-col gap-2">
                        <label className="label-clean">Hero Title</label>
                        <input
                            type="text"
                            value={activeSlide.title || ""}
                            onChange={(e) => updateActiveSlide({ title: e.target.value })}
                            placeholder="e.g. Welcome to Our Resort"
                            className="input-clean font-bold"
                        />
                    </div>

                    {/* Subtitle */}
                    <div className="flex flex-col gap-2">
                        <label className="label-clean">Hero Subtitle</label>
                        <textarea
                            value={activeSlide.subtitle || ""}
                            onChange={(e) => updateActiveSlide({ subtitle: e.target.value })}
                            placeholder="e.g. Experience luxury in the heart of nature."
                            rows={3}
                            className="input-clean min-h-[100px] resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex flex-col gap-2 max-w-sm">
                        <label className="label-clean flex items-center gap-2">
                            Text Entry Animation
                            <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">New</span>
                        </label>
                        <select
                            value={activeSlide.textAnimation || 'fade-up'}
                            onChange={(e) => updateActiveSlide({ textAnimation: e.target.value as any })}
                            className="input-clean appearance-none cursor-pointer"
                        >
                            <option value="fade-up">Fade Up (Clean & Modern)</option>
                            <option value="fade-down">Fade Down (Weighty)</option>
                            <option value="slide-left">Slide In Left (Dynamic)</option>
                            <option value="slide-right">Slide In Right (Dynamic)</option>
                            <option value="zoom">Zoom Out (Cinematic)</option>
                            <option value="fade">Pure Fade (Classic)</option>
                        </select>
                    </div>
                </div>

                {/* Save & Danger Zone */}
                <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {slides.length > 1 ? (
                        <button
                            onClick={() => deleteSlide(activeSlideId!)}
                            className="text-sm font-semibold border border-red-200 text-red-600 bg-white hover:bg-red-50 rounded-xl px-5 py-2.5 transition-colors self-start md:self-auto"
                        >
                            Delete Slide
                        </button>
                    ) : <div />}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-clean-primary flex items-center gap-2 self-end md:self-auto"
                    >
                        <Save size={20} />
                        {saving ? "Publishing All..." : "Save All Slides"}
                    </motion.button>
                </div>
            </motion.div>

        </div>
    );
};