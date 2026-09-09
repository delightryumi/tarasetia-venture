"use client";

import React from "react";
import { BudgetMonthData, SmDepartmentBudget, createDefaultSmDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface SmDeptTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

const SM_EXPENSE_ROWS = [
  { key: "uniform", label: "Uniform", code: "EXP-01" },
  { key: "printingStationery", label: "Printing & Stationery", code: "EXP-02" },
  { key: "marketingCollateralsBrochures", label: "Marketing Collaterals & Brochures", code: "EXP-03" },
  { key: "advertisingPromotionOnline", label: "Advertising & Promotion Online", code: "EXP-04" },
  { key: "otaCommissions", label: "OTA Commissions", code: "EXP-05" },
  { key: "travelAgentCommissions", label: "Travel Agent Commissions", code: "EXP-06" },
  { key: "salesTripsTravel", label: "Sales Trips & Travel", code: "EXP-07" },
  { key: "clientEntertainment", label: "Client Entertaintment", code: "EXP-08" },
  { key: "websiteHostingDomain", label: "Website, Hosting & Domain", code: "EXP-09" },
  { key: "photoVideoShootingContent", label: "Photo & Video Shooting Content", code: "EXP-10" },
  { key: "exhibitionsTradeShows", label: "Exhibitions & Trade Shows", code: "EXP-11" },
  { key: "publicRelationsMedia", label: "Public Relations & Media", code: "EXP-12" },
  { key: "guestGiftsSouvenirs", label: "Guest Gifts & Souvenirs", code: "EXP-13" },
  { key: "telephoneInternet", label: "Telephone & Internet", code: "EXP-14" },
  { key: "miscellaneous", label: "Miscellaneous", code: "EXP-15" },
];

export const SmDeptTab: React.FC<SmDeptTabProps> = ({ monthData, onChange }) => {
  const sm: SmDepartmentBudget = monthData.deptSm || createDefaultSmDepartment();

  return (
    <div className={styles.sectionGrid}>
      {/* SALES & MARKETING SALARY & WAGES */}
      <SalaryWagesForm
        deptCodePrefix="SM"
        title="SALES & MARKETING SALARY & WAGES"
        data={sm.salary}
        onChange={(updater) =>
          onChange((d) => {
            if (!d.deptSm) return;
            updater(d.deptSm.salary);
          })
        }
      />

      {/* SALES & MARKETING OTHER OPERATING EXPENSES */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>SALES & MARKETING</span>
            <h4 className={styles.excelSheetTitle}>SALES & MARKETING OTHER OPERATING EXPENSES</h4>
          </div>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Total S&M: {formatIDR(sm.totalExpenses || 0)}
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
              {SM_EXPENSE_ROWS.map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{row.code}</td>
                  <td className={styles.excelDescCell}>{row.label}</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={sm.expenses[row.key as keyof typeof sm.expenses] ? (sm.expenses[row.key as keyof typeof sm.expenses] as number).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.deptSm.expenses[row.key as keyof typeof sm.expenses] = val;
                        });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={styles.excelInput}
                    />
                  </td>
                </tr>
              ))}

              <tr className={styles.excelTotalRow}>
                <td className={styles.excelCodeCell}>TOTAL</td>
                <td className={styles.excelDescCell}>Total Sales & Marketing Expenses (Salary + Other)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(sm.totalExpenses || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
