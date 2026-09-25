"use client";

import React from "react";
import { Building2 } from "lucide-react";
import styles from "./GridTotalAvailableRow.module.css";

interface GridTotalAvailableRowProps {
    dateList: string[];
    todayStr: string;
    totalDailyAvailable: Record<string, number>;
    totalPhysicalRooms: number;
}

export const GridTotalAvailableRow = React.memo(function GridTotalAvailableRow({
    dateList,
    todayStr,
    totalDailyAvailable,
    totalPhysicalRooms
}: GridTotalAvailableRowProps) {
    return (
        <tr className={styles.row}>
            <td className={styles.colTitle}>
                <div className={styles.titleLabel}>
                    <Building2 size={16} style={{ color: "#2563eb" }} />
                    <span>Total Property Availability</span>
                </div>
                <span className={styles.titleBadge}>
                    {totalPhysicalRooms} Total Units
                </span>
            </td>

            {dateList.map(dateStr => {
                const avail = totalDailyAvailable[dateStr] ?? totalPhysicalRooms;
                const dObj = new Date(dateStr);
                const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;
                const isToday = dateStr === todayStr;
                const isZero = avail === 0;

                return (
                    <td
                        key={dateStr}
                        className={[
                            styles.colDay,
                            isWeekend ? styles.colWeekend : "",
                            isToday ? styles.colToday : ""
                        ].filter(Boolean).join(" ")}
                    >
                        <span className={[styles.valueText, isZero ? styles.valueZero : ""].filter(Boolean).join(" ")}>
                            {avail}
                        </span>
                    </td>
                );
            })}

            <td style={{ backgroundColor: "inherit" }} />
        </tr>
    );
});
