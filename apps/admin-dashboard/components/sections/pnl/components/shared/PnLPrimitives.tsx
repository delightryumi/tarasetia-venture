"use client";

import React from "react";
import { TrendingUp, TrendingDown, Hash, Equal } from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";

/* ══════════════════════════════════════════════════════
   SOURCE PILL — coloured badge per booking channel
══════════════════════════════════════════════════════ */
const SOURCE_PALETTE: Record<string, { bg: string; color: string; border: string }> = {
    "TIKET.COM": { bg: "#E6F1FB", color: "#185FA5", border: "#B5D4F4" },
    AGODA: { bg: "#FAEEDA", color: "#854F0B", border: "#FAC775" },
    "WALK-IN": { bg: "#E1F5EE", color: "#0F6E56", border: "#9FE1CB" },
    POS: { bg: "#EEEDFE", color: "#534AB7", border: "#AFA9EC" },
};

export function SourcePill({ label }: { label: string }) {
    const s = SOURCE_PALETTE[label?.toUpperCase()] ?? {
        bg: "#F1EFE8", color: "#5F5E5A", border: "#D3D1C7",
    };
    return (
        <span
            style={{
                display: "inline-flex", alignItems: "center",
                padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 500,
                letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
                background: s.bg, color: s.color, border: `0.5px solid ${s.border}`,
            }}
        >
            {label}
        </span>
    );
}

/* ══════════════════════════════════════════════════════
   DOC TAG
══════════════════════════════════════════════════════ */
export function DocTag({ label }: { label: string }) {
    return (
        <span
            style={{
                display: "inline-flex", padding: "3px 8px",
                background: "var(--color-bg-2, #F5F5F3)",
                border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 6,
                fontSize: 10, fontWeight: 500,
                color: "var(--color-text-2, #888)",
                textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    );
}

/* ══════════════════════════════════════════════════════
   STAT CARD — inside the drill-down modal stats strip
══════════════════════════════════════════════════════ */
type StatVariant = "neutral" | "income" | "expense";

const STAT_ICON_STYLE: Record<StatVariant, { bg: string; color: string }> = {
    neutral: { bg: "var(--f-surface-soft, #f5f2eb)", color: "var(--p-muted, #787466)" },
    income: { bg: "var(--f-income-bg, #E1F5EE)", color: "var(--f-income-color, #0F6E56)" },
    expense: { bg: "var(--f-expense-bg, #FCEBEB)", color: "var(--f-expense-color, #A32D2D)" },
};
const STAT_VALUE_COLOR: Record<StatVariant, string> = {
    neutral: "var(--foreground, #111)", income: "var(--f-income-color, #0F6E56)", expense: "var(--f-expense-color, #A32D2D)",
};

export function StatCard({
    icon: Icon, label, value, variant = "neutral",
}: {
    icon: React.ElementType; label: string; value: string; variant?: StatVariant;
}) {
    return (
        <div
            style={{
                background: "var(--f-canvas, #faf8f4)", border: "0.5px solid var(--f-hairline, rgba(141, 122, 82, 0.12))",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
            }}
        >
            <div
                style={{
                    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: STAT_ICON_STYLE[variant].bg,
                    color: STAT_ICON_STYLE[variant].color,
                }}
            >
                <Icon size={18} />
            </div>
            <div>
                <p style={{ fontSize: 11, color: "var(--p-muted, #787466)", marginBottom: 3 }}>{label}</p>
                <p
                    style={{
                        fontSize: 15, fontWeight: 500,
                        fontFamily: "var(--font-mono, monospace)",
                        color: STAT_VALUE_COLOR[variant],
                    }}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   DESIGN TOKENS (re-exported for modal reuse)
══════════════════════════════════════════════════════ */
export const MODAL_TOKENS = {
    surface:  "var(--f-canvas, #faf8f4)",
    surface2: "var(--f-surface, #f5f2eb)",
    border:   "0.5px solid var(--f-hairline, rgba(141, 122, 82, 0.12))",
    borderSm: "0.5px solid var(--f-hairline, rgba(141, 122, 82, 0.2))",
    textPri:  "var(--foreground, #212121)",
    textSec:  "var(--p-muted, #787466)",
    mono:     "var(--font-mono, 'JetBrains Mono', monospace)",
    radius:   10,
} as const;
