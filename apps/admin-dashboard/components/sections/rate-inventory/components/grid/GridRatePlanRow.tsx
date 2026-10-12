import React, { useMemo } from "react";
import { Check, Ban, Utensils, Bed } from "lucide-react";
import { RateInventoryTab, RatePlanGridRow, GridFeatureId, GRID_FEATURES } from "../../RateInventoryTypes";
import styles from "./GridRatePlanRow.module.css";
import cellStyles from "./GridCellInput.module.css";
import { getCurrencyConfig } from "@/lib/currency-utils";
import { useCurrency } from "@/hooks/useCurrency";

interface GridRatePlanRowProps {
    roomTypeId: string;
    ratePlan: RatePlanGridRow;
    dateList: string[];
    todayStr: string;
    activeTab: RateInventoryTab;
    visibleFeatures?: Record<GridFeatureId, boolean>;
    channelFilter: string;
    isRateSeparated: boolean;
    canStopSell: boolean;
    canChangeRate: boolean;
    stageEdit: (key: string, value: any) => void;
}

const METRIC_LABELS: Record<GridFeatureId, string> = {
    availability: "Availability",
    rate: "Rate",
    minStayThrough: "Min Stay Through",
    minStayArrival: "Min Stay Arrival",
    maxStay: "Max Stay",
    closedToArrival: "Closed To Arrival (CTA)",
    closedToDeparture: "Closed To Departure (CTD)",
    stopSell: "Stop Sell"
};

