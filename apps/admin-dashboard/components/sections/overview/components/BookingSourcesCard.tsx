"use client";

import React, { useState, useMemo } from "react";
import { resolveChannelName, getChannelLogo } from "@/lib/channelHelper";
import styles from "./BookingSourcesCard.module.css";

interface BookingEntry {
  channel?: string;
  otaName?: string;
  company?: string;
  source?: string;
  amount?: number;
  totalAmount?: number;
  status?: string;
  totalStayNights?: number;
  nights?: number;
  [key: string]: any;
}

interface BookingSourcesCardProps {
  bookings: BookingEntry[];
  startDate?: string;
  endDate?: string;
  onDetailsClick?: () => void;
}

const OTA_PALETTE: Record<string, string> = {
  "Traveloka": "#3b82f6",     // Sky / bright blue
  "Booking.com": "#1e3a8a",   // Deep navy blue
  "Direct": "#0f172a",        // Dark slate / black
  "Agoda": "#2563eb",         // Royal blue
  "Tiket.com": "#60a5fa",     // Light blue
  "Airbnb": "#ff385c",        // Coral red
  "Expedia": "#0369a1",       // Cyan/navy
  "Open Channel": "#0284c7",  // Medium blue
  "Trip.com": "#1d4ed8",      // Blue
  "MG Bedbank": "#dc2626",    // Red
  "Hotelbeds": "#ea580c",     // Orange
  "WebBeds": "#0891b2",       // Cyan
  "Klook": "#f59e0b",         // Amber
  "Walk-in": "#334155",       // Slate
  "Booking Engine": "#10b981",// Emerald green
  "Other": "#64748b"          // Slate gray
};

const getChannelColor = (name: string): string => {
  return OTA_PALETTE[name] || OTA_PALETTE["Other"];
};

