"use client";

import React, { useState } from "react";
import { useGallery, GalleryItem } from "./useGallery";
import { MultiImageUpload } from "../../ui/ImageUpload/MultiImageUpload";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Grid, Move, Plus } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BentoGrid, BentoCard } from "../../ui/BentoGrid";
import "../../ui/BentoGrid/bento.css";
import "./gallery.css";

interface SortableItemProps {
    item: GalleryItem;
    onDelete: (item: GalleryItem) => void;
    onUpdateCategory: (id: string, category: string) => void;
}

const CATEGORIES = ["Sanctuary", "Culinary", "Lifestyle", "Adventure"];

const SortableItem = ({ item, onDelete, onUpdateCategory }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="gallery-item-premium group"
        >
            <img src={item.url} alt="Gallery item" className="gallery-img-premium" />

            {/* Category Indicator Badge */}
            <div className="absolute top-4 left-4 z-20">
                <select 
                    value={item.category || "Sanctuary"}
                    onChange={(e) => onUpdateCategory(item.id, e.target.value)}
                    className="bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-sage px-2 py-1 rounded-md border-none outline-none cursor-pointer hover:bg-white transition-colors"
                >
                    {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Drag Handle Overlay */}
            <div className="gallery-drag-handle" {...attributes} {...listeners}>
                <Move size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Action Overlay */}
            <div className="gallery-overlay-premium">
                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: "#BD5D38" }}
                    className="btn-delete-premium"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                    }}
                >
                    <Trash2 size={20} />
                </motion.button>
            </div>
        </div>
    );
};

export const GallerySection = () => {
    const [stagedUploads, setStagedUploads] = useState<{ url: string; storagePath: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("Sanctuary");

    const [resetKey, setResetKey] = useState(0);

    const {
        items,
        loading,
        saving,
        handleDelete,
        handleBatchAdd,
        updateItemsOrder,
        updateItemCategory
    } = useGallery();

    const handleConfirmAdd = async () => {
        if (stagedUploads.length === 0) return;
        await handleBatchAdd(stagedUploads, selectedCategory);
        setStagedUploads([]); // Clear staging
        setResetKey(prev => prev + 1); // Reset the uploader UI
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);

            const newOrder = arrayMove(items, oldIndex, newIndex);
            updateItemsOrder(newOrder);
        }
    };

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
                        <Grid size={24} />
                    </div>
                    <h1 className="content-title">Gallery</h1>
                </div>
                <p className="content-subtitle">Curate the visual story of luxury and comfort at Bumi Anyom.</p>
            </header>

            <BentoGrid className="lg:grid-cols-4">
                <BentoCard className="lg:col-span-1">
                    <div className="sticky top-8">
                        <h3 className="text-lg font-bold text-rich-black mb-4 flex items-center gap-2">
                            <Plus className="text-sage" size={20} />
                            Add Photo
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Upload high-quality images to the gallery.</p>

                        <MultiImageUpload
                            key={resetKey}
                            basePath="gallery"
                            onUploadsComplete={(results) => {
                                setStagedUploads(results);
                            }}
                        />

                        <div className="mt-6 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Category</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedCategory === cat ? 'bg-sage text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <motion.button
                            whileHover={stagedUploads.length > 0 ? { scale: 1.02 } : {}}
                            whileTap={stagedUploads.length > 0 ? { scale: 0.98 } : {}}
                            disabled={stagedUploads.length === 0 || saving}
                            onClick={handleConfirmAdd}
                            className={`btn-primary w-full mt-6 py-4 flex flex-col items-center justify-center gap-1 ${stagedUploads.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                        >
                            <span className="font-bold">
                                {saving ? "Adding..." : stagedUploads.length > 0 ? `Add ${stagedUploads.length} Photo${stagedUploads.length > 1 ? 's' : ''}` : "Add to Gallery"}
                            </span>
                            {stagedUploads.length > 0 && !saving && (
                                <span className="text-[10px] opacity-60 font-black uppercase tracking-widest">Confirm to Publish</span>
                            )}
                        </motion.button>

                        {saving && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sage animate-pulse">
                                <Plus size={16} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Syncing with Gallery...</span>
                            </div>
                        )}
                    </div>
                </BentoCard>

                <BentoCard className="lg:col-span-3">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <SortableContext
                                items={items.map(i => i.id)}
                                strategy={rectSortingStrategy}
                            >
                                <AnimatePresence>
                                    {items.length === 0 ? (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-20 text-gray-400 col-span-full border-2 border-dashed border-gray-100 rounded-3xl"
                                        >
                                            "The gallery is waiting for its first masterpiece."
                                        </motion.p>
                                    ) : (
                                        items.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                            >
                                                <SortableItem 
                                                    item={item} 
                                                    onDelete={handleDelete} 
                                                    onUpdateCategory={updateItemCategory}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </SortableContext>
                        </div>
                    </DndContext>
                </BentoCard>
            </BentoGrid>
        </motion.div>
    );
};

