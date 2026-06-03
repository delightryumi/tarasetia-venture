'use client';

import React from 'react';
import { Store, Activity } from 'lucide-react';
import { VsCard } from '@/components/sections/pnl/components/shared/VsCard';
import styles from '@/components/sections/pnl/components/sections/PNLSectionLayout.module.css';

interface FoodBeveragePerformanceTabProps {
  activePnLStats: any;
  loading: boolean;
  onCardClick: (cardId: string) => void;
  viewScale: 'daily' | 'monthly';
}

export default function FoodBeveragePerformanceTab({ activePnLStats, loading, onCardClick, viewScale }: FoodBeveragePerformanceTabProps) {
  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <Activity size={22} />
          <span>Category Performance Analysis ({viewScale === 'daily' ? 'Daily' : 'Monthly'})</span>
        </h2>
        <p className={styles.sectionSubtitle}>Revenue Vs Expenses Analysis</p>
      </div>
      <div className={styles.innerContainer}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 xl:gap-10">
          <VsCard 
            label="Food A la Carte Performance"
            icon={<Store size={18} />}
            revenue={activePnLStats?.revFoodAlacarte || 0}
            expenses={activePnLStats?.expFoodAlacarte || 0}
            loading={loading}
            onClick={onCardClick}
            accent="#0066cc"
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
            loading={loading}
            onClick={onCardClick}
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
            loading={loading}
            onClick={onCardClick}
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
            loading={loading}
            onClick={onCardClick}
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
  );
}
