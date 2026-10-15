"use client";

import React, { useState, useMemo, useRef } from "react";
import { 
    CalendarCheck, 
    SquaresFour, 
    ListBullets, 
    MagnifyingGlass, 
    BuildingOffice,
    Calendar,
    ArrowCounterClockwise
} from "@phosphor-icons/react";
import { useBookings } from "./useBookings";
import { BookingCard } from "./components/BookingCard";
import { BookingTable } from "./components/BookingTable";
import { BookingDetailModal } from "./components/BookingDetailModal";
import { BookingStatusFilter, ViewMode, BookingRecord } from "./types";
import s from "./BookingsSection.module.css";

export function BookingsSection() {
    // Default initial dates (Today)
    const initialDates = useMemo(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const todayStr = `${y}-${m}-${d}`;

        return {
            start: todayStr,
            end: todayStr,
        };
    }, []);

    const endDateInputRef = useRef<HTMLInputElement>(null);

    // Staged input states
    const [startDate, setStartDate] = useState(initialDates.start);
    const [endDate, setEndDate] = useState(initialDates.end);
    const [searchQuery, setSearchQuery] = useState("");
    const [channelFilter, setChannelFilter] = useState("ALL");
    const [roomTypeFilter, setRoomTypeFilter] = useState("ALL");

    // Applied search params that trigger the actual query
    const [appliedFilters, setAppliedFilters] = useState({
        startDate: initialDates.start,
        endDate: initialDates.end,
        searchQuery: "",
        channelFilter: "ALL",
        roomTypeFilter: "ALL",
    });

    const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("ALL");
    const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "guest_asc">("date_desc");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

    // Call high-efficiency hook with applied search criteria
    const { bookings, rawCount, stats, filterOptions, loading, error } = useBookings({
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        statusFilter,
        channelFilter: appliedFilters.channelFilter,
        roomTypeFilter: appliedFilters.roomTypeFilter,
        searchQuery: appliedFilters.searchQuery,
        sortBy,
    });

    // Auto trigger/open end date picker immediately after picking start date
    const handleStartDateChange = (newStart: string) => {
        setStartDate(newStart);
        if (endDate && endDate < newStart) {
            setEndDate(newStart);
        }
        setTimeout(() => {
            try {
                if (endDateInputRef.current) {
                    if (typeof (endDateInputRef.current as any).showPicker === "function") {
                        (endDateInputRef.current as any).showPicker();
                    } else {
                        endDateInputRef.current.focus();
                    }
                }
            } catch {
                endDateInputRef.current?.focus();
            }
        }, 80);
    };

    // Explicit Search Action Handler
    const handleApplySearch = () => {
        setAppliedFilters({
            startDate,
            endDate,
            searchQuery,
            channelFilter,
            roomTypeFilter,
        });
    };

    const handleResetFilters = () => {
        setStartDate(initialDates.start);
        setEndDate(initialDates.end);
        setSearchQuery("");
        setChannelFilter("ALL");
        setRoomTypeFilter("ALL");
        setStatusFilter("ALL");

        setAppliedFilters({
            startDate: initialDates.start,
            endDate: initialDates.end,
            searchQuery: "",
            channelFilter: "ALL",
            roomTypeFilter: "ALL",
        });
    };

    return (
        <div className={s.container}>
            {/* Top Page Header */}
            <div className={s.header}>
                <div className={s.headerLeft}>
                    <div className={s.moduleBadge}>
                        <BuildingOffice size={14} weight="bold" />
                        <span>Front Office PMS</span>
                    </div>
                    <h1 className={s.title}>Master Bookings Ledger</h1>
                    <p className={s.subtitle}>
                        Monitoring dan kelola seluruh reservasi masuk dari OTA (Traveloka, Booking.com, Agoda, Tiket.com) dan Walk-In.
                    </p>
                </div>
            </div>

            {/* Claymorphic Filter Panel */}
            <div className={s.filterPanel}>
                {/* Row 1: Status Filter Tabs & Date Range Picker */}
                <div className={s.filterTopRow}>
                    <div className={s.statusTabs}>
                        <button
                            type="button"
                            className={`${s.statusTabBtn} ${statusFilter === "ALL" ? s.statusTabBtnActive : ""}`}
                            onClick={() => setStatusFilter("ALL")}
                        >
                            <span>Semua</span>
                        </button>
                        <button
                            type="button"
                            className={`${s.statusTabBtn} ${statusFilter === "CONFIRMED" ? s.statusTabBtnActive : ""}`}
                            onClick={() => setStatusFilter("CONFIRMED")}
                        >
                            <span>Confirmed</span>
                        </button>
                        <button
                            type="button"
                            className={`${s.statusTabBtn} ${statusFilter === "CHECKED_OUT" ? s.statusTabBtnActive : ""}`}
                            onClick={() => setStatusFilter("CHECKED_OUT")}
                        >
                            <span>Checked-Out</span>
                        </button>
                        <button
                            type="button"
                            className={`${s.statusTabBtn} ${statusFilter === "CANCELLED" ? s.statusTabBtnCancelActive : ""}`}
                            onClick={() => setStatusFilter("CANCELLED")}
                        >
                            <span>Cancelled ({stats.cancelledCount})</span>
                        </button>
                    </div>

                    <div className={s.dateRangeControls}>
                        <div className={s.dateInputGroup}>
                            <Calendar size={15} color="#64748b" />
                            <input
                                type="date"
                                className={s.dateInput}
                                value={startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                aria-label="Start date"
                            />
                            <span style={{ color: "#94a3b8", fontSize: "12px" }}>to</span>
                            <input
                                ref={endDateInputRef}
                                type="date"
                                className={s.dateInput}
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                aria-label="End date"
                            />
                        </div>
                        <button
                            type="button"
                            className={s.searchActionBtn}
                            onClick={handleApplySearch}
                            title="Search bookings"
                        >
                            <MagnifyingGlass size={15} weight="bold" />
                            <span>Search</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: OTA Dropdown, Room Type Dropdown, Search, Sort & View Switcher */}
                <div className={s.filterBottomRow}>
                    <div className={s.filterControlsLeft}>
                        {/* OTA / Channel Dropdown */}
                        <select
                            className={s.selectInput}
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            aria-label="Filter OTA Channel"
                        >
                            <option value="ALL">All Channels</option>
                            {filterOptions.channels.map((ch) => (
                                <option key={ch} value={ch}>{ch}</option>
                            ))}
                        </select>

                        {/* Room Type Dropdown */}
                        <select
                            className={s.selectInput}
                            value={roomTypeFilter}
                            onChange={(e) => setRoomTypeFilter(e.target.value)}
                            aria-label="Filter Room Type"
                        >
                            <option value="ALL">All Room Types</option>
                            {filterOptions.roomTypes.map((rt) => (
                                <option key={rt} value={rt}>{rt}</option>
                            ))}
                        </select>

                        {/* Search Input */}
                        <div className={s.searchInputWrapper}>
                            <MagnifyingGlass size={15} color="#64748b" />
                            <input
                                type="text"
                                className={s.searchInput}
                                placeholder="Search guest, voucher, room..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleApplySearch();
                                }}
                            />
                        </div>

                        {/* Reset Filter Button */}
                        <button
                            type="button"
                            className={s.resetFilterIconBtn}
                            onClick={handleResetFilters}
                            title="Reset all filters"
                        >
                            <ArrowCounterClockwise size={14} weight="bold" />
                            <span>Reset</span>
                        </button>

                        {/* Grid / List View Mode Switcher */}
                        <div className={s.viewModeGroup}>
                            <button
                                type="button"
                                className={`${s.viewModeBtn} ${viewMode === "grid" ? s.viewModeBtnActive : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid View"
                                aria-label="Grid View"
                            >
                                <SquaresFour size={18} weight="bold" />
                            </button>
                            <button
                                type="button"
                                className={`${s.viewModeBtn} ${viewMode === "list" ? s.viewModeBtnActive : ""}`}
                                onClick={() => setViewMode("list")}
                                title="List View"
                                aria-label="List View"
                            >
                                <ListBullets size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Display */}
            {loading ? (
                <div className={s.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={s.skeletonCard} />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className={s.emptyState}>
                    <div className={s.emptyIcon}>
                        <CalendarCheck size={32} weight="bold" />
                    </div>
                    <div className={s.emptyTitle}>No bookings found</div>
                    <div className={s.emptyDesc}>
                        There are no reservations matching the selected date range or search criteria.
                    </div>
                    <button type="button" className={s.resetBtn} onClick={handleResetFilters}>
                        Reset Filters
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                <div className={s.bookingsGrid}>
                    {bookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onSelect={setSelectedBooking}
                        />
                    ))}
                </div>
            ) : (
                <BookingTable
                    bookings={bookings}
                    onSelect={setSelectedBooking}
                />
            )}

            {/* Booking Detail Modal */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    );
}
