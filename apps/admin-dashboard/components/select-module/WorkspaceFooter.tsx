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

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
  const formattedDate = time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="absolute bottom-3 md:bottom-4 left-0 w-full px-6 md:px-12 lg:px-16 pb-2 select-none z-10 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-2 pointer-events-none">
      {/* Left side: Time System */}
      <div className="text-[11px] text-zinc-900/40 dark:text-zinc-100/30 pointer-events-auto flex items-center gap-2.5 font-sans font-light tracking-wide">
        <span className="tracking-wide text-[10.5px] font-medium opacity-80">Time System</span>
        <span className="opacity-40 text-[9px]">•</span>
        <span className="font-medium tracking-widest">{mounted ? formattedTime : '--:--:--'}</span>
        <span className="opacity-40 text-[9px]">•</span>
        <span className="tracking-wider">{mounted ? formattedDate : '---'}</span>
      </div>

      {/* Right side: Copyright */}
      <div className="text-[11px] text-zinc-900/40 dark:text-zinc-100/30 pointer-events-auto flex items-center gap-1.5">
        <span className="font-sans font-light tracking-normal">Powered by</span>
        <span className="font-serif italic font-light tracking-wide">© 2026 Nexura Global Hospitality.</span>
        <span className="font-sans font-light tracking-normal opacity-80">All rights reserved.</span>
      </div>
    </div>
  );
};
