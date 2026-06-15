'use client';

import React, { useState, useEffect } from 'react';

interface WorkspaceFooterProps {
  onRefresh: () => Promise<void>;
  onSignOut: () => void;
  isRefreshing?: boolean;
}

export const WorkspaceFooter: React.FC<WorkspaceFooterProps> = () => {
  const [time, setTime] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    setMounted(true);
    // Calculate local GMT timezone offset
    const offsetMin = -new Date().getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMin) / 60);
    const offsetMinutes = Math.abs(offsetMin) % 60;
    const sign = offsetMin >= 0 ? '+' : '-';
    const gmt = `GMT${sign}${offsetHours}${offsetMinutes > 0 ? `:${offsetMinutes}` : ''}`;
    setTimezone(gmt);

    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
  const formattedDate = time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <footer className="absolute bottom-0 left-0 w-full px-6 md:px-12 lg:px-16 py-3.5 select-none z-20 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-2 border-t border-slate-200/50 dark:border-zinc-800/45 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
      {/* Left side: Time System */}
      <div className="text-[11px] flex items-center gap-2 font-mono text-slate-500 dark:text-zinc-400">
        <span className="font-sans font-medium text-slate-400 dark:text-zinc-500 text-[10.5px]">System Time</span>
        <span className="opacity-40 text-slate-300 dark:text-zinc-700 text-[9px]">•</span>
        <span className="font-semibold text-slate-700 dark:text-zinc-200 tabular-nums">
          {mounted ? formattedTime : '--:--:--'}
        </span>
        <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-medium tracking-tight">
          {mounted ? timezone : ''}
        </span>
        <span className="opacity-40 text-slate-300 dark:text-zinc-700 text-[9px]">•</span>
        <span className="text-slate-500 dark:text-zinc-350 font-medium">
          {mounted ? formattedDate : '---'}
        </span>
      </div>

      {/* Right side: Copyright */}
      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
        <span className="font-sans font-light tracking-normal text-slate-400 dark:text-zinc-500">Powered by</span>
        <span className="font-serif italic font-light tracking-wide text-slate-700 dark:text-zinc-300">© 2026 Tarasetia Venture.</span>
        <span className="font-sans font-light tracking-normal opacity-80 text-slate-400 dark:text-zinc-500">All rights reserved.</span>
      </div>
    </footer>
  );
};
