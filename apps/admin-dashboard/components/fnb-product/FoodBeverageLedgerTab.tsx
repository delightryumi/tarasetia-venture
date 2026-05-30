'use client';

import React from 'react';
import { Store, Percent, Hotel, Wallet } from 'lucide-react';
import ds from './fnb-product.module.css';

// ── Custom POS-Inspired Card Component ──
function FnbStatCard({ label, value, loading, icon, variantClass, onClick }: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  variantClass: string;
  onClick?: (id: string) => void;
}) {
  return (
    <div 
      className={`${ds.statCard} ${variantClass}`}
      onClick={() => onClick && onClick(label)}
    >
      <div className="flex flex-col h-full justify-between w-full">
        <div className="flex justify-between items-start w-full gap-2">
          <span className={ds.statLabel}>{label}</span>
          <div className={ds.statIcon}>{icon}</div>
        </div>
        <div className={ds.statVal}>
          {loading ? "—" : `Rp ${Math.round(value).toLocaleString("id-ID")}`}
        </div>
      </div>
    </div>
  );
}

interface FoodBeverageLedgerTabProps {
  activePnLStats: any;
  loading: boolean;
  onCardClick: (cardId: string) => void;
  viewScale: 'daily' | 'monthly';
}

export default function FoodBeverageLedgerTab({ activePnLStats, loading, onCardClick, viewScale }: FoodBeverageLedgerTabProps) {
  return (
    <div className={ds.forestCard}>
      <div className={ds.forestTitle}>
        <Store size={22} />
        <span>Food & Beverage Ledger Overview ({viewScale === 'daily' ? 'Daily' : 'Monthly'})</span>
      </div>
      <div className={ds.statGrid}>
        <FnbStatCard 
          label="Food A La Carte Revenue"
          value={activePnLStats?.revFoodAlacarte || 0}
          loading={loading}
          icon={<Store size={18} />}
          variantClass={ds.peachCard}
          onClick={onCardClick}
        />
        <FnbStatCard 
          label="Beverage A La Carte Revenue"
          value={activePnLStats?.revBeverageAlacarte || 0}
          loading={loading}
          icon={<Store size={18} />}
          variantClass={ds.mintCard}
          onClick={onCardClick}
        />
        <FnbStatCard 
          label="Banquet Revenue"
          value={activePnLStats?.revBanquetRevenue || 0}
          loading={loading}
          icon={<Store size={18} />}
          variantClass={ds.creamCard}
          onClick={onCardClick}
        />
        <FnbStatCard 
          label="Total F&B A la Carte Revenue"
          value={activePnLStats?.revTotalFnb || 0}
          loading={loading}
          icon={<Store size={18} />}
          variantClass={ds.yellowCard}
          onClick={onCardClick}
        />
        
        {/* Deductions */}
        <FnbStatCard 
          label={`Service Charge (${activePnLStats?.posServiceRate || 0}%)`}
          value={activePnLStats?.posServiceCharge || 0}
          loading={loading}
          icon={<Percent size={18} />}
          variantClass={ds.softCard}
        />
        <FnbStatCard 
          label={`Tax (${activePnLStats?.posTaxRateIndividual || 0}%)`}
          value={activePnLStats?.posTaxAmount || 0}
          loading={loading}
          icon={<Percent size={18} />}
          variantClass={ds.softCard}
        />
        <FnbStatCard 
          label={`Lost & Breakage (${activePnLStats?.posLostBreakageRate || 0}%)`}
          value={activePnLStats?.posLostBreakageAmount || 0}
          loading={loading}
          icon={<Percent size={18} />}
          variantClass={ds.softCard}
        />
        <FnbStatCard 
          label={`Total Service & Tax (${activePnLStats?.posTaxRateCombined || 0}%)`}
          value={activePnLStats?.posTotalServiceTax || 0}
          loading={loading}
          icon={<Percent size={18} />}
          variantClass={ds.softCard}
        />

        {/* Gross/Nett totals */}
        <FnbStatCard 
          label="Gross Revenue"
          value={activePnLStats?.posGrossRevenue || 0}
          loading={loading}
          icon={<Hotel size={18} />}
          variantClass={ds.darkCard}
        />
        <FnbStatCard 
          label="Nett Revenue"
          value={activePnLStats?.posNettRevenue || 0}
          loading={loading}
          icon={<Wallet size={18} />}
          variantClass={ds.darkCard}
        />
      </div>
    </div>
  );
}
