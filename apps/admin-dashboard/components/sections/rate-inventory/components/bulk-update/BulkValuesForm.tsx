"use client";

import React from "react";
import {
    DollarSign,
    Bed,
    Ban,
    Clock,
    LogIn,
    LogOut,
    Calendar,
    Check,
    X,
    AlertCircle
} from "lucide-react";
import { BulkRuleState } from "./types";
import { useCurrency } from "@/hooks/useCurrency";
import styles from "./BulkValuesForm.module.css";

interface BulkValuesFormProps {
    rule: BulkRuleState;
    onChange: (updates: Partial<BulkRuleState>) => void;
}

export function BulkValuesForm({ rule, onChange }: BulkValuesFormProps) {
    const { config: currConfig } = useCurrency();
    const metrics = rule.selectedMetrics;

    if (metrics.length === 0) {
        return (
            <div className={styles.emptyState}>
                <AlertCircle size={16} />
                <span>Belum ada komponen metrik yang dipilih pada Langkah 1.</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 1. Rate */}
            {metrics.includes("rate") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <DollarSign size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Rates (Harga)</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.rateAction}
                            onChange={e =>
                                onChange({
                                    rateAction: e.target.value as BulkRuleState["rateAction"]
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Setel Harga Tetap</option>
                            <option value="inc_amount">Naikkan Nominal (+ Rp)</option>
                            <option value="dec_amount">Turunkan Nominal (- Rp)</option>
                            <option value="inc_percent">Naikkan Persen (+ %)</option>
                            <option value="dec_percent">Turunkan Persen (- %)</option>
                        </select>

                        <div className={styles.currencyInputWrapper}>
                            <span className={styles.currencySymbol}>
                                {rule.rateAction.includes("percent") ? "%" : currConfig.symbol}
                            </span>
                            <input
                                type="number"
                                placeholder={rule.rateAction.includes("percent") ? "10" : "500000"}
                                value={rule.rateValueStr}
                                onChange={e => {
                                    const str = e.target.value;
                                    onChange({
                                        rateValueStr: str,
                                        rateValue: parseFloat(str) || 0
                                    });
                                }}
                                className={styles.numberInput}
                                min="0"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Inventory */}
            {metrics.includes("inventory") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Bed size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Inventory (Allotment)</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>Setel kuota kamar:</span>
                        <input
                            type="number"
                            placeholder="5"
                            value={rule.inventoryValue}
                            onChange={e =>
                                onChange({ inventoryValue: parseInt(e.target.value, 10) || 0 })
                            }
                            className={styles.selectInput}
                            style={{ maxWidth: 90 }}
                            min="0"
                        />
                        <span style={{ fontSize: 11.5, color: "#64748b" }}>unit</span>
                    </div>
                </div>
            )}

            {/* 3. Stop Sell */}
            {metrics.includes("stopsell") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Ban size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Stop Sell</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.toggleButtonGroup}>
                            <button
                                type="button"
                                onClick={() => onChange({ stopSellAction: "open" })}
                                className={`${styles.toggleBtn} ${
                                    rule.stopSellAction === "open" ? styles.toggleBtnOpen : ""
                                }`}
                            >
                                <Check size={12} />
                                <span>Buka (Open)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange({ stopSellAction: "close" })}
                                className={`${styles.toggleBtn} ${
                                    rule.stopSellAction === "close" ? styles.toggleBtnClose : ""
                                }`}
                            >
                                <X size={12} />
                                <span>Tutup (Stop Sell)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Min Stay Through */}
            {metrics.includes("minstay_through") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Clock size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Min Stay Through</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.minStayThroughAction}
                            onChange={e =>
                                onChange({
                                    minStayThroughAction: e.target.value as "none" | "set" | "remove"
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Tetapkan Minimal Malam</option>
                            <option value="remove">Hapus Batasan</option>
                        </select>
                        {rule.minStayThroughAction === "set" && (
                            <input
                                type="number"
                                value={rule.minStayThroughValue}
                                onChange={e =>
                                    onChange({
                                        minStayThroughValue: Math.max(1, parseInt(e.target.value, 10) || 1)
                                    })
                                }
                                className={styles.selectInput}
                                style={{ maxWidth: 80 }}
                                min="1"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* 5. Min Stay Arrival */}
            {metrics.includes("minstay_arrival") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Clock size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Min Stay Arrival</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.minStayArrivalAction}
                            onChange={e =>
                                onChange({
                                    minStayArrivalAction: e.target.value as "none" | "set" | "remove"
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Tetapkan Min Malam Check-in</option>
                            <option value="remove">Hapus Batasan</option>
                        </select>
                        {rule.minStayArrivalAction === "set" && (
                            <input
                                type="number"
                                value={rule.minStayArrivalValue}
                                onChange={e =>
                                    onChange({
                                        minStayArrivalValue: Math.max(1, parseInt(e.target.value, 10) || 1)
                                    })
                                }
                                className={styles.selectInput}
                                style={{ maxWidth: 80 }}
                                min="1"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* 6. Max Stay */}
            {metrics.includes("maxstay") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Calendar size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Maximum Stay</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.maxStayAction}
                            onChange={e =>
                                onChange({
                                    maxStayAction: e.target.value as "none" | "set" | "remove"
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Tetapkan Batas Maksimal</option>
                            <option value="remove">Hapus Batasan</option>
                        </select>
                        {rule.maxStayAction === "set" && (
                            <input
                                type="number"
                                value={rule.maxStayValue}
                                onChange={e =>
                                    onChange({
                                        maxStayValue: Math.max(1, parseInt(e.target.value, 10) || 1)
                                    })
                                }
                                className={styles.selectInput}
                                style={{ maxWidth: 80 }}
                                min="1"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* 7. COA */}
            {metrics.includes("cta") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <LogIn size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Closed to Arrival (COA)</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.toggleButtonGroup}>
                            <button
                                type="button"
                                onClick={() => onChange({ ctaAction: "open" })}
                                className={`${styles.toggleBtn} ${
                                    rule.ctaAction === "open" ? styles.toggleBtnOpen : ""
                                }`}
                            >
                                <Check size={12} />
                                <span>Buka Check-in</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange({ ctaAction: "close" })}
                                className={`${styles.toggleBtn} ${
                                    rule.ctaAction === "close" ? styles.toggleBtnClose : ""
                                }`}
                            >
                                <X size={12} />
                                <span>Tutup Check-in (COA)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 8. COD */}
            {metrics.includes("ctd") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <LogOut size={14} className={styles.metricIcon} />
                        <span className={styles.metricName}>Closed to Departure (COD)</span>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.toggleButtonGroup}>
                            <button
                                type="button"
                                onClick={() => onChange({ ctdAction: "open" })}
                                className={`${styles.toggleBtn} ${
                                    rule.ctdAction === "open" ? styles.toggleBtnOpen : ""
                                }`}
                            >
                                <Check size={12} />
                                <span>Buka Check-out</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange({ ctdAction: "close" })}
                                className={`${styles.toggleBtn} ${
                                    rule.ctdAction === "close" ? styles.toggleBtnClose : ""
                                }`}
                            >
                                <X size={12} />
                                <span>Tutup Check-out (COD)</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
