'use client';

import React from 'react';
import { Store, Activity } from 'lucide-react';
import ds from './fnb-product.module.css';

function FnbVsCard({ label, icon, revenue, expenses, loading, onClick, accentColor, costLabel, healthyThreshold, warningThreshold, serviceRate, taxRateIndividual, lostBreakageRate }: {
  label: string;
  icon: React.ReactNode;
  revenue: number;
  expenses: number;
  loading: boolean;
  onClick?: (id: string) => void;
  accentColor: string;
  costLabel: string;
  healthyThreshold: number;
  warningThreshold: number;
  serviceRate: number;
  taxRateIndividual: number;
  lostBreakageRate: number;
}) {
  const taxRateCombined = serviceRate + taxRateIndividual + lostBreakageRate;
  const nettRevenue = taxRateCombined > 0 ? revenue / (1 + taxRateCombined / 100) : revenue;
  const costPercentage = nettRevenue > 0 ? (expenses / nettRevenue) * 100 : 0;
  const isHealthy = costPercentage <= healthyThreshold;
  const isWarning = costPercentage > healthyThreshold && costPercentage <= warningThreshold;

  const healthClass = costPercentage === 0 
    ? ds.healthNeutral 
    : isHealthy 
    ? ds.healthHealthy 
    : isWarning 
    ? ds.healthWarning 
    : ds.healthCritical;

  const badgeText = costPercentage === 0
    ? "No Data"
    : isHealthy
    ? `Healthy (≤${healthyThreshold}%)`
    : isWarning
    ? `Warning (${healthyThreshold}-${warningThreshold}%)`
    : `Critical (>${warningThreshold}%)`;

  return (
    <div 
      className={ds.vsCard}
      onClick={() => onClick && onClick(label)}
    >
      <div className={ds.vsCardHeader}>
        <span className={ds.vsCardTitle}>{label}</span>
        <span className={`${ds.vsBadge} ${healthClass}`} style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
          {badgeText}
        </span>
      </div>

      <div className={ds.vsValues}>
        <div className={ds.vsValGroup}>
          <span className={ds.vsValLabel}>Nett Revenue</span>
          <span className={ds.vsVal}>{loading ? "—" : `Rp ${Math.round(nettRevenue).toLocaleString("id-ID")}`}</span>
        </div>
        <div className={ds.vsValGroup} style={{ paddingLeft: 16, borderLeft: '1px solid #e0e0e0' }}>
          <span className={ds.vsValLabel}>Expenses</span>
          <span className={ds.vsVal}>{loading ? "—" : `Rp ${Math.round(expenses).toLocaleString("id-ID")}`}</span>
        </div>
      </div>

      <div className={ds.vsProgressContainer}>
        <div className={ds.vsProgressHeader}>
          <span className={ds.vsProgressLabel}>{costLabel} Percentage</span>
          <span className={ds.vsProgressVal}>{loading ? "—" : `${costPercentage.toFixed(1)}%`}</span>
        </div>
        <div className={ds.vsProgressBarBg}>
          <div 
            className={ds.vsProgressBarFill} 
            style={{ 
              width: `${Math.min(costPercentage, 100)}%`, 
              backgroundColor: accentColor 
            }} 
          />
        </div>
      </div>
    </div>
  );
}

interface FoodBeveragePerformanceTabProps {
  activePnLStats: any;
  loading: boolean;
  onCardClick: (cardId: string) => void;
  viewScale: 'daily' | 'monthly';
}

export default function FoodBeveragePerformanceTab({ activePnLStats, loading, onCardClick, viewScale }: FoodBeveragePerformanceTabProps) {
  return (
    <div className={ds.canvasCard}>
      <div className={ds.canvasTitle}>
        <Activity size={22} />
        <span>Category Performance Analysis ({viewScale === 'daily' ? 'Daily' : 'Monthly'})</span>
      </div>
      <div className={ds.vsGrid}>
        <FnbVsCard 
          label="Food A la Carte Performance"
          icon={<Store size={18} />}
          revenue={activePnLStats?.revFoodAlacarte || 0}
          expenses={activePnLStats?.expFoodAlacarte || 0}
          loading={loading}
          onClick={onCardClick}
          accentColor="#0066cc" // Action Blue
          costLabel="Food Cost"
          healthyThreshold={30}
          warningThreshold={40}
          serviceRate={activePnLStats?.posServiceRate || 0}
          taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
          lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
        />
        <FnbVsCard 
          label="Banquet Performance"
          icon={<Store size={18} />}
          revenue={activePnLStats?.revBanquet || 0}
          expenses={activePnLStats?.expBanquet || 0}
          loading={loading}
          onClick={onCardClick}
          accentColor="#d9a441" // Gold/Cream
          costLabel="Banquet Cost"
          healthyThreshold={45}
          warningThreshold={50}
          serviceRate={activePnLStats?.posServiceRate || 0}
          taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
          lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
        />
        <FnbVsCard 
          label="Total F&B A la Carte Performance"
          icon={<Store size={18} />}
          revenue={activePnLStats?.revAlacarte || 0}
          expenses={activePnLStats?.expAlacarte || 0}
          loading={loading}
          onClick={onCardClick}
          accentColor="#fcab79" // Peach
          costLabel="Total Cost"
          healthyThreshold={30}
          warningThreshold={40}
          serviceRate={activePnLStats?.posServiceRate || 0}
          taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
          lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
        />
        <FnbVsCard 
          label="Beverage A la Carte Performance"
          icon={<Store size={18} />}
          revenue={activePnLStats?.revBeverageAlacarte || 0}
          expenses={activePnLStats?.expBeverageAlacarte || 0}
          loading={loading}
          onClick={onCardClick}
          accentColor="#a8d8c4" // Mint
          costLabel="Beverage Cost"
          healthyThreshold={18}
          warningThreshold={25}
          serviceRate={activePnLStats?.posServiceRate || 0}
          taxRateIndividual={activePnLStats?.posTaxRateIndividual || 0}
          lostBreakageRate={activePnLStats?.posLostBreakageRate || 0}
        />
      </div>
    </div>
  );
}
