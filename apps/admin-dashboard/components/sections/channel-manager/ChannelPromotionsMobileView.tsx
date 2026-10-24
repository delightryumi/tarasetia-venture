"use client";

import React, { useEffect } from "react";
import { Tag, Plus, RefreshCw, Trash2, X, Sparkles } from "lucide-react";
import { OtaPromotionConfig } from "@/lib/channex/types";
import styles from "./ChannelPromotionsMobileView.module.css";

interface ChannelPromotionsMobileViewProps {
    promotions: OtaPromotionConfig[];
    loading: boolean;
    saving: boolean;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    title: string;
    setTitle: (val: string) => void;
    channelCode: "booking_com" | "airbnb" | "agoda" | "expedia";
    setChannelCode: (val: "booking_com" | "airbnb" | "agoda" | "expedia") => void;
    promoType: "mobile_only" | "high_rated_guest" | "last_minute" | "early_bird" | "los";
    setPromoType: (val: "mobile_only" | "high_rated_guest" | "last_minute" | "early_bird" | "los") => void;
    discountPercent: number;
    setDiscountPercent: (val: number) => void;
    startDate: string;
    setStartDate: (val: string) => void;
    endDate: string;
    setEndDate: (val: string) => void;
    minLos: number;
    setMinLos: (val: number) => void;
    onRefresh: () => void;
    onCreatePromotion: (e: React.FormEvent) => void;
    onDeletePromotion: (id: string, name: string) => void;
    getPromoTypeLabel: (type: string) => string;
    getChannelName: (code: string) => string;
}

export function ChannelPromotionsMobileView({
    promotions,
    loading,
    saving,
    isModalOpen,
    setIsModalOpen,
    title,
    setTitle,
    channelCode,
    setChannelCode,
    promoType,
    setPromoType,
    discountPercent,
    setDiscountPercent,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    minLos,
    setMinLos,
    onRefresh,
    onCreatePromotion,
    onDeletePromotion,
    getPromoTypeLabel,
    getChannelName
}: ChannelPromotionsMobileViewProps) {
    // Escape key listener for bottom sheet modal
    useEffect(() => {
        if (!isModalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen, setIsModalOpen]);

    return (
        <div className={styles.mobileContainer}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Tag size={15} color="#09090b" />
                        <span>Channel Promotions</span>
                    </div>
                    <span className={styles.desc}>
                        Manage targeted discounts on Booking.com, Airbnb, and Agoda.
                    </span>
                </div>

                <div className={styles.actionRow}>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={styles.btnPrimary}
                    >
                        <Plus size={14} />
                        <span>+ New Promotion</span>
                    </button>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className={styles.btnSecondary}
                        title="Refresh"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Card-Reflow Stream */}
            <div className={styles.cardStream}>
                {promotions.map(p => (
                    <div key={p.id} className={styles.promoCard}>
                        <div className={styles.cardTopRow}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <span className={styles.channelBadge}>{getChannelName(p.channelCode)}</span>
                                <span className={styles.cardTitle}>{p.title}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onDeletePromotion(p.id, p.title)}
                                className={styles.btnDeleteMobile}
                                title="Delete"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>

                        <div className={styles.cardMetaRow}>
                            <span className={styles.discountBadge}>{p.discountPercent}% OFF</span>
                            <span className={styles.promoTypeTag}>
                                {getPromoTypeLabel(p.promoType)}
                                {p.minLos ? ` (${p.minLos}N min)` : ""}
                            </span>
                        </div>

                        <div className={styles.cardFooterRow}>
                            <span className={styles.dateRange}>
                                {p.startDate} - {p.endDate}
                            </span>
                            {p.isActive ? (
                                <span className={styles.badgeActive}>ACTIVE</span>
                            ) : (
                                <span className={styles.badgeInactive}>INACTIVE</span>
                            )}
                        </div>
                    </div>
                ))}

                {promotions.length === 0 && (
                    <div className={styles.emptyState}>
                        <Sparkles size={22} color="#a1a1aa" />
                        <span>No promotions found. Tap "+ New Promotion" to publish.</span>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Sheet Modal */}
            {isModalOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={e => {
                        if (e.target === e.currentTarget) setIsModalOpen(false);
                    }}
                >
                    <div className={styles.bottomSheet} role="dialog" aria-modal="true">
                        <div className={styles.sheetHeader}>
                            <span className={styles.sheetTitle}>New Channel Promotion</span>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.sheetCloseBtn}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={onCreatePromotion}>
                            <div className={styles.sheetBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Promotion Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mobile Deal 10%"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Target Channel</label>
                                    <select
                                        value={channelCode}
                                        onChange={e => setChannelCode(e.target.value as any)}
                                        className={styles.select}
                                    >
                                        <option value="booking_com">Booking.com</option>
                                        <option value="airbnb">Airbnb</option>
                                        <option value="agoda">Agoda</option>
                                        <option value="expedia">Expedia</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Discount Percentage (%)</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={50}
                                        value={discountPercent}
                                        onChange={e => setDiscountPercent(Number(e.target.value) || 0)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Program Type</label>
                                    <select
                                        value={promoType}
                                        onChange={e => setPromoType(e.target.value as any)}
                                        className={styles.select}
                                    >
                                        <option value="mobile_only">Mobile Rate (Smartphone Deal)</option>
                                        <option value="high_rated_guest">High-Rated Guest / Genius</option>
                                        <option value="last_minute">Last-Minute Deal</option>
                                        <option value="early_bird">Early Bird Advance Purchase</option>
                                        <option value="los">Minimum Length of Stay (LOS)</option>
                                    </select>
                                </div>

                                {promoType === "los" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Min Nights (Min LOS)</label>
                                        <input
                                            type="number"
                                            min={2}
                                            max={30}
                                            value={minLos}
                                            onChange={e => setMinLos(Number(e.target.value) || 2)}
                                            className={styles.input}
                                        />
                                    </div>
                                )}

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            <div className={styles.sheetFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.btnSecondary}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={styles.btnPrimary}
                                    style={{ flex: 2 }}
                                >
                                    {saving ? "Publishing..." : "Publish to OTA"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
