"use client";

import React from "react";
import { 
    CalendarCheck, 
    CheckCircle, 
    Door, 
    SignOut, 
    XCircle, 
    CurrencyCircleDollar 
} from "@phosphor-icons/react";
import { useCurrency } from "@/hooks/useCurrency";
import { BookingStatsSummary } from "../types";
import s from "./BookingStats.module.css";

interface BookingStatsProps {
    stats: BookingStatsSummary;
}

export function BookingStats({ stats }: BookingStatsProps) {
    const { formatCurrency } = useCurrency();

    return (
        <div className={s.statsGrid}>
            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconBlue}`}>
                    <img src="/images/icons-3d/icon-3d-10.webp" alt="Total Bookings" className={s.icon3d} />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Total Bookings</span>
                    <span className={s.statValue}>{stats.totalBookings}</span>
                    <span className={s.statSubtext}>{stats.totalNights} Malam Terjual</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconGreen}`}>
                    <img src="/images/icons-3d/icon-3d-14.webp" alt="Confirmed" className={s.icon3d} />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Confirmed</span>
                    <span className={s.statValue}>{stats.confirmedCount}</span>
                    <span className={s.statSubtext}>Siap Check-In</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconPurple}`}>
                    <img src="/images/icons-3d/icon-3d-28.webp" alt="In-House" className={s.icon3d} />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>In-House</span>
                    <span className={s.statValue}>{stats.checkedInCount}</span>
                    <span className={s.statSubtext}>Sedang Menginap</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconSlate}`}>
                    <img src="/images/icons-3d/icon-3d-30.webp" alt="Checked-Out" className={s.icon3d} />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Checked-Out</span>
                    <span className={s.statValue}>{stats.checkedOutCount}</span>
                    <span className={s.statSubtext}>Selesai Menginap</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconRed}`}>
                    <img src="/images/icons-3d/icon-3d-46.webp" alt="Cancelled" className={s.icon3d} />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Cancelled</span>
                    <span className={s.statValue}>{stats.cancelledCount}</span>
                    <span className={s.statSubtext}>Dibatalkan</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconAmber}`}>
                    <img src="/images/icons-3d/icon-3d-11.webp" alt="Gross Revenue" className={s.icon3d} />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Gross Revenue</span>
                    <span className={s.statRevenueValue}>
                        {formatCurrency(stats.totalGrossRevenue)}
                    </span>
                    <span className={s.statSubtext}>Nilai Transaksi</span>
                </div>
            </div>
        </div>
    );
}
