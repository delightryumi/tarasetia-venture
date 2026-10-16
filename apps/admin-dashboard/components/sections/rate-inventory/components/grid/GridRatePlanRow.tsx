import React, { useMemo, useState } from "react";
import { Check, Ban, Utensils, Bed } from "lucide-react";
import { RateInventoryTab, RatePlanGridRow, GridFeatureId, GRID_FEATURES } from "../../RateInventoryTypes";
import styles from "./GridRatePlanRow.module.css";
import cellStyles from "./GridCellInput.module.css";
import { getCurrencyConfig } from "@/lib/currency-utils";
import { useCurrency } from "@/hooks/useCurrency";

interface RateCellInputProps {
    value: number;
    disabled?: boolean;
    isChannelCustom?: boolean;
    currencyCode?: string;
    onSave: (val: number) => void;
}

const RateCellInput = React.memo(function RateCellInput({
    value,
    disabled = false,
    isChannelCustom = false,
    currencyCode = "IDR",
    onSave
}: RateCellInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [rawText, setRawText] = useState("");

    const currConfig = useMemo(() => getCurrencyConfig(currencyCode), [currencyCode]);

    // Format display according to standard hotel industry currency rules:
    // Decimals are strictly preserved for currencies that use cents (USD, EUR, SGD -> 100.00),
    // while zero-decimal currencies remain clean (IDR, JPY -> 1,000,000).
    const displayValue = useMemo(() => {
        const num = Number(value) || 0;
        return num.toLocaleString("en-US", {
            minimumFractionDigits: currConfig.decimals,
            maximumFractionDigits: currConfig.decimals
        });
    }, [value, currConfig.decimals]);

    // Keep local rawText in sync when value changes externally
    React.useEffect(() => {
        if (!isFocused) {
            const num = Number(value) || 0;
            setRawText(num === 0 ? "" : String(num));
        }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        const num = Number(value) || 0;
        const initialText = num === 0 ? "" : String(num);
        setRawText(initialText);
        // Select all text automatically so typing immediately replaces the whole number
        setTimeout(() => {
            e.target.select();
        }, 10);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Clean any invalid characters except digits and single decimal dot
        const cleaned = val.replace(/[^0-9.]/g, "");
        const parts = cleaned.split(".");
        const safeText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
        setRawText(safeText);

        // Immediately trigger onSave so stagedUpdates & unsavedCount update in real-time!
        if (safeText.trim() === "") {
            onSave(0);
        } else {
            const parsed = parseFloat(safeText);
            if (!isNaN(parsed) && parsed >= 0) {
                const finalVal = currConfig.decimals === 0
                    ? Math.round(parsed)
                    : Math.round((parsed + Number.EPSILON) * 100) / 100;
                onSave(finalVal);
            }
        }
    };

    const commitChange = () => {
        setIsFocused(false);
        if (rawText.trim() === "") {
            if (value !== 0) onSave(0);
            return;
        }
        const parsed = parseFloat(rawText);
        const finalVal = isNaN(parsed) || parsed < 0 
            ? 0 
            : currConfig.decimals === 0 
                ? Math.round(parsed) 
                : Math.round((parsed + Number.EPSILON) * 100) / 100;
        onSave(finalVal);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            commitChange();
            e.currentTarget.blur();
        } else if (e.key === "Escape") {
            setIsFocused(false);
            setRawText(value === 0 ? "" : String(value));
            e.currentTarget.blur();
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={isFocused ? rawText : displayValue}
            disabled={disabled}
            onFocus={handleFocus}
            onChange={handleChange}
            onBlur={commitChange}
            onKeyDown={handleKeyDown}
            onWheel={e => e.currentTarget.blur()}
            className={[
                cellStyles.numberInput,
                disabled ? cellStyles.inputDisabled : "",
                isChannelCustom ? cellStyles.inputCapped : ""
            ].filter(Boolean).join(" ")}
            title={`Tarif: ${currencyCode} ${displayValue}`}
        />
    );
});

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
    const currConfig = getCurrencyConfig(currencyCode || rp.currency || "IDR");
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

            const isRateDirty = metricId === "rate" && dayStat?.rate !== undefined && dayStat.rate !== rp.baseRate;
            const cellClasses = [
                cellStyles.cell,
                isWeekend ? cellStyles.cellWeekend : "",
                isToday ? cellStyles.cellToday : "",
                (metricId === "stopSell" && isStopSell) || isRateDirty ? cellStyles.cellDirty : ""
            ].filter(Boolean).join(" ");

            // 1. Rate Metric
            if (metricId === "rate") {
                const currentRate = dayStat?.rate ?? rp.baseRate;
                const canEdit = canChangeRate && (!isChannelSpecific || isRateSeparated);
                const rateKey = isChannelSpecific 
                    ? `channelRate_${channelFilter}_${roomTypeId}_${rp.ratePlanId}_${dateStr}` 
                    : `rate_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;

                return (
                    <td key={dateStr} className={cellClasses}>
                        <RateCellInput
                            value={currentRate}
                            disabled={!canEdit}
                            isChannelCustom={dayStat?.isChannelCustom}
                            currencyCode={currConfig.code}
                            onSave={val => stageEdit(rateKey, val)}
                        />
                    </td>
                );
            }

            // 2. Stop Sell Metric
            if (metricId === "stopSell") {
                const stopSellKey = isChannelSpecific 
                    ? `channelStopSell_${channelFilter}_${roomTypeId}_${rp.ratePlanId}_${dateStr}` 
                    : `stopSell_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;

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
                const minStayArrKey = `min_arr_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;
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
                const minStayThruKey = `min_thru_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;
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
                const maxStayKey = `max_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;
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
                const ctaKey = `cta_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;
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
                const ctdKey = `ctd_${roomTypeId}_${rp.ratePlanId}_${dateStr}`;
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
                        <span className={styles.baseRateLabel} title={`Base Rate: ${currConfig.code} ${formatCurrency(Number(rp.baseRate || 0))}`}>
                            Base: {currConfig.code} {formatCurrency(Number(rp.baseRate || 0))}
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

