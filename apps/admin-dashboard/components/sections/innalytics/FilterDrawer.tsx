'use client';

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import styles from './innalytics.module.css';
import { InnalyticsFilterState, ALL_CHANNELS } from './useInnalyticsData';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: InnalyticsFilterState;
  onApply: (newFilters: InnalyticsFilterState) => void;
  availableChannels?: string[];
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  availableChannels
}) => {
  const [localState, setLocalState] = useState<InnalyticsFilterState>(filters);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const channelList =
    availableChannels && availableChannels.length > 0
      ? availableChannels
      : ALL_CHANNELS;

  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleFilterTypeChange = (type: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'Today') {
      // today to today
    } else if (type === 'Yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (type === 'This Week') {
      const day = today.getDay();
      start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      end = new Date(today);
    } else if (type === 'This Month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Full calendar month
    } else if (type === 'Last Month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (type === 'This Year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }

    setLocalState((prev) => ({
      ...prev,
      filterType: type,
      startDate: formatYMD(start),
      endDate: formatYMD(end)
    }));
  };

  const toggleChannel = (ch: string) => {
    setLocalState((prev) => {
      const exists = prev.selectedChannels.includes(ch);
      const next = exists
        ? prev.selectedChannels.filter((c) => c !== ch)
        : [...prev.selectedChannels, ch];
      return { ...prev, selectedChannels: next };
    });
  };

  const removeChannel = (ch: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalState((prev) => ({
      ...prev,
      selectedChannels: prev.selectedChannels.filter((c) => c !== ch)
    }));
  };

  const handleSubmit = () => {
    onApply(localState);
    onClose();
  };

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Search</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Form Body */}
        <div className={styles.drawerBody}>
          {/* Report By */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Report By <span className={styles.requiredAsterisk}>*</span>
            </label>
            <select
              className={styles.selectInput}
              value={localState.reportBy}
              onChange={(e) =>
                setLocalState((prev) => ({
                  ...prev,
                  reportBy: e.target.value as 'booking_date' | 'stay_date'
                }))
              }
            >
              <option value="booking_date">Booking Date</option>
              <option value="stay_date">Stay Date / Arrival Date</option>
            </select>
          </div>

          {/* Filter By */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Filter By <span className={styles.requiredAsterisk}>*</span>
            </label>
            <select
              className={styles.selectInput}
              value={localState.filterBy}
              onChange={(e) =>
                setLocalState((prev) => ({
                  ...prev,
                  filterBy: e.target.value as 'channel' | 'room_type' | 'rate_plan'
                }))
              }
            >
              <option value="channel">Channel</option>
              <option value="room_type">Room Type</option>
              <option value="rate_plan">Rate Plan</option>
            </select>
          </div>

          {/* Select Channel (Pills) */}
          <div className={styles.formField} style={{ position: 'relative' }}>
            <label className={styles.fieldLabel}>Select Channel</label>
            <div
              className={styles.pillContainer}
              onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
              style={{ cursor: 'pointer' }}
            >
              {localState.selectedChannels.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#a0aec0', padding: '4px' }}>
                  All Channels
                </span>
              ) : (
                localState.selectedChannels.slice(0, 3).map((ch) => (
                  <span key={ch} className={styles.pillTag}>
                    {ch}
                    <button
                      className={styles.pillRemove}
                      onClick={(e) => removeChannel(ch, e)}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
              {localState.selectedChannels.length > 3 && (
                <span className={styles.pillTag}>
                  +{localState.selectedChannels.length - 3}...
                </span>
              )}
              <ChevronDown
                size={14}
                style={{ marginLeft: 'auto', alignSelf: 'center', color: '#718096' }}
              />
            </div>

            {/* Dropdown for channel selection */}
            {channelDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 20,
                  maxHeight: '160px',
                  overflowY: 'auto',
                  padding: '6px 0'
                }}
              >
                {channelList.map((ch) => {
                  const isChecked = localState.selectedChannels.includes(ch);
                  return (
                    <div
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        backgroundColor: isChecked ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{ch}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter Type */}
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>
              Filter Type <span className={styles.requiredAsterisk}>*</span>
            </label>
            <select
              className={styles.selectInput}
              value={localState.filterType}
              onChange={(e) => handleFilterTypeChange(e.target.value)}
            >
              <option value="Custom Date Range">Custom Date Range</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Variance Checkbox */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={localState.variance}
              onChange={(e) =>
                setLocalState((prev) => ({ ...prev, variance: e.target.checked }))
              }
            />
            <span>Variance</span>
          </label>

          {/* Date Range Inputs */}
          <div className={styles.formField}>
            <div className={styles.dateRangeRow}>
              <input
                type="date"
                className={styles.textInput}
                value={localState.startDate}
                onChange={(e) =>
                  setLocalState((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
              <span style={{ fontSize: '12px', color: '#718096' }}>to</span>
              <input
                type="date"
                className={styles.textInput}
                value={localState.endDate}
                onChange={(e) =>
                  setLocalState((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Discard Record with No Data Checkbox */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={localState.discardNoData}
              onChange={(e) =>
                setLocalState((prev) => ({ ...prev, discardNoData: e.target.checked }))
              }
            />
            <span>Discard record with no data</span>
          </label>
        </div>

        {/* Drawer Footer */}
        <div className={styles.drawerFooter}>
          <button className={styles.searchSubmitBtn} onClick={handleSubmit}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
