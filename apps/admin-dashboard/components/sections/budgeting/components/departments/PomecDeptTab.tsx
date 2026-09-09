"use client";

import React from "react";
import { BudgetMonthData, PomecDepartmentBudget, createDefaultPomecDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface PomecDeptTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

const POMEC_ENERGY_ROWS = [
  { key: "electricityPln", label: "Electricity (PLN)", code: "ENG-01" },
  { key: "waterPdamWell", label: "Water (PDAM / Well)", code: "ENG-02" },
  { key: "kitchenLpgGas", label: "Kitchen LPG Gas", code: "ENG-03" },
  { key: "dieselFuelSolar", label: "Diesel Fuel (Solar Genset)", code: "ENG-04" },
];

const POMEC_MAINTENANCE_ROWS = [
  { key: "airConditioning", label: "Air Conditioning (AC)", code: "MNT-01" },
  { key: "generatorElectrical", label: "Generator & Electrical", code: "MNT-02" },
  { key: "plumbingWaterSystem", label: "Plumbing & Water System", code: "MNT-03" },
  { key: "buildingStructural", label: "Building Structural", code: "MNT-04" },
  { key: "kitchenEquipmentMaint", label: "Kitchen Equipment Maintenance", code: "MNT-05" },
  { key: "swimmingPoolChemicals", label: "Swimming Pool Chemicals", code: "MNT-06" },
  { key: "fireSafetyEquipment", label: "Fire Safety Equipment", code: "MNT-07" },
  { key: "landscapingGardening", label: "Landscaping & Gardening", code: "MNT-08" },
  { key: "itHardwareMaintenance", label: "IT Hardware Maintenance", code: "MNT-09" },
  { key: "elevatorMaintenance", label: "Elevator / Lift Maintenance", code: "MNT-10" },
  { key: "paintingCarpentry", label: "Painting & Carpentry", code: "MNT-11" },
  { key: "toolsEquipment", label: "Tools & Equipment", code: "MNT-12" },
  { key: "pestControlBuilding", label: "Pest Control Building", code: "MNT-13" },
  { key: "miscellaneous", label: "Miscellaneous", code: "MNT-14" },
];

export const PomecDeptTab: React.FC<PomecDeptTabProps> = ({ monthData, onChange }) => {
  const pomec: PomecDepartmentBudget = monthData?.deptPomec || createDefaultPomecDepartment();

  return (
    <div className={styles.sectionGrid}>
      {/* POMEC SALARY & WAGES */}
      <SalaryWagesForm
        deptCodePrefix="POM"
        title="POMEC SALARY & WAGES"
        data={pomec.salary}
        onChange={(updater) =>
          onChange((d) => {
            if (!d.deptPomec) return;
            updater(d.deptPomec.salary);
          })
        }
      />

      {/* POMEC ENERGY EXPENSES */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>POMEC</span>
            <h4 className={styles.excelSheetTitle}>ENERGY & UTILITIES EXPENSES</h4>
          </div>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Energy: {formatIDR(pomec.energy.total || 0)}
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
              {POMEC_ENERGY_ROWS.map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{row.code}</td>
                  <td className={styles.excelDescCell}>{row.label}</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pomec.energy[row.key as keyof typeof pomec.energy] ? (pomec.energy[row.key as keyof typeof pomec.energy] as number).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.deptPomec.energy[row.key as keyof typeof pomec.energy] = val;
                        });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={styles.excelInput}
                    />
                  </td>
                </tr>
              ))}

              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>SUBTOTAL</td>
                <td className={styles.excelDescCell}>Total Energy & Utilities Expenses</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(pomec.energy.total || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* POMEC MAINTENANCE & REPAIRS */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>POMEC</span>
            <h4 className={styles.excelSheetTitle}>MAINTENANCE & REPAIR EXPENSES</h4>
          </div>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Total POMEC: {formatIDR(pomec.totalExpenses || 0)}
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
              {POMEC_MAINTENANCE_ROWS.map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{row.code}</td>
                  <td className={styles.excelDescCell}>{row.label}</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pomec.maintenance[row.key as keyof typeof pomec.maintenance] ? (pomec.maintenance[row.key as keyof typeof pomec.maintenance] as number).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.deptPomec.maintenance[row.key as keyof typeof pomec.maintenance] = val;
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
                <td className={styles.excelDescCell}>Total POMEC Expenses (Salary + Energy + Maintenance)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(pomec.totalExpenses || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
