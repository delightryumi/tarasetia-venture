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
        { id: 'arriving', label: 'Arriving', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: <Clock size={10} /> },
        { id: 'checked_in', label: 'Checked In', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: <UserCheck size={10} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb', icon: <LogOut size={10} /> },
        { id: 'no_show', label: 'No Show', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <AlertCircle size={10} /> },
    ];

    return (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", maxWidth: "130px" }}>
            {statuses.map((s) => {
                const isActive = current === s.id;
                return (
                    <button
                        key={s.id}
                        onClick={() => onChange(s.id)}
                        className={styles.guestSubtext}
                        style={{ 
                            padding: "3px 6px",
                            borderRadius: "5px",
                            fontSize: "8px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                            transition: "all var(--f-duration-fast)",
                            backgroundColor: isActive ? s.bg : "var(--f-canvas)",
                            borderColor: isActive ? s.border : "var(--f-hairline)",
                            border: "1px solid",
                            color: isActive ? s.color : "var(--f-muted)",
                            boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                            opacity: isActive ? 1 : 0.75
                        }}
                    >
                        {s.label}
                    </button>
                );
            })}
        </div>
    );
}
