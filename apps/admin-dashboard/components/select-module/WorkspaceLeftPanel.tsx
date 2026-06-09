'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, ShieldCheck, Database, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceLeftPanelProps {
  user: {
    displayName: string;
    email: string;
    role?: string;
  } | null;
  isSuperadmin: boolean;
}

export const WorkspaceLeftPanel: React.FC<WorkspaceLeftPanelProps> = ({ user, isSuperadmin }) => {
  const [time, setTime] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Welcome');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));

      const hours = now.getHours();
      if (hours < 12) {
        setGreeting('Good Morning');
      } else if (hours < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayRole = isSuperadmin ? 'Superadmin' : (user?.role || 'User');
  const userInitials = user?.displayName 
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'OP';

  return (
    <div className="w-full flex flex-col gap-6 md:gap-7 select-none text-[#141413] dark:text-[#faf9f5]">
      {/* Brand Header Section */}
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="flex items-center gap-2">
          {/* Anthropic style 4-spoke radial symbol (radial-spike mark) */}
          <span className="text-[#cc785c] font-black text-xl leading-none">✦</span>
          <img
            src="/channels/nexura-logo.png"
            alt="Nexura Logo"
            className="h-7 w-auto object-contain dark:brightness-0 dark:invert"
          />
        </div>
        <div className="text-center md:text-left mt-1">
          <p className="text-[10px] font-black tracking-[0.25em] text-[#cc785c] uppercase">
            Nexura Global Hospitality
          </p>
          <p className="text-[9px] font-medium tracking-wider text-[#6c6a64] dark:text-[#a09d96] uppercase mt-0.5">
            Central Reservation System
          </p>
        </div>
      </div>

      {/* Dynamic Greeting & Clock (Claude.com warm editorial design) */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#cc785c]">
          {greeting}
        </span>
        <h2 className="text-2xl sm:text-3xl font-normal tracking-tight leading-snug font-serif text-[#141413] dark:text-[#faf9f5]">
          Hello, <span className="italic block sm:inline text-[#141413] dark:text-[#faf9f5] font-serif font-light">{user?.displayName || 'Operator'}</span>
        </h2>
        {/* Real-time Clock */}
        <div className="flex items-center gap-2 mt-2 bg-[#efe9de]/50 dark:bg-[#252320]/50 px-3 py-1.5 rounded-md border border-[#e6dfd8] dark:border-zinc-800 shadow-sm w-fit">
          <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
          <span className="text-xs font-mono font-bold tracking-widest text-[#3d3d3a] dark:text-[#faf9f5]">
            {time || '--:--:--'}
          </span>
        </div>
      </div>

      {/* Identity Card (Claude.com card design) */}
      <div className="w-full rounded-lg bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-zinc-800 p-4 sm:p-5 transition-all duration-300">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-[#e8e0d2] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-zinc-800 flex items-center justify-center text-[#cc785c] font-serif italic font-bold text-sm shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[#141413] dark:text-[#faf9f5] truncate tracking-wide">
              {user?.displayName || 'Loading...'}
            </h4>
            <p className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] truncate mt-0.5">
              {user?.email || '...'}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-[#e6dfd8] dark:bg-zinc-800 my-4" />

        {/* Access Level */}
        <div className="flex items-center justify-between gap-3 text-[10px]">
          <span className="uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96] font-bold">
            Access Credentials
          </span>
          <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#faf9f5] dark:bg-[#181715] border border-[#e6dfd8] dark:border-zinc-800 text-[#cc785c]">
            {displayRole}
          </span>
        </div>
      </div>

      {/* Diagnostics Panel (Claude.com mock product status style) */}
      <div className="w-full rounded-lg bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-zinc-800 p-4 sm:p-5 flex flex-col gap-3">
        <h5 className="text-[9px] uppercase tracking-[0.15em] font-extrabold text-[#cc785c]">
          System Diagnostics
        </h5>
        
        <div className="flex flex-col gap-3">
          {/* Cloud Database */}
          <div className="flex items-center justify-between text-[11px] group/item">
            <div className="flex items-center gap-2 text-[#3d3d3a] dark:text-[#a09d96] font-medium">
              <Database className="w-3.5 h-3.5 text-[#5db8a6]" />
              <span>Cloud Database</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5db8a6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#5db8a6]"></span>
              </span>
              <span className="font-bold text-[10px] text-[#141413] dark:text-[#faf9f5]">Connected</span>
            </div>
          </div>

          {/* Security Audits */}
          <div className="flex items-center justify-between text-[11px] group/item">
            <div className="flex items-center gap-2 text-[#3d3d3a] dark:text-[#a09d96] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#cc785c]" />
              <span>Security Shield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600 dark:bg-emerald-500"></span>
              </span>
              <span className="font-bold text-[10px] text-[#141413] dark:text-[#faf9f5]">Active</span>
            </div>
          </div>

          {/* Core System */}
          <div className="flex items-center justify-between text-[11px] group/item">
            <div className="flex items-center gap-2 text-[#3d3d3a] dark:text-[#a09d96] font-medium">
              <Server className="w-3.5 h-3.5 text-[#e8a55a]" />
              <span>System Core</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600 dark:bg-emerald-500"></span>
              </span>
              <span className="font-bold text-[10px] text-[#141413] dark:text-[#faf9f5]">Stable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
