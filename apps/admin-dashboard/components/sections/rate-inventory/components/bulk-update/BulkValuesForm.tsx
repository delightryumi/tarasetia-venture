"use client";

import React from "react";
import {
    Check,
    Ban,
    AlertCircle
} from "lucide-react";
import { BulkRuleState } from "./types";
import {
    Rate3DIcon,
    Inventory3DIcon,
    MinStayThrough3DIcon,
    MinStayArrival3DIcon,
    StopSell3DIcon,
    MaxStay3DIcon,
    Cta3DIcon,
    Ctd3DIcon
} from "./Bulk3DIcons";
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
                <AlertCircle size={15} />
                <span>Silakan klik komponen di atas (Rate, Stop Sell, COA, COD, dll.) untuk mulai mengatur nilainya.</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 1. Rate */}
            {metrics.includes("rate") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Rate3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Rates (Harga)</span>
                            <span className={styles.metricSub}>Tentukan nominal atau persentase perubahan</span>
                        </div>
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
                                {rule.rateAction.includes("percent") ? "%" : (currConfig.symbol || "Rp")}
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
                        <Inventory3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Inventory (Allotment)</span>
                            <span className={styles.metricSub}>Atur jumlah unit fisik kamar yang dijual</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.unitInputWrapper}>
                            <input
                                type="number"
                                placeholder="5"
                                value={rule.inventoryValue ?? 0}
                                onChange={e =>
                                    onChange({
                                        inventoryAction: "set",
                                        inventoryValue: Math.max(0, parseInt(e.target.value, 10) || 0)
                                    })
                                }
                                className={styles.compactNumberInput}
                                min="0"
                            />
                            <span className={styles.unitLabel}>unit kamar</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Stop Sell (Stop Sell / Open) */}
            {metrics.includes("stopsell") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <StopSell3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Stop Sell</span>
                            <span className={styles.metricSub}>Status: Stop Sell (Tutup) / Open (Buka)</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.toggleButtonGroup}>
                            <button
                                type="button"
                                onClick={() => {
                                    const isCurrentlyTrue = rule.stopSell === true || rule.stopSellAction === "close" || rule.stopSellAction === "true";
                                    onChange({
                                        stopSell: isCurrentlyTrue ? undefined : true,
                                        stopSellAction: isCurrentlyTrue ? "none" : "true"
                                    });
                                }}
                                className={`${styles.toggleBtn} ${
                                    (rule.stopSell === true || rule.stopSellAction === "close" || rule.stopSellAction === "true") ? styles.toggleBtnClose : ""
                                }`}
                                title="Aktifkan Stop Sell (Tutup Penjualan)"
                            >
                                <Ban size={12} />
                                <span>Stop Sell</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const isCurrentlyFalse = rule.stopSell === false || rule.stopSellAction === "open" || rule.stopSellAction === "false";
                                    onChange({
                                        stopSell: isCurrentlyFalse ? undefined : false,
                                        stopSellAction: isCurrentlyFalse ? "none" : "false"
                                    });
                                }}
                                className={`${styles.toggleBtn} ${
                                    (rule.stopSell === false || rule.stopSellAction === "open" || rule.stopSellAction === "false") ? styles.toggleBtnOpen : ""
                                }`}
                                title="Buka Penjualan (Open)"
                            >
                                <Check size={12} />
                                <span>Open</span>
                            </button>
                        </div>
                        <span className={`${styles.channexCodePill} ${
                            (rule.stopSell === true || rule.stopSellAction === "close" || rule.stopSellAction === "true")
                                ? styles.channexCodePillActive
                                : (rule.stopSell === false || rule.stopSellAction === "open" || rule.stopSellAction === "false")
                                ? styles.channexCodePillFalse
                                : ""
                        }`}>
                            Status: {rule.stopSell === true || rule.stopSellAction === "close" || rule.stopSellAction === "true" ? "Stop Sell" : (rule.stopSell === false || rule.stopSellAction === "open" || rule.stopSellAction === "false" ? "Open" : "Tidak Diubah")}
                        </span>
                    </div>
                </div>
            )}

            {/* 4. Min Stay Through */}
            {metrics.includes("minstay_through") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <MinStayThrough3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Min Stay Through</span>
                            <span className={styles.metricSub}>Minimal malam menginap melintasi tanggal</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.minStayThroughAction === "remove" ? "remove" : "set"}
                            onChange={e =>
                                onChange({
                                    minStayThroughAction: e.target.value as "set" | "remove"
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Tetapkan Minimal Malam</option>
                            <option value="remove">Hapus Batasan (Bebas)</option>
                        </select>
                        {rule.minStayThroughAction !== "remove" ? (
                            <div className={styles.unitInputWrapper}>
                                <input
                                    type="number"
                                    value={rule.minStayThroughValue || 1}
                                    onChange={e =>
                                        onChange({
                                            minStayThroughAction: "set",
                                            minStayThroughValue: Math.max(1, parseInt(e.target.value, 10) || 1)
                                        })
                                    }
                                    className={styles.compactNumberInput}
                                    min="1"
                                />
                                <span className={styles.unitLabel}>malam</span>
                            </div>
                        ) : (
                            <span className={styles.badgeRemoved}>Batasan Dihapus</span>
                        )}
                    </div>
                </div>
            )}

            {/* 5. Min Stay Arrival */}
            {metrics.includes("minstay_arrival") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <MinStayArrival3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Min Stay Arrival</span>
                            <span className={styles.metricSub}>Minimal malam khusus tamu check-in tanggal ini</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.minStayArrivalAction === "remove" ? "remove" : "set"}
                            onChange={e =>
                                onChange({
                                    minStayArrivalAction: e.target.value as "set" | "remove"
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Tetapkan Min Malam Check-in</option>
                            <option value="remove">Hapus Batasan (Bebas)</option>
                        </select>
                        {rule.minStayArrivalAction !== "remove" ? (
                            <div className={styles.unitInputWrapper}>
                                <input
                                    type="number"
                                    value={rule.minStayArrivalValue || 1}
                                    onChange={e =>
                                        onChange({
                                            minStayArrivalAction: "set",
                                            minStayArrivalValue: Math.max(1, parseInt(e.target.value, 10) || 1)
                                        })
                                    }
                                    className={styles.compactNumberInput}
                                    min="1"
                                />
                                <span className={styles.unitLabel}>malam</span>
                            </div>
                        ) : (
                            <span className={styles.badgeRemoved}>Batasan Check-in Dihapus</span>
                        )}
                    </div>
                </div>
            )}

            {/* 6. Max Stay */}
            {metrics.includes("maxstay") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <MaxStay3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Maximum Stay</span>
                            <span className={styles.metricSub}>Batas maksimal malam menginap</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <select
                            value={rule.maxStayAction === "remove" ? "remove" : "set"}
                            onChange={e =>
                                onChange({
                                    maxStayAction: e.target.value as "set" | "remove"
                                })
                            }
                            className={styles.selectInput}
                        >
                            <option value="set">Tetapkan Batas Maksimal</option>
                            <option value="remove">Hapus Batasan (Bebas)</option>
                        </select>
                        {rule.maxStayAction !== "remove" ? (
                            <div className={styles.unitInputWrapper}>
                                <input
                                    type="number"
                                    value={rule.maxStayValue || 30}
                                    onChange={e =>
                                        onChange({
                                            maxStayAction: "set",
                                            maxStayValue: Math.max(1, parseInt(e.target.value, 10) || 1)
                                        })
                                    }
                                    className={styles.compactNumberInput}
                                    min="1"
                                />
                                <span className={styles.unitLabel}>malam</span>
                            </div>
                        ) : (
                            <span className={styles.badgeRemoved}>Batasan Maksimal Dihapus</span>
                        )}
                    </div>
                </div>
            )}

            {/* 7. CTA (Closed to Arrival) */}
            {metrics.includes("cta") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Cta3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Closed to Arrival (CTA)</span>
                            <span className={styles.metricSub}>Status: Closed (Kunci Check-in) / Open (Buka Check-in)</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.toggleButtonGroup}>
                            <button
                                type="button"
                                onClick={() => {
                                    const isCurrentlyTrue = rule.closedToArrival === true || rule.ctaAction === "close" || rule.ctaAction === "true";
                                    onChange({
                                        closedToArrival: isCurrentlyTrue ? undefined : true,
                                        ctaAction: isCurrentlyTrue ? "none" : "true"
                                    });
                                }}
                                className={`${styles.toggleBtn} ${
                                    (rule.closedToArrival === true || rule.ctaAction === "close" || rule.ctaAction === "true") ? styles.toggleBtnClose : ""
                                }`}
                                title="Kunci Check-in (Closed to Arrival)"
                            >
                                <Ban size={12} />
                                <span>Closed</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const isCurrentlyFalse = rule.closedToArrival === false || rule.ctaAction === "open" || rule.ctaAction === "false";
                                    onChange({
                                        closedToArrival: isCurrentlyFalse ? undefined : false,
                                        ctaAction: isCurrentlyFalse ? "none" : "false"
                                    });
                                }}
                                className={`${styles.toggleBtn} ${
                                    (rule.closedToArrival === false || rule.ctaAction === "open" || rule.ctaAction === "false") ? styles.toggleBtnOpen : ""
                                }`}
                                title="Buka Check-in (Open to Arrival)"
                            >
                                <Check size={12} />
                                <span>Open</span>
                            </button>
                        </div>
                        <span className={`${styles.channexCodePill} ${
                            (rule.closedToArrival === true || rule.ctaAction === "close" || rule.ctaAction === "true")
                                ? styles.channexCodePillActive
                                : (rule.closedToArrival === false || rule.ctaAction === "open" || rule.ctaAction === "false")
                                ? styles.channexCodePillFalse
                                : ""
                        }`}>
                            Status: {rule.closedToArrival === true || rule.ctaAction === "close" || rule.ctaAction === "true" ? "Closed" : (rule.closedToArrival === false || rule.ctaAction === "open" || rule.ctaAction === "false" ? "Open" : "Tidak Diubah")}
                        </span>
                    </div>
                </div>
            )}

            {/* 8. CTD (Closed to Departure) */}
            {metrics.includes("ctd") && (
                <div className={styles.rowItem}>
                    <div className={styles.rowLabelCol}>
                        <Ctd3DIcon size={38} />
                        <div>
                            <span className={styles.metricName}>Closed to Departure (CTD)</span>
                            <span className={styles.metricSub}>Status: Closed (Kunci Check-out) / Open (Buka Check-out)</span>
                        </div>
                    </div>
                    <div className={styles.rowInputsCol}>
                        <div className={styles.toggleButtonGroup}>
                            <button
                                type="button"
                                onClick={() => {
                                    const isCurrentlyTrue = rule.closedToDeparture === true || rule.ctdAction === "close" || rule.ctdAction === "true";
                                    onChange({
                                        closedToDeparture: isCurrentlyTrue ? undefined : true,
                                        ctdAction: isCurrentlyTrue ? "none" : "true"
                                    });
                                }}
                                className={`${styles.toggleBtn} ${
                                    (rule.closedToDeparture === true || rule.ctdAction === "close" || rule.ctdAction === "true") ? styles.toggleBtnClose : ""
                                }`}
                                title="Kunci Check-out (Closed to Departure)"
                            >
                                <Ban size={12} />
                                <span>Closed</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const isCurrentlyFalse = rule.closedToDeparture === false || rule.ctdAction === "open" || rule.ctdAction === "false";
                                    onChange({
                                        closedToDeparture: isCurrentlyFalse ? undefined : false,
                                        ctdAction: isCurrentlyFalse ? "none" : "false"
                                    });
                                }}
                                className={`${styles.toggleBtn} ${
                                    (rule.closedToDeparture === false || rule.ctdAction === "open" || rule.ctdAction === "false") ? styles.toggleBtnOpen : ""
                                }`}
                                title="Buka Check-out (Open to Departure)"
                            >
                                <Check size={12} />
                                <span>Open</span>
                            </button>
                        </div>
                        <span className={`${styles.channexCodePill} ${
                            (rule.closedToDeparture === true || rule.ctdAction === "close" || rule.ctdAction === "true")
                                ? styles.channexCodePillActive
                                : (rule.closedToDeparture === false || rule.ctdAction === "open" || rule.ctdAction === "false")
                                ? styles.channexCodePillFalse
                                : ""
                        }`}>
                            Status: {rule.closedToDeparture === true || rule.ctdAction === "close" || rule.ctdAction === "true" ? "Closed" : (rule.closedToDeparture === false || rule.ctdAction === "open" || rule.ctdAction === "false" ? "Open" : "Tidak Diubah")}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
