'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Clock, StickyNote, Building2, Calendar as CalendarIcon } from 'lucide-react';

// === Widget: Clock & Date (Flat Design) ===
const ClockWidget = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-[96px] bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 animate-pulse rounded-lg" />;

  const formatterTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formatterSec = new Intl.DateTimeFormat('id-ID', { second: '2-digit' });
  
  const formatterDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex justify-between items-center p-6 rounded-[12px] bg-[#faf8f4] dark:bg-[#262626] border border-neutral-200 dark:border-transparent shadow-sm relative overflow-hidden">
      <div className="flex flex-col gap-1 z-10">
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1">
          <CalendarIcon size={13} />
          <span className="text-[11px] font-semibold tracking-wide uppercase">
            {formatterDate.format(time)}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {formatterTime.format(time).replace('.', ':')}
          </span>
          <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-500">
            {formatterSec.format(time)}
          </span>
        </div>
      </div>
      <Clock size={42} strokeWidth={1} className="text-neutral-200 dark:text-neutral-800 z-0" />
    </div>
  );
};

// === Widget: Private Notes (Flat Design) ===
const PrivateNotesWidget = () => {
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crs_private_notes');
    if (saved) setNote(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    setIsSaving(true);
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('crs_private_notes', val);
      setIsSaving(false);
    }, 800);
    
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="flex flex-col p-6 rounded-[12px] bg-[#faf8f4] dark:bg-[#262626] border border-neutral-200 dark:border-transparent shadow-sm h-full min-h-[220px]">
      <div className="flex items-center justify-between mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
          <StickyNote size={14} />
          <span className="text-xs font-bold uppercase tracking-wide">Private Notes</span>
        </div>
        {isSaving ? (
          <span className="text-[10px] font-bold tracking-wider text-blue-500 animate-pulse">SAVING...</span>
        ) : (
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500">SAVED</span>
        )}
      </div>
      <textarea
        value={note}
        onChange={handleChange}
        placeholder="Enter your notes or quick to-do list here..."
        className="w-full h-full flex-grow resize-none bg-transparent border-none outline-none text-[13px] text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 custom-scrollbar leading-relaxed"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      />
    </div>
  );
};

// === Main Container ===
interface WorkspaceWidgetsProps {
  user: {
    displayName: string;
    email: string;
    role?: string;
  } | null;
  isSuperadmin: boolean;
}

export const WorkspaceWidgets: React.FC<WorkspaceWidgetsProps> = ({ user, isSuperadmin }) => {
  const { activeHotelName, activeHotelCode } = useAuth();
  
  const userName = user?.displayName || user?.email?.split('@')[0] || "Administrator";
  const userRole = isSuperadmin ? "Superadmin" : (user?.role || "System Admin");
  
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      
      {/* 1. Greeting & Profile Widget */}
      <div className="flex flex-col p-6 rounded-[12px] bg-[#faf8f4] dark:bg-[#262626] border border-neutral-200 dark:border-transparent shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-0.5">{greeting},</span>
            <span className="text-lg font-bold text-neutral-900 dark:text-white leading-tight truncate">{userName}</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-500 font-medium capitalize mt-1 bg-neutral-100 dark:bg-neutral-800 w-fit px-2 py-0.5 rounded">{userRole}</span>
          </div>
          <div 
            className="w-12 h-12 rounded overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800"
          >
            <img 
              src={`/avatar/memo_${((((userName || "U").charCodeAt(0) || 0) + 5) % 35) + 1}.png`} 
              alt={userName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* 2. System Status Widget */}
      <div className="flex flex-col p-6 rounded-[12px] bg-[#faf8f4] dark:bg-[#262626] border border-neutral-200 dark:border-transparent shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-neutral-400" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">Active Workspace</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-neutral-800 dark:text-neutral-200 leading-snug">
            {activeHotelCode === "0" || !activeHotelCode ? "Setara Central Registry" : activeHotelName}
          </span>
          <span className="text-[11px] font-semibold text-neutral-400 mt-1 uppercase">
            ID: {activeHotelCode === "0" || !activeHotelCode ? "SUPERADMIN" : activeHotelCode}
          </span>
        </div>
      </div>

      {/* 3. Clock Widget */}
      <ClockWidget />

      {/* 4. Private Notes Widget */}
      <div className="flex-grow flex flex-col min-h-[220px]">
        <PrivateNotesWidget />
      </div>

    </div>
  );
};
