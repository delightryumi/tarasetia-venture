"use client";

import React from "react";
import { usePackages } from "./usePackages";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { motion, AnimatePresence } from "framer-motion";
import { Package as PackageIcon, Plus, Trash2, Tag, Check, LayoutGrid, ChevronLeft, ChevronRight, Luggage, Heart, Briefcase, Info } from "lucide-react";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./packages.css";

export const PackagesSection = () => {
    const {
        packages,
        loading,
        newName,
        setNewName,
        newDesc,
        setNewDesc,
        newPrice,
        setNewPrice,
        newImage,
        setNewImage,
        newFeature,
        setNewFeature,
        packageType,
        setPackageType,
        customType,
        setCustomType,
        features,
        addFeature,
        removeFeature,
        saving,
        editingPackage,
        handleAdd,
        handleUpdate,
        handleDelete,
        startEditing,
        cancelEditing,
        view,
        setView,
        currentStep,
        setCurrentStep,
    } = usePackages();

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-sage rounded-full animate-spin" />
        </div>
    );

    const getPackageIcon = (type: string) => {
        switch (type) {
            case 'Wedding': return <Heart size={14} />;
            case 'MICE': return <Briefcase size={14} />;
            case 'Trip': return <Luggage size={14} />;
            default: return <PackageIcon size={14} />;
        }
    };

    return (
        <div className="section-container min-h-[calc(100vh-100px)]">
            <AnimatePresence mode="wait">
                {view === 'list' ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="clean-container py-12"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h1 className="text-proper-h1 mb-2">Package Catalog</h1>
                                <p className="text-proper-subtitle">A collection of specialized experiences and signature stays.</p>
                            </div>
                            <button
                                onClick={() => setView('stepper')}
                                className="btn-clean-primary flex items-center gap-3"
                            >
                                <Plus size={18} />
                                Craft New Package
                            </button>
                        </div>

                        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence mode="popLayout">
                                {packages.map((pkg) => (
                                    <BentoCard key={pkg.id} className="room-list-item-clean">
                                        <div className="room-thumb-clean bg-slate-100">
                                            {pkg.imageUrl ? (
                                                <img src={pkg.imageUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300"><PackageIcon size={48} /></div>
                                            )}
                                            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-lg border border-slate-100 text-[10px] font-bold text-sage flex items-center gap-2">
                                                {getPackageIcon(pkg.packageType || 'Stay')} {pkg.packageType || 'Stay'}
                                            </div>
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-terracotta text-white rounded-lg text-[10px] font-bold shadow-lg">
                                                {pkg.price}
                                            </div>
                                        </div>

                                        <div className="room-details-clean">
                                            <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em] mb-3 block">Offer</span>
                                            <h3 className="text-lg font-bold text-slate-900 mb-2 truncate text-proper-h1 !text-lg">{pkg.name}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-6 h-8 italic">
                                                {pkg.description || "A bundle of moments curated for perfection."}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {pkg.features?.slice(0, 3).map((f, i) => (
                                                    <span key={i} className="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded border border-slate-100">
                                                        {f}
                                                    </span>
                                                ))}
                                                {pkg.features?.length > 3 && <span className="text-[9px] font-bold text-slate-300">+{pkg.features.length - 3} more</span>}
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                                                <div className="flex items-center gap-3 w-full">
                                                    <button
                                                        onClick={() => startEditing(pkg)}
                                                        className="btn-action-edit flex-grow"
                                                    >
                                                        Edit Catalog
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(pkg.id)}
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
                ) : (
                    <motion.div
                        key="stepper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="clean-container py-12"
                    >
                        <button
                            onClick={cancelEditing}
                            className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-12 hover:text-slate-900 transition-colors"
                        >
                            <ChevronLeft size={16} /> Back to Catalog
                        </button>

                        <div className="stepper-header-slim">
                            <div className={`step-indicator-slim ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                                <div className="step-number-slim">{currentStep > 1 ? <Check size={14} /> : "1"}</div>
                                <span className="step-label-slim">Concept</span>
                            </div>
                            <div className={`step-indicator-slim ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                                <div className="step-number-slim">{currentStep > 2 ? <Check size={14} /> : "2"}</div>
                                <span className="step-label-slim">Visuals</span>
                            </div>
                            <div className={`step-indicator-slim ${currentStep >= 3 ? 'active' : ''}`}>
                                <div className="step-number-slim">3</div>
                                <span className="step-label-slim">Inclusions</span>
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
                                        <div className="text-center border-b border-slate-100 pb-12 mb-12">
                                            <h1 className="text-proper-h1 !text-4xl mb-4">Package Concept</h1>
                                            <p className="text-proper-subtitle">Define the identity and value of this signature experience.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                            <div className="space-y-4">
                                                <label className="label-clean">Package Name</label>
                                                <input
                                                    type="text"
                                                    className="input-clean font-bold text-2xl !py-6"
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    placeholder="Ex: Romantic Honeymoon"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <label className="label-clean">Package Type</label>
                                                <select
                                                    className="input-clean !py-6 font-bold"
                                                    value={packageType}
                                                    onChange={(e) => setPackageType(e.target.value)}
                                                >
                                                    <option value="Stay">Signature Stay</option>
                                                    <option value="Wedding">Wedding Package</option>
                                                    <option value="MICE">Meeting & Events (MICE)</option>
                                                    <option value="Trip">Curated Trip</option>
                                                    <option value="Custom">Custom...</option>
                                                </select>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="label-clean">Display Price</label>
                                                <input
                                                    type="text"
                                                    className="input-clean !py-6 font-bold"
                                                    value={newPrice}
                                                    onChange={(e) => setNewPrice(e.target.value)}
                                                    placeholder="Ex: Rp 2.500.000"
                                                />
                                            </div>

                                            <AnimatePresence>
                                                {packageType === "Custom" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="space-y-4 overflow-hidden"
                                                    >
                                                        <label className="label-clean">Custom Category Name</label>
                                                        <input
                                                            type="text"
                                                            className="input-clean !py-6 font-bold border-sage"
                                                            value={customType}
                                                            onChange={(e) => setCustomType(e.target.value)}
                                                            placeholder="Ex: Corporate Retreat"
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="md:col-span-2 space-y-4">
                                                <label className="label-clean">Experience Narrative</label>
                                                <textarea
                                                    className="input-clean min-h-[180px] resize-none leading-relaxed"
                                                    value={newDesc}
                                                    onChange={(e) => setNewDesc(e.target.value)}
                                                    placeholder="Describe the heart of this bundle..."
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-12 flex justify-end border-t border-slate-100">
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
                                        <div className="text-center border-b border-slate-100 pb-12 mb-12">
                                            <h1 className="text-proper-h1 !text-4xl mb-4">Signature Visual</h1>
                                            <p className="text-proper-subtitle">Select an image that encapsulates the aura of this package.</p>
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <div className="w-full max-w-md aspect-video rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 hover:border-sage transition-colors p-2 shadow-inner">
                                                <ImageUpload
                                                    path={`packages/pkg-${Date.now()}.jpg`}
                                                    currentUrl={newImage}
                                                    onUploadComplete={(url) => setNewImage(url)}
                                                />
                                            </div>
                                            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Visual</p>
                                        </div>

                                        <div className="pt-12 flex justify-between items-center border-t border-slate-100">
                                            <button
                                                onClick={() => setCurrentStep(1)}
                                                className="btn-clean-ghost"
                                            >
                                                <ChevronLeft size={16} className="inline mr-2" /> Back to Concept
                                            </button>
                                            <button
                                                onClick={() => setCurrentStep(3)}
                                                className="btn-clean-primary"
                                            >
                                                Define Inclusions <ChevronRight size={20} className="inline ml-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="max-w-3xl mx-auto space-y-12"
                                    >
                                        <div className="text-center border-b border-slate-100 pb-12 mb-12">
                                            <h1 className="text-proper-h1 !text-4xl mb-4">Inclusions & Perks</h1>
                                            <p className="text-proper-subtitle">List every detail that makes this package extraordinary.</p>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="flex gap-4">
                                                <input
                                                    type="text"
                                                    className="input-clean !py-6 font-bold flex-grow"
                                                    value={newFeature}
                                                    onChange={(e) => setNewFeature(e.target.value)}
                                                    placeholder="Add a signature perk..."
                                                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                                                />
                                                <button
                                                    onClick={addFeature}
                                                    className="w-16 h-16 bg-sage text-white rounded-2xl flex items-center justify-center hover:bg-sage/90 transition-all font-bold text-2xl"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <AnimatePresence>
                                                    {features.map((f, i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group"
                                                        >
                                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-sage" />
                                                                {f}
                                                            </span>
                                                            <button
                                                                onClick={() => removeFeature(i)}
                                                                className="text-slate-300 hover:text-terracotta transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="pt-12 flex justify-between items-center border-t border-slate-100">
                                            <button
                                                onClick={() => setCurrentStep(2)}
                                                className="btn-clean-ghost"
                                            >
                                                <ChevronLeft size={16} className="inline mr-2" /> Back to Visuals
                                            </button>
                                            <button
                                                onClick={editingPackage ? handleUpdate : handleAdd}
                                                disabled={saving}
                                                className="btn-clean-primary"
                                            >
                                                {saving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    editingPackage ? "Refine Catalog" : "Add to Catalog"
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