export const GridRatePlanRow = React.memo(function GridRatePlanRow({
    roomTypeId,
    ratePlan: rp,
    dateList,
    todayStr,
    activeTab,
    visibleFeatures,
    channelFilter,
    isRateSeparated,
    canStopSell,
    canChangeRate,
    stageEdit
}: GridRatePlanRowProps) {
    const isChannelSpecific = channelFilter && channelFilter !== "all";
    const isBreakfast = rp.mealsIncluded || rp.ratePlanName.toLowerCase().includes("breakfast") || rp.ratePlanName.toLowerCase().includes("sarapan");

    const { currencyCode } = useCurrency();
    const currConfig = getCurrencyConfig(rp.currency || currencyCode || "IDR");
    const formatCurrency = (val: number) => {
        return Number(val || 0).toLocaleString("en-US", {
            minimumFractionDigits: currConfig.decimals,
            maximumFractionDigits: currConfig.decimals
        });
    };

    // Determine which rate-plan level metrics are visible with bulletproof fallback
    const safeVisibleFeatures: Record<GridFeatureId, boolean> = useMemo(() => {
        if (visibleFeatures && typeof visibleFeatures === "object") {
            return visibleFeatures;
        }
        return {
            availability: activeTab === "inventory",
            rate: activeTab === "rates" || activeTab === "custom",
            minStayThrough: activeTab === "minstay" || activeTab === "minstay_through",
            minStayArrival: activeTab === "minstay" || activeTab === "minstay_arrival",
            maxStay: activeTab === "maxstay",
            closedToArrival: activeTab === "cta",
            closedToDeparture: activeTab === "ctd",
            stopSell: activeTab === "stopsell"
        };
    }, [visibleFeatures, activeTab]);

    const activeMetricIds = useMemo(() => {
        const ids: GridFeatureId[] = [];
        if (safeVisibleFeatures.rate) ids.push("rate");
        if (safeVisibleFeatures.minStayThrough) ids.push("minStayThrough");
        if (safeVisibleFeatures.minStayArrival) ids.push("minStayArrival");
        if (safeVisibleFeatures.maxStay) ids.push("maxStay");
        if (safeVisibleFeatures.closedToArrival) ids.push("closedToArrival");
        if (safeVisibleFeatures.closedToDeparture) ids.push("closedToDeparture");
        if (safeVisibleFeatures.stopSell) ids.push("stopSell");
        return ids;
    }, [safeVisibleFeatures]);

    // If no rate plan metric is enabled (e.g. only Availability is checked in Inventory tab)
    if (activeMetricIds.length === 0) {
        return null;
    }

    // Helper to render date cells for a specific metric
    const renderMetricCells = (metricId: GridFeatureId) => {
        return dateList.map(dateStr => {
            const dayStat = rp.days[dateStr];
            const isWeekend = dayStat?.isWeekend ?? false;
            const isStopSell = !!dayStat?.stopSell;
            const isToday = dateStr === todayStr;

            const cellClasses = [
                cellStyles.cell,
                isWeekend ? cellStyles.cellWeekend : "",
                isToday ? cellStyles.cellToday : "",
                metricId === "stopSell" && isStopSell ? cellStyles.cellDirty : ""
            ].filter(Boolean).join(" ");

            // 1. Rate Metric
            if (metricId === "rate") {
                const currentRate = dayStat?.rate ?? rp.baseRate;
                const canEdit = canChangeRate && (!isChannelSpecific || isRateSeparated);
                const rateKey = isChannelSpecific 
                    ? `channelRate_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                    : `rate_${rp.ratePlanId}_${dateStr}`;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <input
                            type="text"
                            value={formatCurrency(currentRate)}
                            disabled={!canEdit}
                            onChange={e => {
                                if (!canEdit) return;
                                const rawNum = Number(e.target.value.replace(/[^0-9.-]+/g, "")) || 0;
                                stageEdit(rateKey, rawNum);
                            }}
                            onWheel={e => e.currentTarget.blur()}
                            className={[
                                cellStyles.numberInput,
                                !canEdit ? cellStyles.inputDisabled : "",
                                dayStat?.isChannelCustom ? cellStyles.inputCapped : ""
                            ].filter(Boolean).join(" ")}
                            title={`Tarif: ${currConfig.code} ${formatCurrency(currentRate)}`}
                        />
                    </td>
                );
            }

            // 2. Stop Sell Metric
            if (metricId === "stopSell") {
                const stopSellKey = isChannelSpecific 
                    ? `channelStopSell_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                    : `stopSell_${rp.ratePlanId}_${dateStr}`;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <button
                            type="button"
                            disabled={!canStopSell}
                            onClick={() => {
                                if (!canStopSell) return;
                                stageEdit(stopSellKey, !isStopSell);
                            }}
                            className={[
                                cellStyles.toggleBtn,
                                isStopSell ? cellStyles.toggleClosed : cellStyles.toggleOpen,
                                !canStopSell ? cellStyles.inputDisabled : ""
                            ].filter(Boolean).join(" ")}
                            title={isStopSell ? "Stop Sell Aktif (Penjualan Ditutup)" : "Terbuka untuk Penjualan"}
                        >
                            {isStopSell ? <Ban size={12} /> : <Check size={12} />}
                            <span>{isStopSell ? "CLOSED" : "OPEN"}</span>
                        </button>
                    </td>
                );
            }

            // 3. Min Stay Arrival Metric
            if (metricId === "minStayArrival") {
                const minStayArrKey = `min_arr_${rp.ratePlanId}_${dateStr}`;
                const val = dayStat?.minStayArrival ?? dayStat?.minStay ?? 1;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <input
                            type="number"
                            min={1}
                            max={30}
                            value={val}
                            onChange={e => {
                                const num = Math.max(1, parseInt(e.target.value, 10) || 1);
                                stageEdit(minStayArrKey, num);
                            }}
                            onWheel={e => e.currentTarget.blur()}
                            className={cellStyles.numberInput}
                            title={`Min Stay Arrival: ${val} malam`}
                        />
                    </td>
                );
            }

            // 4. Min Stay Through Metric
            if (metricId === "minStayThrough") {
                const minStayThruKey = `min_thru_${rp.ratePlanId}_${dateStr}`;
                const val = dayStat?.minStayThrough ?? dayStat?.minStay ?? 1;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <input
                            type="number"
                            min={1}
                            max={30}
                            value={val}
                            onChange={e => {
                                const num = Math.max(1, parseInt(e.target.value, 10) || 1);
                                stageEdit(minStayThruKey, num);
                            }}
                            onWheel={e => e.currentTarget.blur()}
                            className={cellStyles.numberInput}
                            title={`Min Stay Through: ${val} malam`}
                        />
                    </td>
                );
            }

            // 5. Max Stay Metric
            if (metricId === "maxStay") {
                const maxStayKey = `max_${rp.ratePlanId}_${dateStr}`;
                const val = dayStat?.maxStay ?? 0;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <input
                            type="number"
                            min={0}
                            max={365}
                            value={val || ""}
                            placeholder="None"
                            onChange={e => {
                                const num = Math.max(0, parseInt(e.target.value, 10) || 0);
                                stageEdit(maxStayKey, num);
                            }}
                            onWheel={e => e.currentTarget.blur()}
                            className={[cellStyles.numberInput, !val ? cellStyles.inputDisabled : ""].filter(Boolean).join(" ")}
                            title={val > 0 ? `Max Stay: ${val} malam` : "Max Stay: Tidak Terbatas"}
                        />
                    </td>
                );
            }

            // 6. Closed to Arrival Metric
            if (metricId === "closedToArrival") {
                const ctaKey = `cta_${rp.ratePlanId}_${dateStr}`;
                const isCta = !!dayStat?.closedToArrival;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <button
                            type="button"
                            disabled={!canStopSell}
                            onClick={() => {
                                if (!canStopSell) return;
                                stageEdit(ctaKey, !isCta);
                            }}
                            className={[
                                cellStyles.toggleBtn,
                                isCta ? cellStyles.toggleWarning : cellStyles.toggleOpen,
                                !canStopSell ? cellStyles.inputDisabled : ""
                            ].filter(Boolean).join(" ")}
                            title={isCta ? "CTA Aktif (Dilarang Check-In)" : "Check-In Diizinkan"}
                        >
                            {isCta ? <Ban size={12} /> : <Check size={12} />}
                            <span>{isCta ? "CLOSED" : "OPEN"}</span>
                        </button>
                    </td>
                );
            }

            // 7. Closed to Departure Metric
            if (metricId === "closedToDeparture") {
                const ctdKey = `ctd_${rp.ratePlanId}_${dateStr}`;
                const isCtd = !!dayStat?.closedToDeparture;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <button
                            type="button"
                            disabled={!canStopSell}
                            onClick={() => {
                                if (!canStopSell) return;
                                stageEdit(ctdKey, !isCtd);
                            }}
                            className={[
                                cellStyles.toggleBtn,
                                isCtd ? cellStyles.toggleWarning : cellStyles.toggleOpen,
                                !canStopSell ? cellStyles.inputDisabled : ""
                            ].filter(Boolean).join(" ")}
                            title={isCtd ? "CTD Aktif (Dilarang Check-Out)" : "Check-Out Diizinkan"}
                        >
                            {isCtd ? <Ban size={12} /> : <Check size={12} />}
                            <span>{isCtd ? "CLOSED" : "OPEN"}</span>
                        </button>
                    </td>
                );
            }

            return (
                <td key={dateStr} className={cellClasses}>
                    <span className={cellStyles.dashCell}>-</span>
                </td>
            );
        });
    };

    const hasMultipleMetrics = activeMetricIds.length > 1;
    const firstMetric = activeMetricIds[0];
    const remainingMetrics = activeMetricIds.slice(1);

    return (
        <React.Fragment>
            {/* Primary Row: Rate Plan Identity + First Metric */}
            <tr className={styles.ratePlanRow}>
                <td className={styles.ratePlanTitleCell}>
                    <div className={styles.ratePlanHeaderRow}>
                        <span className={styles.ratePlanName} title={rp.ratePlanName}>
                            {rp.ratePlanName}
                        </span>
                        {rp.isDerived && (
                            <span className={styles.derivedPill} title="Derived Rate Plan">
                                Derived
                            </span>
                        )}
                        {isChannelSpecific && isRateSeparated && (
                            <span className={styles.channelSeparatedBadge} title="Custom OTA Rate">
                                OTA
                            </span>
                        )}
                    </div>

                    <div className={styles.ratePlanMetaRow}>
                        {isBreakfast ? (
                            <span className={`${styles.mealBadge} ${styles.mealBadgeBreakfast}`} title="Breakfast Included (BB)">
                                <Utensils size={11} />
                                <span>BB</span>
                            </span>
                        ) : (
                            <span className={`${styles.mealBadge} ${styles.mealBadgeRoomOnly}`} title="Room Only (RO)">
                                <Bed size={11} />
                                <span>RO</span>
                            </span>
                        )}
                        <span className={styles.baseRateLabel} title={`Base Rate: IDR ${Number(rp.baseRate || 0).toLocaleString("id-ID")}`}>
                            Base: IDR {Number(rp.baseRate || 0).toLocaleString("id-ID")}
                        </span>
                        {hasMultipleMetrics && (
                            <span className={`${styles.metricBadge} ${styles.firstMetricBadge}`}>
                                {METRIC_LABELS[firstMetric]}
                            </span>
                        )}
                    </div>
                </td>

                {/* Primary Metric Cells */}
                {renderMetricCells(firstMetric)}

                <td className={styles.endSpacerCell} />
            </tr>

            {/* Subsequent Sub-Metric Rows when Multiple Metrics are Active */}
            {hasMultipleMetrics && remainingMetrics.map(metricId => (
                <tr key={`${rp.ratePlanId}_${metricId}`} className={styles.subMetricRow}>
                    <td className={styles.subMetricTitleCell}>
                        <div className={styles.subMetricLabelGroup}>
                            <span className={styles.subMetricBranch}>↳</span>
                            <span className={styles.subMetricName}>
                                {METRIC_LABELS[metricId]}
                            </span>
                        </div>
                    </td>

                    {/* Sub-Metric Cells */}
                    {renderMetricCells(metricId)}

                    <td className={styles.endSpacerCell} />
                </tr>
            ))}
        </React.Fragment>
    );
});

