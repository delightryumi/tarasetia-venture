"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Receipt, PieChart, 
  Calculator, Wallet, Percent, ArrowRight
} from "lucide-react";
import { formatIDR, GlobalPnLResult, PnlIncomeItem } from "@/lib/pnl-utils";
import styles from "./FinancialBreakdown.module.css";

// --- INTERFACES ---
interface FinancialBreakdownProps {
  pnlResult: GlobalPnLResult;
  customIncomes: PnlIncomeItem[];
  nonCommissionRevenue: PnlIncomeItem[];
  expenses: any[];
  sharedExpensesTotal: number;
  mgmtExpensesTotal: number;
  totalNonComm: number;
  finalMgmtNet: number;
  vatPercentage: number;
  gopPercentage: number;
  totalRevenueHotelCollect: number;
  retainedPercent: number;
  setRetainedPercent: (val: number) => void;
  mgmtFeeRoomPercentage?: number;
  mgmtFeeFnbPercentage?: number;
  serviceChargePercentage?: number;
  lostBreakagePercentage?: number;
}

const EmptyDash = () => <span className={`${styles.emptyDash} ${styles.fontMonoJb}`}>--</span>;

const SectionHeader = ({ icon: Icon, title, subtitle, themeColor }: any) => {
  const colors: any = {
    emerald: styles.sectionIconEmerald, 
    rose: styles.sectionIconRose,
    blue: styles.sectionIconBlue,
    zinc: styles.sectionIconZinc
  };
  const activeColor = colors[themeColor] || styles.sectionIconZinc;

  return (
    <div className={styles.sectionHeader}>
      <div className={`${styles.sectionIconBox} ${activeColor}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className={styles.sectionHeaderRight}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.sectionSubtitle}>{subtitle}</p>
      </div>
      <div className={styles.sectionDivider}></div>
    </div>
  );
};

interface TableRowProps {
  label: string;
  subLabel?: string;
  rate?: string;
  value: number;
  isNegative?: boolean;
  isTotal?: boolean;
  highlight?: boolean;
}

const TableRow = ({ label, subLabel, rate, value, isNegative, isTotal, highlight }: TableRowProps) => {
  const adjustedValue = isNegative ? -Math.abs(value) : value;
  const displayVal = adjustedValue !== null && adjustedValue !== undefined && adjustedValue !== 0 
    ? formatIDR(adjustedValue) 
    : null;

  if (isTotal) {
    const amountColor = adjustedValue < 0 ? styles.totalAmountNegative : styles.totalAmountPositive;
    return (
      <tr className={styles.rowGroup}>
        <td className={styles.tdFirstTotal}>
          <div className={styles.labelBox}>
            <span className={styles.totalLabel}>{label}</span>
            {subLabel && <span className={styles.totalSubLabel}>{subLabel}</span>}
          </div>
        </td>
        <td className={`${styles.tdMidTotal} ${styles.tdCenter} ${styles.rateText} ${styles.fontMonoJb}`}>
          {rate || "—"}
        </td>
        <td className={`${styles.tdLastTotal} ${styles.fontMonoJb} ${styles.totalAmount} ${amountColor}`}>
          {displayVal || <EmptyDash />}
        </td>
      </tr>
    );
  }

  const rowClass = highlight 
    ? `${styles.rowGroup} ${styles.rowHighlight}` 
    : styles.rowGroup;

  const labelColor = highlight ? styles.tdHighlightLabel : styles.labelMain;
  const amountColor = adjustedValue < 0 
    ? styles.amountNegative 
    : highlight 
      ? styles.tdHighlightAmount 
      : styles.amountPositive;

  return (
    <tr className={rowClass}>
      <td className={styles.tdFirst}>
        <div className={styles.labelBox}>
          <span className={`${styles.labelMain} ${labelColor}`}>{label}</span>
          {subLabel && <span className={styles.labelSub}>{subLabel}</span>}
        </div>
      </td>
      <td className={`${styles.tdMid} ${styles.tdCenter} ${styles.rateText} ${styles.fontMonoJb}`}>
        {rate || "—"}
      </td>
      <td className={`${styles.tdLast} ${styles.fontMonoJb} ${styles.amountText} ${amountColor}`}>
        {displayVal || <EmptyDash />}
      </td>
    </tr>
  );
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function FinancialBreakdown({
  pnlResult, sharedExpensesTotal, mgmtExpensesTotal, vatPercentage,
  retainedPercent, setRetainedPercent, mgmtFeeRoomPercentage = 0, mgmtFeeFnbPercentage = 0,
  serviceChargePercentage = 0, lostBreakagePercentage = 0
}: FinancialBreakdownProps) {
  
  if (!pnlResult) return null;

  // Values aligned to Executive Summary card section
  const val_revRoom = pnlResult.revRoom || 0;
  const val_revTotalFnb = pnlResult.revTotalFnb || 0;
  const val_revBanquet = pnlResult.revBanquet || 0;
  const val_card5_Other = pnlResult.card5_OtherRevenue || 0;
  const val_card1_TotalRevenue = pnlResult.card1_TotalRevenue || 0;

  const val_expHousekeeping = pnlResult.expHousekeeping || 0;
  const val_expAlacarte = pnlResult.expAlacarte || 0;
  const val_expBanquet = pnlResult.expBanquet || 0;
  const val_expOperational = pnlResult.expOperational || 0;
  const val_card8_TotalExpenses = pnlResult.card8_TotalExpenses || 0;

  const val_card7_TotalGOP = pnlResult.card7_TotalGOP || 0;
  const val_card11_VAT = pnlResult.card11_VAT || 0;
  const val_summaryServiceCharge = pnlResult.summaryServiceCharge || 0;
  const val_summaryLostBreakage = pnlResult.summaryLostBreakage || 0;
  const val_card9_FeeGrossRoom = pnlResult.card9_FeeGrossRoom || 0;
  const val_card9_FeeGrossFnb = pnlResult.card9_FeeGrossFnb || 0;
  const val_card12_ReconOwner = pnlResult.card12_ReconOwner || 0;

  const calculatedInvestors = pnlResult.investorDistributions?.map(inv => ({
    ...inv,
    calculatedAmount: inv.amount
  })) || [];
  
  const mgmtShareData = calculatedInvestors.length > 0 ? calculatedInvestors[0] : null;
  const mgmtShareAmount = mgmtShareData ? mgmtShareData.calculatedAmount : 0;
  
  const retainedEarningsValue = mgmtShareAmount * (retainedPercent / 100);
  const totalSisaManagement = mgmtShareAmount - retainedEarningsValue - mgmtExpensesTotal;

  return (
    <motion.section 
      variants={rise} 
      initial="hidden" 
      animate="show" 
      className={`${styles.section} ${styles.fontInstrument}`}
    >
      <div className={styles.outerCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>
              <Receipt size={24} /> Financial <span className={styles.titleAccent}>Breakdown</span>
            </h2>
            <p className={styles.subtitle}>Detailed PnL Audit Table</p>
          </div>
        </div>

        {/* Inner Tray */}
        <div className={styles.innerTray}>
          {/* ── TOP ROW: 3 sections inline ── */}
          <div className={styles.grid3}>
            {/* SECTION 1: REVENUE */}
            <div className={styles.tableCard}>
              <SectionHeader icon={TrendingUp} title="I. Revenues" subtitle="Income sources audit" themeColor="emerald" />
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th>Line Item / Description</th>
                      <th className={styles.thCenter}>Rate</th>
                      <th className={styles.thRight}>Amount (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow label="Room Revenue" subLabel="Accommodation & lodging earnings" value={val_revRoom} />
                    <TableRow label="Total F&B A la Carte Revenue" subLabel="Outlet restaurant, bar & room service" value={val_revTotalFnb} />
                    <TableRow label="Total Banquet Revenue" subLabel="MICE events & corporate functions" value={val_revBanquet} />
                    <TableRow label="Other Revenue" subLabel="Miscellaneous manual & ledger collection" value={val_card5_Other} />
                    <TableRow label="Total Gross Revenue" subLabel="Overall combined hotel revenue" value={val_card1_TotalRevenue} isTotal={true} />
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: OPERATIONAL EXPENSES */}
            <div className={styles.tableCard}>
              <SectionHeader icon={Receipt} title="II. Expenses" subtitle="Departmental costs & operational deductions" themeColor="rose" />
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th>Line Item / Description</th>
                      <th className={styles.thCenter}>Rate</th>
                      <th className={styles.thRight}>Amount (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow label="Housekeeping Expenses" subLabel="Guest supplies, laundry & linen costs" value={val_expHousekeeping} isNegative />
                    <TableRow label="Total F&B A la Carte Expenses" subLabel="A la carte kitchen, bar & beverage raw materials" value={val_expAlacarte} isNegative />
                    <TableRow label="Total Banquet Expenses" subLabel="Event banquet catering & external sourcing costs" value={val_expBanquet} isNegative />
                    <TableRow label="Operational Expenses" subLabel="Purchasing, general office, administrative & utilities" value={val_expOperational} isNegative />
                    <TableRow label="Total Operational Expenses" subLabel="Sum of all operational departmental costs" value={val_card8_TotalExpenses} isTotal={true} />
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: NET PROFIT */}
            <div className={styles.tableCard}>
              <SectionHeader icon={Calculator} title="III. GOP & Net Profit Flow" subtitle="Nexura Profit Reconciliation" themeColor="emerald" />
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHead}>
                      <th>Line Item / Description</th>
                      <th className={styles.thCenter}>Rate</th>
                      <th className={styles.thRight}>Amount (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow label="Total GOP" subLabel="Gross operating profit (Revenues - Expenses)" value={val_card7_TotalGOP} highlight />
                    <TableRow label="VAT Input" subLabel="Value-added tax deductions" rate={`${vatPercentage}%`} value={val_card11_VAT} isNegative />
                    <TableRow label="Service Charge" subLabel="Staff service charge allocations" rate={`${serviceChargePercentage}%`} value={val_summaryServiceCharge} isNegative />
                    <TableRow label="Lost & Breakage" subLabel="Asset shrinkage buffer" rate={`${lostBreakagePercentage}%`} value={val_summaryLostBreakage} isNegative />
                    <TableRow label="Management Fee - Room" subLabel="Room management system fee" rate={`${mgmtFeeRoomPercentage}%`} value={val_card9_FeeGrossRoom} isNegative />
                    <TableRow label="Management Fee - F&B" subLabel="Food & beverage management fee" rate={`${mgmtFeeFnbPercentage}%`} value={val_card9_FeeGrossFnb} isNegative />
                    <TableRow label="Net Profit (Recon Owner)" subLabel="Final owner reconciliation settlement" value={val_card12_ReconOwner} isTotal={true} />
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 4: DISTRIBUTION */}
          <div className={styles.distCard}>
            <SectionHeader icon={PieChart} title="IV. Distribution Audit" subtitle="Shareholder equity allocation" themeColor="blue" />
            <div className={styles.distGrid}>
              {calculatedInvestors.map((inv, i) => (
                <div key={i} className={styles.investorCard}>
                  <div className={styles.investorHeader}>
                    <div className={styles.shareBadge}>
                      {inv.share}%
                    </div>
                    <span className={styles.investorMeta}>Equity Allocation</span>
                  </div>
                  <div>
                    <p className={styles.investorName}>{inv.name}</p>
                    <p className={`${styles.investorAmount} ${styles.fontMonoJb}`}>
                      {formatIDR(inv.calculatedAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: MGMT CASHFLOW */}
          {mgmtShareData && (
            <div className={styles.mgmtCard}>
              <div className={styles.mgmtHeader}>
                <div className={styles.mgmtHeaderLeft}>
                  <div className={styles.mgmtHeaderIcon}><Wallet size={18}/></div>
                  <div>
                    <h3 className={styles.mgmtHeaderTitle}>Management Cash Flow</h3>
                    <p className={styles.mgmtHeaderSubtitle}>Internal Audit</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.mgmtBody}>
                <div className={styles.mgmtStatsGrid}>
                  <div className={styles.mgmtStatCol}>
                    <p className={styles.mgmtStatMeta}>Gross Management Share</p>
                    <p className={`${styles.mgmtStatVal} ${styles.fontMonoJb}`}>{formatIDR(mgmtShareAmount)}</p>
                  </div>
                  
                  <div className={styles.mgmtStatCol}>
                    <p className={styles.mgmtStatMeta}>Retained Earnings</p>
                    <div className={styles.retainedActionBox}>
                      <p className={`${styles.mgmtStatValNegative} ${styles.fontMonoJb}`}>-{formatIDR(retainedEarningsValue)}</p>
                      <div className={styles.retainedInputWrap}>
                        <input 
                          type="number" min="0" max="100"
                          value={retainedPercent}
                          onChange={(e) => setRetainedPercent(Number(e.target.value))}
                          className={styles.retainedInput}
                        />
                        <Percent size={8} className={styles.percentIcon}/>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.mgmtStatCol}>
                    <p className={styles.mgmtStatMeta}>Operational Cost</p>
                    <p className={`${styles.mgmtStatValNegative} ${styles.fontMonoJb}`}>-{formatIDR(mgmtExpensesTotal)}</p>
                  </div>
                </div>
                
                <div className={styles.settlementCard}>
                  <span className={styles.settlementMeta}>Net Cash Disbursement</span>
                  <p className={`${styles.settlementAmount} ${styles.fontMonoJb}`}>{formatIDR(totalSisaManagement)}</p>
                  <button className={styles.settlementBtn}>
                    Process Settlement <ArrowRight size={14}/>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>{/* /innerTray */}
      </div>{/* /outerCard */}
    </motion.section>
  );
}