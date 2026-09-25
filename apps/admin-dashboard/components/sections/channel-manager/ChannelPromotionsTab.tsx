"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Plus, Trash2, Tag, Calendar, Percent, CheckCircle2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { OtaPromotionConfig } from "@/lib/channex/types";
import styles from "./ChannelPromotions.module.css";

interface Props {
    hotelCode: string;
}

export function ChannelPromotionsTab({ hotelCode }: Props) {
    const [promotions, setPromotions] = useState<OtaPromotionConfig[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    // Form states
    const [title, setTitle] = useState<string>("");
    const [channelCode, setChannelCode] = useState<"booking_com" | "airbnb" | "agoda" | "expedia">("booking_com");
    const [promoType, setPromoType] = useState<"mobile_only" | "high_rated_guest" | "last_minute" | "early_bird" | "los">("mobile_only");
    const [discountPercent, setDiscountPercent] = useState<number>(10);
    const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 60);
        return d.toISOString().split("T")[0];
    });
    const [minLos, setMinLos] = useState<number>(1);

    const fetchPromotions = async () => {
        if (!hotelCode) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/channex/promotions?hotelCode=${hotelCode}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.promotions)) {
                setPromotions(data.promotions);
            }
        } catch (err: any) {
            console.error("Error fetching promotions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, [hotelCode]);

    const handleCreatePromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Nama promosi wajib diisi.");
            return;
        }

        setSaving(true);
        try {
            const newPromo: OtaPromotionConfig = {
                id: `promo_${Date.now()}`,
                title: title.trim(),
                channelCode,
                promoType,
                discountPercent: Number(discountPercent) || 10,
                startDate,
                endDate,
                isActive: true,
                applicableRoomTypeIds: ["all"],
                minLos: promoType === "los" ? Number(minLos) : undefined
            };

            const res = await fetch("/api/channex/promotions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    promotion: newPromo
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Promotion created successfully.");
                setIsModalOpen(false);
                setTitle("");
                fetchPromotions();
            } else {
                toast.error(data.error || "Failed to create channel promotion.");
            }
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePromotion = async (id: string, name: string) => {
        if (!confirm(`Delete promotion '${name}'? This will revoke the discount on connected OTA extranets.`)) return;

        try {
            const res = await fetch(`/api/channex/promotions?hotelCode=${hotelCode}&promoId=${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Promotion deleted successfully.");
                setPromotions(prev => prev.filter(p => p.id !== id));
            } else {
                toast.error(data.error || "Failed to delete promotion.");
            }
        } catch (err: any) {
            toast.error("Failed to delete channel promotion.");
        }
    };

    const getPromoTypeLabel = (type: string) => {
        switch (type) {
            case "mobile_only": return "Mobile Rate (Smartphone Exclusive Discount)";
            case "high_rated_guest": return "Loyalty & Genius Program Discount";
            case "last_minute": return "Last-Minute Booking Discount";
            case "early_bird": return "Early Bird Advance Purchase Discount";
            case "los": return "Extended Stay Discount (Minimum LOS)";
            default: return type;
        }
    };

    const getChannelName = (code: string) => {
        switch (code) {
            case "booking_com": return "Booking.com";
            case "airbnb": return "Airbnb";
            case "agoda": return "Agoda";
            case "expedia": return "Expedia";
            default: return code;
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.titleGroup}>
                    <div className={styles.title}>
                        <Tag size={18} color="#1e3a2f" />
                        <span>OTA Channel Promotion Engine</span>
                    </div>
                    <span className={styles.desc}>
                        Centrally configure and publish promotional campaigns and targeted discounts across connected OTA extranets without separate portal logins.
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={fetchPromotions}
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
                        <span>+ Create Channel Promotion</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Promotion Campaign</th>
                            <th className={styles.th}>Target Channel</th>
                            <th className={styles.th}>Promotion Program Type</th>
                            <th className={styles.th}>Discount Value</th>
                            <th className={styles.th}>Stay Validity Period</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map(p => (
                            <tr key={p.id} className={styles.tr}>
                                <td className={styles.td} style={{ fontWeight: 700, color: "#0f172a" }}>
                                    {p.title}
                                </td>
                                <td className={styles.td}>
                                    <span style={{ fontWeight: 600 }}>{getChannelName(p.channelCode)}</span>
                                </td>
                                <td className={styles.td}>
                                    {getPromoTypeLabel(p.promoType)}
                                    {p.minLos ? ` (Min. ${p.minLos} Nights)` : ""}
                                </td>
                                <td className={styles.td}>
                                    <span style={{ fontWeight: 800, color: "#16a34a", fontSize: "13px" }}>
                                        {p.discountPercent}%
                                    </span>
                                </td>
                                <td className={styles.td} style={{ fontSize: "11px", color: "#64748b" }}>
                                    {p.startDate} to {p.endDate}
                                </td>
                                <td className={styles.td}>
                                    {p.isActive ? (
                                        <span className={styles.badgeActive}>● ACTIVE ON OTA</span>
                                    ) : (
                                        <span className={styles.badgeInactive}>○ INACTIVE</span>
                                    )}
                                </td>
                                <td className={styles.td} style={{ textAlign: "right" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleDeletePromotion(p.id, p.title)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                                        title="Delete promotion"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {promotions.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                                    No active OTA promotions found. Create a promotion to boost visibility and conversions on Booking.com, Agoda, and Airbnb.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Create Promotion */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Create Channel Promotion Campaign</span>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePromotion}>
                            <div className={styles.modalBody}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                        Promotion Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Mobile Booking Deal 10%"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                            Target Channel
                                        </label>
                                        <select
                                            value={channelCode}
                                            onChange={e => setChannelCode(e.target.value as any)}
                                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                        >
                                            <option value="booking_com">Booking.com</option>
                                            <option value="airbnb">Airbnb</option>
                                            <option value="agoda">Agoda</option>
                                            <option value="expedia">Expedia</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                            Discount Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            min={5}
                                            max={50}
                                            value={discountPercent}
                                            onChange={e => setDiscountPercent(Number(e.target.value) || 0)}
                                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                        Promotion Program Type
                                    </label>
                                    <select
                                        value={promoType}
                                        onChange={e => setPromoType(e.target.value as any)}
                                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                    >
                                        <option value="mobile_only">Mobile Rate (Smartphone Exclusive Discount)</option>
                                        <option value="high_rated_guest">High-Rated Guest / Genius Program Discount</option>
                                        <option value="last_minute">Last-Minute Booking Discount</option>
                                        <option value="early_bird">Early Bird Advance Purchase Discount</option>
                                        <option value="los">Minimum Length of Stay (LOS) Deal</option>
                                    </select>
                                </div>

                                {promoType === "los" && (
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                            Minimum Nights Stay (Min LOS)
                                        </label>
                                        <input
                                            type="number"
                                            min={2}
                                            max={30}
                                            value={minLos}
                                            onChange={e => setMinLos(Number(e.target.value) || 2)}
                                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                        />
                                    </div>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "12px" }}
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
                                    {saving ? "Publishing..." : "Publish Promotion to OTA"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
