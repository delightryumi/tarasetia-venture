"use client";

import React from "react";
import { BookingSourcesCard } from "./components/BookingSourcesCard";
import { LiveFeedEventsCard } from "./components/LiveFeedEventsCard";
import styles from "./ChannexDashboardPanel.module.css";

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

interface ChannexDashboardPanelProps {
  bookings: BookingEntry[];
  startDate?: string;
  endDate?: string;
  hotelName?: string;
  onSelectBooking: (booking: BookingEntry) => void;
  onDetailsClick?: () => void;
}

export function ChannexDashboardPanel({
  bookings = [],
  startDate,
  endDate,
  onSelectBooking,
  onDetailsClick
}: ChannexDashboardPanelProps) {
  return (
    <section className={styles.panelContainer} aria-label="Executive Overview Dashboard">
      <div className={styles.gridContainer}>
        {/* Left Column: Booking Sources Donut Chart */}
        <div className={styles.leftColumn}>
          <BookingSourcesCard
            bookings={bookings}
            startDate={startDate}
            endDate={endDate}
            onDetailsClick={onDetailsClick}
          />
        </div>

        {/* Right Column: Live Feed Events Stream */}
        <div className={styles.rightColumn}>
          <LiveFeedEventsCard
            bookings={bookings}
            onSelectBooking={onSelectBooking}
          />
        </div>
      </div>
    </section>
  );
}
