'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Check, Search, Calendar } from 'lucide-react';
import styles from './innalytics.module.css';
import {
  InnalyticsFilterState,
  ALL_CHANNELS,
  PORTFOLIO_HOTELS,
  PORTFOLIO_COUNTRIES,
  PORTFOLIO_TRAVEL_AGENTS
} from './useInnalyticsData';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: InnalyticsFilterState;
  onApply: (newFilters: InnalyticsFilterState) => void;
  availableChannels?: string[];
  availableHotels?: { code: string; name: string }[];
  availableTravelAgents?: string[];
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const formatMonthDisplay = (ymStr: string) => {
  if (!ymStr) return 'Sep-2026';
  const parts = ymStr.split('-');
  if (parts.length < 2) return ymStr;
  const y = parts[0];
  const m = parts[1];
  const idx = parseInt(m, 10) - 1;
  return `${MONTH_NAMES_SHORT[idx] || m}-${y}`;
};

const formatDayDisplay = (ymdStr: string) => {
  if (!ymdStr) return '';
  const parts = ymdStr.split('-');
  if (parts.length < 3) return ymdStr;
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  return `${d}/${m}/${y}`;
};

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  availableChannels,
  availableHotels,
  availableTravelAgents
}) => {
  const [localState, setLocalState] = useState<InnalyticsFilterState>(filters);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [hotelDropdownOpen, setHotelDropdownOpen] = useState(false);
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');

  // Date picker states
  const [singleMonth, setSingleMonth] = useState(
    filters.startDate ? filters.startDate.slice(0, 7) : '2026-09'
  );
  const [rangeStartMonth, setRangeStartMonth] = useState('2026-06');
  const [rangeEndMonth, setRangeEndMonth] = useState('2026-09');
  const [selectedYear, setSelectedYear] = useState(
    filters.startDate ? filters.startDate.slice(0, 4) : '2026'
  );

  useEffect(() => {
    if (isOpen) {
      setLocalState(filters);
      setChannelDropdownOpen(false);
      setHotelDropdownOpen(false);
      setEntityDropdownOpen(false);
      setHotelSearchQuery('');
      if (filters.startDate) {
        setSingleMonth(filters.startDate.slice(0, 7));
        setSelectedYear(filters.startDate.slice(0, 4));
      }
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const channelList =
    availableChannels && availableChannels.length > 0
      ? availableChannels
      : ALL_CHANNELS;

  const hotelList =
    availableHotels && availableHotels.length > 0
      ? availableHotels
      : [];

  const filteredHotelsList = hotelList.filter((h) =>
    h.name.toLowerCase().includes(hotelSearchQuery.toLowerCase())
  );

  const selectedHotels = localState.selectedHotels || [];

  const isAllHotelsSelected =
    selectedHotels.length > 0 &&
    hotelList.every((h) =>
      selectedHotels.includes(h.name) || selectedHotels.includes(h.code)
    );

  const handleToggleAllHotels = () => {
    if (isAllHotelsSelected) {
      setLocalState((prev) => ({ ...prev, selectedHotels: [] }));
    } else {
      setLocalState((prev) => ({
        ...prev,
        selectedHotels: hotelList.map((h) => h.name)
      }));
    }
  };

  const toggleHotel = (name: string) => {
    setLocalState((prev) => {
      const current = prev.selectedHotels || [];
      const exists = current.includes(name);
      const next = exists
        ? current.filter((n) => n !== name)
        : [...current, name];
      return { ...prev, selectedHotels: next };
    });
  };

  const removeHotel = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalState((prev) => ({
      ...prev,
      selectedHotels: (prev.selectedHotels || []).filter((n) => n !== name)
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

  const toggleEntity = (item: string) => {
    setLocalState((prev) => {
      const current = prev.selectedEntities || [];
      const exists = current.includes(item);
      const next = exists ? current.filter((i) => i !== item) : [...current, item];
      return { ...prev, selectedEntities: next };
    });
  };

  const removeEntity = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalState((prev) => ({
      ...prev,
      selectedEntities: (prev.selectedEntities || []).filter((i) => i !== item)
    }));
  };

  const handleSingleMonthChange = (val: string) => {
    if (!val) return;
    setSingleMonth(val);
    const [y, m] = val.split('-');
    const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
    setLocalState((prev) => ({
      ...prev,
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    }));
  };

  const handleRangeStartMonthChange = (val: string) => {
    if (!val) return;
    setRangeStartMonth(val);
    const [yS, mS] = val.split('-');
    const [yE, mE] = rangeEndMonth.split('-');
    const lastDay = new Date(parseInt(yE), parseInt(mE), 0).getDate();
    setLocalState((prev) => ({
      ...prev,
      startDate: `${yS}-${mS}-01`,
      endDate: `${yE}-${mE}-${String(lastDay).padStart(2, '0')}`
    }));
  };

  const handleRangeEndMonthChange = (val: string) => {
    if (!val) return;
    setRangeEndMonth(val);
    const [yS, mS] = rangeStartMonth.split('-');
    const [yE, mE] = val.split('-');
    const lastDay = new Date(parseInt(yE), parseInt(mE), 0).getDate();
    setLocalState((prev) => ({
      ...prev,
      startDate: `${yS}-${mS}-01`,
      endDate: `${yE}-${mE}-${String(lastDay).padStart(2, '0')}`
    }));
  };

  const handleYearChange = (val: string) => {
    if (!val) return;
    setSelectedYear(val);
    setLocalState((prev) => ({
      ...prev,
      startDate: `${val}-01-01`,
      endDate: `${val}-12-31`
    }));
  };

  const handleFilterTypeChange = (type: string) => {
    if (type === 'Monthly') {
      const ym = singleMonth || '2026-09';
      const [y, m] = ym.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      setLocalState((prev) => ({
        ...prev,
        filterType: type,
        startDate: `${y}-${m}-01`,
        endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`
      }));
    } else if (type === 'Custom Month Range') {
      const [yS, mS] = rangeStartMonth.split('-');
      const [yE, mE] = rangeEndMonth.split('-');
      const lastDay = new Date(parseInt(yE), parseInt(mE), 0).getDate();
      setLocalState((prev) => ({
        ...prev,
        filterType: type,
        startDate: `${yS}-${mS}-01`,
        endDate: `${yE}-${mE}-${String(lastDay).padStart(2, '0')}`
      }));
    } else if (type === 'Yearly') {
      const y = selectedYear || '2026';
      setLocalState((prev) => ({
        ...prev,
        filterType: type,
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`
      }));
    } else {
      // Custom Date Range
      setLocalState((prev) => ({
        ...prev,
        filterType: 'Custom Date Range',
        startDate: prev.startDate || '2026-09-15',
        endDate: prev.endDate || '2026-09-22'
      }));
    }
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
              <option value="stay_date">Stay Date</option>
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
              onChange={(e) => {
                const val = e.target.value as any;
                setLocalState((prev) => {
                  const nextHotels =
                    val === 'hotel' && (!prev.selectedHotels || prev.selectedHotels.length === 0)
                      ? hotelList.map((h) => h.name)
                      : prev.selectedHotels;
                  return {
                    ...prev,
                    filterBy: val,
                    selectedHotels: nextHotels
                  };
                });
              }}
            >
              <option value="hotel">Hotel</option>
              <option value="channel">Channel</option>
              <option value="country">Country</option>
              <option value="travel_agent">Travel Agent</option>
              <option value="room_type">Room Type</option>
              <option value="rate_plan">Rate Plan</option>
            </select>
          </div>

          {/* DYNAMIC ENTITY SELECTOR */}
          {/* 1. Hotel Selector */}
          {localState.filterBy === 'hotel' && (
            <div className={styles.formField} style={{ position: 'relative' }}>
              <label className={styles.fieldLabel}>Select Hotel</label>
              <div className={styles.hotelSelectWrapper}>
                <div
                  className={styles.hotelSelectBox}
                  onClick={() => setHotelDropdownOpen((prev) => !prev)}
                >
                  <div className={styles.hotelChipsArea}>
                    {selectedHotels.length > 0 ? (
                      <>
                        <span className={styles.hotelChip}>
                          {selectedHotels[0]}
                          <button
                            type="button"
                            className={styles.hotelChipClose}
                            onClick={(e) => removeHotel(selectedHotels[0], e)}
                          >
                            ×
                          </button>
                        </span>
                        {selectedHotels.length > 1 && (
                          <span className={styles.hotelCountBadge}>
                            + {selectedHotels.length - 1} ...
                          </span>
                        )}
                      </>
                    ) : null}
                    <input
                      type="text"
                      className={styles.hotelSearchInput}
                      value={hotelSearchQuery}
                      onChange={(e) => {
                        setHotelSearchQuery(e.target.value);
                        setHotelDropdownOpen(true);
                      }}
                      onFocus={() => setHotelDropdownOpen(true)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={selectedHotels.length === 0 ? 'Select Hotel...' : ''}
                    />
                  </div>
                  <Search size={15} className={styles.hotelSearchIcon} />
                </div>

                {hotelDropdownOpen && (
                  <div
                    className={styles.hotelDropdownMenu}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={styles.hotelDropdownHeader}
                      onClick={handleToggleAllHotels}
                    >
                      {isAllHotelsSelected ? 'Deselect all' : 'Select all'}
                    </div>
                    {filteredHotelsList.map((hotel) => {
                      const isSelected =
                        selectedHotels.includes(hotel.name) ||
                        selectedHotels.includes(hotel.code);
                      return (
                        <div
                          key={hotel.code || hotel.name}
                          className={styles.hotelDropdownItem}
                          onClick={() => toggleHotel(hotel.name)}
                        >
                          <span>{hotel.name}</span>
                          {isSelected && (
                            <Check size={16} className={styles.hotelCheckIcon} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Channel Selector */}
          {localState.filterBy === 'channel' && (
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
                        type="button"
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
          )}

          {/* 3. Country Selector */}
          {localState.filterBy === 'country' && (
            <div className={styles.formField} style={{ position: 'relative' }}>
              <label className={styles.fieldLabel}>Select Country</label>
              <div
                className={styles.pillContainer}
                onClick={() => setEntityDropdownOpen(!entityDropdownOpen)}
                style={{ cursor: 'pointer' }}
              >
                {(!localState.selectedEntities || localState.selectedEntities.length === 0) ? (
                  <span style={{ fontSize: '12px', color: '#a0aec0', padding: '4px' }}>
                    All Countries
                  </span>
                ) : (
                  localState.selectedEntities.slice(0, 3).map((c) => (
                    <span key={c} className={styles.pillTag}>
                      {c}
                      <button
                        type="button"
                        className={styles.pillRemove}
                        onClick={(e) => removeEntity(c, e)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
                {localState.selectedEntities && localState.selectedEntities.length > 3 && (
                  <span className={styles.pillTag}>
                    +{localState.selectedEntities.length - 3}...
                  </span>
                )}
                <ChevronDown
                  size={14}
                  style={{ marginLeft: 'auto', alignSelf: 'center', color: '#718096' }}
                />
              </div>

              {entityDropdownOpen && (
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
                  {PORTFOLIO_COUNTRIES.map((c) => {
                    const isChecked = (localState.selectedEntities || []).includes(c);
                    return (
                      <div
                        key={c}
                        onClick={() => toggleEntity(c)}
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
                        <span>{c}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. Travel Agent Selector */}
          {localState.filterBy === 'travel_agent' && (
            <div className={styles.formField} style={{ position: 'relative' }}>
              <label className={styles.fieldLabel}>Select Travelagent</label>
              <div
                className={styles.pillContainer}
                onClick={() => setEntityDropdownOpen(!entityDropdownOpen)}
                style={{ cursor: 'pointer' }}
              >
                {(!localState.selectedEntities || localState.selectedEntities.length === 0) ? (
                  <span style={{ fontSize: '12px', color: '#a0aec0', padding: '4px' }}>
                    All Travel Agents
                  </span>
                ) : (
                  localState.selectedEntities.slice(0, 3).map((a) => (
                    <span key={a} className={styles.pillTag}>
                      {a}
                      <button
                        type="button"
                        className={styles.pillRemove}
                        onClick={(e) => removeEntity(a, e)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
                {localState.selectedEntities && localState.selectedEntities.length > 3 && (
                  <span className={styles.pillTag}>
                    +{localState.selectedEntities.length - 3}...
                  </span>
                )}
                <ChevronDown
                  size={14}
                  style={{ marginLeft: 'auto', alignSelf: 'center', color: '#718096' }}
                />
              </div>

              {entityDropdownOpen && (
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
                  {(availableTravelAgents && availableTravelAgents.length > 0
                    ? availableTravelAgents
                    : PORTFOLIO_TRAVEL_AGENTS.map((t) => t.name)
                  ).map((agentName) => {
                    const isChecked = (localState.selectedEntities || []).includes(agentName);
                    return (
                      <div
                        key={agentName}
                        onClick={() => toggleEntity(agentName)}
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
                        <span>{agentName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filter Type * */}
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
              <option value="Monthly">Monthly</option>
              <option value="Custom Month Range">Custom Month Range</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>

          {/* Variance Checkbox (Always positioned right under Filter Type as in screenshots) */}
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

          {/* Dynamic Date/Month/Year Pickers matching reference screenshots */}
          {/* A. Monthly: Single Month Picker box e.g. Sep-2026 */}
          {localState.filterType === 'Monthly' && (
            <div className={styles.formField}>
              <div className={styles.datePickerBox}>
                <span className={styles.datePickerText}>
                  {formatMonthDisplay(singleMonth)}
                </span>
                <Calendar size={14} className={styles.datePickerIcon} />
                <input
                  type="month"
                  className={styles.hiddenNativeInput}
                  value={singleMonth}
                  onChange={(e) => handleSingleMonthChange(e.target.value)}
                />
              </div>

              {/* Day Wise checkbox (present under month picker in Screenshot 1) */}
              <label className={styles.checkboxLabel} style={{ marginTop: '6px' }}>
                <input
                  type="checkbox"
                  checked={localState.dayWise || false}
                  onChange={(e) =>
                    setLocalState((prev) => ({ ...prev, dayWise: e.target.checked }))
                  }
                />
                <span>Day Wise</span>
              </label>
            </div>
          )}

          {/* B. Custom Date Range: Two Date Pickers side-by-side e.g. 15/09/2026 & 22/09/2026 */}
          {localState.filterType === 'Custom Date Range' && (
            <div className={styles.formField}>
              <div className={styles.datePickerRow}>
                <div className={styles.datePickerBox}>
                  <span className={styles.datePickerText}>
                    {formatDayDisplay(localState.startDate)}
                  </span>
                  <Calendar size={14} className={styles.datePickerIcon} />
                  <input
                    type="date"
                    className={styles.hiddenNativeInput}
                    value={localState.startDate}
                    onChange={(e) =>
                      setLocalState((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className={styles.datePickerBox}>
                  <span className={styles.datePickerText}>
                    {formatDayDisplay(localState.endDate)}
                  </span>
                  <Calendar size={14} className={styles.datePickerIcon} />
                  <input
                    type="date"
                    className={styles.hiddenNativeInput}
                    value={localState.endDate}
                    onChange={(e) =>
                      setLocalState((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* C. Custom Month Range: Two Month Pickers side-by-side e.g. Jun-2026 & Sep-2026 */}
          {localState.filterType === 'Custom Month Range' && (
            <div className={styles.formField}>
              <div className={styles.datePickerRow}>
                <div className={styles.datePickerBox}>
                  <span className={styles.datePickerText}>
                    {formatMonthDisplay(rangeStartMonth)}
                  </span>
                  <Calendar size={14} className={styles.datePickerIcon} />
                  <input
                    type="month"
                    className={styles.hiddenNativeInput}
                    value={rangeStartMonth}
                    onChange={(e) => handleRangeStartMonthChange(e.target.value)}
                  />
                </div>
                <div className={styles.datePickerBox}>
                  <span className={styles.datePickerText}>
                    {formatMonthDisplay(rangeEndMonth)}
                  </span>
                  <Calendar size={14} className={styles.datePickerIcon} />
                  <input
                    type="month"
                    className={styles.hiddenNativeInput}
                    value={rangeEndMonth}
                    onChange={(e) => handleRangeEndMonthChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* D. Yearly: Single Year Picker box e.g. 2026 */}
          {localState.filterType === 'Yearly' && (
            <div className={styles.formField}>
              <div className={styles.datePickerBox}>
                <span className={styles.datePickerText}>{selectedYear}</span>
                <Calendar size={14} className={styles.datePickerIcon} />
                <select
                  className={styles.hiddenNativeInput}
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  <option value="2027">2027</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>
          )}

          {/* Discard Record with No Data Checkbox */}
          <label className={styles.checkboxLabel} style={{ marginTop: '2px' }}>
            <input
              type="checkbox"
              checked={localState.discardNoData}
              onChange={(e) =>
                setLocalState((prev) => ({
                  ...prev,
                  discardNoData: e.target.checked
                }))
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
