"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { OtaPromotionConfig } from "@/lib/channex/types";
import { ChannelPromotionsDesktopView } from "./ChannelPromotionsDesktopView";
import { ChannelPromotionsMobileView } from "./ChannelPromotionsMobileView";
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
            case "mobile_only": return "Mobile Rate (Smartphone)";
            case "high_rated_guest": return "Loyalty & Genius Discount";
            case "last_minute": return "Last-Minute Booking";
            case "early_bird": return "Early Bird Advance Purchase";
            case "los": return "Extended Stay (Min LOS)";
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

    const sharedProps = {
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
        onRefresh: fetchPromotions,
        onCreatePromotion: handleCreatePromotion,
        onDeletePromotion: handleDeletePromotion,
        getPromoTypeLabel,
        getChannelName
    };

    return (
        <div className={styles.container}>
            <div className={styles.desktopOnly}>
                <ChannelPromotionsDesktopView {...sharedProps} />
            </div>
            <div className={styles.mobileOnly}>
                <ChannelPromotionsMobileView {...sharedProps} />
            </div>
        </div>
    );
}
