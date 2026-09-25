"use client";

import React, { useState, useMemo } from "react";
import { resolveBookingIdentifiers, resolveChannelName, getChannelLogo } from "@/lib/channelHelper";
import styles from "./LiveFeedEventsCard.module.css";

interface BookingEntry {
  guestName?: string;
  bookingId?: string;
  reservationId?: string;
  roomType?: string;
  channel?: string;
  amount?: number;
  totalAmount?: number;
  status?: string;
  guestStatus?: string;
  paymentStatus?: string;
  timestamp?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomNumber?: string;
  roomsCount?: number;
  roomCount?: number;
  totalStayNights?: number;
  nights?: number;
  [key: string]: any;
}

interface LiveFeedEventsCardProps {
  bookings: BookingEntry[];
  onSelectBooking: (booking: BookingEntry) => void;
}

// Calculate relative time: "4 days ago", "Today", "Yesterday", "2 hours ago"
const getRelativeTime = (timestamp?: string, checkInDate?: string): string => {
  const targetStr = timestamp || checkInDate;
  if (!targetStr) return "Recent";

  try {
    const target = new Date(targetStr);
    if (isNaN(target.getTime())) return "Recent";

    const now = new Date();
    const diffMs = now.getTime() - target.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffDays > 0) {
      if (diffDays === 1) return "Yesterday";
      return `${diffDays} days ago`;
    }
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "Just now";
  } catch {
    return "Recent";
  }
};

// Format Date: "Mon, Sep 21, 2026"
const formatEventDate = (checkInDate?: string, timestamp?: string): string => {
  const dateStr = checkInDate || (timestamp && timestamp.includes("T") ? timestamp.split("T")[0] : timestamp);
  if (!dateStr) return "Recent Date";

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
};

export function LiveFeedEventsCard({ bookings = [], onSelectBooking }: LiveFeedEventsCardProps) {
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [eventFilter, setEventFilter] = useState<string>("ALL");

  // Get list of unique channels
  const uniqueChannels = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      const ch = resolveChannelName(b);
      if (ch) set.add(ch);
    });
    return Array.from(set).sort();
  }, [bookings]);

  // Filtered event list
  const filteredEvents = useMemo(() => {
    return bookings.filter((b) => {
      const ch = resolveChannelName(b);
      if (channelFilter !== "ALL" && ch !== channelFilter) {
        return false;
      }

      const st = String(b.status || "").toUpperCase();
      const gst = String(b.guestStatus || "").toLowerCase();
      const isCancelled = st === "CANCELLED" || st === "CANCEL" || st === "VOID";
      const isCheckIn = gst === "checked_in";
      const isCheckOut = gst === "checked_out";

      if (eventFilter === "CANCEL" && !isCancelled) return false;
      if (eventFilter === "CHECK_IN" && !isCheckIn) return false;
      if (eventFilter === "CHECK_OUT" && !isCheckOut) return false;
      if (eventFilter === "NEW_BOOKING" && (isCancelled || isCheckIn || isCheckOut)) return false;

      return true;
    });
  }, [bookings, channelFilter, eventFilter]);

  return (
    <div className={styles.cardContainer}>
      {/* Header with Title & Filter Selects */}
      <div className={styles.header}>
        <h3 className={styles.title}>Live Feed Events</h3>
        <div className={styles.controls}>
          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by channel"
          >
            <option value="ALL">All channels</option>
            {uniqueChannels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by event type"
          >
            <option value="ALL">All Events</option>
            <option value="NEW_BOOKING">New Booking</option>
            <option value="CHECK_IN">Check In</option>
            <option value="CHECK_OUT">Check Out</option>
            <option value="CANCEL">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Feed Container */}
      <div className={styles.feedContainer}>
        {filteredEvents.length === 0 ? (
          <div className={styles.emptyFeed}>
            No live events match the active filter criteria.
          </div>
        ) : (
          filteredEvents.slice(0, 40).map((event, idx) => {
            const ids = resolveBookingIdentifiers(event);
            const st = String(event.status || "").toUpperCase();
            const gst = String(event.guestStatus || "").toLowerCase();
            const isCancelled = st === "CANCELLED" || st === "CANCEL" || st === "VOID";
            const isCheckIn = gst === "checked_in";
            const isCheckOut = gst === "checked_out";

            let badgeClass = styles.badgeNew;
            let badgeText = "NEW BOOKING";

            if (isCancelled) {
              badgeClass = styles.badgeCancelled;
              badgeText = "CANCELLED";
            } else if (isCheckIn) {
              badgeClass = styles.badgeCheckIn;
              badgeText = "CHECK IN";
            } else if (isCheckOut) {
              badgeClass = styles.badgeCheckOut;
              badgeText = "CHECK OUT";
            }

            const relativeTime = getRelativeTime(event.timestamp, event.checkInDate);
            const eventDateStr = formatEventDate(event.checkInDate, event.timestamp);
            const rooms = event.roomCount || event.roomsCount || 1;
            const nights = event.totalStayNights || event.nights || 1;
            const guestName = event.guestName || "General Guest";
            const roomType = event.roomType || (event.incomeCategory || "Standard Room");
            const amount = Number(event.amount || event.totalAmount || 0);

            return (
              <div
                key={idx}
                className={styles.feedItem}
                onClick={() => onSelectBooking(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectBooking(event);
                  }
                }}
              >
                {/* Left Col: Meta line, Date, Details */}
                <div className={styles.feedLeft}>
                  <div className={styles.feedMetaLine}>
                    <span>{relativeTime}</span>
                    <span className={styles.metaDot} />
                    <span className={`${styles.eventBadge} ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  <p className={styles.eventDate}>
                    {eventDateStr}
                  </p>

                  <p className={styles.eventDetail}>
                    {guestName} ({roomType}) | {rooms} {rooms === 1 ? "room" : "rooms"} x {nights} {nights === 1 ? "night" : "nights"}
                  </p>
                </div>

                {/* Right Col: Amount & Channel Logo */}
                <div className={styles.feedRight}>
                  <span
                    className={styles.eventAmount}
                    style={{
                      textDecoration: isCancelled ? "line-through" : "none",
                      color: isCancelled ? "#94a3b8" : "#0f172a"
                    }}
                  >
                    IDR {amount.toLocaleString("id-ID")}
                  </span>

                  <img
                    src={ids.channelLogo}
                    alt={ids.channelName}
                    className={styles.channelIcon}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
