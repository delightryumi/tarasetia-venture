"use client";

import React from "react";
import { useAttractions } from "./useAttractions";
import { MultiImageUpload } from "../../ui/ImageUpload/MultiImageUpload";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Trash2, Navigation, ChevronLeft, ChevronRight, Check, Sparkles, Images } from "lucide-react";
import { toast } from "sonner";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./attractions.css";

export const AttractionsSection = () => {
    const {
        attractions,
        loading,
        newName,
        setNewName,
        newDesc,
        setNewDesc,
        newDistance,
        setNewDistance,
        newImages,
        setNewImages,
        saving,
        editingAttraction,
        handleAdd,
        handleUpdate,
        handleDelete,
        startEditing,
        cancelEditing,
        view,
        setView,
        currentStep,
        setCurrentStep,
    } = useAttractions();

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-[var(--surface-alt)] border-t-[var(--sage)] rounded-full animate-spin" />
        </div>
    );

    const addImage = (url: string) => {
        if (newImages.length >= 10) {
            toast.error("Maximum 10 images allowed per attraction.");
            return;
        }
        const isFirst = newImages.length === 0;
        setNewImages([...newImages, { url, isProfile: isFirst }]);
    };

    const removeImage = (index: number) => {
        const updated = [...newImages];
        updated.splice(index, 1);
        if (updated.length > 0 && !updated.some(img => img.isProfile)) {
            updated[0].isProfile = true;
        }
        setNewImages(updated);
    };

    const toggleProfile = (index: number) => {
        const updated = newImages.map((img, i) => ({
            ...img,
            isProfile: i === index
        }));
        setNewImages(updated);
    };

    const renderListView = () => (
        <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="clean-container py-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-proper-h1 mb-2">Nearby Attractions</h1>
                    <p className="text-proper-subtitle">Curate the local experiences that orbit your sanctuary.</p>
                </div>
                <button
                    onClick={() => setView('stepper')}
                    className="btn-clean-primary flex items-center gap-3"
                >
                    <Plus size={18} />
                    Pin New Destination
                </button>
            </div>

            <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {attractions.map((attr) => (
                        <BentoCard key={attr.id} className="room-list-item-clean">
                            <div className="room-thumb-clean bg-[var(--surface-alt)]">
                                {(() => {
                                    const profileImg = attr.images?.find(img => img.isProfile)?.url || attr.images?.[0]?.url || attr.imageUrl;
                                    return profileImg ? (
                                        <img src={profileImg} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[var(--sage-light)]"><MapPin size={48} /></div>
                                    )
                                })()}
                                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-lg border border-[var(--border-light)] text-[10px] font-bold text-[var(--sage)] flex items-center gap-2">
                                    <Navigation size={12} /> {attr.distance}
                                </div>
                                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-lg border border-[var(--border-light)] text-[10px] font-bold text-[var(--sage)] flex items-center gap-2">
                                    <Images size={12} /> {attr.images?.length || (attr.imageUrl ? 1 : 0)}
                                </div>
                            </div>

                            <div className="room-details-clean">
                                <span className="text-[10px] font-black text-peach uppercase tracking-[0.2em] mb-3 block">Destination</span>
                                <h3 className="text-lg font-bold text-[var(--rich-black)] mb-2 truncate text-proper-h1 !text-lg">{attr.name}</h3>
                                <p className="text-xs text-[var(--sage)] line-clamp-2 mb-6 h-8 italic">
                                    {attr.description || "A destination awaiting its story."}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-[var(--border-light)] mt-auto">
                                    <div className="flex items-center gap-3 w-full">
                                        <button
                                            onClick={() => startEditing(attr)}
                                            className="btn-action-edit flex-grow"
                                        >
                                            Edit Concept
                                        </button>
                                        <button
                                            onClick={() => handleDelete(attr.id)}
                                            className="btn-action-delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>
                    ))}
                </AnimatePresence>
            </BentoGrid>
        </motion.div>
    );

    const renderStepperView = () => (
        <motion.div
            key="stepper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="clean-container py-12"
        >
            <button
                onClick={cancelEditing}
                className="flex items-center gap-2 text-[9px] font-black text-[var(--sage)] uppercase tracking-[0.25em] mb-12 hover:text-[var(--rich-black)] transition-colors"
            >
                <ChevronLeft size={16} /> Back to Catalog
            </button>

            <div className="stepper-header-slim">
                <div className={`step-indicator-slim ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                    <div className="step-number-slim">{currentStep > 1 ? <Check size={14} /> : "1"}</div>
                    <span className="step-label-slim">Essentials</span>
                </div>
                <div className={`step-indicator-slim ${currentStep >= 2 ? 'active' : ''}`}>
                    <div className="step-number-slim">2</div>
                    <span className="step-label-slim">Atmosphere</span>
                </div>
            </div>

            <div className="builder-box-clean">
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="max-w-3xl mx-auto space-y-12"
                        >
                            <div className="text-center border-b border-[var(--border-light)] pb-12 mb-12">
                                <h1 className="text-proper-h1 !text-4xl mb-4">Destination Essentials</h1>
                                <p className="text-proper-subtitle">Define the name and proximity of this local masterpiece.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                <div className="space-y-4">
                                    <label className="label-clean">Spot Name</label>
                                    <input
                                        type="text"
                                        className="input-clean font-bold text-2xl !py-6"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Ex: Tangkuban Perahu"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="label-clean">Distance / Reach</label>
                                    <input
                                        type="text"
                                        className="input-clean !py-6 font-bold"
                                        value={newDistance}
                                        onChange={(e) => setNewDistance(e.target.value)}
                                        placeholder="Ex: 5 km / 20 mins"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <label className="label-clean">Quick Narrative</label>
                                    <textarea
                                        className="input-clean min-h-[180px] resize-none leading-relaxed"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Describe the aura of this destination..."
                                    />
                                </div>
                            </div>

                            <div className="pt-12 flex justify-end border-t border-[var(--border-light)]">
                                <button
                                    onClick={() => newName && setCurrentStep(2)}
                                    className="btn-clean-primary"
                                    disabled={!newName}
                                >
                                    Proceed to Media <ChevronRight size={20} className="inline ml-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="max-w-3xl mx-auto space-y-12"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border-light)] pb-12 mb-12">
                                <div>
                                    <h1 className="text-proper-h1 !text-4xl mb-4">Atmosphere</h1>
                                    <p className="text-proper-subtitle">Upload signature visuals that encapsulate this destination.</p>
                                </div>
                                <div className="px-5 py-2 bg-[var(--surface-alt)] border border-[var(--border-light)] text-[9px] font-black text-[var(--sage-light)] uppercase tracking-[0.25em]">
                                    {newImages.length} / 10 Visions
                                </div>
                            </div>

                            <div className="gallery-grid-clean">
                                <div className="col-span-full border-b border-slate-100 pb-8 mb-4">
                                    <MultiImageUpload
                                        basePath={`attractions`}
                                        onUploadsComplete={(results) => {
                                            const newUrls = results.map(r => ({ url: r.url, isProfile: false }));

                                            setNewImages(prev => {
                                                const combined = [...prev, ...newUrls];
                                                if (combined.length > 0 && !combined.some(img => img.isProfile)) {
                                                    combined[0].isProfile = true;
                                                }
                                                // Take at most 10 items to prevent overflow
                                                return combined.slice(0, 10);
                                            });
                                        }}
                                    />
                                </div>

                                {newImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`gallery-tile-clean group ${img.isProfile ? 'is-portfolio-main' : ''}`}
                                    >
                                        <div className="relative w-full h-full overflow-hidden">
                                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                                            {img.isProfile && (
                                                <div className="portfolio-marker">
                                                    Main Portfolio
                                                </div>
                                            )}

                                            <div className="tile-actions-overlay">
                                                <button
                                                    onClick={() => toggleProfile(idx)}
                                                    className={`btn-boutique-action ${img.isProfile ? 'active' : ''}`}
                                                    title="Designate as Main"
                                                >
                                                    <Sparkles size={18} />
                                                </button>
                                                <button
                                                    onClick={() => removeImage(idx)}
                                                    className="btn-boutique-action"
                                                    title="Remove Vision"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-12 flex justify-between items-center border-t border-[var(--border-light)]">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="btn-clean-ghost"
                                >
                                    <ChevronLeft size={16} className="inline mr-2" /> Back to Essentials
                                </button>
                                <button
                                    onClick={editingAttraction ? handleUpdate : handleAdd}
                                    disabled={saving}
                                    className="btn-clean-primary"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        editingAttraction ? "Refine Destination" : "Pin Destination"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );

    return (
        <div className="section-container min-h-[calc(100vh-100px)]">
            <AnimatePresence mode="wait">
                {view === 'list' ? renderListView() : renderStepperView()}
            </AnimatePresence>
        </div>
    );
};
