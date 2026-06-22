'use client';

import React from 'react';
import { Store, Percent, Hotel, Wallet } from 'lucide-react';
import { SummaryCard } from '@/components/sections/pnl/components/shared/SummaryCard';
import styles from '@/components/sections/pnl/components/sections/PNLSectionLayout.module.css';

interface FoodBeverageLedgerTabProps {
  activePnLStats: any;
  loading: boolean;
  onCardClick: (cardId: string) => void;
  viewScale: 'daily' | 'monthly';
}

export default function FoodBeverageLedgerTab({ activePnLStats, loading, onCardClick, viewScale }: FoodBeverageLedgerTabProps) {
  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Store size={22} />
          <span>Food & Beverage Ledger Overview ({viewScale === 'daily' ? 'Daily' : 'Monthly'})</span>
        </h2>
        <p className={styles.sectionSubtitle}>Food & Beverage Breakdown</p>
      </div>
      <div className={styles.innerContainer}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 xl:gap-10">
          <SummaryCard 
            label="Food A La Carte Revenue"
            value={activePnLStats?.revFoodAlacarte || 0}
            loading={loading}
            icon={<Store size={18} />}
            accent="#788069"
            bgVariant="revenue"
            onClick={onCardClick}
          />
          <SummaryCard 
            label="Beverage A La Carte Revenue"
            value={activePnLStats?.revBeverageAlacarte || 0}
            loading={loading}
            icon={<Store size={18} />}
            accent="#f59e0b"
            bgVariant="revenue"
            onClick={onCardClick}
          />
          <SummaryCard 
            label="Banquet Revenue"
            value={activePnLStats?.revBanquetRevenue || 0}
            loading={loading}
            icon={<Store size={18} />}
            accent="#d9a441"
            bgVariant="revenue"
            onClick={onCardClick}
          />
          <SummaryCard 
            label="Total F&B A la Carte Revenue"
            value={activePnLStats?.revTotalFnb || 0}
            loading={loading}
            icon={<Store size={18} />}
            accent="#eab308"
            bgVariant="revenue"
            onClick={onCardClick}
          />
          
          {/* Deductions */}
          <SummaryCard 
            label={`Service Charge (${activePnLStats?.posServiceRate || 0}%)`}
            value={activePnLStats?.posServiceCharge || 0}
            loading={loading}
            icon={<Percent size={18} />}
            accent="#8d7a52"
            bgVariant="amber"
          />
          <SummaryCard 
            label={`Tax (${activePnLStats?.posTaxRateIndividual || 0}%)`}
            value={activePnLStats?.posTaxAmount || 0}
            loading={loading}
            icon={<Percent size={18} />}
            accent="#788069"
            bgVariant="amber"
          />
          <SummaryCard 
            label={`Lost & Breakage (${activePnLStats?.posLostBreakageRate || 0}%)`}
            value={activePnLStats?.posLostBreakageAmount || 0}
            loading={loading}
            icon={<Percent size={18} />}
            accent="#ef4444"
            bgVariant="pink"
          />
          <SummaryCard 
            label={`Total Service & Tax (${activePnLStats?.posTaxRateCombined || 0}%)`}
            value={activePnLStats?.posTotalServiceTax || 0}
            loading={loading}
            icon={<Percent size={18} />}
            accent="#f59e0b"
            bgVariant="pink"
          />

          {/* Gross/Nett totals */}
          <SummaryCard 
            label="Gross Revenue"
            value={activePnLStats?.posGrossRevenue || 0}
            loading={loading}
            icon={<Hotel size={18} />}
            accent="#8d7a52"
            bgVariant="yellow"
          />
          <SummaryCard 
            label="Nett Revenue"
            value={activePnLStats?.posNettRevenue || 0}
            loading={loading}
            icon={<Wallet size={18} />}
            accent="#788069"
            bgVariant="revenue"
          />
        </div>
      </div>
    </div>
  );
}
