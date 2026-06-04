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
        { id: 'clean', label: 'Clean', color: '#10b981', icon: <Sparkles size={10} /> },
        { id: 'dirty', label: 'Dirty', color: '#f59e0b', icon: <Droplets size={10} /> },
        { id: 'maintenance', label: 'Maint.', color: '#ef4444', icon: <Hammer size={10} /> },
    ];

    const active = statuses.find(s => s.id === current) || statuses[1];

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    title={s.label}
                    style={{ 
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        cursor: "pointer",
                        transition: "all var(--f-duration-fast)",
                        backgroundColor: current === s.id ? `${s.color}15` : "transparent",
                        borderColor: current === s.id ? s.color : "transparent",
                        color: s.color,
                        opacity: current === s.id ? 1 : 0.3
                    }}
                >
                    {s.icon}
                </button>
            ))}
            <span className={styles.guestSubtext} style={{ fontSize: "8px", fontWeight: "bold", color: active.color, marginLeft: "4px" }}>
                {active.label}
            </span>
        </div>
    );
}
