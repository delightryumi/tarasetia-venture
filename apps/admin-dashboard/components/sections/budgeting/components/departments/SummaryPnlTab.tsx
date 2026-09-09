"use client";

import React from "react";
import { BudgetMonthData, NonOpDepartmentBudget, createDefaultNonOpDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import styles from "../../budgeting.module.css";

interface SummaryPnlTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

export const SummaryPnlTab: React.FC<SummaryPnlTabProps> = ({ monthData, onChange }) => {
  const pnl = monthData.summaryPnl || {
    roomRevenue: 0,
    fnbRevenue: 0,
    modRevenue: 0,
    totalNetRevenue: 0,
    serviceCharge: 0,
    governmentTax: 0,
    totalGrossRevenue: 0,
    roomCogs: 0,
    fnbCogs: 0,
    modCogs: 0,
    totalCogs: 0,
    grossProfit: 0,
    grossProfitMarginPercent: 0,
    roomExpenses: 0,
    fnbExpenses: 0,
    modExpenses: 0,
    totalDepartmentalExpenses: 0,
    totalDepartmentalProfit: 0,
    tdpMarginPercent: 0,
    agExpenses: 0,
    hrdExpenses: 0,
    smExpenses: 0,
    pomecExpenses: 0,
    totalUndistributedExpenses: 0,
    grossOperatingProfit: 0,
    gopMarginPercent: 0,
    nonOperatingExpenses: 0,
    netOperatingIncome: 0,
    noiMarginPercent: 0,
  };

  const nonOp: NonOpDepartmentBudget = monthData.deptNonOp || createDefaultNonOpDepartment();

  const handleNonOpChange = (field: keyof NonOpDepartmentBudget, val: number) => {
    onChange((draft) => {
      if (!draft.deptNonOp) draft.deptNonOp = createDefaultNonOpDepartment();
      draft.deptNonOp[field] = val;
    });
  };

  return (
    <div className={styles.sectionGrid}>
      {/* 1. MASTER USALI P&L STATEMENT (Menurun Vertikal Sesuai IS Summary) */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>USALI SUMMARY</span>
            <h4 className={styles.excelSheetTitle}>SUMMARY PROFIT & LOSS STATEMENT (USALI REVIEW)</h4>
          </div>
          <span
            className={styles.totalBadge}
            style={{
              backgroundColor: (pnl.grossOperatingProfit || 0) >= 0 ? "#ecfdf5" : "#fef2f2",
              color: (pnl.grossOperatingProfit || 0) >= 0 ? "#047857" : "#b91c1c",
            }}
          >
            GOP Margin: {(pnl.gopMarginPercent || 0).toFixed(1)}%
          </span>
        </div>

        <div className={styles.excelTableWrapper}>
          <table className={styles.excelTable}>
            <thead className={styles.excelThead}>
              <tr>
                <th className={styles.excelTh} style={{ width: "90px" }}>Account</th>
                <th className={styles.excelTh}>Profit & Loss Account Description</th>
                <th className={`${styles.excelTh} ${styles.excelThRight}`} style={{ width: "220px" }}>
                  Target Budget (IDR)
                </th>
                <th className={`${styles.excelTh} ${styles.excelThRight}`} style={{ width: "100px" }}>
                  % of Rev
                </th>
              </tr>
            </thead>
            <tbody>
              {/* ── 1. REVENUE ── */}
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={4}>
                  1. REVENUE (PENDAPATAN DEPARTEMEN)
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>3013</td>
                <td className={styles.excelDescCell}>Rooms Revenue</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.roomRevenue || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.roomRevenue / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>3023</td>
                <td className={styles.excelDescCell}>Food & Beverage Revenue</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.fnbRevenue || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.fnbRevenue / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>3323</td>
                <td className={styles.excelDescCell}>Minor Operating Departments (MOD & OI)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.modRevenue || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.modRevenue / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>TOTAL</td>
                <td className={styles.excelDescCell} style={{ fontWeight: 800 }}>TOTAL NET REVENUE</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669", fontWeight: 900 }}>
                  {formatIDR(pnl.totalNetRevenue || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>100.0%</td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>SVC</td>
                <td className={styles.excelDescCell}>Service Charge (10%)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.serviceCharge || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>10.0%</td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>TAX</td>
                <td className={styles.excelDescCell}>Government Tax (PB1 - 10%)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.governmentTax || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>10.0%</td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>GROSS</td>
                <td className={styles.excelDescCell}>TOTAL GROSS REVENUE (Inc. Tax & Service)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontWeight: 900 }}>
                  {formatIDR(pnl.totalGrossRevenue || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>120.0%</td>
              </tr>

              {/* ── 2. COST OF SALES ── */}
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={4}>
                  2. COST OF SALES (COGS / HPP)
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>4013</td>
                <td className={styles.excelDescCell}>Rooms Cost of Sales</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.roomCogs || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.roomCogs / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>4014</td>
                <td className={styles.excelDescCell}>Food & Beverage Cost of Sales</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.fnbCogs || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.fnbRevenue > 0 ? `${((pnl.fnbCogs / pnl.fnbRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>4114</td>
                <td className={styles.excelDescCell}>Minor Operating Dept Cost of Sales</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.modCogs || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.modRevenue > 0 ? `${((pnl.modCogs / pnl.modRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>TOTAL</td>
                <td className={styles.excelDescCell} style={{ color: "#b91c1c" }}>TOTAL COST OF SALES</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c", fontWeight: 800 }}>
                  {formatIDR(pnl.totalCogs || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.totalCogs / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelTotalRow}>
                <td className={styles.excelCodeCell}>GP</td>
                <td className={styles.excelDescCell}>GROSS PROFIT (Net Revenue - COGS)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontWeight: 900, color: "#1e293b" }}>
                  {formatIDR(pnl.grossProfit || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontWeight: 900 }}>
                  {(pnl.grossProfitMarginPercent || 0).toFixed(1)}%
                </td>
              </tr>

              {/* ── 3. DEPARTMENTAL EXPENSES ── */}
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={4}>
                  3. DEPARTMENTAL EXPENSES (BEBAN OPERASIONAL DEPARTEMEN)
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>5015</td>
                <td className={styles.excelDescCell}>Rooms Department Expenses (FO & HK)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.roomExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.roomExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>5075</td>
                <td className={styles.excelDescCell}>Food & Beverage Department Expenses (All Outlets)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.fnbExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.fnbExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>5115</td>
                <td className={styles.excelDescCell}>Minor Operating Department Expenses (Laundry & Spa)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.modExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.modExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>TOTAL</td>
                <td className={styles.excelDescCell} style={{ color: "#b91c1c" }}>TOTAL DEPARTMENTAL EXPENSES</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c", fontWeight: 800 }}>
                  {formatIDR(pnl.totalDepartmentalExpenses || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.totalDepartmentalExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelTotalRow}>
                <td className={styles.excelCodeCell}>TDP</td>
                <td className={styles.excelDescCell}>TOTAL DEPARTMENTAL PROFIT (TDP)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontWeight: 900, color: "#1e293b" }}>
                  {formatIDR(pnl.totalDepartmentalProfit || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontWeight: 900 }}>
                  {(pnl.tdpMarginPercent || 0).toFixed(1)}%
                </td>
              </tr>

              {/* ── 4. UNDISTRIBUTED EXPENSES ── */}
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={4}>
                  4. UNDISTRIBUTED OPERATING EXPENSES
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>6015</td>
                <td className={styles.excelDescCell}>Administrative & General (A&G)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.agExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.agExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>6045</td>
                <td className={styles.excelDescCell}>Human Resources Department (HRD)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.hrdExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.hrdExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>6075</td>
                <td className={styles.excelDescCell}>Sales & Marketing (SM)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.smExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.smExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>6105</td>
                <td className={styles.excelDescCell}>Property Operations, Maintenance & Energy (POMEC)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{formatIDR(pnl.pomecExpenses || 0)}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.pomecExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>TOTAL</td>
                <td className={styles.excelDescCell} style={{ color: "#b91c1c" }}>TOTAL UNDISTRIBUTED OPERATING EXPENSES</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c", fontWeight: 800 }}>
                  {formatIDR(pnl.totalUndistributedExpenses || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {pnl.totalNetRevenue > 0 ? `${((pnl.totalUndistributedExpenses / pnl.totalNetRevenue) * 100).toFixed(1)}%` : "0%"}
                </td>
              </tr>

              {/* ── 5. GROSS OPERATING PROFIT ── */}
              <tr className={styles.excelHighlightRow}>
                <td className={styles.excelCodeCell} style={{ fontSize: "12px" }}>GOP</td>
                <td className={styles.excelDescCell} style={{ fontSize: "14px", fontWeight: 900 }}>
                  GROSS OPERATING PROFIT (GOP = TDP - Undistributed Expenses)
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontSize: "15px", fontWeight: 900 }}>
                  {formatIDR(pnl.grossOperatingProfit || 0)}
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontSize: "14px", fontWeight: 900 }}>
                  {(pnl.gopMarginPercent || 0).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. NON OPERATING EXPENSES */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>NON-OPERATING</span>
            <h4 className={styles.excelSheetTitle}>OTHER NON OPERATING EXPENSES & NET OPERATING INCOME</h4>
          </div>
          <span className={styles.totalBadge}>
            NOI Margin: {(pnl.noiMarginPercent || 0).toFixed(1)}%
          </span>
        </div>

        <div className={styles.excelTableWrapper}>
          <table className={styles.excelTable}>
            <thead className={styles.excelThead}>
              <tr>
                <th className={styles.excelTh} style={{ width: "90px" }}>Account</th>
                <th className={styles.excelTh}>Account Description</th>
                <th className={`${styles.excelTh} ${styles.excelThRight}`} style={{ width: "220px" }}>
                  Target Budget (IDR)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={3}>
                  OTHER NON OPERATING EXPENSES
                </td>
              </tr>
              {[
                { key: "managementBaseFee", label: "Exp. Management Fees (Base Fee)", code: "6308-01", isAuto: true, note: "Auto Fees Plan (Net Sales %)" },
                { key: "managementIncentiveFee", label: "Exp. Incentive Fees", code: "6308-02", isAuto: true, note: "Auto Fees Plan (GOP %)" },
                { key: "franchiseRoyaltyFee", label: "Exp. Franchise / Royalty Fee", code: "6308-03", isAuto: false },
                { key: "buildingInsurance", label: "Exp. Building Insurance", code: "6308-04", isAuto: false },
                { key: "propertyTaxPbb", label: "Exp. Property Tax (PBB)", code: "6308-05", isAuto: false },
                { key: "bankInterestCharges", label: "Exp. Bank Interest & Financing", code: "6308-06", isAuto: false },
                { key: "depreciationAmortization", label: "Exp. Depreciation & Amortization", code: "6308-07", isAuto: false },
              ].map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{row.code}</td>
                  <td className={styles.excelDescCell}>
                    {row.label}
                    {row.isAuto && (
                      <span style={{ marginLeft: "8px", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "#ecfdf5", color: "#047857", fontWeight: 600 }}>
                        🔒 {row.note}
                      </span>
                    )}
                  </td>
                  <td className={styles.excelInputCell}>
                    {row.isAuto ? (
                      <div className={styles.excelNumValue} style={{ color: "#047857", fontWeight: 700, padding: "6px 12px" }}>
                        {formatIDR((nonOp[row.key as keyof NonOpDepartmentBudget] as number) || 0)}
                      </div>
                    ) : (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={nonOp[row.key as keyof NonOpDepartmentBudget] ? (nonOp[row.key as keyof NonOpDepartmentBudget] as number).toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          handleNonOpChange(row.key as keyof NonOpDepartmentBudget, val);
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    )}
                  </td>
                </tr>
              ))}

              <tr className={styles.excelTotalRow}>
                <td className={styles.excelCodeCell}>TOTAL</td>
                <td className={styles.excelDescCell}>Total Other Non Operating Expenses</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(pnl.nonOperatingExpenses || 0)}
                </td>
              </tr>

              <tr className={styles.excelHighlightRow}>
                <td className={styles.excelCodeCell} style={{ fontSize: "12px" }}>NOI / EBITDA</td>
                <td className={styles.excelDescCell} style={{ fontSize: "14px", fontWeight: 900 }}>
                  NET OPERATING INCOME (NOI = GOP - Non Operating Expenses)
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontSize: "15px", fontWeight: 900 }}>
                  {formatIDR(pnl.netOperatingIncome || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
