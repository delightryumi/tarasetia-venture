"use client";

import React from "react";
import { MyTaraRatePlan } from "@/lib/channex/types";
import {
    Plus,
    Trash2,
    Edit2,
    Search,
    Coffee,
    BedDouble,
    Copy,
    Activity,
    SlidersHorizontal,
    Layers
} from "lucide-react";
import { toast } from "sonner";
import styles from "./RatePlanMobileView.module.css";
import { RatePlanDesktopViewProps } from "./RatePlanDesktopView";

export const RatePlanMobileView: React.FC<RatePlanDesktopViewProps> = ({
    ratePlans,
    roomTypes,
    currencyCode,
    currConfig,
    searchQuery,
    setSearchQuery,
    openAddModal,
    openEditModal,
    deleteRatePlan,
    handlePingRatePlan,
    pingingId,
    seedDefaultRatePlans,
    savingRates,
    copyToClipboard,
    formatPlanRate
}) => {
    const filteredPlans = ratePlans.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const hasRoomMatch = p.roomTypeNames?.some(name => name.toLowerCase().includes(q));
        return (
            p.name?.toLowerCase().includes(q) ||
            p.code?.toLowerCase().includes(q) ||
            p.roomTypeName?.toLowerCase().includes(q) ||
            hasRoomMatch
        );
    });

    const totalPlans = ratePlans.length;
    let rateSum = 0;
    let rateCount = 0;
    ratePlans.forEach(p => {
        if (p.roomRates && Object.keys(p.roomRates).length > 0) {
            Object.values(p.roomRates).forEach(r => {
                rateSum += Number(r);
                rateCount++;
            });
        } else {
            rateSum += Number(p.baseRate || 0);
            rateCount++;
        }
    });
    const avgRate = rateCount > 0 ? Math.round(rateSum / rateCount) : 0;

    return (
        <div className={styles.container}>
            {/* Mobile Masthead */}
            <div className={styles.mastheadMobile}>
                <span className={styles.mastheadEyebrow}>Central Reservation · Rate Portfolio</span>
                <div className={styles.mastheadTitleRow}>
                    <h2 className={styles.mastheadTitle}>Rate Plans</h2>
                    <div className={styles.currencyBadge}>
                        <span>{currConfig?.flag || "ID"}</span>
                        <span>{currConfig?.code || "IDR"}</span>
                    </div>
                </div>
            </div>

            {/* Mobile Metrics 2x2 */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>Total Plans</span>
                    <span className={styles.metricValue}>{totalPlans}</span>
                </div>
                <div className={styles.metricBox}>
                    <span className={styles.metricLabel}>Avg Base Rate</span>
                    <span className={styles.metricValue}>{formatPlanRate(avgRate)}</span>
                </div>
            </div>

            {/* Search Input */}
            <div className={styles.searchWrapper}>
                <Search size={14} color="#71717a" />
                <input
                    type="text"
                    placeholder="Search rate plans..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Mobile Actions */}
            <div className={styles.mobileActionsRow}>
                <button
                    type="button"
                    onClick={openAddModal}
                    className={styles.btnMobileCreate}
                >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Create Rate Plan</span>
                </button>
                <button
                    type="button"
                    onClick={() => seedDefaultRatePlans(roomTypes, currencyCode)}
                    disabled={savingRates}
                    className={styles.btnMobileSeed}
                    title="Generate Standard Rates"
                >
                    <SlidersHorizontal size={14} />
                </button>
            </div>

            {/* Mobile Cards List */}
            <div className={styles.cardList}>
                {filteredPlans.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 12px", color: "#71717a", fontSize: "12px" }}>
                        <Layers size={24} style={{ margin: "0 auto 8px auto", opacity: 0.5 }} />
                        <p style={{ margin: 0 }}>No rate plans match your search.</p>
                    </div>
                ) : (
                    filteredPlans.map(plan => {
                        const rates = plan.roomRates && Object.keys(plan.roomRates).length > 0
                            ? Object.values(plan.roomRates)
                            : [Number(plan.baseRate || 0)];
                        const minRate = Math.min(...rates);
                        const maxRate = Math.max(...rates);
                        const isRange = minRate !== maxRate && isFinite(minRate) && isFinite(maxRate);

                        const ids = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
                            ? plan.roomTypeIds
                            : (plan.roomTypeId ? [plan.roomTypeId] : []);

                        const isSynced = Boolean(plan.channexRatePlanId || (plan.channexRatePlanIds && Object.keys(plan.channexRatePlanIds).length > 0));

                        return (
                            <div key={plan.id} className={styles.mobileCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitleArea}>
                                        <span className={styles.codeBadge}>{plan.code || "STD"}</span>
                                        <h3 className={styles.planName}>{plan.name}</h3>
                                    </div>
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "#71717a" }}>
                                        <span className={isSynced ? styles.dotBlack : styles.dotGray} />
                                        <span>{isSynced ? "Synced" : "PMS"}</span>
                                    </div>
                                </div>

                                <div className={styles.priceStrip}>
                                    <span className={styles.priceAmount}>
                                        {isRange ? (
                                            `${formatPlanRate(minRate, plan.currency)} - ${formatPlanRate(maxRate, plan.currency)}`
                                        ) : (
                                            formatPlanRate(Number(plan.baseRate || minRate || 0), plan.currency)
                                        )}
                                    </span>
                                    <span className={styles.priceLabel}>Net /night</span>
                                </div>

                                <div className={styles.specsGrid}>
                                    <div className={styles.specItem}>
                                        <span className={styles.specLabel}>Meal:</span>
                                        <span className={styles.specValue}>
                                            {plan.mealsIncluded ? "B&B" : "RO"}
                                        </span>
                                    </div>
                                    <div className={styles.specItem}>
                                        <span className={styles.specLabel}>Policy:</span>
                                        <span className={styles.specValue}>
                                            {plan.cancellationPolicy === "NON_REFUNDABLE"
                                                ? "Non-Ref."
                                                : plan.cancellationPolicy === "MODERATE"
                                                ? "Moderate"
                                                : "Free Canc."}
                                        </span>
                                    </div>
                                    <div className={styles.specItem}>
                                        <span className={styles.specLabel}>Min Stay:</span>
                                        <span className={styles.specValue}>{plan.minStay || 1} Night(s)</span>
                                    </div>
                                    <div className={styles.specItem}>
                                        <span className={styles.specLabel}>Status:</span>
                                        <span className={styles.specValue}>
                                            {plan.stopSell ? "Stop Sell" : "Open"}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.roomRow}>
                                    <span>Categories:</span>
                                    <div className={styles.roomPill}>
                                        <BedDouble size={10} />
                                        <span>
                                            {ids.length === 0
                                                ? "All Rooms"
                                                : ids.length === roomTypes.length && roomTypes.length > 1
                                                ? `All (${ids.length})`
                                                : `${ids.length} Room(s)`}
                                        </span>
                                    </div>
                                </div>

                                {/* Touch action buttons */}
                                <div className={styles.cardActionsRow}>
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(plan)}
                                        className={styles.btnActionTouch}
                                    >
                                        <Edit2 size={12} />
                                        <span>Edit Plan</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePingRatePlan(plan)}
                                        disabled={pingingId === plan.id}
                                        className={styles.btnPingTouch}
                                        title="Ping ARI Sync"
                                    >
                                        <Activity size={11} className={pingingId === plan.id ? "animate-spin" : ""} />
                                        <span>Ping</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deleteRatePlan(plan.id)}
                                        className={styles.btnDeleteTouch}
                                        title="Delete Plan"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
