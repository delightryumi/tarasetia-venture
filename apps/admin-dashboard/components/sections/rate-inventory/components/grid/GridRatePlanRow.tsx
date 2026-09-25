"use client";

import React from "react";
import { Coffee, Bed, Info, Check, Ban } from "lucide-react";
import { RateInventoryTab, RatePlanGridRow } from "../../RateInventoryTypes";
import styles from "./GridRatePlanRow.module.css";
import cellStyles from "./GridCellInput.module.css";

interface GridRatePlanRowProps {
    roomTypeId: string;
    ratePlan: RatePlanGridRow;
    dateList: string[];
    todayStr: string;
    activeTab: RateInventoryTab;
    channelFilter: string;
    isRateSeparated: boolean;
    canStopSell: boolean;
    canChangeRate: boolean;
    stageEdit: (key: string, value: any) => void;
}

export const GridRatePlanRow = React.memo(function GridRatePlanRow({
    roomTypeId,
    ratePlan: rp,
    dateList,
    todayStr,
    activeTab,
    channelFilter,
    isRateSeparated,
    canStopSell,
    canChangeRate,
    stageEdit
}: GridRatePlanRowProps) {
    const isChannelSpecific = channelFilter && channelFilter !== "all";

    const formatCurrency = (val: number) => {
        return Number(val || 0).toLocaleString("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <tr className={styles.ratePlanRow}>
            {/* 1. Left Sticky Column: Rate Plan Identity */}
            <td className={styles.ratePlanTitleCell}>
                <div className={styles.ratePlanDetails}>
                    <div className={styles.ratePlanNameRow}>
                        <span className={styles.ratePlanName} title={rp.ratePlanName}>
                            {rp.ratePlanName}
                        </span>
                        {rp.isDerived && (
                            <span className={styles.derivedPill} title="Derived from Master Rate Plan">
                                Derived
                            </span>
                        )}
                    </div>
                    <div className={styles.ratePlanMetaRow}>
                        {rp.mealsIncluded ? (
                            <span className={`${styles.mealBadge} ${styles.mealBadgeBreakfast}`} title="Breakfast Included (BB)">
                                <Coffee size={10} /> BB (Breakfast Included)
                            </span>
                        ) : (
                            <span className={`${styles.mealBadge} ${styles.mealBadgeRoomOnly}`} title="Room Only (RO)">
                                <Bed size={10} /> RO (Room Only)
                            </span>
                        )}

                        {isChannelSpecific && isRateSeparated && (
                            <span className={styles.channelSeparatedBadge}>
                                Custom OTA Rate
                            </span>
                        )}

                        <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>
                            Base: IDR {formatCurrency(rp.baseRate)}
                        </span>
                    </div>
                </div>
            </td>

            {/* 2. Days Columns */}
            {dateList.map(dateStr => {
                const dayStat = rp.days[dateStr];
                const isWeekend = dayStat?.isWeekend ?? false;
                const isStopSell = !!dayStat?.stopSell;
                const isToday = dateStr === todayStr;

                const rateKey = isChannelSpecific 
                    ? `channelRate_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                    : `rate_${rp.ratePlanId}_${dateStr}`;
                const stopSellKey = isChannelSpecific 
                    ? `channelStopSell_${channelFilter}_${rp.ratePlanId}_${dateStr}` 
                    : `stopSell_${rp.ratePlanId}_${dateStr}`;
                const minStayKey = `min_${rp.ratePlanId}_${dateStr}`;
                const ctaKey = `cta_${rp.ratePlanId}_${dateStr}`;
                const ctdKey = `ctd_${rp.ratePlanId}_${dateStr}`;

                const cellClasses = [
                    cellStyles.cell,
                    isWeekend ? cellStyles.cellWeekend : "",
                    isToday ? cellStyles.cellToday : "",
                    isStopSell && activeTab === "stopsell" ? cellStyles.cellDirty : ""
                ].filter(Boolean).join(" ");

                // A. RATES TAB
                if (activeTab === "rates") {
                    const currentRate = dayStat?.rate ?? rp.baseRate;
                    const canEdit = canChangeRate && (!isChannelSpecific || isRateSeparated);

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
                                title={`Rate: IDR ${formatCurrency(currentRate)}`}
                            />
                        </td>
                    );
                }

                // B. STOP SELL TAB
                if (activeTab === "stopsell") {
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
                                title={isStopSell ? "Stop Sell Active (Closed to Sale)" : "Open for Sale"}
                            >
                                {isStopSell ? <Ban size={12} /> : <Check size={12} />}
                                <span>{isStopSell ? "CLOSED" : "OPEN"}</span>
                            </button>
                        </td>
                    );
                }

                // C. MIN STAY TAB
                if (activeTab === "minstay") {
                    const minStay = dayStat?.minStay ?? 1;
                    return (
                        <td key={dateStr} className={cellClasses}>
                            <input
                                type="number"
                                min={1}
                                max={30}
                                value={minStay}
                                disabled={!canChangeRate}
                                onChange={e => {
                                    if (!canChangeRate) return;
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    stageEdit(minStayKey, val);
                                }}
                                onWheel={e => e.currentTarget.blur()}
                                className={[
                                    cellStyles.numberInput,
                                    !canChangeRate ? cellStyles.inputDisabled : ""
                                ].filter(Boolean).join(" ")}
                                title={`Min Stay: ${minStay} night(s)`}
                            />
                        </td>
                    );
                }

                // D. CTA TAB
                if (activeTab === "cta") {
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
                                title={isCta ? "Closed to Arrival (No Check-in Allowed)" : "Open to Arrival"}
                            >
                                {isCta ? <Ban size={12} /> : <Check size={12} />}
                                <span>{isCta ? "CLOSED" : "OPEN"}</span>
                            </button>
                        </td>
                    );
                }

                // E. CTD TAB
                if (activeTab === "ctd") {
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
                                title={isCtd ? "Closed to Departure (No Check-out Allowed)" : "Open to Departure"}
                            >
                                {isCtd ? <Ban size={12} /> : <Check size={12} />}
                                <span>{isCtd ? "CLOSED" : "OPEN"}</span>
                            </button>
                        </td>
                    );
                }

                // F. INVENTORY TAB (Rate plans show their base price or reference)
                const currentRate = dayStat?.rate ?? rp.baseRate;
                return (
                    <td key={dateStr} className={cellClasses}>
                        <span
                            style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b" }}
                            title={`Rate: IDR ${formatCurrency(currentRate)}`}
                        >
                            {formatCurrency(currentRate)}
                        </span>
                    </td>
                );
            })}

            <td style={{ backgroundColor: "inherit" }} />
        </tr>
    );
});
