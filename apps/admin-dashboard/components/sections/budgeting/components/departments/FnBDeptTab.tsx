"use client";

import React, { useState } from "react";
import { BudgetMonthData, FbDepartmentBudget, FbOutletExpenses, createDefaultFbDepartment } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface FnBDeptTabProps {
  monthData: BudgetMonthData;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

const EXPENSE_ROW_CONFIG: { key: keyof FbOutletExpenses; label: string; code: string }[] = [
  { key: "uniform", label: "Uniform", code: "01" },
  { key: "printingStationery", label: "Printing & Stationery", code: "02" },
  { key: "transportFuel", label: "Transport, Fuel & Parking", code: "03" },
  { key: "entertainment", label: "Entertaintment", code: "04" },
  { key: "testFood", label: "Test Food", code: "05" },
  { key: "decoration", label: "Decoration", code: "06" },
  { key: "equipmentRental", label: "Equipment Rental", code: "07" },
  { key: "kitchenSupplies", label: "Kitchen Supplies", code: "08" },
  { key: "guestSupplies", label: "Guest Supplies", code: "09" },
  { key: "cleaningSupplies", label: "Cleaning Supplies", code: "10" },
  { key: "linenReplacement", label: "Linen Replacement", code: "11" },
  { key: "chinaGlassSilverware", label: "China, Glass & Silverware Replacement", code: "12" },
  { key: "telephone", label: "Telephone", code: "13" },
  { key: "spoilage", label: "Spoilage", code: "14" },
  { key: "specialPromotion", label: "Special Promotion", code: "15" },
  { key: "laundryLinen", label: "Laundry Linen", code: "16" },
  { key: "pestControl", label: "Pest Controll", code: "17" },
  { key: "postageCourier", label: "Postage & Courier", code: "18" },
  { key: "banquetExpenses", label: "Banquet Expenses", code: "19" },
  { key: "kitchenFuelGas", label: "Kitchen Fuel Gas / LPG", code: "20" },
  { key: "paperSupplies", label: "Paper Supplies", code: "21" },
  { key: "menuFoodBevList", label: "Menu Food & Beverage List", code: "22" },
  { key: "serviceEquipment", label: "Service Equipment", code: "23" },
  { key: "miscellaneous", label: "Miscellaneous", code: "24" },
];

export const FnBDeptTab: React.FC<FnBDeptTabProps> = ({ monthData, onChange }) => {
  const [activeOutlet, setActiveOutlet] = useState<"restaurant" | "kitchen" | "lounge" | "banquet" | "roomService">("restaurant");

  const fnb: FbDepartmentBudget = monthData.deptFnB || createDefaultFbDepartment();

  const handleExpenseChange = (
    outlet: "restaurant" | "kitchen" | "lounge" | "banquet" | "roomService",
    field: keyof FbOutletExpenses,
    val: number
  ) => {
    onChange((draft) => {
      if (!draft.deptFnB) draft.deptFnB = createDefaultFbDepartment();
      const exp = draft.deptFnB[outlet].expenses;
      exp[field] = val;
    });
  };

  const currentOutletData = fnb[activeOutlet];
  const outletPrefixMap = {
    restaurant: { tag: "F&B RESTAURANT", title: "RESTAURANT OUTLET", code: "REST", revCode: "3023", cogsCode: "4014", expCode: "5075" },
    kitchen: { tag: "F&B KITCHEN", title: "KITCHEN PRODUCT", code: "KC", revCode: "3023", cogsCode: "4014", expCode: "5085" },
    lounge: { tag: "SKY LOUNGE", title: "SKY LOUNGE & BAR", code: "LOUNGE", revCode: "3033", cogsCode: "4024", expCode: "5095" },
    banquet: { tag: "BANQUET & EVENTS", title: "BANQUET & EVENTS", code: "BQ", revCode: "3063", cogsCode: "4054", expCode: "5105" },
    roomService: { tag: "ROOM SERVICE", title: "ROOM SERVICE", code: "RS", revCode: "3073", cogsCode: "4064", expCode: "5115" },
  };

  const meta = outletPrefixMap[activeOutlet];

  return (
    <div className={styles.sectionGrid}>
      {/* Outlet Sub Tabs */}
      <div className={styles.mainTabs}>
        <button
          onClick={() => setActiveOutlet("restaurant")}
          className={`${styles.mainTabBtn} ${activeOutlet === "restaurant" ? styles.mainTabBtnActive : ""}`}
        >
          Restaurant
        </button>
        <button
          onClick={() => setActiveOutlet("kitchen")}
          className={`${styles.mainTabBtn} ${activeOutlet === "kitchen" ? styles.mainTabBtnActive : ""}`}
        >
          Kitchen
        </button>
        <button
          onClick={() => setActiveOutlet("lounge")}
          className={`${styles.mainTabBtn} ${activeOutlet === "lounge" ? styles.mainTabBtnActive : ""}`}
        >
          Sky Lounge & Bar
        </button>
        <button
          onClick={() => setActiveOutlet("banquet")}
          className={`${styles.mainTabBtn} ${activeOutlet === "banquet" ? styles.mainTabBtnActive : ""}`}
        >
          Banquet & Events
        </button>
        <button
          onClick={() => setActiveOutlet("roomService")}
          className={`${styles.mainTabBtn} ${activeOutlet === "roomService" ? styles.mainTabBtnActive : ""}`}
        >
          Room Service
        </button>
      </div>

      {/* 1. REVENUE & COGS TABLE (Menurun Sesuai Excel) */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>{meta.tag}</span>
            <h4 className={styles.excelSheetTitle}>{meta.title} - REVENUE & COST OF SALES</h4>
          </div>
          <span className={styles.totalBadge}>
            Net Rev: {formatIDR(fnb.revenue[activeOutlet]?.total || 0)}
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
              {/* REVENUE */}
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={3}>
                  {meta.code} REVENUE
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{meta.revCode}-01</td>
                <td className={styles.excelDescCell}>{meta.code}-Food Revenue</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fnb.revenue[activeOutlet]?.food ? fnb.revenue[activeOutlet].food.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((d) => (d.deptFnB[activeOutlet].revenue.food = val));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{meta.revCode}-02</td>
                <td className={styles.excelDescCell}>{meta.code}-Beverage Revenue</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fnb.revenue[activeOutlet]?.beverage ? fnb.revenue[activeOutlet].beverage.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((d) => (d.deptFnB[activeOutlet].revenue.beverage = val));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{meta.revCode}-03</td>
                <td className={styles.excelDescCell}>{meta.code}-Others</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fnb.revenue[activeOutlet]?.other ? fnb.revenue[activeOutlet].other.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((d) => (d.deptFnB[activeOutlet].revenue.other = val));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>SUBTOTAL</td>
                <td className={styles.excelDescCell}>Total Revenue - {meta.title}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669" }}>
                  {formatIDR(fnb.revenue[activeOutlet]?.total || 0)}
                </td>
              </tr>

              {/* COST OF SALES */}
              <tr className={styles.excelCategoryRow}>
                <td className={styles.excelCategoryCell} colSpan={3}>
                  COST OF SALES - {meta.code}
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{meta.cogsCode}-01</td>
                <td className={styles.excelDescCell}>{meta.code}-Cost of Food</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fnb.cogs[activeOutlet]?.costFood ? fnb.cogs[activeOutlet].costFood.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((d) => (d.deptFnB[activeOutlet].cogs.costFood = val));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{meta.cogsCode}-02</td>
                <td className={styles.excelDescCell}>{meta.code}-Cost of Beverage</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fnb.cogs[activeOutlet]?.costBeverage ? fnb.cogs[activeOutlet].costBeverage.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((d) => (d.deptFnB[activeOutlet].cogs.costBeverage = val));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
              </tr>
              <tr className={styles.excelRow}>
                <td className={styles.excelCodeCell}>{meta.cogsCode}-03</td>
                <td className={styles.excelDescCell}>{meta.code}-Cost of Other</td>
                <td className={styles.excelInputCell}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fnb.cogs[activeOutlet]?.costOther ? fnb.cogs[activeOutlet].costOther.toLocaleString("id-ID") : ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                      onChange((d) => (d.deptFnB[activeOutlet].cogs.costOther = val));
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0"
                    className={styles.excelInput}
                  />
                </td>
              </tr>
              <tr className={styles.excelSubtotalRow}>
                <td className={styles.excelCodeCell}>SUBTOTAL</td>
                <td className={styles.excelDescCell}>Total Cost of Sales - {meta.title}</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(fnb.cogs[activeOutlet]?.total || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SALARY & WAGES FORM */}
      <SalaryWagesForm
        deptCodePrefix={meta.code}
        title={`${meta.code} SALARY & WAGES`}
        data={currentOutletData.salary}
        onChange={(updater) =>
          onChange((d) => {
            if (!d.deptFnB) return;
            updater(d.deptFnB[activeOutlet].salary);
          })
        }
      />

      {/* 3. OTHER OPERATING EXPENSES (Menurun Sesuai Excel) */}
      <div className={styles.excelCard}>
        <div className={styles.excelSheetBanner}>
          <div className={styles.excelSheetTitleGroup}>
            <span className={styles.excelSheetTag}>{meta.tag}</span>
            <h4 className={styles.excelSheetTitle}>OTHER OPERATING EXPENSES - {meta.title}</h4>
          </div>
          <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
            Total Exp: {formatIDR(currentOutletData.totalExpenses || 0)}
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
              {EXPENSE_ROW_CONFIG.map((row) => (
                <tr key={row.key} className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>{meta.code}-{row.code}</td>
                  <td className={styles.excelDescCell}>FB - {row.label}</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentOutletData.expenses[row.key] ? (currentOutletData.expenses[row.key] as number).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        handleExpenseChange(activeOutlet, row.key, val);
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
                <td className={styles.excelDescCell}>Total Expenses {meta.title} (Salary + Other)</td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                  {formatIDR(currentOutletData.totalExpenses || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. TOTAL F&B PROFIT HIGHLIGHT ROW */}
      <div className={styles.excelCard}>
        <div className={styles.excelTableWrapper}>
          <table className={styles.excelTable}>
            <tbody>
              <tr className={styles.excelHighlightRow}>
                <td className={styles.excelCodeCell} style={{ fontSize: "12px" }}>NET PROFIT</td>
                <td className={styles.excelDescCell} style={{ fontSize: "14px", fontWeight: 900 }}>
                  TOTAL F&B DEPARTMENT PROFIT (All Outlets Rev - COGS - All Expenses)
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontSize: "15px" }}>
                  {formatIDR(fnb.departmentProfit || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
