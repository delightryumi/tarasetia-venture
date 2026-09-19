"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Receipt, PieChart, 
  Calculator, Wallet, Percent, ArrowRight, ShieldCheck
} from "lucide-react";
import { formatIDR, GlobalPnLResult, PnlIncomeItem } from "@/lib/pnl-utils";
import styles from "./FinancialBreakdown.module.css";

interface FinancialBreakdownProps {
  isStartup?: boolean;
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

const EmptyDash = () => <span className={styles.emptyDash}>—</span>;

interface StatementTableRowProps {
  label: string;
  subLabel?: string;
  rate?: string;
  value: number;
  isNegative?: boolean;
  isTotal?: boolean;
  highlight?: boolean;
}

const StatementTableRow = ({
  label,
  subLabel,
  rate,
  value,
  isNegative,
  isTotal,
  highlight
}: StatementTableRowProps) => {
  const adjustedValue = isNegative ? -Math.abs(value) : value;
  const displayVal = adjustedValue !== null && adjustedValue !== undefined && adjustedValue !== 0 
    ? formatIDR(adjustedValue) 
    : null;

  if (isTotal) {
    const amountColor = adjustedValue < 0 ? styles.totalAmountNegative : styles.totalAmountPositive;
    return (
      <tr className={`${styles.row} ${styles.rowTotal}`}>
        <td className={styles.tdLabel}>
          <div className={styles.labelWrapper}>
            <div className={styles.labelLine}>
              <span className={styles.totalLabel}>{label}</span>
              {rate && <span className={styles.rateBadge}>{rate}</span>}
            </div>
            {subLabel && <span className={styles.labelSub}>{subLabel}</span>}
          </div>
        </td>
        <td className={`${styles.tdAmount} ${styles.totalAmount} ${amountColor}`}>
          {displayVal || <EmptyDash />}
        </td>
      </tr>
    );
  }

  const rowClass = highlight 
    ? `${styles.row} ${styles.rowHighlight}` 
    : styles.row;

  const labelClass = highlight ? styles.highlightLabel : styles.labelMain;
  const amountClass = adjustedValue < 0 
    ? styles.amountNegative 
    : highlight 
      ? styles.highlightAmount 
      : styles.amountPositive;

  return (
    <tr className={rowClass}>
      <td className={styles.tdLabel}>
        <div className={styles.labelWrapper}>
          <div className={styles.labelLine}>
            <span className={labelClass}>{label}</span>
            {rate && <span className={styles.rateBadge}>{rate}</span>}
          </div>
          {subLabel && <span className={styles.labelSub}>{subLabel}</span>}
        </div>
      </td>
      <td className={`${styles.tdAmount} ${amountClass}`}>
        {displayVal || <EmptyDash />}
      </td>
    </tr>
  );
};

export default function FinancialBreakdown({
  isStartup = false,
  pnlResult,
  mgmtExpensesTotal,
  vatPercentage,
  retainedPercent,
  setRetainedPercent,
  mgmtFeeRoomPercentage = 0,
  mgmtFeeFnbPercentage = 0,
  serviceChargePercentage = 0,
  lostBreakagePercentage = 0
}: FinancialBreakdownProps) {
  if (!pnlResult) return null;

  // ── Statement I: Operating Revenues ──
  const val_revRoom = pnlResult.revRoom || pnlResult.ledgerRoomRevenue || 0;
  const val_revTotalFnb = pnlResult.revTotalFnb || 0;
  const val_revBanquet = pnlResult.revBanquet || pnlResult.revBanquetRevenue || 0;
  const val_card5_Other = pnlResult.card5_OtherRevenue || 0;
  const val_card2_NonComm = pnlResult.card2_NonCommRevenue || 0;
  const val_card1_TotalRevenue = pnlResult.card1_TotalRevenue || 0;

  // ── Statement II: Departmental Operating Expenses ──
  const val_expHousekeeping = pnlResult.expHousekeeping || 0;
  const val_expAlacarte = pnlResult.expAlacarte || 0;
  const val_expBanquet = pnlResult.expBanquet || 0;
  const val_expPomec = pnlResult.expPomec || 0;
  const val_expOperational = pnlResult.expOperational || 0;
  const val_expPayroll = pnlResult.expPayroll || 0;
  const val_compliments = (pnlResult.foComplimentValue || 0) + (pnlResult.posComplimentValue || 0);
  const val_card8_TotalExpenses = pnlResult.card8_TotalExpenses || 0;

  // ── Statement III: GOP & Owner Reconciliation Flow ──
  const val_card7_TotalGOP = pnlResult.card7_TotalGOP || 0;
  const val_card11_VAT = pnlResult.card11_VAT || 0;
  const val_summaryServiceCharge = pnlResult.summaryServiceCharge || 0;
  const val_summaryLostBreakage = pnlResult.summaryLostBreakage || 0;
  const val_card9_FeeGrossRoom = pnlResult.card9_FeeGrossRoom || 0;
  const val_card9_FeeGrossFnb = pnlResult.card9_FeeGrossFnb || 0;
  const val_card12_ReconOwner = pnlResult.card12_ReconOwner || 0;

  // ── Shareholder Distribution & Management Cash Flow ──
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.section}
    >
      <div className={styles.containerCard}>
        {/* ── Section Header ── */}
        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleRow}>
              <span className={styles.headerIcon}>
                <Receipt size={20} />
              </span>
              <h2 className={styles.title}>Detailed Financial Breakdown</h2>
            </div>
            <p className={styles.subtitle}>
              Audited Operating Statement &bull; Departmental Revenues, Operational Expenses &amp; Profit Flow
            </p>
          </div>
          <div className={styles.headerBadges}>
            <span className={styles.badgeStandard}>
              <span className={styles.badgeDot} />
              Audited Operating Accounts
            </span>
          </div>
        </div>

        {/* ── 3-Column Statement Grid ── */}
        <div className={styles.statementsGrid}>
          {/* STATEMENT I: REVENUES */}
          <div className={styles.statementCard}>
            <div className={styles.statementHeader}>
              <div className={`${styles.statementIconBox} ${styles.iconRevenue}`}>
                <TrendingUp size={16} />
              </div>
              <div className={styles.statementTitleCol}>
                <h3 className={styles.statementTitle}>I. Operating Revenues</h3>
                <p className={styles.statementSubtitle}>Core departmental revenue sources</p>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <th>Revenue Center / Line Item</th>
                    <th className={styles.thRight}>Amount (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {!isStartup && (
                    <StatementTableRow 
                      label="Room Division" 
                      subLabel="Accommodation & lodging earnings" 
                      value={val_revRoom} 
                    />
                  )}
                  <StatementTableRow 
                    label="Food & Beverage (A la Carte)" 
                    subLabel="Outlet restaurant, bar & room service" 
                    value={val_revTotalFnb} 
                  />
                  <StatementTableRow 
                    label="Banquet & Events" 
                    subLabel="MICE events & corporate functions" 
                    value={val_revBanquet} 
                  />
                  <StatementTableRow 
                    label="Other Operated Depts (MOD)" 
                    subLabel="Laundry, transport & miscellaneous" 
                    value={val_card5_Other} 
                  />
                  {val_card2_NonComm > 0 && (
                    <StatementTableRow 
                      label="Sundry & Non-Operating" 
                      subLabel="Concessions & commissions" 
                      value={val_card2_NonComm} 
                    />
                  )}
                  <StatementTableRow 
                    label="Total Gross Revenue" 
                    subLabel="Combined operating revenue" 
                    value={val_card1_TotalRevenue} 
                    isTotal={true} 
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* STATEMENT II: EXPENSES */}
          <div className={styles.statementCard}>
            <div className={styles.statementHeader}>
              <div className={`${styles.statementIconBox} ${styles.iconExpense}`}>
                <Receipt size={16} />
              </div>
              <div className={styles.statementTitleCol}>
                <h3 className={styles.statementTitle}>II. Operating Expenses</h3>
                <p className={styles.statementSubtitle}>Departmental costs &amp; cost of sales</p>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <th>Cost Center / Expense Item</th>
                    <th className={styles.thRight}>Amount (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  {!isStartup && (
                    <StatementTableRow 
                      label="Housekeeping Division" 
                      subLabel="Guest supplies, laundry & room linen" 
                      value={val_expHousekeeping} 
                      isNegative 
                    />
                  )}
                  <StatementTableRow 
                    label="Food & Beverage (A la Carte)" 
                    subLabel="Kitchen, bar & beverage raw materials" 
                    value={val_expAlacarte} 
                    isNegative 
                  />
                  <StatementTableRow 
                    label="Banquet & Catering Operations" 
                    subLabel="Banquet event supplies & catering costs" 
                    value={val_expBanquet} 
                    isNegative 
                  />
                  <StatementTableRow 
                    label="POMEC / Property Engineering" 
                    subLabel="Maintenance, repairs & energy utilities" 
                    value={val_expPomec} 
                    isNegative 
                  />
                  <StatementTableRow 
                    label="Administration & Operations" 
                    subLabel="Purchasing, general office & admin" 
                    value={val_expOperational} 
                    isNegative 
                  />
                  {val_expPayroll > 0 && (
                    <StatementTableRow 
                      label="Payroll & Staffing" 
                      subLabel="Staff wages & employee benefits" 
                      value={val_expPayroll} 
                      isNegative 
                    />
                  )}
                  {val_compliments > 0 && (
                    <StatementTableRow 
                      label="Complimentary Allowances" 
                      subLabel="POS & FO complimentary guest items" 
                      value={val_compliments} 
                      isNegative 
                    />
                  )}
                  <StatementTableRow 
                    label="Total Operating Expenses" 
                    subLabel="Sum of all operational costs (Opex)" 
                    value={val_card8_TotalExpenses} 
                    isTotal={true} 
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* STATEMENT III: GOP & OWNER RECONCILIATION */}
          <div className={styles.statementCard}>
            <div className={styles.statementHeader}>
              <div className={`${styles.statementIconBox} ${styles.iconRecon}`}>
                <Calculator size={16} />
              </div>
              <div className={styles.statementTitleCol}>
                <h3 className={styles.statementTitle}>III. GOP &amp; Profit Flow</h3>
                <p className={styles.statementSubtitle}>Operational margin to net owner profit</p>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHead}>
                    <th>Metric / Reconciliation Item</th>
                    <th className={styles.thRight}>Amount (IDR)</th>
                  </tr>
                </thead>
                <tbody>
                  <StatementTableRow 
                    label="Total GOP" 
                    subLabel="Gross Operating Profit (Gross Rev - Opex)" 
                    value={val_card7_TotalGOP} 
                    highlight 
                  />
                  <StatementTableRow 
                    label="Value-Added Tax (VAT)" 
                    subLabel="Output tax liability" 
                    rate={`${vatPercentage}%`} 
                    value={val_card11_VAT} 
                    isNegative 
                  />
                  <StatementTableRow 
                    label="Service Charge" 
                    subLabel="Employee service allocation" 
                    rate={`${serviceChargePercentage}%`} 
                    value={val_summaryServiceCharge} 
                    isNegative 
                  />
                  <StatementTableRow 
                    label="Lost & Breakage Reserve" 
                    subLabel="Property shrinkage buffer" 
                    rate={`${lostBreakagePercentage}%`} 
                    value={val_summaryLostBreakage} 
                    isNegative 
                  />
                  {!isStartup && (
                    <StatementTableRow 
                      label="Management Fee - Room" 
                      subLabel="Room management system fee" 
                      rate={`${mgmtFeeRoomPercentage}%`} 
                      value={val_card9_FeeGrossRoom} 
                      isNegative 
                    />
                  )}
                  <StatementTableRow 
                    label="Management Fee - F&B" 
                    subLabel="F&B management operations fee" 
                    rate={`${mgmtFeeFnbPercentage}%`} 
                    value={val_card9_FeeGrossFnb} 
                    isNegative 
                  />
                  <StatementTableRow 
                    label="Net Profit (Recon Owner)" 
                    subLabel="Net distributable profit to property owner" 
                    value={val_card12_ReconOwner} 
                    isTotal={true} 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: SHAREHOLDER DISTRIBUTION AUDIT ── */}
        {calculatedInvestors.length > 0 && (
          <div className={styles.distCard}>
            <div className={styles.statementHeader} style={{ marginBottom: 0 }}>
              <div className={`${styles.statementIconBox} ${styles.iconRevenue}`}>
                <PieChart size={16} />
              </div>
              <div className={styles.statementTitleCol}>
                <h3 className={styles.statementTitle}>IV. Shareholder Equity Allocation</h3>
                <p className={styles.statementSubtitle}>Pro-rata net profit distribution across ownership partners</p>
              </div>
            </div>

            <div className={styles.distGrid}>
              {calculatedInvestors.map((inv, i) => (
                <div key={i} className={styles.investorCard}>
                  <div className={styles.investorHeader}>
                    <span className={styles.shareBadge}>{inv.share}%</span>
                    <span className={styles.investorMeta}>Equity Share</span>
                  </div>
                  <div>
                    <p className={styles.investorName}>{inv.name}</p>
                    <p className={styles.investorAmount}>
                      {formatIDR(inv.calculatedAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 5: MANAGEMENT COMPANY CASH FLOW & SETTLEMENT ── */}
        {mgmtShareData && (
          <div className={styles.mgmtCard}>
            <div className={styles.mgmtHeader}>
              <div className={styles.headerTitleRow}>
                <span className={styles.headerIcon}>
                  <Wallet size={18} />
                </span>
                <div>
                  <h3 className={styles.statementTitle}>Management Company Cash Flow &amp; Settlement</h3>
                  <p className={styles.statementSubtitle}>Internal Operator Disbursable Reconciliation</p>
                </div>
              </div>
              <span className={styles.badgeStandard}>
                <ShieldCheck size={12} />
                Internal Operator Audit
              </span>
            </div>
            
            <div className={styles.mgmtBody}>
              <div className={styles.mgmtStatsGrid}>
                <div className={styles.mgmtStatCol}>
                  <p className={styles.mgmtStatMeta}>Gross Management Share</p>
                  <p className={styles.mgmtStatVal}>{formatIDR(mgmtShareAmount)}</p>
                </div>
                
                <div className={styles.mgmtStatCol}>
                  <p className={styles.mgmtStatMeta}>Retained Earnings Reserve</p>
                  <div className={styles.retainedActionBox}>
                    <p className={styles.mgmtStatValNegative}>-{formatIDR(retainedEarningsValue)}</p>
                    <div className={styles.retainedInputWrap}>
                      <input 
                        type="number" 
                        min="0" 
                        max="100"
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                            e.preventDefault();
                          }
                        }}
                        value={retainedPercent}
                        onChange={(e) => setRetainedPercent(Number(e.target.value))}
                        className={styles.retainedInput}
                      />
                      <Percent size={10} className={styles.percentIcon} />
                    </div>
                  </div>
                </div>
                
                <div className={styles.mgmtStatCol}>
                  <p className={styles.mgmtStatMeta}>Operator Internal Cost</p>
                  <p className={styles.mgmtStatValNegative}>-{formatIDR(mgmtExpensesTotal)}</p>
                </div>
              </div>
              
              <div className={styles.settlementCard}>
                <div className={styles.settlementInfo}>
                  <span className={styles.settlementMeta}>Net Cash Disbursement to Operator</span>
                  <p className={styles.settlementAmount}>{formatIDR(totalSisaManagement)}</p>
                </div>
                <button className={styles.settlementBtn}>
                  Process Settlement <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}