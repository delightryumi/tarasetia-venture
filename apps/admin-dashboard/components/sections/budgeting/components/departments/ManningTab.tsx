"use client";

import React from "react";
import {
  YearlyBudgetDocument,
  YearlyManningPlan,
  DeptManningLevel,
  createDefaultManningPlan,
  createDefaultDeptManningLevel,
  syncManningToBudgetDoc,
} from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { Users, Briefcase, Award, Building, Sparkles } from "lucide-react";
import styles from "./manning.module.css";

interface ManningTabProps {
  budgetDoc: YearlyBudgetDocument;
  hotelRoomCount: number;
  onDocChange: (updater: (draft: YearlyBudgetDocument) => void) => void;
}

const DEPT_ROWS: {
  key: keyof YearlyManningPlan["departments"];
  label: string;
  hodTitle: string;
  coordTitle: string;
}[] = [
  { key: "gmExcom", label: "Executive Committee (EXCOM / GM)", hodTitle: "G|HM", coordTitle: "-" },
  { key: "frontOffice", label: "Front Office (FO)", hodTitle: "FOM", coordTitle: "A.FOM" },
  { key: "housekeeping", label: "Housekeeping (HK)", hodTitle: "EHK", coordTitle: "A.EHK" },
  { key: "fnbKitchen", label: "F&B Kitchen (FB Prod)", hodTitle: "Chef", coordTitle: "FB Prod" },
  { key: "fnbService", label: "F&B Service (FB Rest)", hodTitle: "FBM", coordTitle: "A.FBM" },
  { key: "salesMarketing", label: "Sales & Marketing (SM)", hodTitle: "DOS", coordTitle: "SM" },
  { key: "accounting", label: "Administration & General / Acct", hodTitle: "CA", coordTitle: "ACCT" },
  { key: "hrd", label: "Human Resources (HRD)", hodTitle: "HRM", coordTitle: "HR" },
  { key: "engineering", label: "POMEC / Engineering (ENG)", hodTitle: "CE", coordTitle: "ENG" },
  { key: "spaFitness", label: "Spa & Minor Operating (SPA)", hodTitle: "Spa Mgr", coordTitle: "Spa Spv" },
];

