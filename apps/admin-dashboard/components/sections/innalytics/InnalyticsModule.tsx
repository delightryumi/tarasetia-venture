'use client';

import React, { useState } from 'react';
import styles from './innalytics.module.css';
import { InnalyticsHeader } from './InnalyticsHeader';
import { DashboardView } from './DashboardView';
import { ReportsView } from './ReportsView';
import { useAuth } from '@/context/AuthContext';

export default function InnalyticsModule() {
  const { activeHotelCode } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'reports'>('dashboard');

  return (
    <div className={styles.innalyticsRoot}>
      {/* Top Header Bar */}
      <InnalyticsHeader
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
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
