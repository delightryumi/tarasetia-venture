'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './innalytics.module.css';
import { InnalyticsHeader } from './InnalyticsHeader';
import { DashboardView } from './DashboardView';
import { ReportsView } from './ReportsView';
import { useAuth } from '@/context/AuthContext';

function InnalyticsContent() {
  const { activeHotelCode } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get('view') as 'dashboard' | 'reports' | null;
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'reports'>(
    viewParam === 'reports' ? 'reports' : 'dashboard'
  );

  useEffect(() => {
    if (viewParam === 'reports' || viewParam === 'dashboard') {
      setCurrentTab(viewParam);
    }
  }, [viewParam]);

  const handleSelectTab = (tab: 'dashboard' | 'reports') => {
    setCurrentTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', tab);
    router.replace(`/innalytics?${params.toString()}`);
  };

  return (
    <div className={styles.innalyticsRoot}>
      {/* Top Header Bar */}
      <InnalyticsHeader
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Tab View */}
      {currentTab === 'dashboard' ? (
        <DashboardView activeHotelCode={activeHotelCode} />
      ) : (
        <ReportsView activeHotelCode={activeHotelCode} />
      )}
    </div>
  );
}

export default function InnalyticsModule() {
  return (
    <Suspense fallback={<div className={styles.innalyticsRoot} style={{ padding: 24 }}><p style={{ color: "var(--s-muted)", fontSize: 13 }}>Memuat Innalytics...</p></div>}>
      <InnalyticsContent />
    </Suspense>
  );
}