// Format Date Range: "Aug 25, 2026 - Sep 25, 2026"
const formatDateRange = (start?: string, end?: string): string => {
  if (!start && !end) {
    const d = new Date();
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const formatOne = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const startFormatted = start ? formatOne(start) : "";
  const endFormatted = end ? formatOne(end) : "";

  if (startFormatted && endFormatted && startFormatted !== endFormatted) {
    return `${startFormatted} - ${endFormatted}`;
  }
  return startFormatted || endFormatted;
};

export function BookingSourcesCard({
  bookings = [],
  startDate,
  endDate,
  onDetailsClick
}: BookingSourcesCardProps) {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  // Aggregate channel statistics from real booking data
  const { channelStats, totalBookings, totalRevenue } = useMemo(() => {
    const map: Record<string, { bookings: number; revenue: number; nights: number }> = {};

    bookings.forEach((b) => {
      const channel = resolveChannelName(b);
      const st = String(b.status || "").toUpperCase();
      const isCancelled = st === "CANCELLED" || st === "CANCEL" || st === "VOID";

      if (!map[channel]) {
        map[channel] = { bookings: 0, revenue: 0, nights: 0 };
      }

      map[channel].bookings += 1;
      map[channel].nights += (b.totalStayNights || b.nights || 1);
      if (!isCancelled) {
        map[channel].revenue += Number(b.amount || b.totalAmount || 0);
      }
    });

    const sumBookings = Object.values(map).reduce((sum, item) => sum + item.bookings, 0);
    const sumRevenue = Object.values(map).reduce((sum, item) => sum + item.revenue, 0);

    const statsList = Object.entries(map).map(([name, data]) => {
      const share = sumBookings > 0 ? (data.bookings / sumBookings) * 100 : 0;
      return {
        name,
        bookings: data.bookings,
        revenue: data.revenue,
        nights: data.nights,
        share: Math.round(share * 10) / 10,
        color: getChannelColor(name),
        logo: getChannelLogo(name)
      };
    }).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);

    return {
      channelStats: statsList,
      totalBookings: sumBookings,
      totalRevenue: sumRevenue
    };
  }, [bookings]);

  // Donut SVG Circle Geometry calculations matching Channex sleek ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.82
  const centerCoord = 90;

  // Compute SVG arc segments with rounded end gaps
  const segments = useMemo(() => {
    if (totalBookings === 0) return [];
    let accumulatedAngle = 0;
    const gap = channelStats.length > 1 ? 16 : 0;

    return channelStats.map((item) => {
      const portion = item.bookings / totalBookings;
      const arcLength = portion * circumference;
      const visibleLength = Math.max(1, arcLength - gap);
      const dashArray = `${visibleLength} ${circumference - visibleLength}`;
      const dashOffset = -(accumulatedAngle + gap / 2);
      accumulatedAngle += arcLength;

      return {
        ...item,
        dashArray,
        dashOffset
      };
    });
  }, [channelStats, totalBookings, circumference]);

  const activeHoverItem = useMemo(() => {
    if (!hoveredChannel) return null;
    return channelStats.find((c) => c.name === hoveredChannel) || null;
  }, [hoveredChannel, channelStats]);

  const dateRangeDisplay = useMemo(() => formatDateRange(startDate, endDate), [startDate, endDate]);

  return (
    <div className={styles.cardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Booking Sources</h3>
        <span className={styles.dateRangeText} title="Active date filter period">
          {dateRangeDisplay}
        </span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Donut Chart */}
        <div className={styles.chartWrapper}>
          <svg className={styles.donutSvg} viewBox="0 0 180 180" aria-label="Booking sources breakdown donut chart">
            {/* Background ring */}
            <circle
              className={styles.donutBgRing}
              cx={centerCoord}
              cy={centerCoord}
              r={radius}
            />

            {/* Colored arc segments */}
            {segments.map((seg, idx) => {
              const isHovered = hoveredChannel === seg.name;
              return (
                <circle
                  key={idx}
                  className={`${styles.donutSegment} ${isHovered ? styles.donutSegmentActive : ""}`}
                  cx={centerCoord}
                  cy={centerCoord}
                  r={radius}
                  stroke={seg.color}
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredChannel(seg.name)}
                  onMouseLeave={() => setHoveredChannel(null)}
                  style={{
                    opacity: hoveredChannel && !isHovered ? 0.45 : 1
                  }}
                />
              );
            })}
          </svg>

          {/* Center Info Text */}
          <div className={styles.centerInfo}>
            <p className={styles.centerLabel}>
              {activeHoverItem ? activeHoverItem.name : "Bookings"}
            </p>
            <p className={styles.centerValue}>
              {activeHoverItem ? activeHoverItem.bookings : totalBookings}
            </p>
          </div>
        </div>

        {/* Channels Breakdown List */}
        <div className={styles.sourcesList}>
          {channelStats.length === 0 ? (
            <div className={styles.emptyState}>
              No booking records in selected period.
            </div>
          ) : (
            channelStats.map((item, idx) => {
              const isHovered = hoveredChannel === item.name;
              return (
                <div
                  key={idx}
                  className={`${styles.sourceRow} ${isHovered ? styles.sourceRowActive : ""}`}
                  onMouseEnter={() => setHoveredChannel(item.name)}
                  onMouseLeave={() => setHoveredChannel(null)}
                >
                  <div className={styles.sourceLeft}>
                    <img
                      src={item.logo}
                      alt={item.name}
                      className={styles.channelLogo}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className={styles.channelName} title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className={styles.sourceRight}>
                    <span className={styles.bookingCount}>{item.bookings}</span>
                    <span className={styles.revenueAmount}>
                      IDR {item.revenue.toLocaleString("id-ID")}
                    </span>
                    <span className={styles.sharePercent}>{item.share}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div className={styles.footer}>
        <button
          type="button"
          onClick={onDetailsClick}
          className={styles.detailsLink}
        >
          Details
        </button>
      </div>
    </div>
  );
}
