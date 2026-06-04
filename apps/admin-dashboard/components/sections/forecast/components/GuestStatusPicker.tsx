"use client";

import React from "react";
import { Clock, UserCheck, LogOut, AlertCircle } from "lucide-react";
import styles from "../ForecastStyles.module.css";

interface GuestStatusPickerProps {
    current: string;
    onChange: (val: string) => void;
}

export function GuestStatusPicker({ current, onChange }: GuestStatusPickerProps) {
    const statuses = [
        { id: 'arriving', label: 'Arriving', color: '#3b82f6', icon: <Clock size={10} /> },
        { id: 'checked_in', label: 'Checked In', color: '#10b981', icon: <UserCheck size={10} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#71717a', icon: <LogOut size={10} /> },
        { id: 'no_show', label: 'No Show', color: '#ef4444', icon: <AlertCircle size={10} /> },
    ];

    return (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", maxWidth: "120px" }}>
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    className={styles.guestSubtext}
                    style={{ 
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "7px",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        transition: "all var(--f-duration-fast)",
                        backgroundColor: current === s.id ? `${s.color}10` : "transparent",
                        borderColor: current === s.id ? `${s.color}40` : "transparent",
                        border: "1px solid",
                        color: current === s.id ? s.color : "#a8a29e",
                        opacity: current === s.id ? 1 : 0.4
                    }}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );
}