export const ManningTab: React.FC<ManningTabProps> = ({
  budgetDoc,
  hotelRoomCount,
  onDocChange,
}) => {
  const manning: YearlyManningPlan =
    budgetDoc.manning || createDefaultManningPlan(hotelRoomCount, budgetDoc.year);

  const updateAssumptions = (field: keyof typeof manning.assumptions, val: number) => {
    onDocChange((draft) => {
      if (!draft.manning) draft.manning = createDefaultManningPlan(hotelRoomCount, draft.year);
      (draft.manning.assumptions as any)[field] = val;

      if (field === "umrPreviousYear" || field === "umrCurrentYear") {
        const prev = field === "umrPreviousYear" ? val : draft.manning.assumptions.umrPreviousYear;
        const curr = field === "umrCurrentYear" ? val : draft.manning.assumptions.umrCurrentYear;
        if (prev > 0) {
          draft.manning.assumptions.umrIncrementPercent = Number((((curr - prev) / prev) * 100).toFixed(2));
        }
      }

      // Auto sync calculated salaries across all 12 months & departments
      syncManningToBudgetDoc(draft);
    });
  };

  const updateDeptLevel = (
    deptKey: keyof YearlyManningPlan["departments"],
    levelKey: keyof DeptManningLevel,
    val: number
  ) => {
    onDocChange((draft) => {
      if (!draft.manning) draft.manning = createDefaultManningPlan(hotelRoomCount, draft.year);
      const d = draft.manning.departments[deptKey];
      if (!d) return;

      (d as any)[levelKey] = Math.max(0, val);
      d.total =
        (d.excom || 0) +
        (d.hod || 0) +
        (d.coordinator || 0) +
        (d.supervisor || 0) +
        (d.rankAndFile || 0) +
        (d.dailyWorker || 0) +
        (d.trainee || 0) +
        (d.casual || 0);

      // Recalculate totals across all departments
      let totContract = 0;
      let totDw = 0;
      let totCasual = 0;
      let totTrainee = 0;

      Object.values(draft.manning.departments).forEach((dept) => {
        totContract +=
          (dept.excom || 0) +
          (dept.hod || 0) +
          (dept.coordinator || 0) +
          (dept.supervisor || 0) +
          (dept.rankAndFile || 0);
        totDw += dept.dailyWorker || 0;
        totCasual += dept.casual || 0;
        totTrainee += dept.trainee || 0;
      });

      draft.manning.contractCount = totContract;
      draft.manning.dailyWorkerCount = totDw;
      draft.manning.casualCount = totCasual;
      draft.manning.traineeCount = totTrainee;
      draft.manning.totalAllManning = totContract + totDw + totCasual + totTrainee;
      const rooms = draft.manning.assumptions.roomInventory || hotelRoomCount || 1;
      draft.manning.employeeRatio = Number((draft.manning.totalAllManning / rooms).toFixed(3));

      // Auto sync calculated salaries across all 12 months & departments
      syncManningToBudgetDoc(draft);
    });
  };

  return (
    <div className={styles.container}>
      {/* 1. ASSUMPTIONS & RATIO CARD */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.badge}>
              <Users size={13} style={{ display: "inline", marginRight: "4px" }} />
              MANNING
            </div>
            <h3 className={styles.title}>ASUMSI KETENAGAKERJAAN & STANDAR GAJI</h3>
          </div>
          <span className={styles.tag}>Perencanaan Tahunan</span>
        </div>

        {/* Assumptions Form Grid */}
        <div className={styles.assumptionsGrid}>
          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>Jumlah Kamar Fisik</span>
            <input
              type="number"
              className={styles.paramInput}
              value={manning.assumptions.roomInventory}
              onChange={(e) => updateAssumptions("roomInventory", Number(e.target.value))}
            />
            <span className={styles.paramHelp}>Kapasitas kamar hotel</span>
          </div>

          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>Total Kamar Tersedia / Tahun</span>
            <span className={styles.paramValue} style={{ color: "#2563eb" }}>
              {manning.assumptions.roomInventory * 365} Kamar
            </span>
            <span className={styles.paramHelp}>{manning.assumptions.roomInventory} Kamar × 365 Hari</span>
          </div>

          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>UMR Tahun Sebelumnya ({budgetDoc.year - 1})</span>
            <input
              type="number"
              className={styles.paramInput}
              value={manning.assumptions.umrPreviousYear}
              onChange={(e) => updateAssumptions("umrPreviousYear", Number(e.target.value))}
            />
            <span className={styles.paramHelp}>{formatIDR(manning.assumptions.umrPreviousYear)}</span>
          </div>

          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>UMR Target Budget ({budgetDoc.year})</span>
            <input
              type="number"
              className={styles.paramInput}
              value={manning.assumptions.umrCurrentYear}
              onChange={(e) => updateAssumptions("umrCurrentYear", Number(e.target.value))}
            />
            <span className={styles.paramHelp}>{formatIDR(manning.assumptions.umrCurrentYear)}</span>
          </div>

          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>Kenaikan UMR (%)</span>
            <span className={styles.paramValue} style={{ color: "#16a34a" }}>
              {manning.assumptions.umrIncrementPercent}%
            </span>
            <span className={styles.paramHelp}>Kenaikan {budgetDoc.year} vs {budgetDoc.year - 1}</span>
          </div>

          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>Biaya Makan Karyawan / Pax</span>
            <input
              type="number"
              className={styles.paramInput}
              value={manning.assumptions.employeeMealPerPax}
              onChange={(e) => updateAssumptions("employeeMealPerPax", Number(e.target.value))}
            />
            <span className={styles.paramHelp}>{formatIDR(manning.assumptions.employeeMealPerPax)} / meal</span>
          </div>

          <div className={styles.paramCard}>
            <span className={styles.paramLabel}>Asumsi Inflasi (%)</span>
            <input
              type="number"
              className={styles.paramInput}
              value={manning.assumptions.inflationPercent}
              onChange={(e) => updateAssumptions("inflationPercent", Number(e.target.value))}
            />
            <span className={styles.paramHelp}>{manning.assumptions.inflationPercent}%</span>
          </div>
        </div>

        {/* Headcount Recap Pills */}
        <div className={styles.summaryRecapRow}>
          <div className={styles.recapPill}>
            <span className={styles.recapLabel}>Karyawan Kontrak</span>
            <span className={styles.recapNumber}>{manning.contractCount} Org</span>
          </div>
          <div className={styles.recapPill}>
            <span className={styles.recapLabel}>Daily Worker (DW)</span>
            <span className={styles.recapNumber}>{manning.dailyWorkerCount} Org</span>
          </div>
          <div className={styles.recapPill}>
            <span className={styles.recapLabel}>Casual Worker</span>
            <span className={styles.recapNumber}>{manning.casualCount} Org</span>
          </div>
          <div className={styles.recapPill}>
            <span className={styles.recapLabel}>Trainee / Magang</span>
            <span className={styles.recapNumber}>{manning.traineeCount} Org</span>
          </div>
          <div className={styles.recapPillHighlight}>
            <span className={styles.recapLabel} style={{ color: "#1d4ed8" }}>Total Seluruh Manning</span>
            <span className={styles.recapNumber} style={{ color: "#1e40af" }}>
              {manning.totalAllManning} Personel
            </span>
          </div>
          <div className={styles.recapPillHighlight} style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <span className={styles.recapLabel} style={{ color: "#15803d" }}>Rasio Karyawan / Kamar</span>
            <span className={styles.recapNumber} style={{ color: "#166534" }}>
              {manning.employeeRatio}
            </span>
          </div>
        </div>
      </div>

      {/* 2. DETAILED DEPARTMENTAL MANNING MATRIX */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.badge} style={{ background: "#059669" }}>
              STRUKTUR
            </div>
            <h3 className={styles.title}>ALOKASI PERSONEL PER DEPARTEMEN & LEVEL JABATAN</h3>
          </div>
          <span className={styles.tag}>Matriks Formasi Tenaga Kerja</span>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>DEPARTEMEN</th>
                <th style={{ textAlign: "center" }}>EXCOM</th>
                <th style={{ textAlign: "center" }}>HOD</th>
                <th style={{ textAlign: "center" }}>COORD</th>
                <th style={{ textAlign: "center" }}>SPV</th>
                <th style={{ textAlign: "center" }}>STAFF</th>
                <th style={{ textAlign: "center" }}>DW</th>
                <th style={{ textAlign: "center" }}>TRAINEE</th>
                <th style={{ textAlign: "center" }}>CASUAL</th>
                <th style={{ textAlign: "right", paddingRight: "14px" }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {DEPT_ROWS.map((d) => {
                const item = manning.departments[d.key] || createDefaultDeptManningLevel();
                return (
                  <tr key={d.key}>
                    <td className={styles.cellDept}>{d.label}</td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.excom || 0}
                        onChange={(e) => updateDeptLevel(d.key, "excom", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.hod || 0}
                        onChange={(e) => updateDeptLevel(d.key, "hod", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.coordinator || 0}
                        onChange={(e) => updateDeptLevel(d.key, "coordinator", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.supervisor || 0}
                        onChange={(e) => updateDeptLevel(d.key, "supervisor", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.rankAndFile || 0}
                        onChange={(e) => updateDeptLevel(d.key, "rankAndFile", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.dailyWorker || 0}
                        onChange={(e) => updateDeptLevel(d.key, "dailyWorker", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.trainee || 0}
                        onChange={(e) => updateDeptLevel(d.key, "trainee", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellInput} style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        className={styles.numInput}
                        value={item.casual || 0}
                        onChange={(e) => updateDeptLevel(d.key, "casual", Number(e.target.value))}
                      />
                    </td>
                    <td className={styles.cellTotal}>{item.total || 0} Org</td>
                  </tr>
                );
              })}
              <tr className={styles.grandTotalRow}>
                <td className={styles.cellDept} style={{ color: "#166534" }}>TOTAL SELURUH DEPARTEMEN</td>
                <td style={{ textAlign: "center" }}>
                  {Object.values(manning.departments).reduce((acc, x) => acc + (x?.excom || 0), 0)}
                </td>
                <td style={{ textAlign: "center" }}>
                  {Object.values(manning.departments).reduce((acc, x) => acc + (x?.hod || 0), 0)}
                </td>
                <td style={{ textAlign: "center" }}>
                  {Object.values(manning.departments).reduce((acc, x) => acc + (x?.coordinator || 0), 0)}
                </td>
                <td style={{ textAlign: "center" }}>
                  {Object.values(manning.departments).reduce((acc, x) => acc + (x?.supervisor || 0), 0)}
                </td>
                <td style={{ textAlign: "center" }}>
                  {Object.values(manning.departments).reduce((acc, x) => acc + (x?.rankAndFile || 0), 0)}
                </td>
                <td style={{ textAlign: "center" }}>{manning.dailyWorkerCount}</td>
                <td style={{ textAlign: "center" }}>{manning.traineeCount}</td>
                <td style={{ textAlign: "center" }}>{manning.casualCount}</td>
                <td className={styles.cellTotal} style={{ color: "#166534", fontSize: "15px" }}>
                  {manning.totalAllManning} Org
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
