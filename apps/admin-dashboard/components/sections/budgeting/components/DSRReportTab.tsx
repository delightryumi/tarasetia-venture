"use client";

import React from "react";
import { DSRReportResult, DSRDataRow } from "@/lib/budget-types";
import { formatIDR } from "@/lib/pnl-utils";
import styles from "../budgeting.module.css";

interface DSRReportTabProps {
  dsrReport: DSRReportResult;
  hotelName: string;
}

export const DSRReportTab: React.FC<DSRReportTabProps> = ({ dsrReport, hotelName }) => {
  const [y, m, d] = dsrReport.date.split("-");
  const formattedDate = `${d}/${m}/${y}`;

  const renderValue = (val: number, isPercent?: boolean, isCurrency?: boolean) => {
    if (isPercent) {
      return `${val.toFixed(2)} %`;
    }
    if (isCurrency) {
      if (val === 0) return "-";
      return formatIDR(Math.round(val));
    }
    if (val === 0) return "0";
    return Number.isInteger(val) ? val.toLocaleString("id-ID") : val.toFixed(1);
  };

  const renderVar = (val: number, isPercent?: boolean, isCurrency?: boolean) => {
    if (val === 0) return "-";
    const isPositive = val > 0;
    const formatted = renderValue(val, isPercent, isCurrency);
    return (
      <span className={isPositive ? styles.varPositive : styles.varNegative}>
        {isPositive ? `+${formatted}` : formatted}
      </span>
    );
  };

  const renderRows = (rows: DSRDataRow[]) => {
    return rows.map((row) => {
      const c = row.cells;
      let rowClass = styles.dataRow;
      if (row.isHighlight) rowClass = `${styles.dataRow} ${styles.highlightRow}`;
      else if (row.isTotal) rowClass = `${styles.dataRow} ${styles.totalRow}`;

      return (
        <tr key={row.id} className={rowClass}>
          <td className={styles.cellText} style={{ paddingLeft: row.isTotal || row.isHighlight ? "14px" : "26px" }}>
            {row.label}
          </td>
          {/* TODAY */}
          <td className={`${styles.cellNum} ${styles.borderCol}`}>
            {renderValue(c.todayActual, row.isPercent, row.isCurrency)}
          </td>
          <td className={styles.cellNum}>
            {c.todayVar !== undefined ? renderVar(c.todayVar, row.isPercent, row.isCurrency) : "-"}
          </td>
          {/* MTD */}
          <td className={`${styles.cellNum} ${styles.borderCol}`} style={{ fontWeight: 600 }}>
            {renderValue(c.mtdActual, row.isPercent, row.isCurrency)}
          </td>
          <td className={styles.cellNum}>
            {row.isPercent ? "-" : `${c.mtdPercent.toFixed(1)}%`}
          </td>
          <td className={styles.cellNum} style={{ opacity: 0.8 }}>
            {renderValue(c.mtdBudget, row.isPercent, row.isCurrency)}
          </td>
          <td className={styles.cellNum}>
            {renderVar(c.mtdVar, row.isPercent, row.isCurrency)}
          </td>
          {/* YTD */}
          <td className={`${styles.cellNum} ${styles.borderCol}`} style={{ fontWeight: 600 }}>
            {renderValue(c.ytdActual, row.isPercent, row.isCurrency)}
          </td>
          <td className={styles.cellNum}>
            {row.isPercent ? "-" : `${c.ytdPercent.toFixed(1)}%`}
          </td>
          <td className={styles.cellNum} style={{ opacity: 0.8 }}>
            {renderValue(c.ytdBudget, row.isPercent, row.isCurrency)}
          </td>
          <td className={styles.cellNum}>
            {renderVar(c.ytdVar, row.isPercent, row.isCurrency)}
          </td>
        </tr>
      );
    });
  };

  const p = dsrReport.payments;

  return (
    <div className={styles.reportCard}>
      {/* Hotel Document Header */}
      <div className={styles.reportHeaderBanner}>
        <h2 className={styles.reportHotelName}>{hotelName}</h2>
        <div className={styles.reportDocTitle}>
          DAILY SALES REPORT On {formattedDate}
        </div>
      </div>

      {/* Main Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dsrTable}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.thMain} style={{ width: "260px", textAlign: "left" }}>
                Remark
              </th>
              <th colSpan={2} className={`${styles.thMain} ${styles.borderCol}`} style={{ textAlign: "center" }}>
                TODAY
              </th>
              <th colSpan={4} className={`${styles.thMain} ${styles.borderCol}`} style={{ textAlign: "center" }}>
                MTD
              </th>
              <th colSpan={4} className={`${styles.thMain} ${styles.borderCol}`} style={{ textAlign: "center" }}>
                YTD
              </th>
            </tr>
            <tr>
              {/* TODAY */}
              <th className={`${styles.thSub} ${styles.borderCol}`}>Actual</th>
              <th className={styles.thSub}>Var</th>
              {/* MTD */}
              <th className={`${styles.thSub} ${styles.borderCol}`}>Actual</th>
              <th className={styles.thSub}>%</th>
              <th className={styles.thSub}>Budget</th>
              <th className={styles.thSub}>Var</th>
              {/* YTD */}
              <th className={`${styles.thSub} ${styles.borderCol}`}>Actual</th>
              <th className={styles.thSub}>%</th>
              <th className={styles.thSub}>Budget</th>
              <th className={styles.thSub}>Var</th>
            </tr>
          </thead>

          <tbody>
            {/* STATISTIC */}
            <tr className={styles.sectionRow}>
              <td colSpan={11}>STATISTIC</td>
            </tr>
            {renderRows(dsrReport.statistics)}

            {/* DEBIT / REVENUE BANNER */}
            <tr className={styles.sectionDebitBanner}>
              <td colSpan={11}>Debit (Revenue Breakdown)</td>
            </tr>

            {/* ROOM REVENUE */}
            <tr className={styles.subSectionRow}>
              <td colSpan={11}>ROOM REVENUE</td>
            </tr>
            {renderRows(dsrReport.roomRevenue)}

            {/* FOOD & BEVERAGE */}
            <tr className={styles.subSectionRow}>
              <td colSpan={11}>FOOD & BEVERAGE</td>
            </tr>
            {renderRows(dsrReport.foodRevenue)}
            {renderRows(dsrReport.beverageRevenue)}
            {renderRows(dsrReport.otherFnbRevenue)}

            {/* MINOR OPERATING */}
            <tr className={styles.subSectionRow}>
              <td colSpan={11}>MINOR OPERATING</td>
            </tr>
            {renderRows(dsrReport.minorOperatingRevenue)}

            {/* AMENITIES */}
            <tr className={styles.subSectionRow}>
              <td colSpan={11}>AMENITIES</td>
            </tr>
            {renderRows(dsrReport.amenitiesRevenue)}

            {/* SUMMARY TOTALS */}
            {renderRows(dsrReport.summaryTotals)}

            {/* CREDIT / SETTLEMENTS */}
            <tr className={styles.sectionCreditBanner}>
              <td colSpan={11}>Credit (Settlement / Payments)</td>
            </tr>
            {[
              p.cashFo,
              p.cashOutlet,
              p.cashRefundFo,
              p.totalCash,
              p.edcBca,
              p.edcMandiri,
              p.qris,
              p.transfer,
              p.cityLedger,
              p.totalSettlement,
            ].map((item) => {
              const isTotal = item.id.includes("total");
              const rowClass = isTotal ? `${styles.dataRow} ${styles.totalRow}` : styles.dataRow;
              return (
                <tr key={item.id} className={rowClass}>
                  <td className={styles.cellText} style={{ paddingLeft: isTotal ? "14px" : "26px" }}>
                    {item.label}
                  </td>
                  <td className={`${styles.cellNum} ${styles.borderCol}`}>
                    {item.today > 0 ? formatIDR(item.today) : "-"}
                  </td>
                  <td className={styles.cellNum}>-</td>
                  <td className={`${styles.cellNum} ${styles.borderCol}`} style={{ fontWeight: 600 }}>
                    {item.mtd > 0 ? formatIDR(item.mtd) : "-"}
                  </td>
                  <td colSpan={3} className={styles.cellNum} style={{ textAlign: "center", opacity: 0.5 }}>
                    -
                  </td>
                  <td className={`${styles.cellNum} ${styles.borderCol}`} style={{ fontWeight: 600 }}>
                    {item.ytd > 0 ? formatIDR(item.ytd) : "-"}
                  </td>
                  <td colSpan={3} className={styles.cellNum} style={{ textAlign: "center", opacity: 0.5 }}>
                    -
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
