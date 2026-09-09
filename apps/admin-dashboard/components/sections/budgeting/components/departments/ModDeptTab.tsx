"use client";

import React, { useState } from "react";
import { BudgetMonthData, ModDepartmentBudget, createDefaultModDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface ModDeptTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

export const ModDeptTab: React.FC<ModDeptTabProps> = ({ monthData, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<"laundry" | "spa" | "other">("laundry");

  const mod: ModDepartmentBudget = monthData.deptMod || createDefaultModDepartment();

  return (
    <div className={styles.sectionGrid}>
      {/* Sub Tabs */}
      <div className={styles.mainTabs}>
        <button
          onClick={() => setActiveSubTab("laundry")}
          className={`${styles.mainTabBtn} ${activeSubTab === "laundry" ? styles.mainTabBtnActive : ""}`}
        >
          Laundry
        </button>
        <button
          onClick={() => setActiveSubTab("spa")}
          className={`${styles.mainTabBtn} ${activeSubTab === "spa" ? styles.mainTabBtnActive : ""}`}
        >
          Spa & Fitness
        </button>
        <button
          onClick={() => setActiveSubTab("other")}
          className={`${styles.mainTabBtn} ${activeSubTab === "other" ? styles.mainTabBtnActive : ""}`}
        >
          Other Income
        </button>
      </div>

      {/* 1. LAUNDRY DEPARTMENT */}
      {activeSubTab === "laundry" && (
        <div className={styles.sectionGrid}>
          {/* Revenue & COGS */}
          <div className={styles.excelCard}>
            <div className={styles.excelSheetBanner}>
              <div className={styles.excelSheetTitleGroup}>
                <span className={styles.excelSheetTag}>LAUNDRY</span>
                <h4 className={styles.excelSheetTitle}>LAUNDRY REVENUE & COST OF SALES</h4>
              </div>
              <span className={styles.totalBadge}>
                Rev: {formatIDR(mod.laundry.revenue.total || 0)}
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
                      LAUNDRY & DRY CLEANING REVENUE
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3323-01</td>
                    <td className={styles.excelDescCell}>LD-Laundry</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.laundry.revenue.laundry ? mod.laundry.revenue.laundry.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.laundry.revenue.laundry = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3323-02</td>
                    <td className={styles.excelDescCell}>LD-Dry Clean</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.laundry.revenue.dryClean ? mod.laundry.revenue.dryClean.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.laundry.revenue.dryClean = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3323-03</td>
                    <td className={styles.excelDescCell}>LD-Pressing</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.laundry.revenue.pressing ? mod.laundry.revenue.pressing.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.laundry.revenue.pressing = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3323-04</td>
                    <td className={styles.excelDescCell}>LD-Other</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.laundry.revenue.other ? mod.laundry.revenue.other.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.laundry.revenue.other = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelSubtotalRow}>
                    <td className={styles.excelCodeCell}>SUBTOTAL</td>
                    <td className={styles.excelDescCell}>Total Revenue Laundry</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669" }}>
                      {formatIDR(mod.laundry.revenue.total || 0)}
                    </td>
                  </tr>

                  {/* COGS LAUNDRY */}
                  <tr className={styles.excelCategoryRow}>
                    <td className={styles.excelCategoryCell} colSpan={3}>
                      COST OF SALES LAUNDRY
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>4114-01</td>
                    <td className={styles.excelDescCell}>LD-Cost of laundry</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.laundry.cogs.costLaundry ? mod.laundry.cogs.costLaundry.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.laundry.cogs.costLaundry = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>4114-02</td>
                    <td className={styles.excelDescCell}>LD-Cost of Others</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.laundry.cogs.costOther ? mod.laundry.cogs.costOther.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.laundry.cogs.costOther = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelSubtotalRow}>
                    <td className={styles.excelCodeCell}>SUBTOTAL</td>
                    <td className={styles.excelDescCell}>Total Cost of Sales Laundry</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                      {formatIDR(mod.laundry.cogs.total || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Salary & Related Laundry */}
          <SalaryWagesForm
            deptCodePrefix="LD"
            title="LAUNDRY SALARY & WAGES"
            data={mod.laundry.salary}
            onChange={(updater) =>
              onChange((d) => {
                if (!d.deptMod) return;
                updater(d.deptMod.laundry.salary);
              })
            }
          />

          {/* Operating Expenses Laundry */}
          <div className={styles.excelCard}>
            <div className={styles.excelSheetBanner}>
              <div className={styles.excelSheetTitleGroup}>
                <span className={styles.excelSheetTag}>LAUNDRY</span>
                <h4 className={styles.excelSheetTitle}>LAUNDRY OTHER OPERATING EXPENSES</h4>
              </div>
              <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
                Total Exp: {formatIDR(mod.laundry.totalExpenses || 0)}
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
                  {[
                    { key: "uniform", label: "LD - Uniform", code: "5127-01" },
                    { key: "chemicalSupplies", label: "LD - Chemical Supplies", code: "5127-02" },
                    { key: "packingSupplies", label: "LD - Packing Supplies", code: "5127-03" },
                    { key: "machineMaintenance", label: "LD - Machine Maintenance", code: "5127-04" },
                    { key: "transportFuel", label: "LD - Transport, Fuel & Parking", code: "5127-05" },
                    { key: "miscellaneous", label: "LD - Miscellaneous", code: "5127-06" },
                  ].map((row) => (
                    <tr key={row.key} className={styles.excelRow}>
                      <td className={styles.excelCodeCell}>{row.code}</td>
                      <td className={styles.excelDescCell}>{row.label}</td>
                      <td className={styles.excelInputCell}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mod.laundry.expenses[row.key as keyof typeof mod.laundry.expenses] ? (mod.laundry.expenses[row.key as keyof typeof mod.laundry.expenses] as number).toLocaleString("id-ID") : ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                            onChange((d) => {
                              d.deptMod.laundry.expenses[row.key as keyof typeof mod.laundry.expenses] = val;
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
                    <td className={styles.excelDescCell}>Total Laundry Expenses (Salary + Other)</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                      {formatIDR(mod.laundry.totalExpenses || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. SPA & FITNESS DEPARTMENT */}
      {activeSubTab === "spa" && (
        <div className={styles.sectionGrid}>
          {/* Revenue & COGS */}
          <div className={styles.excelCard}>
            <div className={styles.excelSheetBanner}>
              <div className={styles.excelSheetTitleGroup}>
                <span className={styles.excelSheetTag}>SPA & FITNESS</span>
                <h4 className={styles.excelSheetTitle}>SPA & FITNESS REVENUE & COST OF SALES</h4>
              </div>
              <span className={styles.totalBadge}>
                Rev: {formatIDR(mod.spaFitness.revenue.total || 0)}
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
                      SPA & FITNESS REVENUE
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3333-01</td>
                    <td className={styles.excelDescCell}>SPA-Massage & Teraphy</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.spaFitness.revenue.massageTherapy ? mod.spaFitness.revenue.massageTherapy.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.spaFitness.revenue.massageTherapy = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3333-02</td>
                    <td className={styles.excelDescCell}>SPA-Fitness</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.spaFitness.revenue.fitness ? mod.spaFitness.revenue.fitness.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.spaFitness.revenue.fitness = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>3333-03</td>
                    <td className={styles.excelDescCell}>SPA-Others</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.spaFitness.revenue.others ? mod.spaFitness.revenue.others.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.spaFitness.revenue.others = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelSubtotalRow}>
                    <td className={styles.excelCodeCell}>SUBTOTAL</td>
                    <td className={styles.excelDescCell}>Total Revenue SPA & Fitness</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669" }}>
                      {formatIDR(mod.spaFitness.revenue.total || 0)}
                    </td>
                  </tr>

                  {/* COGS SPA */}
                  <tr className={styles.excelCategoryRow}>
                    <td className={styles.excelCategoryCell} colSpan={3}>
                      COST OF SALES SPA & FITNESS
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>4124-01</td>
                    <td className={styles.excelDescCell}>SPA Cost of Treatment</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.spaFitness.cogs.costTreatment ? mod.spaFitness.cogs.costTreatment.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.spaFitness.cogs.costTreatment = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>4124-02</td>
                    <td className={styles.excelDescCell}>SPA-Cost of Others</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.spaFitness.cogs.costOthers ? mod.spaFitness.cogs.costOthers.toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => (d.deptMod.spaFitness.cogs.costOthers = val));
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className={styles.excelInput}
                      />
                    </td>
                  </tr>
                  <tr className={styles.excelSubtotalRow}>
                    <td className={styles.excelCodeCell}>SUBTOTAL</td>
                    <td className={styles.excelDescCell}>Total Cost of Sales Spa & Fitness</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                      {formatIDR(mod.spaFitness.cogs.total || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Salary & Related Spa */}
          <SalaryWagesForm
            deptCodePrefix="SPA"
            title="SPA & FITNESS SALARY & WAGES"
            data={mod.spaFitness.salary}
            onChange={(updater) =>
              onChange((d) => {
                if (!d.deptMod) return;
                updater(d.deptMod.spaFitness.salary);
              })
            }
          />

          {/* Operating Expenses Spa */}
          <div className={styles.excelCard}>
            <div className={styles.excelSheetBanner}>
              <div className={styles.excelSheetTitleGroup}>
                <span className={styles.excelSheetTag}>SPA & FITNESS</span>
                <h4 className={styles.excelSheetTitle}>SPA & FITNESS OTHER OPERATING EXPENSES</h4>
              </div>
              <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
                Total Exp: {formatIDR(mod.spaFitness.totalExpenses || 0)}
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
                  {[
                    { key: "uniform", label: "SPA - Uniform", code: "5147-01" },
                    { key: "massageOilsLinen", label: "SPA - Massage Oils & Linens", code: "5147-02" },
                    { key: "aromatherapySupplies", label: "SPA - Aromatherapy Supplies", code: "5147-03" },
                    { key: "guestSupplies", label: "SPA - Guest Supplies", code: "5147-04" },
                    { key: "cleaningSupplies", label: "SPA - Cleaning Supplies", code: "5147-05" },
                    { key: "miscellaneous", label: "SPA - Miscellaneous", code: "5147-06" },
                  ].map((row) => (
                    <tr key={row.key} className={styles.excelRow}>
                      <td className={styles.excelCodeCell}>{row.code}</td>
                      <td className={styles.excelDescCell}>{row.label}</td>
                      <td className={styles.excelInputCell}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={mod.spaFitness.expenses[row.key as keyof typeof mod.spaFitness.expenses] ? (mod.spaFitness.expenses[row.key as keyof typeof mod.spaFitness.expenses] as number).toLocaleString("id-ID") : ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                            onChange((d) => {
                              d.deptMod.spaFitness.expenses[row.key as keyof typeof mod.spaFitness.expenses] = val;
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
                    <td className={styles.excelDescCell}>Total Spa Expenses (Salary + Other)</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                      {formatIDR(mod.spaFitness.totalExpenses || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. OTHER INCOME (OI) */}
      {activeSubTab === "other" && (
        <div className={styles.excelCard}>
          <div className={styles.excelSheetBanner}>
            <div className={styles.excelSheetTitleGroup}>
              <span className={styles.excelSheetTag}>OTHER INCOME</span>
              <h4 className={styles.excelSheetTitle}>OTHER INCOME & COST OF SALES</h4>
            </div>
            <span className={styles.totalBadge}>
              Net OI: {formatIDR(mod.otherIncome.departmentProfit || 0)}
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
                    OTHER OPERATING INCOME
                  </td>
                </tr>
                {[
                  { key: "spaceRental", label: "OI-Space Rental", code: "3503-01" },
                  { key: "transportation", label: "OI-Transportation", code: "3503-02" },
                  { key: "commission", label: "OI-Commission", code: "3503-03" },
                  { key: "cityTour", label: "OI-City Tour", code: "3503-04" },
                  { key: "others", label: "OI-Others", code: "3503-05" },
                ].map((row) => (
                  <tr key={row.key} className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>{row.code}</td>
                    <td className={styles.excelDescCell}>{row.label}</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.otherIncome.revenue[row.key as keyof typeof mod.otherIncome.revenue] ? (mod.otherIncome.revenue[row.key as keyof typeof mod.otherIncome.revenue] as number).toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => {
                            d.deptMod.otherIncome.revenue[row.key as keyof typeof mod.otherIncome.revenue] = val;
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
                  <td className={styles.excelDescCell}>Total Other Income Revenue</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669" }}>
                    {formatIDR(mod.otherIncome.revenue.total || 0)}
                  </td>
                </tr>

                {/* COGS OTHER INCOME */}
                <tr className={styles.excelCategoryRow}>
                  <td className={styles.excelCategoryCell} colSpan={3}>
                    COST OF SALES OTHER INCOME
                  </td>
                </tr>
                {[
                  { key: "costSpaceRental", label: "OI-Cost Space Rental", code: "4144-01" },
                  { key: "costCarRental", label: "OI-Cost Car Rental", code: "4144-02" },
                  { key: "costCommission", label: "OI-Cost Commission", code: "4144-03" },
                  { key: "costCityTour", label: "OI-Cost City Tour", code: "4144-04" },
                  { key: "costOthers", label: "OI-Cost Others", code: "4144-05" },
                ].map((row) => (
                  <tr key={row.key} className={styles.excelRow}>
                    <td className={styles.excelCodeCell}>{row.code}</td>
                    <td className={styles.excelDescCell}>{row.label}</td>
                    <td className={styles.excelInputCell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={mod.otherIncome.cogs[row.key as keyof typeof mod.otherIncome.cogs] ? (mod.otherIncome.cogs[row.key as keyof typeof mod.otherIncome.cogs] as number).toLocaleString("id-ID") : ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                          onChange((d) => {
                            d.deptMod.otherIncome.cogs[row.key as keyof typeof mod.otherIncome.cogs] = val;
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
                  <td className={styles.excelDescCell}>Total Cost of Sales Other Income</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                    {formatIDR(mod.otherIncome.cogs.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOTAL MOD PROFIT HIGHLIGHT ROW */}
      <div className={styles.excelCard}>
        <div className={styles.excelTableWrapper}>
          <table className={styles.excelTable}>
            <tbody>
              <tr className={styles.excelHighlightRow}>
                <td className={styles.excelCodeCell} style={{ fontSize: "12px" }}>NET PROFIT</td>
                <td className={styles.excelDescCell} style={{ fontSize: "14px", fontWeight: 900 }}>
                  TOTAL MINOR OPERATING DEPARTMENT PROFIT (Laundry + Spa + Other Income)
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontSize: "15px" }}>
                  {formatIDR(mod.departmentProfit || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
