"use client";

import React from "react";
import { AlertCircle, Bed, Tag, Calendar, CheckCircle2 } from "lucide-react";
import { BulkRuleState } from "./types";
import { RoomTypeInfo, MyTaraRatePlan } from "@/lib/channex/types";
import { useCurrency } from "@/hooks/useCurrency";
import styles from "./BulkSummaryStep.module.css";

interface BulkSummaryStepProps {
    rules: BulkRuleState[];
    roomTypes: RoomTypeInfo[];
    ratePlans: MyTaraRatePlan[];
}

export function BulkSummaryStep({
    rules,
    roomTypes,
    ratePlans
}: BulkSummaryStepProps) {
    const { formatCurrency } = useCurrency();

    // Helper to format Channex-standard date string
    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    // Helper to build Channex restrictions string matching certification screenshots
    const buildRestrictionsString = (rule: BulkRuleState): string => {
        const parts: string[] = [];

        // Rate
        if (rule.selectedMetrics.includes("rate") && rule.rateAction !== "none") {
            if (rule.rateAction === "set") {
                parts.push(`rate: ${rule.rateValue}$`);
            } else if (rule.rateAction === "inc_amount") {
                parts.push(`rate: +${rule.rateValue}`);
            } else if (rule.rateAction === "dec_amount") {
                parts.push(`rate: -${rule.rateValue}`);
            } else if (rule.rateAction === "inc_percent") {
                parts.push(`rate: +${rule.rateValue}%`);
            } else if (rule.rateAction === "dec_percent") {
                parts.push(`rate: -${rule.rateValue}%`);
            }
        }

        // Stop Sell
        const isStopSellActive = rule.stopSell === true || rule.stopSellAction === "close" || rule.stopSellAction === "true";
        const isStopSellInactive = rule.stopSell === false || rule.stopSellAction === "open" || rule.stopSellAction === "false";
        if (rule.selectedMetrics.includes("stopsell")) {
            if (isStopSellActive) parts.push("Stop Sell");
            else if (isStopSellInactive) parts.push("Open");
        }

        // Closed to Arrival (CTA)
        const isCtaActive = rule.closedToArrival === true || rule.ctaAction === "close" || rule.ctaAction === "true";
        const isCtaInactive = rule.closedToArrival === false || rule.ctaAction === "open" || rule.ctaAction === "false";
        if (rule.selectedMetrics.includes("cta")) {
            if (isCtaActive) parts.push("CTA: Closed");
            else if (isCtaInactive) parts.push("CTA: Open");
        }

        // Closed to Departure (CTD)
        const isCtdActive = rule.closedToDeparture === true || rule.ctdAction === "close" || rule.ctdAction === "true";
        const isCtdInactive = rule.closedToDeparture === false || rule.ctdAction === "open" || rule.ctdAction === "false";
        if (rule.selectedMetrics.includes("ctd")) {
            if (isCtdActive) parts.push("CTD: Closed");
            else if (isCtdInactive) parts.push("CTD: Open");
        }

        // Max Stay
        if (rule.selectedMetrics.includes("maxstay")) {
            if (rule.maxStayAction === "set") parts.push(`max_stay: ${rule.maxStayValue}`);
            else if (rule.maxStayAction === "remove") parts.push("max_stay: null");
        }

        // Min Stay Through
        if (rule.selectedMetrics.includes("minstay_through")) {
            if (rule.minStayThroughAction === "set") parts.push(`min_stay: ${rule.minStayThroughValue}`);
            else if (rule.minStayThroughAction === "remove") parts.push("min_stay: null");
        }

        // Min Stay Arrival
        if (rule.selectedMetrics.includes("minstay_arrival")) {
            if (rule.minStayArrivalAction === "set") parts.push(`min_stay_arrival: ${rule.minStayArrivalValue}`);
            else if (rule.minStayArrivalAction === "remove") parts.push("min_stay_arrival: null");
        }

        // Inventory
        if (rule.selectedMetrics.includes("inventory") && rule.inventoryAction === "set") {
            parts.push(`availability: ${rule.inventoryValue}`);
        }

        return parts.length > 0 ? parts.join(", ") : "Tidak ada restriksi diubah";
    };

    // Flatten rules into rows per room type & rate plan for precise verification
    const tableRows = rules.flatMap((rule, ruleIdx) => {
        const targetRooms = rule.roomTypeIds.includes("all")
            ? roomTypes
            : roomTypes.filter(rt => rule.roomTypeIds.includes(rt.id));

        const targetPlans = rule.ratePlanIds.includes("all")
            ? ratePlans
            : ratePlans.filter(rp => rule.ratePlanIds.includes(rp.id));

        const dateRangeText = `${formatDateStr(rule.dateFrom)} to ${formatDateStr(rule.dateTo)}`;
        const restrictionsText = buildRestrictionsString(rule);

        const rows: Array<{
            key: string;
            roomName: string;
            ratePlanName: string;
            dateRange: string;
            restrictions: string;
            ruleIndex: number;
        }> = [];

        targetRooms.forEach(rt => {
            targetPlans.forEach(rp => {
                rows.push({
                    key: `${rule.id}-${rt.id}-${rp.id}`,
                    roomName: rt.name,
                    ratePlanName: rp.name,
                    dateRange: dateRangeText,
                    restrictions: restrictionsText,
                    ruleIndex: ruleIdx + 1
                });
            });
        });

        return rows;
    });

    return (
        <div className={styles.container}>
            {/* Table in Channex Certification Format */}
            <div className={styles.tableContainer}>
                <table className={styles.channexTable}>
                    <thead>
                        <tr>
                            <th className={styles.channexTh}>Room Type</th>
                            <th className={styles.channexTh}>Rate Plan</th>
                            <th className={styles.channexTh}>Date</th>
                            <th className={styles.channexTh}>Restrictions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows.map((row) => (
                            <tr key={row.key}>
                                <td className={styles.channexTd}>
                                    <div style={{ fontWeight: 800 }}>{row.roomName}</div>
                                </td>
                                <td className={styles.channexTd}>
                                    <div style={{ fontWeight: 600 }}>{row.ratePlanName}</div>
                                </td>
                                <td className={styles.channexTd}>
                                    <div style={{ whiteSpace: "nowrap" }}>{row.dateRange}</div>
                                </td>
                                <td className={styles.channexTd}>
                                    <span className={styles.codeSyntax}>{row.restrictions}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Standard 1 API Call Distribution Notice */}
            <div className={styles.oneCallAlert}>
                <AlertCircle size={16} style={{ color: "#0284c7", flexShrink: 0 }} />
                <span>
                    <strong>Distribusi Saluran:</strong> Pembaruan ini disimpan ke sistem dan otomatis didistribusikan ke seluruh saluran penjualan aktif dalam <strong>1 batched transmission</strong>.
                </span>
            </div>
        </div>
    );
}
