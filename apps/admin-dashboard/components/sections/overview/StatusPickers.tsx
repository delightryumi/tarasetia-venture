"use client";

import React from "react";
import { Sparkles, Droplets, Hammer, Clock, UserCheck, LogOut, AlertCircle } from "lucide-react";

/* ── Status Picker Components ── */

export function RoomStatusPicker({ current, onChange }: { current: string, onChange: (val: string) => void }) {
    const statuses = [
        { id: 'clean', label: 'Clean', color: '#212121', icon: <Sparkles size={12} /> },
        { id: 'dirty', label: 'Dirty', color: '#f59e0b', icon: <Droplets size={12} /> },
        { id: 'maintenance', label: 'Maint.', color: '#ef4444', icon: <Hammer size={12} /> },
    ];

    return (
        <div className="flex flex-wrap items-center justify-start gap-1.5 mt-1">
            {statuses.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    onClick={(e) => { 
                        console.log("RoomStatusPicker button clicked", s.id); 
                        e.stopPropagation(); 
                        onChange(s.id); 
                    }}
                    title={s.label}
                    className={`transition-all duration-200 border flex items-center justify-center gap-1.5 ${
                        current === s.id 
                            ? 'shadow-sm translate-y-[-1px]' 
                            : 'opacity-40 hover:opacity-100'
                    }`}
                    style={{ 
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        backgroundColor: current === s.id ? 'var(--color-neutral-100, #f7f5f0)' : 'transparent',
                        borderColor: current === s.id ? 'var(--color-neutral-300, #dccfb7)' : 'var(--f-hairline, rgba(141, 122, 82, 0.12))',
                        color: current === s.id ? s.color : '#a8a29e',
                        borderRadius: '6px',
                        outline: 'none',
                        boxShadow: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {s.icon}
                    <span>{s.label}</span>
                </button>
            ))}
        </div>
    );
}

export function GuestStatusPicker({ current, onChange }: { current: string, onChange: (val: string) => void }) {
    const statuses = [
        { id: 'arriving', label: 'Arriving', color: '#3b82f6', icon: <Clock size={12} /> },
        { id: 'checked_in', label: 'Checked In', color: '#212121', icon: <UserCheck size={12} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#71717a', icon: <LogOut size={12} /> },
        { id: 'no_show', label: 'No Show', color: '#ef4444', icon: <AlertCircle size={12} /> },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', width: '100%', maxWidth: '240px', margin: '0 auto' }}>
            {statuses.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    onClick={(e) => { 
                        console.log("GuestStatusPicker button clicked", s.id); 
                        e.stopPropagation(); 
                        onChange(s.id); 
                    }}
                    className={`transition-all duration-200 border flex items-center justify-center gap-1.5 ${
                        current === s.id 
                            ? 'shadow-sm translate-y-[-1px]' 
                            : 'opacity-40 hover:opacity-100'
                    }`}
                    style={{ 
                        height: '32px',
                        padding: '0 12px',
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        backgroundColor: current === s.id ? 'var(--color-neutral-100, #f7f5f0)' : 'transparent',
                        borderColor: current === s.id ? 'var(--color-neutral-300, #dccfb7)' : 'var(--f-hairline, rgba(141, 122, 82, 0.12))',
                        color: current === s.id ? s.color : '#a8a29e',
                        borderRadius: '6px',
                        outline: 'none',
                        boxShadow: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {s.icon}
                    <span>{s.label}</span>
                </button>
            ))}
        </div>
    );
}

/* ── Static Badge Versions for Overview Cards ── */
export function RoomStatusBadge({ current }: { current: string }) {
    const statuses = [
        { id: 'clean', label: 'Clean', color: '#212121', icon: <Sparkles size={10} /> },
        { id: 'dirty', label: 'Dirty', color: '#f59e0b', icon: <Droplets size={10} /> },
        { id: 'maintenance', label: 'Maint.', color: '#ef4444', icon: <Hammer size={10} /> },
    ];
    const active = statuses.find(s => s.id === current) || statuses[1];

    return (
        <div 
            className="flex items-center justify-center gap-1 border"
            style={{ 
                height: '22px',
                padding: '0 8px',
                fontSize: '8px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'var(--color-neutral-100, #f7f5f0)',
                borderColor: 'var(--color-neutral-300, #dccfb7)',
                color: active.color,
                borderRadius: '5px',
                boxShadow: 'none'
            }}
        >
            {active.icon}
            <span>{active.label}</span>
        </div>
    );
}

export function GuestStatusBadge({ current }: { current: string }) {
    const statuses = [
        { id: 'arriving', label: 'Arriving', color: '#3b82f6', icon: <Clock size={10} /> },
        { id: 'checked_in', label: 'Checked In', color: '#212121', icon: <UserCheck size={10} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#71717a', icon: <LogOut size={10} /> },
        { id: 'no_show', label: 'No Show', color: '#ef4444', icon: <AlertCircle size={10} /> },
    ];
    const active = statuses.find(s => s.id === current) || statuses[0];

    return (
        <div 
            className="flex items-center justify-center gap-1 border"
            style={{ 
                height: '22px',
                padding: '0 8px',
                fontSize: '8px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: 'var(--color-neutral-100, #f7f5f0)',
                borderColor: 'var(--color-neutral-300, #dccfb7)',
                color: active.color,
                borderRadius: '5px',
                boxShadow: 'none'
            }}
        >
            {active.icon}
            <span>{active.label}</span>
        </div>
    );
}
