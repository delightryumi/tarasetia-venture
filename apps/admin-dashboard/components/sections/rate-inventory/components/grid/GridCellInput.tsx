"use client";

import React from "react";
import { Check, Ban } from "lucide-react";
import { RateInventoryTab } from "../../RateInventoryTypes";
import styles from "./GridCellInput.module.css";

interface GridCellInputProps {
    tab: RateInventoryTab;
    dateStr: string;
    isWeekend: boolean;
    isToday: boolean;
    isDirty?: boolean;
    // Values
    numValue?: number;
    boolValue?: boolean;
    // States
    isZero?: boolean;
    isCapped?: boolean;
    disabled?: boolean;
    title?: string;
    // Handlers
    onNumChange?: (val: number) => void;
    onBoolToggle?: () => void;
}

export const GridCellInput = React.memo(function GridCellInput({
    tab,
    dateStr,
    isWeekend,
    isToday,
    isDirty,
    numValue = 0,
    boolValue = false,
    isZero = false,
    isCapped = false,
    disabled = false,
    title,
    onNumChange,
    onBoolToggle
}: GridCellInputProps) {
    const cellClass = [
        styles.cell,
        isWeekend ? styles.cellWeekend : "",
        isToday ? styles.cellToday : "",
        isDirty ? styles.cellDirty : ""
    ].filter(Boolean).join(" ");

    // 1. INVENTORY, RATES, MINSTAY
    if (tab === "inventory" || tab === "rates" || tab === "minstay") {
        return (
            <td className={cellClass}>
                <input
                    type="number"
                    min={0}
                    value={numValue}
                    disabled={disabled}
                    onChange={e => {
                        if (disabled || !onNumChange) return;
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        onNumChange(val);
                    }}
                    onWheel={e => e.currentTarget.blur()}
                    className={[
                        styles.numberInput,
                        isZero ? styles.inputZero : "",
                        isCapped ? styles.inputCapped : "",
                        disabled ? styles.inputDisabled : ""
                    ].filter(Boolean).join(" ")}
                    title={title}
                />
            </td>
        );
    }

    // 2. STOP SELL, CTA, CTD (Boolean Toggles)
    const isClosed = boolValue;
    const isCTA = tab === "cta";
    const isCTD = tab === "ctd";

    return (
        <td className={cellClass}>
            <button
                type="button"
                disabled={disabled}
                onClick={onBoolToggle}
                className={[
                    styles.toggleBtn,
                    isClosed ? (isCTA || isCTD ? styles.toggleWarning : styles.toggleClosed) : styles.toggleOpen,
                    disabled ? styles.inputDisabled : ""
                ].filter(Boolean).join(" ")}
                title={title}
            >
                {isClosed ? <Ban size={12} /> : <Check size={12} />}
                <span>{isClosed ? "CLOSED" : "OPEN"}</span>
            </button>
        </td>
    );
});
