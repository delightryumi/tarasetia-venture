"use client";

import React from "react";
import { AlertTriangle, CheckCircle, Calendar, Bed, Tag } from "lucide-react";
import { BulkRuleState } from "./types";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { useCurrency } from "@/hooks/useCurrency";
import styles from "./BulkSummaryStep.module.css";

interface BulkSummaryStepProps {
    rules: BulkRuleState[];
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
}

const DAYS_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function BulkSummaryStep({
    rules,
    roomTypes,
    ratePlans
}: BulkSummaryStepProps) {
    const { formatCurrency, config: currConfig } = useCurrency();

    const getRoomTypesText = (ids: string[]) => {
        if (ids.includes("all") || ids.length === 0) {
            return `Semua Tipe Kamar (${roomTypes.length})`;
        }
        return ids
            .map(id => roomTypes.find(rt => rt.id === id)?.name || id)
            .join(", ");
    };

    const getRatePlansText = (ids: string[]) => {
        if (ids.includes("all") || ids.length === 0) {
            return `Semua Rate Plan (${ratePlans.length})`;
        }
        return ids
            .map(id => {
                const rp = ratePlans.find(r => r.id === id);
                return rp?.name || rp?.code || id;
            })
            .join(", ");
    };

    const getDaysText = (days: number[]) => {
        if (days.length === 7) return "Semua Hari (Senin - Minggu)";
        if (days.length === 5 && !days.includes(0) && !days.includes(6)) {
            return "Hari Kerja (Senin - Jumat)";
        }
        if (days.length === 2 && days.includes(0) && days.includes(6)) {
            return "Akhir Pekan (Sabtu & Minggu)";
        }
        return days.map(d => DAYS_NAMES[d]).join(", ");
    };

    return (
        <div className={styles.container}>
            <div className={styles.warningBox}>
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div className={styles.warningContent}>
                    <div className={styles.warningTitle}>Perhatian Sebelum Menerapkan</div>
                    <div className={styles.warningDesc}>
                        Pembaruan massal (Bulk Update) akan langsung menimpa data harga, allotment, atau status restriksi pada tanggal dan kamar yang ditentukan. Pastikan data di bawah sudah sesuai sebelum menekan tombol Terapkan.
                    </div>
                </div>
            </div>

            <div className={styles.rulesList}>
                {rules.map((rule, idx) => {
                    const metrics = rule.selectedMetrics;

                    return (
                        <div key={rule.id} className={styles.ruleSummaryCard}>
                            <div className={styles.ruleHeader}>
                                <div className={styles.ruleTitle}>
                                    {rule.title || `Aturan Bulk #${idx + 1}`}
                                </div>
                                <div className={styles.badgeList}>
                                    {metrics.map(m => (
                                        <span key={m} className={styles.metricBadge}>
                                            {m.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.detailsGrid}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Target Kamar</span>
                                    <span className={styles.detailValue}>
                                        <Bed size={13} style={{ display: "inline", marginRight: 4 }} />
                                        {getRoomTypesText(rule.roomTypeIds)}
                                    </span>
                                </div>

                                {metrics.some(m => m !== "inventory") && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Target Rate Plan</span>
                                        <span className={styles.detailValue}>
                                            <Tag size={13} style={{ display: "inline", marginRight: 4 }} />
                                            {getRatePlansText(rule.ratePlanIds)}
                                        </span>
                                    </div>
                                )}

                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Periode Tanggal</span>
                                    <span className={styles.detailValue}>
                                        <Calendar size={13} style={{ display: "inline", marginRight: 4 }} />
                                        {rule.dateFrom} s/d {rule.dateTo}
                                    </span>
                                </div>

                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Hari Aktif</span>
                                    <span className={styles.detailValue}>
                                        {getDaysText(rule.daysOfWeek)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions & Values Summary */}
                            <div className={styles.actionValuesSection}>
                                <span className={styles.detailLabel}>Nilai &amp; Aksi Perubahan:</span>

                                {metrics.includes("rate") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Rate (Harga):</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.rateAction === "set" && `Setel ${formatCurrency(rule.rateValue)}`}
                                            {rule.rateAction === "inc_amount" && `+ ${formatCurrency(rule.rateValue)}`}
                                            {rule.rateAction === "dec_amount" && `- ${formatCurrency(rule.rateValue)}`}
                                            {rule.rateAction === "inc_percent" && `+ ${rule.rateValue}%`}
                                            {rule.rateAction === "dec_percent" && `- ${rule.rateValue}%`}
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("inventory") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Inventory (Allotment):</span>
                                        <span className={styles.actionRowValue}>
                                            Setel {rule.inventoryValue} unit kamar
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("stopsell") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Stop Sell:</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.stopSellAction === "close" ? "TUTUP (Stop Sell Aktif)" : "BUKA (Open)"}
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("minstay_through") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Min Stay Through:</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.minStayThroughAction === "set"
                                                ? `${rule.minStayThroughValue} malam`
                                                : "Hapus batasan"}
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("minstay_arrival") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Min Stay Arrival:</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.minStayArrivalAction === "set"
                                                ? `${rule.minStayArrivalValue} malam`
                                                : "Hapus batasan"}
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("maxstay") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Maximum Stay:</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.maxStayAction === "set"
                                                ? `${rule.maxStayValue} malam`
                                                : "Hapus batasan"}
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("cta") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Closed to Arrival (COA):</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.ctaAction === "close" ? "TUTUP (Larang Check-in)" : "BUKA (Izinkan Check-in)"}
                                        </span>
                                    </div>
                                )}

                                {metrics.includes("ctd") && (
                                    <div className={styles.actionRow}>
                                        <span className={styles.actionRowLabel}>Closed to Departure (COD):</span>
                                        <span className={styles.actionRowValue}>
                                            {rule.ctdAction === "close" ? "TUTUP (Larang Check-out)" : "BUKA (Izinkan Check-out)"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
