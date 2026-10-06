import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  Wallet,
  LineChart,
  BarChart3,
  User,
  ChevronDown,
  Check
} from 'lucide-react';
import styles from './innalytics.module.css';
import selectStyles from '@/app/select-module/select-module.module.css';
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
  const propertyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        propertyDropdownRef.current &&
        !propertyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPropertyModal(false);
      }
    };
    if (showPropertyModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPropertyModal]);

  return (
    <header className={`${styles.topHeader} no-print`}>
      {/* Left: Brand Logo, Hotel Name & Property ID */}
      <div className={styles.headerLeft}>
        <Link href="/select-module" title="Kembali ke Menu Modul" className={styles.headerLogoLink}>
          <img
            src="/channels/5.png"
            alt="My Tara"
            className={styles.headerLogo}
          />
        </Link>
        <div className={styles.headerPropertyText}>
          <div className={styles.propertyName}>{activeHotelName || 'Titik Damai Nexura Collection'}</div>
          <div className={styles.propertyId}>{activeHotelCode || '61872'}</div>
        </div>
      </div>

      {/* Right: Quick Access & Navigation */}
      <div className={styles.headerRight}>
        {/* Switch Property Pill Dropdown */}
        <div className={selectStyles.hotelSelectorWrap} ref={propertyDropdownRef}>
          <button
            type="button"
            className={`${selectStyles.hotelPillBtn} ${showPropertyModal ? selectStyles.hotelPillBtnActive : ''}`}
            onClick={() => setShowPropertyModal(!showPropertyModal)}
            title="Ganti Properti / Hotel Aktif"
          >
            <span className="truncate max-w-[160px] sm:max-w-[220px]">
              {`[${activeHotelCode || '0'}] ${activeHotelName || 'Pilih Properti'}`}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 shrink-0 ${showPropertyModal ? 'rotate-180' : ''}`}
            />
          </button>

          {showPropertyModal && (
            <div className={selectStyles.hotelDropdownCard}>
              <div className={selectStyles.hotelDropdownHeader}>Pilih Properti Aktif</div>
              {hotelsList && hotelsList.length > 0 ? (
                hotelsList.map((hotel, idx) => {
                  const hCode = String(hotel.hotelCode || hotel.id || hotel.code || idx);
                  const hName = hotel.name || hotel.hotelName || 'Hotel';
                  const isSelected = String(activeHotelCode) === hCode;
                  return (
                    <button
                      key={hCode}
                      type="button"
                      onClick={() => {
                        setActiveHotelCode(hCode);
                        setShowPropertyModal(false);
                        window.location.reload();
                      }}
                      className={`${selectStyles.hotelDropdownItem} ${isSelected ? selectStyles.hotelDropdownItemActive : ''}`}
                    >
                      <div className="flex items-center gap-2 truncate text-left">
                        <span className={selectStyles.hotelCodeBadge}>{hCode}</span>
                        <span className="truncate">{hName}</span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>
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

        {/* PMS Building Icon (Back to Select Module / PMS) */}
        <Link href="/select-module" title="Back to PMS Module Hub" className={styles.navShortcut}>
          <button className={styles.iconButton}>
            <Building2 size={18} />
          </button>
        </Link>

        {/* Channel Manager Link */}
        <Link href="/channel-manager" title="Go to Channel Manager" className={styles.navShortcut}>
          <button className={styles.iconButton}>
            <Globe size={18} />
          </button>
        </Link>

        {/* Cashier / Folio */}
        <Link href="/pos" title="POS / Cashier" className={styles.navShortcut}>
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

        {/* User Avatar */}
        <div className={styles.avatarCircle} title={user?.email || 'User'}>
          <User size={16} />
        </div>
      </div>
    </header>
  );
};
