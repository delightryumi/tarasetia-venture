"use client";

import React, { useEffect } from "react";
import { Tag, Plus, RefreshCw, Trash2, X, Sparkles, AlertCircle } from "lucide-react";
import { OtaPromotionConfig } from "@/lib/channex/types";
import styles from "./ChannelPromotionsDesktopView.module.css";

interface ChannelPromotionsDesktopViewProps {
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

export function ChannelPromotionsDesktopView({
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
}: ChannelPromotionsDesktopViewProps) {
    // Escape key listener for executive modal
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
        <div className={styles.desktopContainer}>
            {/* Executive Toolbar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Tag size={16} color="#09090b" />
                        <span>OTA Channel Promotion Engine</span>
                    </div>
                    <span className={styles.desc}>
                        Centrally configure and publish targeted promotional discounts across connected OTA extranets.
                    </span>
                </div>

                <div className={styles.actionsGroup}>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className={styles.btnSecondary}
                        title="Refresh promotions list"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className={styles.btnPrimary}
                    >
                        <Plus size={14} />
                        <span>Create Promotion</span>
                    </button>
                </div>
            </div>

            {/* High-density Data Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Promotion Campaign</th>
                            <th className={styles.th}>Target Channel</th>
                            <th className={styles.th}>Program Type</th>
                            <th className={styles.th}>Discount Value</th>
                            <th className={styles.th}>Stay Validity</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map(p => (
                            <tr key={p.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <div className={styles.campaignCell}>
                                        <span className={styles.campaignTitle}>{p.title}</span>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span className={styles.channelBadge}>{getChannelName(p.channelCode)}</span>
                                </td>
                                <td className={styles.td}>
                                    <span>
                                        {getPromoTypeLabel(p.promoType)}
                                        {p.minLos ? ` (Min. ${p.minLos} Nts)` : ""}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    <span className={styles.discountValue}>{p.discountPercent}% OFF</span>
                                </td>
                                <td className={styles.td}>
                                    <span className={styles.dateRange}>
                                        {p.startDate} to {p.endDate}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    {p.isActive ? (
                                        <span className={styles.badgeActive}>ACTIVE ON OTA</span>
                                    ) : (
                                        <span className={styles.badgeInactive}>INACTIVE</span>
                                    )}
                                </td>
                                <td className={styles.td} style={{ textAlign: "right" }}>
                                    <button
                                        type="button"
                                        onClick={() => onDeletePromotion(p.id, p.title)}
                                        className={styles.btnDelete}
                                        title="Delete promotion"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {promotions.length === 0 && (
                            <tr>
                                <td colSpan={7}>
                                    <div className={styles.emptyState}>
                                        <Sparkles size={24} className={styles.emptyIcon} />
                                        <span>No active OTA channel promotions configured.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Standardized Executive Modal Dialog */}
            {isModalOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={e => {
                        if (e.target === e.currentTarget) setIsModalOpen(false);
                    }}
                >
                    <div className={styles.modalCard} role="dialog" aria-modal="true">
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>
                                <Tag size={15} />
                                <span>Create Channel Promotion Campaign</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                                aria-label="Close dialog"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={onCreatePromotion}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Promotion Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mobile Booking Deal 10%"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGrid}>
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
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Program Type</label>
                                    <select
                                        value={promoType}
                                        onChange={e => setPromoType(e.target.value as any)}
                                        className={styles.select}
                                    >
                                        <option value="mobile_only">Mobile Rate (Smartphone Exclusive Discount)</option>
                                        <option value="high_rated_guest">High-Rated Guest / Genius Program Discount</option>
                                        <option value="last_minute">Last-Minute Booking Discount</option>
                                        <option value="early_bird">Early Bird Advance Purchase Discount</option>
                                        <option value="los">Minimum Length of Stay (LOS) Deal</option>
                                    </select>
                                </div>

                                {promoType === "los" && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Minimum Nights Stay (Min LOS)</label>
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

                                <div className={styles.formGrid}>
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
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.btnSecondary}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={styles.btnPrimary}
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
