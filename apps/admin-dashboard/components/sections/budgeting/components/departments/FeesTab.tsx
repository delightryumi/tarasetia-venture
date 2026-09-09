"use client";

import React from "react";
import {
  YearlyBudgetDocument,
  YearlyFeesPlan,
  createDefaultFeesPlan,
  recalculateBudgetMonthData,
} from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { Calculator, Sparkles, Percent } from "lucide-react";
import styles from "./fees.module.css";

interface FeesTabProps {
  budgetDoc: YearlyBudgetDocument;
  onDocChange: (updater: (draft: YearlyBudgetDocument) => void) => void;
}

const MONTH_KEYS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const FeesTab: React.FC<FeesTabProps> = ({ budgetDoc, onDocChange }) => {
  const fees: YearlyFeesPlan = budgetDoc.fees || createDefaultFeesPlan();

  const updateFeeSetting = (field: keyof YearlyFeesPlan, val: any) => {
    onDocChange((draft) => {
      if (!draft.fees) draft.fees = createDefaultFeesPlan();
      (draft.fees as any)[field] = val;

      MONTH_KEYS.forEach((k) => {
        const m = draft.months[k];
        if (!m) return;
        if (!m.deptNonOp) {
          m.deptNonOp = {
            managementBaseFee: 0,
            managementIncentiveFee: 0,
            franchiseRoyaltyFee: 0,
            buildingInsurance: 0,
            propertyTaxPbb: 0,
            bankInterestCharges: 0,
            depreciationAmortization: 0,
            total: 0,
          };
        }

        const netSales = m.netRevenue || m.summaryPnl?.totalNetRevenue || 0;
        const gop = m.summaryPnl?.grossOperatingProfit || 0;

        const mgmtAmount = Math.round(netSales * ((draft.fees?.managementFeePercent || 3) / 100));
        const incentiveAmount = gop > 0 ? Math.round(gop * ((draft.fees?.incentiveFeePercent || 4) / 100)) : 0;

        m.deptNonOp.managementBaseFee = mgmtAmount;
        m.deptNonOp.managementIncentiveFee = incentiveAmount;

        recalculateBudgetMonthData(m);
      });
    });
  };

  // Compute 12-month series
  const monthlyData = MONTH_KEYS.map((k) => {
    const m = budgetDoc.months[k];
    const netSales = m?.netRevenue || m?.summaryPnl?.totalNetRevenue || 0;
    const gop = m?.summaryPnl?.grossOperatingProfit || 0;
    const totOpex = m?.summaryPnl?.totalUndistributedExpenses || 0;

    const mgmtRate = (fees.managementFeePercent || 3) / 100;
    const incentiveRate = (fees.incentiveFeePercent || 4) / 100;
    const vatRate = (fees.vatTaxPercent || 2) / 100;

    const mgmtAmount = Math.round(netSales * mgmtRate);
    const mgmtVat = Math.round(mgmtAmount * vatRate);
    const mgmtTotal = mgmtAmount - mgmtVat;

    const incentiveAmount = gop > 0 ? Math.round(gop * incentiveRate) : 0;
    const incentiveVat = Math.round(incentiveAmount * vatRate);
    const incentiveTotal = incentiveAmount - incentiveVat;

    return {
      key: k,
      netSales,
      gop,
      totOpex,
      mgmtAmount,
      mgmtVat,
      mgmtTotal,
      incentiveAmount,
      incentiveVat,
      incentiveTotal,
    };
  });

  const ytdSales = monthlyData.reduce((a, b) => a + b.netSales, 0);
  const ytdGop = monthlyData.reduce((a, b) => a + b.gop, 0);
  const ytdMgmtAmount = monthlyData.reduce((a, b) => a + b.mgmtAmount, 0);
  const ytdMgmtVat = monthlyData.reduce((a, b) => a + b.mgmtVat, 0);
  const ytdMgmtTotal = monthlyData.reduce((a, b) => a + b.mgmtTotal, 0);
  const ytdIncentiveAmount = monthlyData.reduce((a, b) => a + b.incentiveAmount, 0);
  const ytdIncentiveVat = monthlyData.reduce((a, b) => a + b.incentiveVat, 0);
  const ytdIncentiveTotal = monthlyData.reduce((a, b) => a + b.incentiveTotal, 0);

  // Sync to all months NonOp
  const applyFeesToAllMonths = () => {
    onDocChange((draft) => {
      MONTH_KEYS.forEach((k) => {
        const m = draft.months[k];
        if (!m) return;
        if (!m.deptNonOp) {
          m.deptNonOp = {
            managementBaseFee: 0,
            managementIncentiveFee: 0,
            franchiseRoyaltyFee: 0,
            buildingInsurance: 0,
            propertyTaxPbb: 0,
            bankInterestCharges: 0,
            depreciationAmortization: 0,
            total: 0,
          };
        }

        const netSales = m.netRevenue || m.summaryPnl?.totalNetRevenue || 0;
        const gop = m.summaryPnl?.grossOperatingProfit || 0;

        const mgmtAmount = Math.round(netSales * ((draft.fees?.managementFeePercent || 3) / 100));
        const incentiveAmount = gop > 0 ? Math.round(gop * ((draft.fees?.incentiveFeePercent || 4) / 100)) : 0;

        m.deptNonOp.managementBaseFee = mgmtAmount;
        m.deptNonOp.managementIncentiveFee = incentiveAmount;

        recalculateBudgetMonthData(m);
      });
    });
  };

  return (
    <div className={styles.container}>
      {/* 1. FEE SETTINGS & CONTROLS */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.badge}>
              <Calculator size={13} style={{ display: "inline", marginRight: "4px" }} />
              MANAGEMENT FEES
            </div>
            <h3 className={styles.title}>PARAMETER & PERSENTASE BIAYA PENGELOLAAN</h3>
          </div>
          <span className={styles.tag}>Skema Revenue & GOP</span>
        </div>

        <div className={styles.settingsBar}>
          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Management Fee:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className={styles.rateInput}
              value={fees.managementFeePercent}
              onChange={(e) => updateFeeSetting("managementFeePercent", Number(e.target.value))}
            />
            <span className={styles.rateUnit}>% Net Sales</span>
          </div>

          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>Incentive Fee:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className={styles.rateInput}
              value={fees.incentiveFeePercent}
              onChange={(e) => updateFeeSetting("incentiveFeePercent", Number(e.target.value))}
            />
            <span className={styles.rateUnit}>% GOP</span>
          </div>

          <div className={styles.settingItem}>
            <span className={styles.settingLabel}>PPh / Pajak:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              className={styles.rateInput}
              value={fees.vatTaxPercent}
              onChange={(e) => updateFeeSetting("vatTaxPercent", Number(e.target.value))}
            />
            <span className={styles.rateUnit}>%</span>
          </div>

          <button onClick={applyFeesToAllMonths} className={styles.actionBtn}>
            <Sparkles size={16} />
            <span>Terapkan ke Biaya Non-Operasional (Semua Bulan)</span>
          </button>
        </div>
      </div>

      {/* 2. MANAGEMENT FEE SCHEDULE */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.badge} style={{ background: "#2563eb" }}>BASE FEE</div>
            <h3 className={styles.title}>JADWAL PERHITUNGAN MANAGEMENT FEE (12 BULAN & YTD)</h3>
          </div>
          <span className={styles.tag}>{fees.managementFeePercent}% dari Total Net Sales</span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>KOMPONEN BIAYA</th>
                <th style={{ textAlign: "right", background: "#e2e8f0" }}>YTD TOTAL</th>
                {MONTH_LABELS.map((lbl) => (
                  <th key={lbl} style={{ textAlign: "right" }}>
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.cellDesc}>Total Net Sales (IDR)</td>
                <td className={styles.cellYtd}>{formatIDR(ytdSales)}</td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount}>
                    {formatIDR(m.netSales)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.cellDesc}>Management Fee %</td>
                <td className={styles.cellYtd}>{fees.managementFeePercent}%</td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount}>
                    {fees.managementFeePercent}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.cellDesc}>Management Amount (Gross)</td>
                <td className={styles.cellYtd}>{formatIDR(ytdMgmtAmount)}</td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount}>
                    {formatIDR(m.mgmtAmount)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.cellDesc}>Potongan Pajak ({fees.vatTaxPercent}%)</td>
                <td className={styles.cellYtd} style={{ color: "#ef4444" }}>
                  -{formatIDR(ytdMgmtVat)}
                </td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount} style={{ color: "#ef4444" }}>
                    -{formatIDR(m.mgmtVat)}
                  </td>
                ))}
              </tr>
              <tr className={styles.totalRow}>
                <td className={styles.cellDesc}>NET MANAGEMENT FEE</td>
                <td className={styles.cellYtd} style={{ color: "#166534" }}>
                  {formatIDR(ytdMgmtTotal)}
                </td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount} style={{ color: "#166534", fontWeight: 800 }}>
                    {formatIDR(m.mgmtTotal)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. INCENTIVE FEE SCHEDULE */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.badge} style={{ background: "#059669" }}>INCENTIVE</div>
            <h3 className={styles.title}>JADWAL PERHITUNGAN INCENTIVE FEE (12 BULAN & YTD)</h3>
          </div>
          <span className={styles.tag}>{fees.incentiveFeePercent}% dari Gross Operating Profit</span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>KOMPONEN BIAYA</th>
                <th style={{ textAlign: "right", background: "#e2e8f0" }}>YTD TOTAL</th>
                {MONTH_LABELS.map((lbl) => (
                  <th key={lbl} style={{ textAlign: "right" }}>
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.cellDesc}>Gross Operating Profit (GOP)</td>
                <td className={styles.cellYtd} style={{ color: ytdGop >= 0 ? "#166534" : "#dc2626" }}>
                  {formatIDR(ytdGop)}
                </td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount} style={{ color: m.gop >= 0 ? "#166534" : "#dc2626" }}>
                    {formatIDR(m.gop)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.cellDesc}>Incentive Fee %</td>
                <td className={styles.cellYtd}>{fees.incentiveFeePercent}%</td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount}>
                    {fees.incentiveFeePercent}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.cellDesc}>Incentive Amount (Gross)</td>
                <td className={styles.cellYtd}>{formatIDR(ytdIncentiveAmount)}</td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount}>
                    {formatIDR(m.incentiveAmount)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className={styles.cellDesc}>Potongan Pajak ({fees.vatTaxPercent}%)</td>
                <td className={styles.cellYtd} style={{ color: "#ef4444" }}>
                  -{formatIDR(ytdIncentiveVat)}
                </td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount} style={{ color: "#ef4444" }}>
                    -{formatIDR(m.incentiveVat)}
                  </td>
                ))}
              </tr>
              <tr className={styles.totalRow}>
                <td className={styles.cellDesc}>NET INCENTIVE FEE</td>
                <td className={styles.cellYtd} style={{ color: "#166534" }}>
                  {formatIDR(ytdIncentiveTotal)}
                </td>
                {monthlyData.map((m) => (
                  <td key={m.key} className={styles.cellAmount} style={{ color: "#166534", fontWeight: 800 }}>
                    {formatIDR(m.incentiveTotal)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
