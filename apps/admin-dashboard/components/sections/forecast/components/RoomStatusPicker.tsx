"use client";

import React from "react";
import { Sparkles, Droplets, Hammer } from "lucide-react";
import styles from "../ForecastStyles.module.css";

interface RoomStatusPickerProps {
    current: string;
    onChange: (val: string) => void;
}

export function RoomStatusPicker({ current, onChange }: RoomStatusPickerProps) {
    const statuses = [
        { id: 'clean', label: 'Clean', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: <Sparkles size={10} /> },
        { id: 'dirty', label: 'Dirty', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: <Droplets size={10} /> },
        { id: 'maintenance', label: 'Maint.', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <Hammer size={10} /> },
    ];

    const active = statuses.find(s => s.id === current) || statuses[1];

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {statuses.map((s) => {
                const isActive = current === s.id;
                return (
                    <button
                        key={s.id}
                        onClick={() => onChange(s.id)}
                        title={s.label}
                        style={{ 
                            width: "22px",
                            height: "22px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid",
                            cursor: "pointer",
                            transition: "all var(--f-duration-fast)",
                            backgroundColor: isActive ? s.bg : "var(--f-canvas)",
                            borderColor: isActive ? s.border : "var(--f-hairline)",
                            color: isActive ? s.color : "var(--f-light-muted)",
                            boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                            opacity: isActive ? 1 : 0.65
                        }}
                    >
                        {s.icon}
                    </button>
                );
            })}
            <span className={styles.guestSubtext} style={{ fontSize: "9px", fontWeight: 700, color: active.color, marginLeft: "4px" }}>
                {active.label}
            </span>
        </div>
    );
}
