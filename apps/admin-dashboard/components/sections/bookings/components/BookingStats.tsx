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
import { BookingStatsSummary } from "../types";
import s from "./BookingStats.module.css";

interface BookingStatsProps {
    stats: BookingStatsSummary;
}

export function BookingStats({ stats }: BookingStatsProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div className={s.statsGrid}>
            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconBlue}`}>
                    <CalendarCheck size={24} weight="bold" />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Total Bookings</span>
                    <span className={s.statValue}>{stats.totalBookings}</span>
                    <span className={s.statSubtext}>{stats.totalNights} Malam Terjual</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconGreen}`}>
                    <CheckCircle size={24} weight="bold" />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Confirmed</span>
                    <span className={s.statValue}>{stats.confirmedCount}</span>
                    <span className={s.statSubtext}>Siap Check-In</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconPurple}`}>
                    <Door size={24} weight="bold" />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>In-House</span>
                    <span className={s.statValue}>{stats.checkedInCount}</span>
                    <span className={s.statSubtext}>Sedang Menginap</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconSlate}`}>
                    <SignOut size={24} weight="bold" />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Checked-Out</span>
                    <span className={s.statValue}>{stats.checkedOutCount}</span>
                    <span className={s.statSubtext}>Selesai Menginap</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconRed}`}>
                    <XCircle size={24} weight="bold" />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Cancelled</span>
                    <span className={s.statValue}>{stats.cancelledCount}</span>
                    <span className={s.statSubtext}>Dibatalkan</span>
                </div>
            </div>

            <div className={s.clayStatCard}>
                <div className={`${s.iconWrapper} ${s.iconAmber}`}>
                    <CurrencyCircleDollar size={24} weight="bold" />
                </div>
                <div className={s.statContent}>
                    <span className={s.statLabel}>Gross Revenue</span>
                    <span className={s.statValue} style={{ fontSize: "16px" }}>
                        {formatCurrency(stats.totalGrossRevenue)}
                    </span>
                    <span className={s.statSubtext}>Nilai Transaksi</span>
                </div>
            </div>
        </div>
    );
}
