"use client";

import React from "react";
import { useAboutUs } from "./useAboutUs";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { motion } from "framer-motion";
import { Info, Save, Eye } from "lucide-react";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./about.css";

export const AboutUsSection = () => {
    const {
        title,
        setTitle,
        content,
        setContent,
        imageUrl,
        setImageUrl,
        loading,
        saving,
        message,
        handleSave,
    } = useAboutUs();

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-sage rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="clean-container py-12">
            <header className="content-header">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-sage/10 rounded-lg text-sage">
                        <Info size={24} />
                    </div>
                    <h1 className="content-title">About Us</h1>
                </div>
                <p className="content-subtitle">Tell the story of your property for your visitors with luxury and warmth.</p>
            </header>

            {message && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="success-toast">{message}</motion.div>}

            <BentoGrid className="grid-cols-1 lg:grid-cols-2">
                <BentoCard colSpan={1}>
                    <div className="space-y-6">
                        <div className="form-group">
                            <label className="label-clean">Section Title</label>
                            <input
                                type="text"
                                className="input-clean font-bold"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ex: Our Heritage & Story"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label-clean">Hero / Brand Image</label>
                            <ImageUpload
                                path="about/hero.jpg"
                                currentUrl={imageUrl}
                                onUploadComplete={(url, path) => setImageUrl(url)}
                                label="About Us brand image"
                            />
                            <p className="text-xs text-gray-400 mt-2">Recommended: 1200x800px high-quality landscape image.</p>
                        </div>
                        <div className="form-group">
                            <label className="label-clean">Main Description</label>
                            <textarea
                                className="input-clean min-h-[200px] leading-relaxed"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write a detailed description about your property..."
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-clean-primary w-full mt-8 py-4 flex items-center justify-center gap-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Content
                            </>
                        )}
                    </motion.button>
                </BentoCard>

                <BentoCard>
                    <h3 className="text-lg font-bold text-rich-black mb-4 flex items-center gap-2">
                        <Eye className="text-sage" size={20} />
                        Live Preview
                    </h3>
                    <div className="about-preview-container overflow-hidden rounded-2xl border border-gray-100">
                        {imageUrl && (
                            <div className="aspect-video w-full overflow-hidden">
                                <img src={imageUrl} alt="About preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-8 bg-white">
                            <h3 className="text-3xl font-serif text-rich-black mb-4">{title || "Preview Title"}</h3>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {content || "Your description will appear here as you type."}
                            </p>
                        </div>
                    </div>
                </BentoCard>
            </BentoGrid>
        </div>
    );
};

