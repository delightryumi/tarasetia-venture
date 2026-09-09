"use client";

import React, { useState } from "react";
import { BudgetMonthData, RoomDepartmentBudget } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import { SalaryWagesForm } from "../common/SalaryWagesForm";
import styles from "../../budgeting.module.css";

interface RoomDeptTabProps {
  monthData: BudgetMonthData;
  hotelRoomCount: number;
  daysInMonth: number;
  onChange: (updater: (draft: BudgetMonthData) => void) => void;
}

export const RoomDeptTab: React.FC<RoomDeptTabProps> = ({
  monthData,
  hotelRoomCount,
  daysInMonth,
  onChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"all" | "statistic" | "revenue" | "fo" | "hk">("all");

  const rm: RoomDepartmentBudget = monthData?.deptRooms || {
    revenue: { lodging: 0, extraBed: 0, otherRoomRevenue: 0, total: 0 },
    cogs: { roomSupplies: 0, linenReplacement: 0, total: 0 },
    frontOffice: {
      salary: {
        salaryKontrak: 0, wagesDailyWorker: 0, wagesCasual: 0, bpjsKesehatan: 0, bpjsKetenagakerjaan: 0,
        bonusThr: 0, payrollTax: 0, employeeMeals: 0, employeeHousing: 0, overtimePay: 0,
        employeeTransportation: 0, total: 0,
      },
      expenses: {
        uniform: 0, printingStationery: 0, transportFuel: 0, travelExpenses: 0, consultant: 0,
        decoration: 0, guestTransportation: 0, reservationExpenses: 0, guestSupplies: 0,
        telephone: 0, tvCable: 0, internetProvider: 0, entertainment: 0, newspaperMagazine: 0,
        postageCourier: 0, pestControl: 0, cleaningSupplies: 0, commission: 0, pulsaHp: 0,
        welcomeDrink: 0, miscellaneous: 0, total: 0,
      },
      totalExpenses: 0,
    },
    housekeeping: {
      salary: {
        salaryKontrak: 0, wagesDailyWorker: 0, wagesCasual: 0, bpjsKesehatan: 0, bpjsKetenagakerjaan: 0,
        bonusThr: 0, payrollTax: 0, employeeMeals: 0, employeeHousing: 0, overtimePay: 0,
        employeeTransportation: 0, total: 0,
      },
      expenses: {
        uniform: 0, guestLaundry: 0, printingStationery: 0, transportFuel: 0, travelExpenses: 0,
        consultant: 0, equipmentRental: 0, decoration: 0, guestSupplies: 0, cleaningSupplies: 0,
        linenReplacement: 0, chinaGlassReplacement: 0, telephone: 0, landscapeGround: 0,
        roomDeodorant: 0, pestControl: 0, postageCourier: 0, pulsaHp: 0, laundryLinen: 0,
        miscellaneous: 0, total: 0,
      },
      totalExpenses: 0,
    },
    totalExpenses: 0,
    departmentProfit: 0,
  };

  const st = monthData?.statistic || {
    roomsAvailable: 0,
    roomsOutOfOrder: 0,
    roomsOccupiedComp: 0,
    roomsOccupiedHouseUse: 0,
    occupiedRoomsPaid: 0,
    totalRoomsOccupied: 0,
    occupancyPercent: 0,
    arrIdr: 0,
    revParIdr: 0,
    totalPax: 0,
    payingPax: 0,
    fnbCoverCount: 0,
    fnbAverageSpend: 0,
  };
  const autoRoomsAvailable = hotelRoomCount * daysInMonth;

  // Handle Occupancy % Change with auto Room Sold & Lodging Revenue
  const handleOccupancyChange = (occPct: number) => {
    onChange((draft) => {
      draft.statistic.occupancyPercent = occPct;
      draft.statistic.roomsAvailable = autoRoomsAvailable;
      const saleable = Math.max(0, autoRoomsAvailable - (draft.statistic.roomsOutOfOrder || 0));
      const sold = Math.round((saleable * occPct) / 100);
      draft.statistic.occupiedRoomsPaid = sold;
      draft.statistic.totalPax = Math.round(sold * 1.2);
      draft.statistic.payingPax = draft.statistic.totalPax;
      if (draft.statistic.arrIdr > 0) {
        draft.deptRooms.revenue.lodging = sold * draft.statistic.arrIdr;
        draft.roomRevenue.lodging = draft.deptRooms.revenue.lodging;
      }
    });
  };

  const foExpRows: { key: keyof typeof rm.frontOffice.expenses; label: string; code: string }[] = [
    { key: "uniform", label: "Uniform", code: "EXP-01" },
    { key: "printingStationery", label: "Printing & Stationery", code: "EXP-02" },
    { key: "transportFuel", label: "Transport, Fuel & Parking", code: "EXP-03" },
    { key: "travelExpenses", label: "Travelling Expenses", code: "EXP-04" },
    { key: "consultant", label: "Consultant", code: "EXP-05" },
    { key: "decoration", label: "Decoration", code: "EXP-06" },
    { key: "guestTransportation", label: "Guest Transportation", code: "EXP-07" },
    { key: "reservationExpenses", label: "Reservation Expenses", code: "EXP-08" },
    { key: "guestSupplies", label: "Guest Supplies", code: "EXP-09" },
    { key: "telephone", label: "Telephone", code: "EXP-10" },
    { key: "tvCable", label: "TV Cable", code: "EXP-11" },
    { key: "internetProvider", label: "Internet Provider", code: "EXP-12" },
    { key: "entertainment", label: "Entertaintment", code: "EXP-13" },
    { key: "newspaperMagazine", label: "Newspaper & Magazine", code: "EXP-14" },
    { key: "postageCourier", label: "Postage & Courier", code: "EXP-15" },
    { key: "pestControl", label: "Pest Control", code: "EXP-16" },
    { key: "cleaningSupplies", label: "Cleaning Supplies", code: "EXP-17" },
    { key: "commission", label: "Commission", code: "EXP-18" },
    { key: "pulsaHp", label: "Pulsa HP Operasional", code: "EXP-19" },
    { key: "welcomeDrink", label: "Welcome Drink", code: "EXP-20" },
    { key: "miscellaneous", label: "Miscellaneous", code: "EXP-21" },
  ];

  const hkExpRows: { key: keyof typeof rm.housekeeping.expenses; label: string; code: string }[] = [
    { key: "uniform", label: "Uniform", code: "EXP-01" },
    { key: "guestLaundry", label: "Guest Laundry", code: "EXP-02" },
    { key: "printingStationery", label: "Printing & Stationery", code: "EXP-03" },
    { key: "transportFuel", label: "Transport & Fuel", code: "EXP-04" },
    { key: "travelExpenses", label: "Travelling Expenses", code: "EXP-05" },
    { key: "consultant", label: "Consultant", code: "EXP-06" },
    { key: "equipmentRental", label: "Equipment Rental", code: "EXP-07" },
    { key: "decoration", label: "Decoration", code: "EXP-08" },
    { key: "guestSupplies", label: "Guest Supplies", code: "EXP-09" },
    { key: "cleaningSupplies", label: "Cleaning Supplies", code: "EXP-10" },
    { key: "linenReplacement", label: "Linen Replacement", code: "EXP-11" },
    { key: "chinaGlassReplacement", label: "China & Glass Replacement", code: "EXP-12" },
    { key: "telephone", label: "Telephone", code: "EXP-13" },
    { key: "landscapeGround", label: "Landscape & Ground Maintenance", code: "EXP-14" },
    { key: "roomDeodorant", label: "Room Deodorant & Fragrance", code: "EXP-15" },
    { key: "pestControl", label: "Pest Control", code: "EXP-16" },
    { key: "postageCourier", label: "Postage & Courier", code: "EXP-17" },
    { key: "pulsaHp", label: "Pulsa HP", code: "EXP-18" },
    { key: "laundryLinen", label: "Laundry Linen", code: "EXP-19" },
    { key: "miscellaneous", label: "Miscellaneous", code: "EXP-20" },
  ];

  return (
    <div className={styles.sectionGrid}>
      {/* Sub Tab Navigation */}
      <div className={styles.mainTabs}>
        <button
          onClick={() => setActiveSubTab("all")}
          className={`${styles.mainTabBtn} ${activeSubTab === "all" ? styles.mainTabBtnActive : ""}`}
        >
          Semua Bagian Room
        </button>
        <button
          onClick={() => setActiveSubTab("statistic")}
          className={`${styles.mainTabBtn} ${activeSubTab === "statistic" ? styles.mainTabBtnActive : ""}`}
        >
          STATISTIC
        </button>
        <button
          onClick={() => setActiveSubTab("revenue")}
          className={`${styles.mainTabBtn} ${activeSubTab === "revenue" ? styles.mainTabBtnActive : ""}`}
        >
          ROOM REVENUE & COGS
        </button>
        <button
          onClick={() => setActiveSubTab("fo")}
          className={`${styles.mainTabBtn} ${activeSubTab === "fo" ? styles.mainTabBtnActive : ""}`}
        >
          ROOM-FO
        </button>
        <button
          onClick={() => setActiveSubTab("hk")}
          className={`${styles.mainTabBtn} ${activeSubTab === "hk" ? styles.mainTabBtnActive : ""}`}
        >
          ROOM-HK
        </button>
      </div>

      {/* 1. STATISTIC */}
      {(activeSubTab === "all" || activeSubTab === "statistic") && (
        <div className={styles.excelCard}>
          <div className={styles.excelSheetBanner}>
            <div className={styles.excelSheetTitleGroup}>
              <span className={styles.excelSheetTag}>STATISTIC</span>
              <h4 className={styles.excelSheetTitle}>Hotel Room Statistics & Target Key Drivers</h4>
            </div>
            <span className={styles.badgeAuto}>Auto CPanel: {hotelRoomCount} Kamar Fisik</span>
          </div>

          <div className={styles.excelTableWrapper}>
            <table className={styles.excelTable}>
              <thead className={styles.excelThead}>
                <tr>
                  <th className={styles.excelTh} style={{ width: "90px" }}>Line</th>
                  <th className={styles.excelTh}>Statistical Indicator / Parameter</th>
                  <th className={`${styles.excelTh} ${styles.excelThRight}`} style={{ width: "220px" }}>
                    Target Value
                  </th>
                  <th className={styles.excelTh} style={{ width: "200px" }}>Keterangan / Rumus</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-01</td>
                  <td className={styles.excelDescCell}># of Rooms (Kapasitas Kamar Fisik)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{hotelRoomCount}</td>
                  <td className={styles.excelCodeCell}>Auto dari CPanel</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-02</td>
                  <td className={styles.excelDescCell}>Days Operation (Hari Operasional Bulan Ini)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{daysInMonth} Hari</td>
                  <td className={styles.excelCodeCell}>Kalender Aktual</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-03</td>
                  <td className={styles.excelDescCell}>Total Rooms Available (Kamar Tersedia)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>{autoRoomsAvailable} Kamar</td>
                  <td className={styles.excelCodeCell}>{hotelRoomCount} × {daysInMonth} Hari</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-04</td>
                  <td className={styles.excelDescCell}>Rooms Out of Order (OOO)</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={st.roomsOutOfOrder ? st.roomsOutOfOrder.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => (d.statistic.roomsOutOfOrder = val));
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={styles.excelInput}
                    />
                  </td>
                  <td className={styles.excelCodeCell}>Kamar Maintenance</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-05</td>
                  <td className={styles.excelDescCell}>Total Rooms Available for Sales (Kamar Siap Jual)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                    {autoRoomsAvailable - (st.roomsOutOfOrder || 0)} Kamar
                  </td>
                  <td className={styles.excelCodeCell}>Available - OOO</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-06</td>
                  <td className={styles.excelDescCell}>Occupancy % - Paid (Target Hunian Berbayar)</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={st.occupancyPercent || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        handleOccupancyChange(val);
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0%"
                      className={styles.excelInput}
                    />
                  </td>
                  <td className={styles.excelCodeCell}>Target Occ (%)</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-07</td>
                  <td className={styles.excelDescCell}>Occupied rooms - paid (Room Sold / Kamar Terjual)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`}>
                    {st.occupiedRoomsPaid || 0} Kamar
                  </td>
                  <td className={styles.excelCodeCell}>Available × Occ %</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-08</td>
                  <td className={styles.excelDescCell}>ARR - IDR (Average Room Rate)</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={st.arrIdr ? st.arrIdr.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.statistic.arrIdr = val;
                          if (d.statistic.occupiedRoomsPaid > 0) {
                            d.deptRooms.revenue.lodging = d.statistic.occupiedRoomsPaid * val;
                            d.roomRevenue.lodging = d.deptRooms.revenue.lodging;
                          }
                        });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Rp 0"
                      className={styles.excelInput}
                    />
                  </td>
                  <td className={styles.excelCodeCell}>Rata-rata Harga Kamar</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-09</td>
                  <td className={styles.excelDescCell}>Total Covers / # of Guests in house (Total Tamu)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669", fontWeight: 700 }}>
                    {Math.round((st.occupiedRoomsPaid || 0) * 1.2).toLocaleString("id-ID")} Covers
                  </td>
                  <td className={styles.excelCodeCell}>Room Sold × 1.2 (Auto Locked)</td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>ST-10</td>
                  <td className={styles.excelDescCell}>REVPAR (Revenue Per Available Room)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669" }}>
                    {autoRoomsAvailable > 0
                      ? formatIDR(Math.round(((rm.revenue.lodging || 0)) / autoRoomsAvailable))
                      : "Rp 0"}
                  </td>
                  <td className={styles.excelCodeCell}>Lodging Rev / Available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ROOM REVENUE & COST OF SALES */}
      {(activeSubTab === "all" || activeSubTab === "revenue") && (
        <div className={styles.excelCard}>
          <div className={styles.excelSheetBanner}>
            <div className={styles.excelSheetTitleGroup}>
              <span className={styles.excelSheetTag}>ROOM</span>
              <h4 className={styles.excelSheetTitle}>ROOM REVENUE & COST OF SALES</h4>
            </div>
            <span className={styles.totalBadge}>
              Total Rev: {formatIDR(rm.revenue.total || 0)}
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
                {/* ROOM REVENUE */}
                <tr className={styles.excelCategoryRow}>
                  <td className={styles.excelCategoryCell} colSpan={3}>
                    ROOM REVENUE
                  </td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>REV-01</td>
                  <td className={styles.excelDescCell}>Room Revenue (Lodging)</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#2563eb", fontWeight: 700 }}>
                    {formatIDR((st.occupiedRoomsPaid || 0) * (st.arrIdr || 0))}
                  </td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>REV-02</td>
                  <td className={styles.excelDescCell}>Extra Bed</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={rm.revenue.extraBed ? rm.revenue.extraBed.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          d.deptRooms.revenue.extraBed = val;
                          d.roomRevenue.extraBed = val;
                        });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={styles.excelInput}
                    />
                  </td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>REV-03</td>
                  <td className={styles.excelDescCell}>Other Room Revenue</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={((rm.revenue.otherRoomRevenue ?? (rm.revenue as any).otherRoom)) ? (rm.revenue.otherRoomRevenue ?? (rm.revenue as any).otherRoom).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          if (!d.deptRooms) d.deptRooms = createDefaultRoomDepartment();
                          d.deptRooms.revenue.otherRoomRevenue = val;
                          (d.deptRooms.revenue as any).otherRoom = val;
                          d.roomRevenue.otherRoomRevenue = val;
                        });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={styles.excelInput}
                    />
                  </td>
                </tr>
                <tr className={styles.excelSubtotalRow}>
                  <td className={styles.excelCodeCell}>SUBTOTAL</td>
                  <td className={styles.excelDescCell}>Total Room Revenue</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#059669", fontWeight: 800 }}>
                    {formatIDR(
                      ((st.occupiedRoomsPaid || 0) * (st.arrIdr || 0)) +
                      (rm.revenue.extraBed || 0) +
                      (rm.revenue.otherRoomRevenue || (rm.revenue as any).otherRoom || 0)
                    )}
                  </td>
                </tr>

                {/* COST OF ROOM */}
                <tr className={styles.excelCategoryRow}>
                  <td className={styles.excelCategoryCell} colSpan={3}>
                    COST OF ROOMS
                  </td>
                </tr>
                <tr className={styles.excelRow}>
                  <td className={styles.excelCodeCell}>COGS-01</td>
                  <td className={styles.excelDescCell}>Cost of Room (Guest Supplies & Linen)</td>
                  <td className={styles.excelInputCell}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={((rm.cogs.roomSupplies ?? (rm.cogs as any).costOfRoom)) ? (rm.cogs.roomSupplies ?? (rm.cogs as any).costOfRoom).toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                        onChange((d) => {
                          if (!d.deptRooms) d.deptRooms = createDefaultRoomDepartment();
                          d.deptRooms.cogs.roomSupplies = val;
                          (d.deptRooms.cogs as any).costOfRoom = val;
                        });
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className={styles.excelInput}
                    />
                  </td>
                </tr>
                <tr className={styles.excelSubtotalRow}>
                  <td className={styles.excelCodeCell}>SUBTOTAL</td>
                  <td className={styles.excelDescCell}>Total Cost of Sales Room</td>
                  <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                    {formatIDR(rm.cogs.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FRONT OFFICE */}
      {(activeSubTab === "all" || activeSubTab === "fo") && (
        <div className={styles.sectionGrid}>
          {/* FO SALARY & WAGES */}
          <SalaryWagesForm
            deptCodePrefix="FO"
            title="FRONT OFFICE SALARY & WAGES"
            data={rm.frontOffice.salary}
            onChange={(updater) =>
              onChange((d) => {
                if (!d.deptRooms) return;
                updater(d.deptRooms.frontOffice.salary);
              })
            }
          />

          {/* FO OTHER OPERATING EXPENSES */}
          <div className={styles.excelCard}>
            <div className={styles.excelSheetBanner}>
              <div className={styles.excelSheetTitleGroup}>
                <span className={styles.excelSheetTag}>FRONT OFFICE</span>
                <h4 className={styles.excelSheetTitle}>FRONT OFFICE OTHER OPERATING EXPENSES</h4>
              </div>
              <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
                Total FO Exp: {formatIDR(rm.frontOffice.totalExpenses || 0)}
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
                  {foExpRows.map((row) => (
                    <tr key={row.key} className={styles.excelRow}>
                      <td className={styles.excelCodeCell}>{row.code}</td>
                      <td className={styles.excelDescCell}>{row.label}</td>
                      <td className={styles.excelInputCell}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={rm.frontOffice.expenses[row.key] ? (rm.frontOffice.expenses[row.key] as number).toLocaleString("id-ID") : ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                            onChange((d) => {
                              d.deptRooms.frontOffice.expenses[row.key] = val;
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
                    <td className={styles.excelDescCell}>Total Front Office Expenses (Salary + Other)</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                      {formatIDR(rm.frontOffice.totalExpenses || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. HOUSEKEEPING */}
      {(activeSubTab === "all" || activeSubTab === "hk") && (
        <div className={styles.sectionGrid}>
          {/* HK SALARY & WAGES */}
          <SalaryWagesForm
            deptCodePrefix="HK"
            title="HOUSEKEEPING SALARY & WAGES"
            data={rm.housekeeping.salary}
            onChange={(updater) =>
              onChange((d) => {
                if (!d.deptRooms) return;
                updater(d.deptRooms.housekeeping.salary);
              })
            }
          />

          {/* HK OTHER OPERATING EXPENSES */}
          <div className={styles.excelCard}>
            <div className={styles.excelSheetBanner}>
              <div className={styles.excelSheetTitleGroup}>
                <span className={styles.excelSheetTag}>HOUSEKEEPING</span>
                <h4 className={styles.excelSheetTitle}>HOUSEKEEPING OTHER OPERATING EXPENSES</h4>
              </div>
              <span className={styles.totalBadge} style={{ color: "#b91c1c", backgroundColor: "#fee2e2" }}>
                Total HK Exp: {formatIDR(rm.housekeeping.totalExpenses || 0)}
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
                  {hkExpRows.map((row) => (
                    <tr key={row.key} className={styles.excelRow}>
                      <td className={styles.excelCodeCell}>{row.code}</td>
                      <td className={styles.excelDescCell}>{row.label}</td>
                      <td className={styles.excelInputCell}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={rm.housekeeping.expenses[row.key] ? (rm.housekeeping.expenses[row.key] as number).toLocaleString("id-ID") : ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0;
                            onChange((d) => {
                              d.deptRooms.housekeeping.expenses[row.key] = val;
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
                    <td className={styles.excelDescCell}>Total Housekeeping Expenses (Salary + Other)</td>
                    <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ color: "#b91c1c" }}>
                      {formatIDR(rm.housekeeping.totalExpenses || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. DEPARTMENTAL PROFIT SUMMARY CARD */}
      <div className={styles.excelCard}>
        <div className={styles.excelTableWrapper}>
          <table className={styles.excelTable}>
            <tbody>
              <tr className={styles.excelHighlightRow}>
                <td className={styles.excelCodeCell} style={{ fontSize: "12px" }}>NET PROFIT</td>
                <td className={styles.excelDescCell} style={{ fontSize: "14px", fontWeight: 900 }}>
                  TOTAL ROOM DEPARTMENT PROFIT (Revenue - COGS - FO Exp - HK Exp)
                </td>
                <td className={`${styles.excelInputCell} ${styles.excelNumValue}`} style={{ fontSize: "15px" }}>
                  {formatIDR(rm.departmentProfit || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
