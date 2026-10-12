"use client";

import React from "react";
import { Info } from "lucide-react";
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
                    <span>Available Inventory</span>
                    <button
                        type="button"
                        className={styles.infoBtn}
                        title={`Total Available Inventory (Property Capacity: ${totalPhysicalRooms} Units)`}
                    >
                        <Info size={13} />
                    </button>
                </div>
            </td>

            {dateList.map(dateStr => {
                const avail = totalDailyAvailable[dateStr] ?? totalPhysicalRooms;
                const isToday = dateStr === todayStr;

                return (
                    <td
                        key={dateStr}
                        className={[
                            styles.colDay,
                            isToday ? styles.colToday : ""
                        ].filter(Boolean).join(" ")}
                    >
                        <span className={styles.valueText}>
                            {avail}
                        </span>
                    </td>
                );
            })}

            <td className={styles.endSpacerCell} />
        </tr>
    );
});
