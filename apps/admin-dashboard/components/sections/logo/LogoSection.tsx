"use client";

"use client";

import React from "react";
import { useLogo } from "./useLogo";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { motion } from "framer-motion";
import { ShieldCheck, Sun, Moon, Link as LinkIcon } from "lucide-react";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./logo.css";

export const LogoSection = () => {
    const {
        lightLogo,
        setLightLogo,
        darkLogo,
        setDarkLogo,
        bookingEngineUrl,
        setBookingEngineUrl,
        loading,
        saving,
        message,
        handleSave,
    } = useLogo();

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="section-container"
        >
            <header className="content-header">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-sage/10 rounded-lg text-sage">
                        <ShieldCheck size={24} />
                    </div>
                    <h1 className="content-title">Branding & Links</h1>
                </div>
                <p className="content-subtitle">Maintain your brand identity and set your booking engine destination.</p>
            </header>

            {message && <div className="success-toast mb-6">{message}</div>}

            <BentoGrid className="grid-cols-1 lg:grid-cols-2">
                <BentoCard>
                    <div className="flex items-center gap-2 mb-4">
                        <Sun className="text-terracotta" size={20} />
                        <h3 className="text-lg font-bold text-rich-black">Light Theme Logo</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">This logo appears when the background is light (e.g., standard page content).</p>

                    <div className="bg-broken-white p-8 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 min-h-[160px]">
                        {lightLogo ? (
                            <img src={lightLogo} alt="Light Logo" className="max-h-20 object-contain" />
                        ) : (
                            <div className="text-gray-300 italic">No logo uploaded</div>
                        )}
                    </div>

                    <ImageUpload
                        path="branding/logo-light.png"
                        currentUrl={lightLogo}
                        onUploadComplete={(url, path) => {
                            setLightLogo(url);
                            handleSave({ light: url });
                        }}
                    />
                </BentoCard>

                <BentoCard>
                    <div className="flex items-center gap-2 mb-4">
                        <Moon className="text-sage" size={20} />
                        <h3 className="text-lg font-bold text-rich-black">Dark Theme Logo</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">This logo appears when the background is dark (e.g., transparent hero header).</p>

                    <div className="bg-rich-black p-8 rounded-2xl flex items-center justify-center mb-6 border border-white/5 min-h-[160px]">
                        {darkLogo ? (
                            <img src={darkLogo} alt="Dark Logo" className="max-h-20 object-contain" />
                        ) : (
                            <div className="text-gray-500 italic">No logo uploaded</div>
                        )}
                    </div>

                    <ImageUpload
                        path="branding/logo-dark.png"
                        currentUrl={darkLogo}
                        onUploadComplete={(url, path) => {
                            setDarkLogo(url);
                            handleSave({ dark: url });
                        }}
                    />
                </BentoCard>
            </BentoGrid>

            {/* Booking Links Section */}
            <BentoGrid className="grid-cols-1 mt-6">
                <BentoCard>
                    <div className="flex items-center gap-2 mb-4">
                        <LinkIcon className="text-sage" size={20} />
                        <h3 className="text-lg font-bold text-rich-black">Booking Engine URL</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Set the destination link for all "Book Now" and "Reserve" buttons across the landing page.</p>

                    <div className="form-group mb-0">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            Direct Booking Link
                        </label>
                        <input
                            type="url"
                            value={bookingEngineUrl}
                            onChange={e => setBookingEngineUrl(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-rich-black outline-none focus:border-sage focus:ring-1 focus:ring-sage transition-all"
                            placeholder="https://booking.com/bumi-anyom-resort"
                        />
                    </div>
                </BentoCard>
            </BentoGrid>

            <div className="mt-8 flex justify-end">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex items-center gap-2 px-10 py-4 shadow-xl shadow-sage/20"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Update Branding"}
                </motion.button>
            </div>
        </motion.div>
    );
};

