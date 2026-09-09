"use client";

import React from "react";
import { DeptSalaryWages } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import styles from "../../budgeting.module.css";

interface SalaryWagesFormProps {
  deptCodePrefix?: string; // e.g. "FO", "HK", "REST", "KC", "AG", "HR", "SM", "POM"
  title?: string;
  data: DeptSalaryWages;
  onChange: (updater: (draft: DeptSalaryWages) => void) => void;
}

export const SalaryWagesForm: React.FC<SalaryWagesFormProps> = ({
  deptCodePrefix = "DEPT",
  title = "Salary & Related",
  data,
  onChange,
}) => {
  const rows: { key: keyof DeptSalaryWages; label: string; code: string; formula: string }[] = [
    { key: "salaryKontrak", label: `${deptCodePrefix} - Salary (Kontrak/Permanen)`, code: "01", formula: "Staff & HOD (Manning)" },
    { key: "wagesDailyWorker", label: `${deptCodePrefix} - Wages (Daily Workers)`, code: "02", formula: "DW Count × UMR" },
    { key: "wagesCasual", label: `${deptCodePrefix} - Wages (Casual & Trainee)`, code: "03", formula: "Casual & Trainee allowance" },
    { key: "bpjsKesehatan", label: `${deptCodePrefix} - BPJS Kesehatan`, code: "04", formula: "4.0% × Base Salary" },
    { key: "bpjsKetenagakerjaan", label: `${deptCodePrefix} - BPJS Ketenaga Kerjaan`, code: "05", formula: "5.7% × Base Salary" },
    { key: "bonusThr", label: `${deptCodePrefix} - Bonus (THR)`, code: "06", formula: "1 Bulan Gaji / 12" },
    { key: "payrollTax", label: `${deptCodePrefix} - Payroll Tax (PPh 21)`, code: "07", formula: "1.5% × Salary" },
    { key: "employeeMeals", label: `${deptCodePrefix} - Employee Meals`, code: "08", formula: "Staff × Meal Rate × 30" },
    { key: "employeeHousing", label: `${deptCodePrefix} - Employee Housing`, code: "09", formula: "-" },
    { key: "overtimePay", label: `${deptCodePrefix} - Overtime Pay`, code: "10", formula: "Staff Allowance (5%)" },
    { key: "employeeTransportation", label: `${deptCodePrefix} - Employee Transportation`, code: "11", formula: "Staff × 100k / Bulan" },
  ];

  return (
    <div className={styles.excelCard}>
      <div className={styles.excelSheetBanner}>
        <div className={styles.excelSheetTitleGroup}>
          <span className={styles.excelSheetTag} style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>
            💰 SALARY & WAGES
          </span>
          <h4 className={styles.excelSheetTitle}>{title}</h4>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 8px", borderRadius: "6px" }}>
            Bisa Diedit / Auto Manning
          </span>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Total Payroll: {formatIDR(data?.total || 0)}
          </span>
        </div>
      </div>

      <div className={styles.excelTableWrapper}>
        <table className={styles.excelTable}>
          <thead className={styles.excelThead}>
            <tr>
              <th className={styles.excelTh} style={{ width: "90px" }}>Kode</th>
              <th className={styles.excelTh}>Account Description</th>
              <th className={`${styles.excelTh} ${styles.excelThRight}`} style={{ width: "220px" }}>
                Target Budget (IDR)
              </th>
              <th className={styles.excelTh} style={{ width: "200px" }}>Sumber / Rumus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{row.code}</td>
                <td className={styles.excelDescCell}>{row.label}</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data?.[row.key] ? (data[row.key] as number).toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((draft) => {
                        draft[row.key] = val;
                      });
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
                <td className={styles.excelCodeCell} style={{ color: "#64748b" }}>
                  {row.formula}
                </td>
              </tr>
            ))}

            {/* Total Row */}
            <tr className={styles.excelTotalRow}>
              <td className={styles.excelCodeCell}>TOTAL</td>
              <td className={styles.excelDescCell}>Total {title}</td>
              <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c", fontWeight: 800 }}>
                {formatIDR(data?.total || 0)}
              </td>
              <td className={styles.excelCodeCell} style={{ color: "#059669", fontWeight: 700 }}>
                Total Salary & Wages
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
