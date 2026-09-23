'use client';

import React from 'react';
import { Store, Activity, Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VsCard } from '@/components/sections/pnl/components/shared/VsCard';
import { PNLDrillDownModal } from '@/components/sections/pnl/components/PNLDrillDownModal';
import { useFnBStats, MONTHS, YEARS } from './useFnBStats';

import layoutDs from './fnb-layout.module.css';
import datepickerDs from './fnb-datepicker.module.css';
import cardsDs from './fnb-cards.module.css';
const ds = { ...layoutDs, ...datepickerDs, ...cardsDs };

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as any } },
};

export default function FoodBeveragePerformancePage() {
  const {
    month, setMonth, displayMonth,
    dateFilter, setDateFilter, displayDate,
    viewScale, setViewScale,
    showMonthPicker, setShowMonthPicker,
    showDatePicker, setShowDatePicker,
    monthPickerRef, datePickerRef,
    viewYear, setViewYear, viewMonth, setViewMonth,
    cells,
    pnlLoading, activePnLStats,
    drillDown, handleExportDrillExcel
  } = useFnBStats();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="purchasing-root">
      <div>
        {/* Header */}
        <div className={ds.headerWrapper}>
          <div className={ds.headerTitleSec}>
            <h1 className={ds.title}>Category Performance</h1>
            <p className={ds.subtitle}>
              Perbandingan dan analisis efisiensi biaya (Revenue vs Expenses) per kategori F&amp;B ({viewScale === 'daily' ? 'Harian' : 'Bulanan'}).
            </p>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className={ds.filterBar}>
          <div className={ds.filterGroup}>
            <span className={ds.filterLabel}>Rentang Waktu</span>
            <div className={ds.toggleContainer}>
              <button 
                type="button"
                className={`${ds.toggleBtn} ${viewScale === 'monthly' ? ds.toggleBtnActive : ds.toggleBtnInactive}`}
                onClick={() => setViewScale('monthly')}
              >
                Bulanan
              </button>
              <button 
                type="button"
                className={`${ds.toggleBtn} ${viewScale === 'daily' ? ds.toggleBtnActive : ds.toggleBtnInactive}`}
                onClick={() => setViewScale('daily')}
              >
                Harian
              </button>
            </div>
          </div>

          {viewScale === 'monthly' ? (
            <div className={ds.filterGroup}>
              <span className={ds.filterLabel}>Pilih Bulan</span>
              <div className="relative" ref={monthPickerRef}>
                <button 
                  type="button"
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className={ds.datepickerTrigger}
                >
                  <Calendar size={14} style={{ color: '#7a7a7a' }} />
                  <span>{displayMonth || 'Pilih Bulan'}</span>
                  <ChevronDown size={12} style={{ color: '#7a7a7a' }} />
                </button>

                <AnimatePresence>
                  {showMonthPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={ds.datepickerDropdown}
                    >
                      <div className={ds.monthPickerGrid}>
                        {YEARS.map(y => (
                          <div key={y} className={ds.monthPickerYearCol}>
                            <div className={ds.monthPickerYearTitle}>{y}</div>
                            <div className={ds.monthPickerBtnGrid}>
                              {MONTHS.map(m => {
                                const val = `${y}-${m.v}`;
                                const isActive = month === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                      setMonth(val);
                                      setShowMonthPicker(false);
                                    }}
                                    className={`${ds.monthPickerBtn} ${isActive ? ds.monthPickerBtnActive : ds.monthPickerBtnInactive}`}
                                  >
                                    {m.n}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className={ds.filterGroup}>
              <span className={ds.filterLabel}>Tanggal Order</span>
              <div className="relative" ref={datePickerRef}>
                <button 
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={ds.datepickerTrigger}
                >
                  <Calendar size={14} style={{ color: '#7a7a7a' }} />
                  <span>{displayDate || 'Pilih Tanggal'}</span>
                  <ChevronDown size={12} style={{ color: '#7a7a7a' }} />
                </button>

                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={ds.datepickerDropdown}
                    >
                      <div className={ds.dailyCalendarWrapper}>
                        <div className={ds.dailyCalendarHeader}>
                          <button 
                            type="button"
                            onClick={() => {
                              if (viewMonth === 0) {
                                setViewMonth(11);
                                setViewYear(y => y - 1);
                              } else {
                                setViewMonth(m => m - 1);
                              }
                            }}
                            className="p-1 hover:bg-neutral-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className={ds.dailyCalendarTitle}>
                            {MONTHS[viewMonth].n} {viewYear}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                              if (viewMonth === 11) {
                                setViewMonth(0);
                                setViewYear(y => y + 1);
                              } else {
                                setViewMonth(m => m + 1);
                              }
                            }}
                            className="p-1 hover:bg-neutral-100 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        <div className={ds.dailyCalendarDaysHead}>
                          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                            <div key={d} className={ds.dailyCalendarDayName}>{d}</div>
                          ))}
                        </div>

                        <div className={ds.dailyCalendarGrid}>
                          {cells.map((day, idx) => {
                            if (day === null) {
                              return <div key={`empty-${idx}`} className={ds.dailyCalendarCell} />;
                            }
                            const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isActive = dateFilter === cellDateStr;
                            const isToday = new Date().toISOString().split('T')[0] === cellDateStr;
                            return (
                              <div key={day} className={ds.dailyCalendarCell}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDateFilter(cellDateStr);
                                    setShowDatePicker(false);
                                  }}
                                  className={`${ds.dailyCalendarDayBtn} ${isActive ? ds.dailyCalendarDayBtnActive : ds.dailyCalendarDayBtnInactive} ${isToday && !isActive ? ds.dailyCalendarDayBtnToday : ''}`}
                                >
                                  {day}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {dateFilter && (
                <button className={ds.clearBtn} onClick={() => setDateFilter('')}>
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category Performance Grid */}
        <div className={ds.signatureLayout}>
          <div className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 xl:gap-10">
              <VsCard 
                label="Food A la Carte Performance"
                icon={<Store size={18} />}
                revenue={activePnLStats?.revFoodAlacarte || 0}
                expenses={activePnLStats?.expFoodAlacarte || 0}
                loading={pnlLoading}
                onClick={drillDown.handleCardClick}
                accent="#8d7a52"
                costLabel="Food Cost"
                healthyThreshold={30}
                warningThreshold={40}
                serviceRate={activePnLStats?.posServiceRate || 0}
                taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
                lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
              />
              <VsCard 
                label="Banquet Performance"
                icon={<Store size={18} />}
                revenue={activePnLStats?.revBanquet || 0}
                expenses={activePnLStats?.expBanquet || 0}
                loading={pnlLoading}
                onClick={drillDown.handleCardClick}
                accent="#d9a441"
                costLabel="Banquet Cost"
                healthyThreshold={45}
                warningThreshold={50}
                serviceRate={activePnLStats?.posServiceRate || 0}
                taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
                lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
              />
              <VsCard 
                label="Total F&B A la Carte Performance"
                icon={<Store size={18} />}
                revenue={activePnLStats?.revAlacarte || 0}
                expenses={activePnLStats?.expAlacarte || 0}
                loading={pnlLoading}
                onClick={drillDown.handleCardClick}
                accent="#fcab79"
                costLabel="Total Cost"
                healthyThreshold={30}
                warningThreshold={40}
                serviceRate={activePnLStats?.posServiceRate || 0}
                taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
                lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
              />
              <VsCard 
                label="Beverage A la Carte Performance"
                icon={<Store size={18} />}
                revenue={activePnLStats?.revBeverageAlacarte || 0}
                expenses={activePnLStats?.expBeverageAlacarte || 0}
                loading={pnlLoading}
                onClick={drillDown.handleCardClick}
                accent="#a8d8c4"
                costLabel="Beverage Cost"
                healthyThreshold={18}
                warningThreshold={25}
                serviceRate={activePnLStats?.posServiceRate || 0}
                taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
                lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drill-down Detail Modal from PNL */}
      <PNLDrillDownModal
        isOpen={drillDown.isDrillDownModalOpen}
        onClose={drillDown.closeModal}
        selectedDrillDown={drillDown.selectedDrillDown}
        modalData={drillDown.modalData}
        isFbPerformanceCard={drillDown.isFbPerformanceCard}
        fbPerformanceData={drillDown.fbPerformanceData}
        costConfig={drillDown.costConfig}
        modalBadgeInfo={drillDown.modalBadgeInfo}
        drillDownSearchQuery={drillDown.drillDownSearchQuery}
        setDrillDownSearchQuery={drillDown.setDrillDownSearchQuery}
        drillDownTab={drillDown.drillDownTab}
        setDrillDownTab={drillDown.setDrillDownTab}
        onExportDrillExcel={handleExportDrillExcel}
        month={viewScale === 'daily' ? dateFilter : month}
      />
    </motion.div>
  );
}
