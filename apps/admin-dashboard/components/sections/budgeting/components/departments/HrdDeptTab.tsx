"use client";

import React from "react";
import { BudgetMonthData, HrdDepartmentBudget, createDefaultHrdDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface HrdDeptTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

const HR_EXPENSE_ROWS = [
  { key: "uniform", label: "Uniform", code: "EXP-01" },
  { key: "printingStationery", label: "Printing & Stationery", code: "EXP-02" },
  { key: "recruitmentAdvertisement", label: "Recruitment & Advertisement", code: "EXP-03" },
  { key: "trainingSeminar", label: "Training & Seminar", code: "EXP-04" },
  { key: "medicalClinic", label: "Medical & Clinic", code: "EXP-05" },
  { key: "staffGatheringOuting", label: "Staff Gathering / Outing", code: "EXP-06" },
  { key: "employeeAppreciationAward", label: "Employee Appreciation Award", code: "EXP-07" },
  { key: "sportsRecreation", label: "Sports & Recreation", code: "EXP-08" },
  { key: "consultantHrd", label: "Consultant HRD", code: "EXP-09" },
  { key: "miscellaneous", label: "Miscellaneous", code: "EXP-10" },
];

export const HrdDeptTab: React.FC<HrdDeptTabProps> = ({ monthData, onChange }) => {
  const hrd: HrdDepartmentBudget = monthData?.deptHrd || createDefaultHrdDepartment();

  return (
    <div className={styles.sectionGrid}>
      {/* HRD SALARY & WAGES */}
      <SalaryWagesForm
        deptCodePrefix="HR"
        title="HRD SALARY & WAGES"
        data={hrd.salary}
        onChange={(updater) =>
          onChange((d) => {
            if (!d.deptHrd) return;
            updater(d.deptHrd.salary);
          })
        }
      />

      {/* HRD OTHER OPERATING EXPENSES */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>HRD</span>
            <h4 className={styles.excelSheetTitle}>HRD OTHER OPERATING EXPENSES</h4>
          </div>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Total HRD: {formatIDR(hrd.totalExpenses || 0)}
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
              {HR_EXPENSE_ROWS.map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{row.code}</td>
                  <td className={styles.excelDescCell}>{row.label}</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hrd.expenses[row.key as keyof typeof hrd.expenses] ? (hrd.expenses[row.key as keyof typeof hrd.expenses] as number).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.deptHrd.expenses[row.key as keyof typeof hrd.expenses] = val;
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
                <td className={styles.excelDescCell}>Total HRD Expenses (Salary + Other)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(hrd.totalExpenses || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
