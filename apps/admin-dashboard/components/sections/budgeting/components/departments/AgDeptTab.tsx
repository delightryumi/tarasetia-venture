"use client";

import React from "react";
import { BudgetMonthData, AgDepartmentBudget, createDefaultAgDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface AgDeptTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

const AG_EXPENSE_ROWS = [
  { key: "uniform", label: "Uniform", code: "EXP-01" },
  { key: "printingStationery", label: "Printing & Stationery", code: "EXP-02" },
  { key: "postageCourier", label: "Postage & Courier", code: "EXP-03" },
  { key: "transportFuelParking", label: "Transport, Fuel & Parking", code: "EXP-04" },
  { key: "entertainment", label: "Entertaintment", code: "EXP-05" },
  { key: "travelExpenses", label: "Travelling Expenses", code: "EXP-06" },
  { key: "telephone", label: "Telephone", code: "EXP-07" },
  { key: "internetProvider", label: "Internet Provider", code: "EXP-08" },
  { key: "tvCable", label: "TV Cable", code: "EXP-09" },
  { key: "bankChargesEdc", label: "Bank Charges & EDC Fees", code: "EXP-10" },
  { key: "legalAuditFees", label: "Legal & Audit Fees", code: "EXP-11" },
  { key: "consultant", label: "Consultant", code: "EXP-12" },
  { key: "securityExpenses", label: "Security Expenses", code: "EXP-13" },
  { key: "recruitmentFee", label: "Recruitment Fee", code: "EXP-14" },
  { key: "softwareLicensesIt", label: "Software Licenses & IT", code: "EXP-15" },
  { key: "trainingDevelopment", label: "Training & Development", code: "EXP-16" },
  { key: "taxConsultant", label: "Tax Consultant", code: "EXP-17" },
  { key: "insuranceProperty", label: "Insurance Property", code: "EXP-18" },
  { key: "insuranceGeneral", label: "Insurance General", code: "EXP-19" },
  { key: "donationCommunity", label: "Donation & Community", code: "EXP-20" },
  { key: "badDebtProvision", label: "Bad Debt Provision", code: "EXP-21" },
  { key: "miscellaneous", label: "Miscellaneous", code: "EXP-22" },
];

export const AgDeptTab: React.FC<AgDeptTabProps> = ({ monthData, onChange }) => {
  const ag: AgDepartmentBudget = monthData.deptAg || createDefaultAgDepartment();

  return (
    <div className={styles.sectionGrid}>
      {/* A&G SALARY & WAGES */}
      <SalaryWagesForm
        deptCodePrefix="AG"
        title="A&G SALARY & WAGES"
        data={ag.salary}
        onChange={(updater) =>
          onChange((d) => {
            if (!d.deptAg) return;
            updater(d.deptAg.salary);
          })
        }
      />

      {/* A&G OTHER OPERATING EXPENSES */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>A&G</span>
            <h4 className={styles.excelSheetTitle}>A&G OTHER OPERATING EXPENSES</h4>
          </div>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Total A&G: {formatIDR(ag.totalExpenses || 0)}
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
              {AG_EXPENSE_ROWS.map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{row.code}</td>
                  <td className={styles.excelDescCell}>{row.label}</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={ag.expenses[row.key as keyof typeof ag.expenses] ? (ag.expenses[row.key as keyof typeof ag.expenses] as number).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.deptAg.expenses[row.key as keyof typeof ag.expenses] = val;
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
                <td className={styles.excelDescCell}>Total A&G Expenses (Salary + Other)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(ag.totalExpenses || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
