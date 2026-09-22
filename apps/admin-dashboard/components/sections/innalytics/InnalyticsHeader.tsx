'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  Wallet,
  LineChart,
  BarChart3,
  User,
  ChevronRight,
  Repeat
} from 'lucide-react';
import styles from './innalytics.module.css';
import { useAuth } from '@/context/AuthContext';

interface InnalyticsHeaderProps {
  currentTab: 'dashboard' | 'reports';
  onSelectTab: (tab: 'dashboard' | 'reports') => void;
}

export const InnalyticsHeader: React.FC<InnalyticsHeaderProps> = ({
  currentTab,
  onSelectTab
}) => {
  const router = useRouter();
  const { activeHotelCode, activeHotelName, hotelsList, setActiveHotelCode, user } = useAuth();
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  return (
    <header className={styles.topHeader}>
      {/* Left: Hotel Name & Property ID */}
      <div className={styles.headerLeft}>
        <div className={styles.propertyName}>{activeHotelName || 'Titik Damai Nexura Collection'}</div>
        <div className={styles.propertyId}>{activeHotelCode || '61872'}</div>
      </div>

      {/* Right: Quick Access & Navigation */}
      <div className={styles.headerRight}>
        {/* PMS Building Icon (Back to Select Module / PMS) */}
        <Link href="/select-module" title="Back to PMS Module Hub">
          <button className={styles.iconButton}>
            <Building2 size={18} />
          </button>
        </Link>

        {/* Channel Manager Link */}
        <Link href="/channel-manager" title="Go to Channel Manager">
          <button className={styles.iconButton}>
            <Globe size={18} />
          </button>
        </Link>

        {/* Cashier / Folio */}
        <Link href="/pos" title="POS / Cashier">
          <button className={styles.iconButton}>
            <Wallet size={18} />
          </button>
        </Link>

        {/* Dashboard Tab Icon */}
        <button
          className={`${styles.iconButton} ${currentTab === 'dashboard' ? styles.iconButtonActive : ''}`}
          onClick={() => onSelectTab('dashboard')}
          title="Dashboard"
        >
          <LineChart size={18} />
        </button>

        {/* Reports Tab Icon */}
        <button
          className={`${styles.iconButton} ${currentTab === 'reports' ? styles.iconButtonActive : ''}`}
          onClick={() => onSelectTab('reports')}
          title="Reports"
        >
          <BarChart3 size={18} />
        </button>

        {/* Badge 'B.' */}
        <div className={styles.iconBadge} title="Business Analytics">
          B.
        </div>

        {/* User Avatar */}
        <div className={styles.avatarCircle} title={user?.email || 'User'}>
          <User size={16} />
        </div>

        {/* Switch Property Button */}
        <div style={{ position: 'relative' }}>
          <button
            className={styles.switchPropertyBtn}
            onClick={() => setShowPropertyModal(!showPropertyModal)}
          >
            <Repeat size={12} />
            <span>Switch Property</span>
            <ChevronRight size={12} />
          </button>

          {/* Property Dropdown */}
          {showPropertyModal && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                width: '260px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e0',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 60,
                padding: '8px 0',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#718096',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #edf2f7'
                }}
              >
                Select Hotel Property
              </div>
              {hotelsList && hotelsList.length > 0 ? (
                hotelsList.map((hotel, idx) => {
                  const hCode = String(hotel.hotelCode || hotel.id || hotel.code || idx);
                  const hName = hotel.name || hotel.hotelName || 'Hotel';
                  return (
                    <div
                      key={hCode}
                      onClick={() => {
                        setActiveHotelCode(hCode);
                        setShowPropertyModal(false);
                        window.location.reload();
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        backgroundColor:
                          hCode === activeHotelCode ? '#eff6ff' : 'transparent',
                        color: hCode === activeHotelCode ? '#2563eb' : '#2d3748',
                        fontWeight: hCode === activeHotelCode ? 600 : 400
                      }}
                    >
                      <div>{hName}</div>
                      <div style={{ fontSize: '10px', color: '#718096' }}>
                        ID: {hCode}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '8px 12px', fontSize: '12px', color: '#a0aec0' }}>
                  Current: {activeHotelName || 'Hotel'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
