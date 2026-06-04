"use client";

import React from "react";
import { Sparkles, Droplets, Hammer, Clock, UserCheck, LogOut, AlertCircle } from "lucide-react";

/* ── Status Picker Components ── */

export function RoomStatusPicker({ current, onChange }: { current: string, onChange: (val: string) => void }) {
    const statuses = [
        { id: 'clean', label: 'Clean', color: '#10b981', icon: <Sparkles size={10} /> },
        { id: 'dirty', label: 'Dirty', color: '#f59e0b', icon: <Droplets size={10} /> },
        { id: 'maintenance', label: 'Maint.', color: '#ef4444', icon: <Hammer size={10} /> },
    ];

    const active = statuses.find(s => s.id === current) || statuses[1];

    return (
        <div className="flex items-center gap-1">
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
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 border ${
                        current === s.id 
                            ? 'scale-110 shadow-sm' 
                            : 'opacity-20 grayscale hover:opacity-100 hover:grayscale-0'
                    }`}
                    style={{ 
                        backgroundColor: current === s.id ? `${s.color}15` : 'transparent',
                        borderColor: current === s.id ? s.color : 'transparent',
                        color: s.color 
                    }}
                >
                    {s.icon}
                </button>
            ))}
            <span className="text-[8px] font-bold uppercase tracking-tighter ml-1" style={{ color: active.color }}>
                {active.label}
            </span>
        </div>
    );
}

export function GuestStatusPicker({ current, onChange }: { current: string, onChange: (val: string) => void }) {
    const statuses = [
        { id: 'arriving', label: 'Arriving', color: '#3b82f6', icon: <Clock size={10} /> },
        { id: 'checked_in', label: 'Checked In', color: '#10b981', icon: <UserCheck size={10} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#71717a', icon: <LogOut size={10} /> },
        { id: 'no_show', label: 'No Show', color: '#ef4444', icon: <AlertCircle size={10} /> },
    ];

    const active = statuses.find(s => s.id === current) || statuses[0];

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-[120px]">
            {statuses.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    onClick={(e) => { 
                        console.log("GuestStatusPicker button clicked", s.id); 
                        e.stopPropagation(); 
                        onChange(s.id); 
                    }}
                    className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest transition-all duration-200 border ${
                        current === s.id 
                            ? 'shadow-sm translate-y-[-1px]' 
                            : 'opacity-40 hover:opacity-100'
                    }`}
                    style={{ 
                        backgroundColor: current === s.id ? `${s.color}10` : 'transparent',
                        borderColor: current === s.id ? `${s.color}40` : 'transparent',
                        color: current === s.id ? s.color : '#a8a29e'
                    }}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );
}

/* ── Static Badge Versions for Overview Cards ── */
export function RoomStatusBadge({ current }: { current: string }) {
    const statuses = [
        { id: 'clean', label: 'Clean', color: '#10b981', icon: <Sparkles size={10} /> },
        { id: 'dirty', label: 'Dirty', color: '#f59e0b', icon: <Droplets size={10} /> },
        { id: 'maintenance', label: 'Maint.', color: '#ef4444', icon: <Hammer size={10} /> },
    ];
    const active = statuses.find(s => s.id === current) || statuses[1];

    return (
        <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
            style={{ backgroundColor: `${active.color}10`, borderColor: `${active.color}30`, color: active.color }}
        >
            {active.icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{active.label}</span>
        </div>
    );
}

export function GuestStatusBadge({ current }: { current: string }) {
    const statuses = [
        { id: 'arriving', label: 'Arriving', color: '#3b82f6', icon: <Clock size={10} /> },
        { id: 'checked_in', label: 'Checked In', color: '#10b981', icon: <UserCheck size={10} /> },
        { id: 'checked_out', label: 'Checked Out', color: '#71717a', icon: <LogOut size={10} /> },
        { id: 'no_show', label: 'No Show', color: '#ef4444', icon: <AlertCircle size={10} /> },
    ];
    const active = statuses.find(s => s.id === current) || statuses[0];

    return (
        <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border"
            style={{ backgroundColor: `${active.color}10`, borderColor: `${active.color}30`, color: active.color }}
        >
            {active.icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{active.label}</span>
        </div>
    );
}
