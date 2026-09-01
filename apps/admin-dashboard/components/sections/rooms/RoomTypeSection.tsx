"use client";

import React, { useState } from "react";
import { useRoomTypes } from "./useRoomTypes";
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
    ChevronLeft,
    Sparkles,
    Star,
    ExternalLink,
    Hash,
    BedDouble,
    Users,
    Maximize2,
    Package
} from "lucide-react";
import styles from "./RoomTypeSection.module.css";

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
        newPhysicalRooms,
        addPhysicalRoom,
        removePhysicalRoom,
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
    
    // Local state for room number tag input
    const [roomInput, setRoomInput] = useState("");

    // Local state for bed builder
    const [selectedBedType, setSelectedBedType] = useState(BED_TYPES[0].label);
    const [bedQty, setBedQty] = useState(1);
    const [customBedSize, setCustomBedSize] = useState("");

    const addBed = () => {
        const bedInfo = BED_TYPES.find(b => b.label === selectedBedType);
        if (!bedInfo) return;
        
        const sizeToUse = selectedBedType === "Custom" ? customBedSize : bedInfo.size;
        
        setNewBeds([...newBeds, { 
            type: selectedBedType, 
            quantity: bedQty, 
            size: sizeToUse 
        }]);
        
        setBedQty(1);
        setCustomBedSize("");
    };

    const removeBed = (index: number) => {
        setNewBeds(newBeds.filter((_, i) => i !== index));
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
            <div style={{ width: 32, height: 32, border: "2px solid #e5e5ea", borderTopColor: "#111113", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
    );

    const renderListView = () => (
        <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.container}
        >
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <span className={styles.headerTag}>
                        Store & Inventory
                    </span>
                    <h1 className={styles.headerTitle}>
                        Room Categories
                    </h1>
                    <p className={styles.headerSubtitle}>
                        Kelola master tipe kamar, nomor kamar fisik, kapasitas tamu, dan kurasi fasilitas.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={() => setView('stepper')}
                        className={styles.btnPrimary}
                    >
                        <Plus size={15} strokeWidth={2.5} />
                        <span>Tambah Kategori</span>
                    </button>
                </div>
            </div>

            {/* Catalog Grid */}
            {roomTypes.length > 0 ? (
                <div className={styles.grid}>
                    <AnimatePresence mode="popLayout">
                        {roomTypes.map((type) => {
                            const profileImg = type.images?.find(img => img.isProfile)?.url || type.images?.[0]?.url;
                            return (
                                <motion.div 
                                    key={type.id} 
                                    whileHover={{ y: -3 }}
                                    className={styles.card}
                                >
                                    <div>
                                        {/* Image Section */}
                                        <div className={styles.cardImageWrapper}>
                                            {profileImg ? (
                                                <img 
                                                    src={profileImg} 
                                                    alt={type.name} 
                                                    className={styles.cardImage} 
                                                />
                                            ) : (
                                                <div className={styles.cardImagePlaceholder}>
                                                    <Package size={36} strokeWidth={1} />
                                                </div>
                                            )}
                                            <div className={styles.cardUnitBadge}>
                                                {type.roomCount || 0} Unit
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className={styles.cardContent}>
                                            <div>
                                                <div className={styles.cardMeta}>
                                                    <span className={styles.cardCategory}>
                                                        Sanctuary
                                                    </span>
                                                    {type.bookingUrl && (
                                                        <a 
                                                            href={type.bookingUrl} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className={styles.cardBookingLink} 
                                                            title="Buka Booking Gateway"
                                                        >
                                                            <ExternalLink size={13} />
                                                        </a>
                                                    )}
                                                </div>
                                                <h3 className={styles.cardTitle}>
                                                    {type.name}
                                                </h3>
                                                <p className={styles.cardDescription}>
                                                    {type.description || "Belum ada deskripsi untuk kategori kamar ini."}
                                                </p>
                                            </div>

                                            {/* Specs Bar */}
                                            <div className={styles.cardSpecs}>
                                                <div className={styles.specItem}>
                                                    <Users size={13} color="#8e8e93" />
                                                    <span>{type.capacity || 2} Tamu</span>
                                                </div>
                                                <span className={styles.specDot}>•</span>
                                                <div className={styles.specItem}>
                                                    <Maximize2 size={13} color="#8e8e93" />
                                                    <span>{type.roomSizeValue ? `${type.roomSizeValue} ${type.roomSizeUnit || 'm²'}` : '32 m²'}</span>
                                                </div>
                                                <span className={styles.specDot}>•</span>
                                                <div className={styles.specItem}>
                                                    <BedDouble size={13} color="#8e8e93" />
                                                    <span>{type.beds?.length || 1} Bed</span>
                                                </div>
                                            </div>

                                            {/* Physical Room Numbers Box */}
                                            <div className={styles.roomNumbersBox}>
                                                <div className={styles.roomNumbersHeader}>
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <Hash size={12} color="#111113" /> No. Kamar Terdaftar
                                                    </span>
                                                    <span className={styles.roomNumbersCount}>
                                                        {type.physicalRooms?.length || 0} Unit
                                                    </span>
                                                </div>
                                                <div className={styles.roomChipsList}>
                                                    {type.physicalRooms && type.physicalRooms.length > 0 ? (
                                                        <>
                                                            {type.physicalRooms.slice(0, 8).map((r: any, idx: number) => {
                                                                const num = typeof r === 'string' ? r : r.number || r.name;
                                                                return (
                                                                    <span key={idx} className={styles.roomChip}>
                                                                        {num}
                                                                    </span>
                                                                );
                                                            })}
                                                            {type.physicalRooms.length > 8 && (
                                                                <span className={styles.roomChipMore}>
                                                                    +{type.physicalRooms.length - 8} lainnya
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className={styles.roomEmptyNotice}>
                                                            Belum ada nomor kamar spesifik
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Amenities */}
                                            <div className={styles.amenitiesList}>
                                                {type.amenities?.slice(0, 3).map(aId => {
                                                    const amenity = AMENITIES.find(a => a.id === aId);
                                                    return amenity ? (
                                                        <div key={aId} className={styles.amenityChip}>
                                                            <amenity.icon size={12} color="#8e8e93" />
                                                            <span>{amenity.label}</span>
                                                        </div>
                                                    ) : null;
                                                })}
                                                {type.amenities && type.amenities.length > 3 && (
                                                    <span className={styles.amenityMore}>
                                                        +{type.amenities.length - 3} lainnya
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className={styles.cardFooter}>
                                        <button
                                            onClick={() => startEditing(type)}
                                            className={styles.btnEdit}
                                        >
                                            Edit Kategori
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type.id)}
                                            className={styles.btnDelete}
                                            title="Hapus kategori"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                /* Empty State */
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Home size={26} strokeWidth={1.5} />
                    </div>
                    <h3 className={styles.emptyTitle}>Belum Ada Kategori Kamar</h3>
                    <p className={styles.emptyDescription}>
                        Buat kategori kamar pertama properti Anda untuk mulai mengatur inventaris dan nomor kamar fisik.
                    </p>
                    <button
                        onClick={() => setView('stepper')}
                        className={styles.btnPrimary}
                    >
                        <Plus size={15} />
                        <span>Tambah Kategori Pertama</span>
                    </button>
                </div>
            )}
        </motion.div>
    );

    const renderStepperView = () => (
        <motion.div
            key="stepper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.container}
            style={{ maxWidth: 960 }}
        >
            <button
                onClick={cancelEditing}
                className={styles.btnBack}
            >
                <ChevronLeft size={15} />
                <span>Kembali ke Katalog</span>
            </button>

            {/* Stepper Navigation Strip */}
            <div className={styles.stepperNav}>
                <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)}
                    className={`${styles.stepBtn} ${currentStep >= 1 ? styles.stepBtnActive : ''} ${currentStep > 1 ? styles.stepBtnCompleted : ''}`}
                >
                    <span className={`${styles.stepNum} ${currentStep === 1 ? styles.stepNumActive : ''} ${currentStep > 1 ? styles.stepNumCompleted : ''}`}>
                        {currentStep > 1 ? <Check size={11} strokeWidth={3} /> : "1"}
                    </span>
                    <span>Essentials</span>
                </button>
                <button 
                    type="button" 
                    onClick={() => newName && setCurrentStep(2)}
                    className={`${styles.stepBtn} ${currentStep >= 2 ? styles.stepBtnActive : ''} ${currentStep > 2 ? styles.stepBtnCompleted : ''}`}
                    disabled={!newName}
                >
                    <span className={`${styles.stepNum} ${currentStep === 2 ? styles.stepNumActive : ''} ${currentStep > 2 ? styles.stepNumCompleted : ''}`}>
                        {currentStep > 2 ? <Check size={11} strokeWidth={3} /> : "2"}
                    </span>
                    <span>Atmosphere</span>
                </button>
                <button 
                    type="button" 
                    onClick={() => newName && setCurrentStep(3)}
                    className={`${styles.stepBtn} ${currentStep >= 3 ? styles.stepBtnActive : ''}`}
                    disabled={!newName}
                >
                    <span className={`${styles.stepNum} ${currentStep === 3 ? styles.stepNumActive : ''}`}>
                        3
                    </span>
                    <span>Amenities</span>
                </button>
            </div>

            {/* Builder Card */}
            <div className={styles.builderCard}>
                <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            <div className={styles.builderHeader}>
                                <h2 className={styles.builderTitle}>Category Essentials</h2>
                                <p className={styles.builderSubtitle}>
                                    Definisikan nama kategori, nomor kamar fisik, kapasitas tamu, dan ukuran kamar.
                                </p>
                            </div>

                            <div className={styles.formGrid}>
                                {/* Category Title */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Nama Kategori Kamar</label>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Contoh: Deluxe King Suite"
                                        style={{ fontWeight: 600 }}
                                    />
                                </div>

                                {/* Booking Gateway URL */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Booking Gateway URL (Opsional)</label>
                                    <input
                                        type="url"
                                        className={styles.formInput}
                                        value={newBookingUrl}
                                        onChange={(e) => setNewBookingUrl(e.target.value)}
                                        placeholder="https://booking.com/..."
                                    />
                                </div>

                                {/* Room Capacity */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Kapasitas Tamu (Capacity)</label>
                                    <div className={styles.formRowFlex}>
                                        <input
                                            type="number"
                                            min="1"
                                            className={styles.formInput}
                                            value={newCapacity}
                                            onChange={(e) => setNewCapacity(parseInt(e.target.value) || 1)}
                                            style={{ width: 100, textAlign: "center", fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: 13, color: "#6c6c70" }}>Dewasa / Tamu</span>
                                    </div>
                                </div>

                                {/* Room Dimensions */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Ukuran Kamar (Dimensions)</label>
                                    <div className={styles.formRowFlex}>
                                        <input
                                            type="number"
                                            className={styles.formInput}
                                            value={newRoomSizeValue}
                                            onChange={(e) => setNewRoomSizeValue(parseFloat(e.target.value) || 0)}
                                            placeholder="Luas"
                                            style={{ flex: 1 }}
                                        />
                                        <select 
                                            className={styles.formSelect}
                                            value={newRoomSizeUnit}
                                            onChange={(e) => setNewRoomSizeUnit(e.target.value)}
                                        >
                                            {ROOM_SIZE_UNITS.map(unit => (
                                                <option key={unit.value} value={unit.value}>{unit.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Room Inventory (Available Units) */}
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Total Unit Kamar (Allotment)</label>
                                    <div className={styles.formRowFlex}>
                                        <input
                                            type="number"
                                            min="1"
                                            className={styles.formInput}
                                            value={newRoomCount}
                                            onChange={(e) => setNewRoomCount(parseInt(e.target.value) || 1)}
                                            style={{ width: 100, textAlign: "center", fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: 13, color: "#6c6c70" }}>Total unit kamar fisik yang dialokasikan</span>
                                    </div>
                                </div>

                                {/* Physical Room Numbers Planner */}
                                <div className={styles.formGroupFull}>
                                    <div className={styles.subPanel}>
                                        <div className={styles.subPanelHeader}>
                                            <div>
                                                <div className={styles.subPanelTitle}>
                                                    <Hash size={14} color="#0071e3" /> Nomor Kamar Fisik (Room Numbers)
                                                </div>
                                                <p className={styles.subPanelSubtitle}>
                                                    Daftar nomor kamar spesifik. Terintegrasi langsung dengan Add Reservation, GRC, dan Kalender Kamar.
                                                </p>
                                            </div>
                                            <span className={styles.subPanelBadge}>
                                                {newPhysicalRooms.length} Kamar Terdaftar
                                            </span>
                                        </div>

                                        <div className={styles.inputButtonRow}>
                                            <input
                                                type="text"
                                                className={styles.formInput}
                                                value={roomInput}
                                                onChange={(e) => setRoomInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        if (roomInput.trim()) {
                                                            addPhysicalRoom(roomInput);
                                                            setRoomInput("");
                                                        }
                                                    }
                                                }}
                                                placeholder="Ketik: 101, 102 atau rentang 101-108 (Tekan Enter)"
                                                style={{ backgroundColor: "#ffffff", fontFamily: "monospace" }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (roomInput.trim()) {
                                                        addPhysicalRoom(roomInput);
                                                        setRoomInput("");
                                                    }
                                                }}
                                                className={styles.btnPrimary}
                                                style={{ flexShrink: 0 }}
                                            >
                                                <Plus size={14} />
                                                <span>Tambah</span>
                                            </button>
                                        </div>

                                        {/* Chips list */}
                                        <div className={styles.chipsContainer}>
                                            <AnimatePresence mode="popLayout">
                                                {newPhysicalRooms.map((r, idx) => (
                                                    <motion.div
                                                        key={r.id || idx}
                                                        initial={{ opacity: 0, scale: 0.85 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.85 }}
                                                        className={styles.tagChip}
                                                    >
                                                        <span>{r.number}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhysicalRoom(idx)}
                                                            className={styles.tagChipDelete}
                                                            title="Hapus nomor kamar"
                                                        >
                                                            &times;
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {newPhysicalRooms.length === 0 && (
                                                <span style={{ fontSize: 12, color: "#8e8e93", fontStyle: "italic" }}>
                                                    Belum ada nomor kamar spesifik. Masukkan nomor kamar di atas (misal: 101-105 atau 101, 102).
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Bed Configuration */}
                                <div className={styles.formGroupFull}>
                                    <div className={styles.subPanel}>
                                        <div className={styles.subPanelTitle}>
                                            <BedDouble size={14} color="#0071e3" /> Konfigurasi Tempat Tidur (Bed Planner)
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, alignItems: "flex-end" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93" }}>Tipe Bed</span>
                                                <select
                                                    className={styles.formSelect}
                                                    value={selectedBedType}
                                                    onChange={(e) => setSelectedBedType(e.target.value)}
                                                    style={{ backgroundColor: "#ffffff" }}
                                                >
                                                    {BED_TYPES.map(bed => (
                                                        <option key={bed.label} value={bed.label}>{bed.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 100 }}>
                                                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93" }}>Jumlah</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className={styles.formInput}
                                                    value={bedQty}
                                                    onChange={(e) => setBedQty(parseInt(e.target.value) || 1)}
                                                    style={{ backgroundColor: "#ffffff", textAlign: "center", fontWeight: 700 }}
                                                />
                                            </div>
                                            {selectedBedType === "Custom" && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "#8e8e93" }}>Ukuran (PxL)</span>
                                                    <input
                                                        type="text"
                                                        className={styles.formInput}
                                                        value={customBedSize}
                                                        onChange={(e) => setCustomBedSize(e.target.value)}
                                                        placeholder="200 x 200"
                                                        style={{ backgroundColor: "#ffffff" }}
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={addBed}
                                                    className={styles.btnPrimary}
                                                    style={{ width: "100%", height: 44 }}
                                                >
                                                    <Plus size={14} />
                                                    <span>Tambah Bed</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Configured beds list */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                                            <AnimatePresence mode="popLayout">
                                                {newBeds.map((bed, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className={styles.bedConfigRow}
                                                    >
                                                        <div className={styles.bedConfigInfo}>
                                                            <div className={styles.bedConfigIcon}>
                                                                <Star size={16} strokeWidth={2} />
                                                            </div>
                                                            <div>
                                                                <h4 className={styles.bedConfigName}>{bed.quantity}x {bed.type}</h4>
                                                                <p className={styles.bedConfigSize}>{bed.size || "Standard Size"}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBed(idx)}
                                                            className={styles.btnDelete}
                                                            title="Hapus bed"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                            {newBeds.length === 0 && (
                                                <div style={{ padding: "16px 0", textAlign: "center", border: "1px dashed #dcdce0", borderRadius: 8 }}>
                                                    <span style={{ fontSize: 12, color: "#8e8e93", fontStyle: "italic" }}>
                                                        Belum ada tempat tidur yang dikonfigurasi.
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className={styles.formGroupFull}>
                                    <label className={styles.formLabel}>Deskripsi Kamar (Narrative Description)</label>
                                    <textarea
                                        className={styles.formTextarea}
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Tuliskan deskripsi lengkap dan keunikan kamar..."
                                    />
                                </div>
                            </div>

                            <div className={styles.stepperFooter}>
                                <div />
                                <button
                                    onClick={() => newName && setCurrentStep(2)}
                                    className={styles.btnPrimary}
                                    disabled={!newName}
                                >
                                    <span>Lanjut: Foto & Atmosfer</span>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            <div className={styles.builderHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <h2 className={styles.builderTitle}>Foto & Atmosfer Kamar</h2>
                                    <p className={styles.builderSubtitle}>Unggah foto representatif untuk kategori kamar ini.</p>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#111113", padding: "4px 10px", backgroundColor: "#f7f7f9", borderRadius: 6 }}>
                                    {newImages.length} / 10 Foto Terunggah
                                </span>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <MultiImageUpload
                                    basePath={`rooms`}
                                    onUploadsComplete={(results) => {
                                        const newUrls = results.map(r => ({ url: r.url, isProfile: false }));

                                        setNewImages(prev => {
                                            const combined = [...prev, ...newUrls];
                                            if (combined.length > 0 && !combined.some(img => img.isProfile)) {
                                                combined[0].isProfile = true;
                                            }
                                            return combined.slice(0, 10);
                                        });
                                    }}
                                />
                            </div>

                            <div className={styles.galleryGrid}>
                                {newImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`${styles.galleryTile} ${img.isProfile ? styles.galleryTileMain : ''}`}
                                    >
                                        <img src={img.url} alt="Room atmosphere" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                                        {img.isProfile && (
                                            <div className={styles.galleryMainBadge}>
                                                Foto Utama
                                            </div>
                                        )}

                                        <div className={styles.galleryOverlay}>
                                            <button
                                                onClick={() => toggleProfile(idx)}
                                                className={`${styles.galleryBtn} ${img.isProfile ? styles.galleryBtnActive : ''}`}
                                                title="Jadikan Foto Utama"
                                            >
                                                <Sparkles size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className={styles.galleryBtn}
                                                title="Hapus Foto"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.stepperFooter}>
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className={styles.btnSecondary}
                                >
                                    <ChevronLeft size={15} />
                                    <span>Kembali ke Essentials</span>
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className={styles.btnPrimary}
                                >
                                    <span>Lanjut: Fasilitas & Amenities</span>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                        >
                            <div className={styles.builderHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div>
                                    <h2 className={styles.builderTitle}>Fasilitas Kamar (Amenities)</h2>
                                    <p className={styles.builderSubtitle}>Pilih fasilitas yang tersedia untuk kategori kamar ini.</p>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#111113", padding: "4px 10px", backgroundColor: "#f7f7f9", borderRadius: 6 }}>
                                    {newAmenities.length} Fasilitas Terpilih
                                </span>
                            </div>

                            <div className={styles.amenityGrid}>
                                {AMENITIES.map((amenity) => {
                                    const isSelected = newAmenities.includes(amenity.id);
                                    return (
                                        <div
                                            key={amenity.id}
                                            onClick={() => toggleAmenity(amenity.id)}
                                            className={`${styles.amenityCard} ${isSelected ? styles.amenityCardSelected : ''}`}
                                        >
                                            <div className={styles.amenityCardIcon}>
                                                <amenity.icon size={18} strokeWidth={1.5} />
                                            </div>
                                            <div className={styles.amenityCardLabel}>
                                                {amenity.label}
                                            </div>
                                            <div className={styles.amenityCheckbox}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.stepperFooter}>
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className={styles.btnSecondary}
                                >
                                    <ChevronLeft size={15} />
                                    <span>Kembali ke Foto</span>
                                </button>
                                <button
                                    onClick={editingRoom ? handleUpdate : handleAdd}
                                    disabled={saving}
                                    className={styles.btnPrimary}
                                    style={{ minWidth: 160 }}
                                >
                                    {saving ? (
                                        <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    ) : (
                                        editingRoom ? "Simpan Perubahan" : "Simpan Kategori"
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
        <div style={{ minHeight: "100vh", backgroundColor: "transparent" }}>
            <AnimatePresence mode="wait">
                {view === 'list' ? renderListView() : renderStepperView()}
            </AnimatePresence>
        </div>
    );
};
