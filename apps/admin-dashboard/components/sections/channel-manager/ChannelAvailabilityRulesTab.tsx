"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    ChannelAvailabilityRulesDesktopView,
    type AvailabilityRule
} from "./ChannelAvailabilityRulesDesktopView";
import { ChannelAvailabilityRulesMobileView } from "./ChannelAvailabilityRulesMobileView";
import styles from "./ChannelAvailabilityRules.module.css";

interface Props {
    hotelCode: string;
    roomTypes?: Array<{ id: string; name: string }>;
}

export function ChannelAvailabilityRulesTab({ hotelCode, roomTypes = [] }: Props) {
    const [rules, setRules] = useState<AvailabilityRule[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchRules = async () => {
        if (!hotelCode) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/channex/rules?hotelCode=${hotelCode}`);
            const data = await res.json();
            if (data.success && data.rules) {
                setRules(data.rules);
            }
        } catch (err: any) {
            console.error("Error fetching rules:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [hotelCode]);

    const handleCreateRule = async (payload: any): Promise<boolean> => {
        try {
            const res = await fetch("/api/channex/rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode,
                    rule: payload
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || "Aturan allotment saluran berhasil dibuat.");
                fetchRules();
                return true;
            } else {
                toast.error(data.error || "Gagal membuat aturan allotment saluran.");
                return false;
            }
        } catch (err) {
            toast.error("Gangguan komunikasi jaringan.");
            return false;
        }
    };

    const handleDeleteRule = async (ruleId: string, ruleTitle: string) => {
        if (!confirm(`Hapus aturan allotment '${ruleTitle}'?`)) return;

        try {
            const res = await fetch(`/api/channex/rules?hotelCode=${hotelCode}&ruleId=${ruleId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Aturan berhasil dihapus.");
                setRules(prev => prev.filter(r => r.id !== ruleId));
            } else {
                toast.error(data.error || "Gagal menghapus aturan.");
            }
        } catch (err) {
            toast.error("Gagal menghapus aturan allotment.");
        }
    };

    const sharedProps = {
        hotelCode,
        rules,
        loading,
        onRefresh: fetchRules,
        onDeleteRule: handleDeleteRule,
        onCreateRule: handleCreateRule
    };

    return (
        <div className={styles.container}>
            {/* Desktop View: High-density Table */}
            <div className={styles.desktopOnly}>
                <ChannelAvailabilityRulesDesktopView {...sharedProps} />
            </div>

            {/* Mobile View: Card-Reflow with Touch Controls */}
            <div className={styles.mobileOnly}>
                <ChannelAvailabilityRulesMobileView {...sharedProps} />
            </div>
        </div>
    );
}
