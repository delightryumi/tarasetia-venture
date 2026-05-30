"use client";

import React from "react";
import { useRoomTypes } from "./useRoomTypes";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { MultiImageUpload } from "../../ui/ImageUpload/MultiImageUpload";
import { AMENITIES } from "./amenities";
import { BED_TYPES, ROOM_SIZE_UNITS } from "./constants";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Home,
    Check,
    ChevronRight,
    Images,
    ChevronLeft,
    Sparkles,
    Star,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./rooms.css";

export const RoomTypeSection = () => {
    const {
        roomTypes,
        loading,
        newName,
        setNewName,
        newDesc,
        setNewDesc,
        newImages,
        setNewImages,
        newAmenities,
        setNewAmenities,
        newBookingUrl,
        setNewBookingUrl,
        newBeds,
        setNewBeds,
        newCapacity,
        setNewCapacity,
        newRoomSizeValue,
        setNewRoomSizeValue,
        newRoomSizeUnit,
        setNewRoomSizeUnit,
        newRoomCount,
        setNewRoomCount,
        saving,
        editingRoom,
        handleAdd,
        handleUpdate,
        handleDelete,
        startEditing,
        cancelEditing,
        view,
        setView,
        currentStep,
        setCurrentStep,
    } = useRoomTypes();
    
    // Local state for bed builder
    const [selectedBedType, setSelectedBedType] = React.useState(BED_TYPES[0].label);
    const [bedQty, setBedQty] = React.useState(1);
    const [customBedSize, setCustomBedSize] = React.useState("");

    const addBed = () => {
        const bedInfo = BED_TYPES.find(b => b.label === selectedBedType);
        if (!bedInfo) return;
        
        const sizeToUse = selectedBedType === "Custom" ? customBedSize : bedInfo.size;
        
        setNewBeds([...newBeds, { 
            type: selectedBedType, 
            quantity: bedQty, 
            size: sizeToUse 
        }]);
        
        // Reset local state
        setBedQty(1);
        setCustomBedSize("");
    };

    const removeBed = (index: number) => {
        setNewBeds(newBeds.filter((_, i) => i !== index));
    };

    const addImage = (url: string) => {
        if (newImages.length >= 10) {
            toast.error("Maximum 10 images allowed per room category.");
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

    const toggleAmenity = (id: string) => {
        if (newAmenities.includes(id)) {
            setNewAmenities(newAmenities.filter(a => a !== id));
        } else {
            setNewAmenities([...newAmenities, id]);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-sage rounded-full animate-spin" />
        </div>
    );

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
                    <h1 className="text-proper-h1 mb-2">Room Categories</h1>
                    <p className="text-proper-subtitle">Manage your property's room types and signature amenities.</p>
                </div>
                <button
                    onClick={() => setView('stepper')}
                    className="btn-clean-primary flex items-center gap-3"
                >
                    <Plus size={18} />
                    Create New Category
                </button>
            </div>

            <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {roomTypes.map((type) => {
                        const profileImg = type.images?.find(img => img.isProfile)?.url || type.images?.[0]?.url;
                        return (
                            <BentoCard key={type.id} className="room-list-item-clean">
                                <div className="room-thumb-clean bg-slate-100">
                                    {profileImg ? (
                                        <img src={profileImg} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={48} /></div>
                                    )}
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-lg border border-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                        <Home size={12} className="text-sage" /> {type.roomCount || 0} Units
                                    </div>
                                </div>

                                <div className="room-details-clean">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-terracotta uppercase tracking-[0.2em]">Sanctuary</span>
                                        {type.bookingUrl && (
                                            <a href={type.bookingUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-sage"><ExternalLink size={14} /></a>
                                        )}
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-2 truncate text-proper-h1 !text-base">{type.name}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-6 h-8 italic">
                                        {type.description || "A master retreat awaiting its definition."}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {type.amenities?.slice(0, 3).map(aId => {
                                            const amenity = AMENITIES.find(a => a.id === aId);
                                            return amenity ? (
                                                <div key={aId} className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                                    <amenity.icon size={10} /> {amenity.label}
                                                </div>
                                            ) : null;
                                        })}
                                        {type.amenities?.length > 3 && (
                                            <div className="px-3 py-1 text-[9px] font-bold text-slate-400">+{type.amenities.length - 3} more</div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center gap-3 w-full">
                                            <button
                                                onClick={() => startEditing(type)}
                                                className="btn-action-edit flex-grow"
                                            >
                                                Edit Concept
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id)}
                                                className="btn-action-delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </BentoCard>
                        );
                    })}
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
                className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-12 hover:text-slate-900 transition-colors"
            >
                <ChevronLeft size={16} /> Back to Catalog
            </button>

            <div className="stepper-header-slim">
                <div className={`step-indicator-slim ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                    <div className="step-number-slim">{currentStep > 1 ? <Check size={14} /> : "1"}</div>
                    <span className="step-label-slim">Essentials</span>
                </div>
                <div className={`step-indicator-slim ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                    <div className="step-number-slim">{currentStep > 2 ? <Check size={14} /> : "2"}</div>
                    <span className="step-label-slim">Atmosphere</span>
                </div>
                <div className={`step-indicator-slim ${currentStep >= 3 ? 'active' : ''}`}>
                    <div className="step-number-slim">3</div>
                    <span className="step-label-slim">Amenities</span>
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
                                <h1 className="text-proper-h1 !text-4xl mb-4">Category Essentials</h1>
                                <p className="text-proper-subtitle">Define the core identity and booking gateway for this sanctuary.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                <div className="space-y-4">
                                    <label className="label-clean">Category Title</label>
                                    <input
                                        type="text"
                                        className="input-clean font-bold text-2xl !py-6"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Ex: Presidential Suite"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="label-clean">Booking Gateway URL</label>
                                    <input
                                        type="url"
                                        className="input-clean !py-6"
                                        value={newBookingUrl}
                                        onChange={(e) => setNewBookingUrl(e.target.value)}
                                        placeholder="https://booking.com/..."
                                    />
                                </div>
                                    <div className="space-y-4">
                                        <label className="label-clean">Room Capacity</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min="1"
                                                className="input-clean !py-6 text-center w-24"
                                                value={newCapacity}
                                                onChange={(e) => setNewCapacity(parseInt(e.target.value) || 1)}
                                            />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adults / Guests</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="label-clean">Room Dimensions</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="input-clean !py-6 flex-grow"
                                                value={newRoomSizeValue}
                                                onChange={(e) => setNewRoomSizeValue(parseFloat(e.target.value) || 0)}
                                                placeholder="Value"
                                            />
                                            <select 
                                                className="input-clean !py-6 w-32 bg-white"
                                                value={newRoomSizeUnit}
                                                onChange={(e) => setNewRoomSizeUnit(e.target.value)}
                                            >
                                                {ROOM_SIZE_UNITS.map(unit => (
                                                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="label-clean">Room Inventory</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="number"
                                                min="1"
                                                className="input-clean !py-6 text-center w-24"
                                                value={newRoomCount}
                                                onChange={(e) => setNewRoomCount(parseInt(e.target.value) || 1)}
                                            />
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Units</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-6 pt-6 border-t border-slate-50">
                                        <div className="flex items-center justify-between">
                                            <label className="label-clean">Bed Configuration</label>
                                            <span className="text-[10px] font-black text-sage uppercase tracking-widest">Master Bed Planner</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                            <div className="md:col-span-5 space-y-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Bed Type</span>
                                                <select
                                                    className="input-clean !py-4 w-full bg-white"
                                                    value={selectedBedType}
                                                    onChange={(e) => setSelectedBedType(e.target.value)}
                                                >
                                                    {BED_TYPES.map(bed => (
                                                        <option key={bed.label} value={bed.label}>{bed.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Qty</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="input-clean !py-4 w-full bg-white text-center"
                                                    value={bedQty}
                                                    onChange={(e) => setBedQty(parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            {selectedBedType === "Custom" && (
                                                <div className="md:col-span-3 space-y-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Dimensions</span>
                                                    <input
                                                        type="text"
                                                        className="input-clean !py-4 w-full bg-white"
                                                        value={customBedSize}
                                                        onChange={(e) => setCustomBedSize(e.target.value)}
                                                        placeholder="200 x 200"
                                                    />
                                                </div>
                                            )}
                                            <div className={`${selectedBedType === "Custom" ? "md:col-span-2" : "md:col-span-5"} pt-2`}>
                                                <button
                                                    type="button"
                                                    onClick={addBed}
                                                    className="w-full py-4 bg-sage text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sage-dark transition-all shadow-sm"
                                                >
                                                    Add Bed
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <AnimatePresence mode="popLayout">
                                                {newBeds.map((bed, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-sage">
                                                                <Star size={18} strokeWidth={2.5} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-slate-900">{bed.quantity}x {bed.type}</h4>
                                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{bed.size || "Standard Size"}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeBed(idx)}
                                                            className="p-2 text-slate-200 hover:text-terracotta transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {newBeds.length === 0 && (
                                                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                                    <p className="text-xs text-slate-400 italic">No beds configured for this category yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                <div className="md:col-span-2 space-y-4">
                                    <label className="label-clean">Narrative Description</label>
                                    <textarea
                                        className="input-clean min-h-[220px] resize-none leading-relaxed"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Weave a story about the unique essence of this space..."
                                    />
                                </div>
                            </div>

                            <div className="pt-12 flex justify-end border-t border-slate-100">
                                <button
                                    onClick={() => newName && setCurrentStep(2)}
                                    className="btn-clean-primary"
                                    disabled={!newName}
                                >
                                    Design Atmosphere <ChevronRight size={20} className="inline ml-4" />
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
                            className="space-y-12"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-12 mb-12">
                                <div>
                                    <h2 className="text-proper-h1 !text-3xl mb-3">Room Atmosphere</h2>
                                    <p className="text-proper-subtitle">Select the signature palette of visuals for this experience.</p>
                                </div>
                                <div className="px-5 py-2 bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                    {newImages.length} / 10 Visions
                                </div>
                            </div>

                            <div className="gallery-grid-clean">
                                <div className="col-span-full border-b border-slate-100 pb-8 mb-4">
                                    <MultiImageUpload
                                        basePath={`rooms`}
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

                            <div className="pt-12 flex justify-between items-center border-t border-slate-100">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="btn-clean-ghost"
                                >
                                    <ChevronLeft size={16} className="inline mr-2" /> Back to Essentials
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="btn-clean-primary"
                                >
                                    Proceed to Amenities <ChevronRight size={20} className="inline ml-4" />
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
                            className="space-y-12"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-12 mb-12">
                                <div>
                                    <h2 className="text-proper-h1 !text-3xl mb-3">Signature Amenities</h2>
                                    <p className="text-proper-subtitle">Select the curated features included in this room sanctuary.</p>
                                </div>
                                <div className="px-5 py-2 bg-slate-100 border border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                    Curated Selection
                                </div>
                            </div>

                            <motion.div
                                variants={{
                                    show: {
                                        transition: {
                                            staggerChildren: 0.05
                                        }
                                    }
                                }}
                                initial="hidden"
                                animate="show"
                                className="amenity-boutique-list px-2"
                            >
                                {AMENITIES.map((amenity) => {
                                    const isSelected = newAmenities.includes(amenity.id);
                                    return (
                                        <motion.div
                                            key={amenity.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 10 },
                                                show: { opacity: 1, y: 0 }
                                            }}
                                            onClick={() => toggleAmenity(amenity.id)}
                                            className={`amenity-row-clean ${isSelected ? 'selected' : ''}`}
                                        >
                                            <div className="amenity-icon-premium">
                                                <amenity.icon size={22} strokeWidth={1.5} />
                                            </div>
                                            <div className="amenity-label-premium">
                                                {amenity.label}
                                            </div>
                                            <div className="boutique-checkbox">
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>

                            <div className="pt-12 flex justify-between items-center border-t border-slate-100">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="btn-clean-ghost"
                                >
                                    <ChevronLeft size={16} className="inline mr-2" /> Back to Atmosphere
                                </button>
                                <button
                                    onClick={editingRoom ? handleUpdate : handleAdd}
                                    disabled={saving}
                                    className="btn-clean-primary"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        editingRoom ? "Publish Evolution" : "Finalize Sanctuary"
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

