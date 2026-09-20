"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Search,
    Printer,
    Plus,
    User,
    CreditCard,
    X,
    Building2,
    Calendar,
    Users,
    BedDouble,
    ShieldCheck,
    Check,
    Eye
} from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { query, onSnapshot, where } from "firebase/firestore";
import { GRCPrintTemplate, GRCData } from "./GRCPrintTemplate";
import "./grc.css";

interface GuestEntryItem {
    id: string;
    guestName: string;
    bookingId?: string;
    roomType?: string;
    roomNumber?: string;
    channel?: string;
    amount?: number;
    totalAmount?: number;
    status?: string;
    paymentStatus?: string;
    checkInDate?: string;
    checkOutDate?: string;
    isExtend?: boolean;
    timestamp?: any;
    staffName?: string;
    phone?: string;
    nik?: string;
    address?: string;
    nationality?: string;
    email?: string;
    company?: string;
    rateCode?: string;
    ratePlanName?: string;
    hasBreakfast?: boolean;
    dailyRate?: number;
    nights?: number;
    pax?: number;
    upgradeFrom?: string;
    upgradeTo?: string;
    _docId?: string;
    _docDate?: string;
}

export function GRCSection() {
    const { activeHotelCode, activeHotelName, user } = useAuth();
    const searchParams = useSearchParams();
    const paramGuestName = searchParams?.get("guestName");
    const paramBookingId = searchParams?.get("bookingId");
    const paramAutoOpen = searchParams?.get("autoOpen") === "true";

    const [entries, setEntries] = useState<GuestEntryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPeriod, setFilterPeriod] = useState<"today" | "upcoming" | "all">("today");

    // Modal & Print States
    const [mounted, setMounted] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [grcData, setGrcData] = useState<GRCData | null>(null);
    const [paperSize, setPaperSize] = useState<"f4" | "a4">("f4");

    useEffect(() => {
        setMounted(true);
    }, []);

    const todayStr = useMemo(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    // Load guest bookings from daily_revenue in real-time (Synchronized with Overview)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Dynamic range query: -60 days to +30 days around today
        const [sY, sM, sD] = todayStr.split('-').map(Number);
        const startD = new Date(sY, (sM || 1) - 1, sD || 1);
        startD.setDate(startD.getDate() - 60);
        const startRange = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}-${String(startD.getDate()).padStart(2, '0')}`;

        const endD = new Date(sY, (sM || 1) - 1, sD || 1);
        endD.setDate(endD.getDate() + 30);
        const endRange = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;

        const q = query(
            getHotelCollection(db, "daily_revenue", activeHotelCode),
            where("date", ">=", startRange),
            where("date", "<=", endRange)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allEntriesRaw: any[] = [];

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const docDate = data.date || docSnap.id.replace(`${activeHotelCode}_`, "") || docSnap.id;

                const docEntries = (data.entries || [])
                    .filter((e: any) => e.status !== "VOID" && e.status !== "VOIDED" && !e.isHidden && e.type !== "pelunasan_ar" && e.type !== "pelunasan_reversal" && !e.isPelunasan)
                    .map((e: any) => {
                        const checkInDate = e.checkInDate || e.checkIn || e.effectiveDate || docDate;
                        const checkOutDate = e.checkOutDate || e.checkOut || "";
                        return {
                            ...e,
                            checkInDate,
                            checkOutDate,
                            _docId: docSnap.id,
                            _docDate: docDate
                        };
                    });
                allEntriesRaw.push(...docEntries);
            });

            const accommodationGroups: Record<string, any[]> = {};

            allEntriesRaw.forEach((e) => {
                const isPOS = e.guestName?.startsWith("POS Order") || !!e.posItems || !!e.revenueType;
                const isAccommodation = !isPOS && (e.type === "accommodation" || (!e.type && e.guestName));

                if (isAccommodation) {
                    const roomIdent = e.roomNumber || e.roomTypeId || e.roomType || '';
                    const key = e.bookingId
                        ? `${e.bookingId}_${roomIdent}_${e.checkInDate}_${e.checkOutDate}`
                        : `${e.guestName}_${roomIdent}_${e.checkInDate}_${e.checkOutDate}_${e.timestamp || ''}`;
                    if (!accommodationGroups[key]) {
                        accommodationGroups[key] = [];
                    }
                    accommodationGroups[key].push(e);
                }
            });

            const resolvedList: GuestEntryItem[] = [];

            Object.values(accommodationGroups).forEach((group, gIdx) => {
                const isCancelled = group.some(e =>
                    e.status === "CANCELLED" ||
                    e.paymentStatus === "CANCELLED" ||
                    e.status === "CANCEL" ||
                    e.paymentStatus === "CANCEL"
                );

                if (isCancelled) return; // Only list active stays in GRC

                group.sort((a, b) => (a._docDate || a.checkInDate || '').localeCompare(b._docDate || b.checkInDate || ''));

                const rep = group[0];
                const totalStayAmount = group.reduce((sum, item) => sum + (Number(item.amount) || Number(item.totalAmount) || 0), 0);
                const checkInDate = rep.checkInDate || rep.checkIn || rep._docDate;
                const checkOutDate = rep.checkOutDate || rep.checkOut || "";
                const stayNights = group.length || 1;
                const dailyRate = Number(rep.amount) || Math.round(totalStayAmount / stayNights);

                const isExtend = Boolean(checkInDate < todayStr && checkOutDate > todayStr);

                // Collect best available contact & guest data from group
                const phone = group.find(e => e.phone)?.phone || rep.phone || "";
                const nik = group.find(e => e.nik || e.identityNo)?.nik || rep.nik || rep.identityNo || "";
                const address = group.find(e => e.address)?.address || rep.address || "";
                const nationality = group.find(e => e.nationality)?.nationality || rep.nationality || "INDONESIA";
                const email = group.find(e => e.email)?.email || rep.email || "";
                const company = group.find(e => e.company)?.company || rep.company || "-";
                const rateCode = group.find(e => e.rateCode && e.rateCode !== '-')?.rateCode || rep.rateCode || "-";
                const ratePlanName = group.find(e => e.ratePlanName)?.ratePlanName || rep.ratePlanName || "";
                const hasBreakfast = group.some(e => e.hasBreakfast) || rep.hasBreakfast || false;
                const pax = group.find(e => e.pax)?.pax || rep.pax || 1;
                const upgradeFrom = group.find(e => e.upgradeFrom)?.upgradeFrom || rep.upgradeFrom || "";
                const upgradeTo = group.find(e => e.upgradeTo)?.upgradeTo || rep.upgradeTo || "";
                const staffName = group.find(e => e.staffName)?.staffName || rep.staffName || user?.displayName || "Staff";

                resolvedList.push({
                    id: `${rep._docId || 'stay'}_${rep.bookingId || gIdx}`,
                    guestName: rep.guestName || "Guest",
                    bookingId: rep.bookingId || `RES-${(rep.timestamp || Date.now()).toString().slice(-6)}`,
                    roomType: rep.roomType || "-",
                    roomNumber: rep.roomNumber || "-",
                    channel: rep.channel || "Walk-in",
                    amount: dailyRate,
                    totalAmount: totalStayAmount || (dailyRate * stayNights),
                    dailyRate,
                    nights: stayNights,
                    status: rep.status || "Pending",
                    paymentStatus: rep.paymentStatus || rep.status || "Pending",
                    checkInDate,
                    checkOutDate,
                    isExtend,
                    timestamp: rep.timestamp,
                    staffName,
                    phone,
                    nik,
                    address,
                    nationality,
                    email,
                    company,
                    rateCode,
                    ratePlanName,
                    hasBreakfast,
                    pax,
                    upgradeFrom,
                    upgradeTo,
                    _docId: rep._docId,
                    _docDate: rep._docDate
                });
            });

            // Sort: Today's active stays first (new check-in & extend), then upcoming, then by check-in date descending
            resolvedList.sort((a, b) => {
                const aActiveToday = (a.checkInDate === todayStr) || (a.isExtend === true);
                const bActiveToday = (b.checkInDate === todayStr) || (b.isExtend === true);
                if (aActiveToday && !bActiveToday) return -1;
                if (!aActiveToday && bActiveToday) return 1;

                const dateA = a.checkInDate || "";
                const dateB = b.checkInDate || "";
                return dateB.localeCompare(dateA);
            });

            setEntries(resolvedList);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching guest entries for GRC:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeHotelCode, todayStr, user]);

    // Format Stay Period
    const formatStayPeriod = (inDate?: string, outDate?: string) => {
        if (!inDate) return "-";
        const fmt = (dStr: string) => {
            try {
                const d = new Date(dStr);
                return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            } catch {
                return dStr;
            }
        };
        if (!outDate) return fmt(inDate);
        return `${fmt(inDate)} - ${fmt(outDate)}`;
    };

    // Prepare GRC Data from Guest Entry
    const handleSelectGuestForGRC = (guest: GuestEntryItem) => {
        const isChannelOta = guest.channel && guest.channel.toLowerCase() !== "walk-in";
        const isCompany = guest.channel && guest.channel.toLowerCase().includes("corporate");

        const isWithBreakfast = guest.hasBreakfast || 
            guest.rateCode === 'BB' || 
            String(guest.rateCode || '').toUpperCase().includes('BB') ||
            String(guest.ratePlanName || '').toLowerCase().includes('breakfast') ||
            String(guest.rateCode || '').toUpperCase().includes('RBF');

        const resolvedRateCode = (guest.rateCode && guest.rateCode !== '-')
            ? (guest.rateCode === 'BB' ? 'BB / RBF' : guest.rateCode)
            : (isWithBreakfast ? 'BB / RBF' : (guest.ratePlanName || '-'));

        const calculatedRoomRate = guest.dailyRate || 
            (guest.amount && Number(guest.amount) > 0 ? Number(guest.amount) : 0) ||
            (guest.totalAmount && guest.nights ? Math.round(guest.totalAmount / guest.nights) : Number(guest.totalAmount || 0));

        const data: GRCData = {
            roomNumber: guest.roomNumber && guest.roomNumber !== "-" ? guest.roomNumber : "",
            roomRate: calculatedRoomRate,
            bookingId: guest.bookingId || "",
            roomType: guest.roomType && guest.roomType !== "-" ? guest.roomType : "",
            rateCode: resolvedRateCode,
            noOfPax: guest.pax || 1,
            upgradeFrom: guest.upgradeFrom || "",
            upgradeTo: guest.upgradeTo || "",
            stayPeriod: formatStayPeriod(guest.checkInDate, guest.checkOutDate),
            checkInDate: guest.checkInDate || todayStr,
            checkOutDate: guest.checkOutDate || "",
            company: guest.company || "-",
            guestName: guest.guestName || "",
            nationality: guest.nationality || "INDONESIA",
            phone: guest.phone || "",
            identityNo: guest.nik || "",
            address: guest.address || "",
            email: guest.email || "",
            paymentMethod: isChannelOta ? "travel_agent" : isCompany ? "company" : "personal",
            travelAgentName: isChannelOta ? guest.channel : "",
            checkedInBy: guest.staffName || user?.displayName || "FRONT OFFICE",
            approvedBy: "Assistant Front Office Manager",
            printedAt: new Date().toLocaleDateString("id-ID", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", second: "2-digit"
            }).replace(/\./g, ":"),
        };

        setGrcData(data);
        setIsEditorOpen(true);
    };

    // Auto open GRC if redirected from Overview
    useEffect(() => {
        if (!paramAutoOpen || entries.length === 0) return;
        const matched = entries.find(e => 
            (paramBookingId && e.bookingId && e.bookingId.toLowerCase() === paramBookingId.toLowerCase()) ||
            (paramGuestName && e.guestName && e.guestName.toLowerCase().includes(paramGuestName.toLowerCase()))
        );
        if (matched) {
            handleSelectGuestForGRC(matched);
        }
    }, [paramAutoOpen, paramBookingId, paramGuestName, entries]);

    // New Manual GRC
    const handleNewManualGRC = () => {
        const data: GRCData = {
            roomNumber: "",
            roomRate: "",
            bookingId: `RES-${Date.now().toString().slice(-6)}`,
            roomType: "",
            rateCode: "-",
            noOfPax: 1,
            upgradeFrom: "",
            upgradeTo: "",
            stayPeriod: formatStayPeriod(todayStr, todayStr),
            checkInDate: todayStr,
            checkOutDate: "",
            company: "-",
            guestName: "",
            nationality: "INDONESIA",
            phone: "",
            identityNo: "",
            address: "",
            email: "",
            paymentMethod: "personal",
            travelAgentName: "",
            checkedInBy: user?.displayName || "FRONT OFFICE",
            approvedBy: "Assistant Front Office Manager",
            printedAt: new Date().toLocaleDateString("id-ID", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", second: "2-digit"
            }).replace(/\./g, ":"),
        };

        setGrcData(data);
        setIsEditorOpen(true);
    };

    // Filtered entries (100% Inline with Overview definitions)
    const filteredEntries = useMemo(() => {
        return entries.filter(item => {
            const matchesSearch = 
                (item.guestName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.roomNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.bookingId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.channel || "").toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (filterPeriod === "today") {
                // Inline with Overview: New Check-In today OR In-House / Extend today
                return item.checkInDate === todayStr || item.isExtend === true;
            } else if (filterPeriod === "upcoming") {
                return (item.checkInDate || "") > todayStr;
            }
            return true;
        });
    }, [entries, searchTerm, filterPeriod, todayStr]);

    // Summary KPI Counts (100% Inline with Overview)
    const kpiData = useMemo(() => {
        const todayNewCheckIn = entries.filter(e => e.checkInDate === todayStr && !e.isExtend).length;
        const todayExtend = entries.filter(e => e.isExtend === true).length;
        const todayTotalActive = entries.filter(e => e.checkInDate === todayStr || e.isExtend === true).length;
        const occupiedCount = entries.filter(e => (e.checkInDate === todayStr || e.isExtend === true) && e.roomNumber && e.roomNumber !== "-").length;
        const totalGuests = entries.length;

        return {
            todayNewCheckIn,
            todayExtend,
            todayCount: todayTotalActive,
            occupiedCount,
            totalGuests,
        };
    }, [entries, todayStr]);

    const handlePrintGRC = () => {
        window.print();
    };

    const handleDirectPrintRow = (guest: GuestEntryItem) => {
        handleSelectGuestForGRC(guest);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    return (
        <div className="grc-root">
            {/* Header (Hidden on Print) */}
            <header className="grc-header grc-no-print">
                <div className="grc-header-meta">
                    <div className="grc-header-badge">
                        <Building2 size={13} />
                        <span>Front Office Operations · {activeHotelName || "Property Hub"}</span>
                    </div>
                    <h1 className="grc-header-title">
                        Guest Registration Card (GRC)
                    </h1>
                    <p className="grc-header-desc">
                        Cetak form registrasi fisik (GRC) berlogo properti dinamis untuk tamu yang terdaftar di <strong>Overview</strong>, lengkap dengan house rules dan persetujuan non-smoking.
                    </p>
                </div>

                <button
                    onClick={handleNewManualGRC}
                    className="grc-btn-primary"
                >
                    <Plus size={16} />
                    <span>Buat GRC Baru / Manual</span>
                </button>
            </header>

            {/* KPI Summary Cards (Hidden on Print) */}
            <div className="grc-kpi-grid grc-no-print">
                <div className="grc-kpi-card">
                    <span className="grc-kpi-label">Check-in & In-House Hari Ini</span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span className="grc-kpi-value">{kpiData.todayCount}</span>
                        {kpiData.todayExtend > 0 && (
                            <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 700 }}>
                                ({kpiData.todayExtend} Extend)
                            </span>
                        )}
                    </div>
                </div>
                <div className="grc-kpi-card">
                    <span className="grc-kpi-label">Kamar Terisi (Occupied)</span>
                    <span className="grc-kpi-value">{kpiData.occupiedCount}</span>
                </div>
                <div className="grc-kpi-card">
                    <span className="grc-kpi-label">Total Data Tamu</span>
                    <span className="grc-kpi-value">{kpiData.totalGuests}</span>
                </div>
                <div className="grc-kpi-card">
                    <span className="grc-kpi-label">Format Cetak</span>
                    <span className="grc-kpi-value" style={{ fontSize: "16px", color: "#006241" }}>
                        {paperSize.toUpperCase()} {paperSize === "f4" ? "(Folio)" : "(Standard)"}
                    </span>
                </div>
            </div>

            {/* Filter & Search Toolbar (Hidden on Print) */}
            <div className="grc-toolbar grc-no-print">
                <div className="grc-search-box">
                    <Search size={16} style={{ position: "absolute", left: "14px", top: "12px", color: "var(--grc-muted)" }} />
                    <input
                        type="text"
                        placeholder="Cari nama tamu, nomor kamar, booking ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="grc-search-input"
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="grc-period-chips">
                        <button
                            onClick={() => setFilterPeriod("today")}
                            className={`grc-chip-btn ${filterPeriod === "today" ? "active" : ""}`}
                        >
                            Hari Ini {kpiData.todayCount > 0 ? `(${kpiData.todayCount})` : ""}
                        </button>
                        <button
                            onClick={() => setFilterPeriod("upcoming")}
                            className={`grc-chip-btn ${filterPeriod === "upcoming" ? "active" : ""}`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setFilterPeriod("all")}
                            className={`grc-chip-btn ${filterPeriod === "all" ? "active" : ""}`}
                        >
                            Semua ({kpiData.totalGuests})
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Card (Hidden on Print) */}
            <div className="grc-table-card grc-no-print">
                <div style={{ overflowX: "auto" }}>
                    <table className="grc-data-table">
                        <thead>
                            <tr>
                                <th>Periode Inap</th>
                                <th>Kamar</th>
                                <th>Nama Tamu & No Reservasi</th>
                                <th>Channel</th>
                                <th>Tarif Kamar</th>
                                <th>Status Bayar</th>
                                <th style={{ textAlign: "right" }}>Aksi GRC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "48px 20px", color: "var(--grc-muted)" }}>
                                        Memuat data tamu overview...
                                    </td>
                                </tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "48px 20px", color: "var(--grc-muted)" }}>
                                        <FileText size={36} style={{ margin: "0 auto 8px auto", opacity: 0.25 }} />
                                        Tidak ada data reservasi tamu yang cocok.
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map((guest) => (
                                    <tr key={guest.id}>
                                        <td style={{ fontFamily: "var(--grc-font-mono)", fontSize: "11px", whiteSpace: "nowrap" }}>
                                            {formatStayPeriod(guest.checkInDate, guest.checkOutDate)}
                                        </td>
                                        <td>
                                            <span className="grc-room-badge">
                                                {guest.roomNumber && guest.roomNumber !== "-" ? `RM ${guest.roomNumber}` : "Unassigned"}
                                            </span>
                                            <div style={{ fontSize: "10.5px", color: "var(--grc-muted)", marginTop: "2px" }}>
                                                {guest.roomType || "-"}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: 600, color: "var(--grc-ink)" }}>
                                                    {guest.guestName}
                                                </span>
                                                {guest.isExtend && (
                                                    <span className="grc-extend-badge">
                                                        Extend
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontFamily: "var(--grc-font-mono)", fontSize: "10.5px", color: "var(--grc-muted)", marginTop: "2px" }}>
                                                {guest.bookingId || "-"}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--grc-muted)" }}>
                                                {guest.channel || "Walk-in"}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: "var(--grc-font-mono)", fontWeight: 600 }}>
                                            Rp {Number(guest.totalAmount || guest.amount || 0).toLocaleString("id-ID")}
                                        </td>
                                        <td>
                                            <span className={`grc-badge-pill ${
                                                (guest.paymentStatus || "").toLowerCase().includes("lunas") 
                                                    ? "grc-badge-lunas" 
                                                    : "grc-badge-pending"
                                            }`}>
                                                {guest.paymentStatus || guest.status || "Pending"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                                <button
                                                    onClick={() => handleSelectGuestForGRC(guest)}
                                                    className="grc-btn-secondary"
                                                    title="Buka Editor & Preview GRC"
                                                >
                                                    <Eye size={13} />
                                                    <span>Preview & Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDirectPrintRow(guest)}
                                                    className="grc-btn-primary"
                                                    style={{ height: "34px", padding: "0 12px", fontSize: "11px", backgroundColor: "#006241" }}
                                                    title="Cetak GRC Langsung (F4)"
                                                >
                                                    <Printer size={13} />
                                                    <span>Cetak F4</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Split Editor Modal & Live F4 Preview */}
            <AnimatePresence>
                {isEditorOpen && grcData && (
                    <div className="grc-modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="grc-modal-window"
                        >
                            {/* Modal Header */}
                            <div className="grc-modal-header grc-no-print">
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "var(--grc-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <FileText size={16} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                                            Guest Registration Card (GRC) Editor & Preview
                                        </h3>
                                        <p style={{ fontSize: "11px", color: "var(--grc-muted)", margin: "2px 0 0 0" }}>
                                            Periksa dan lengkapi rincian kartu registrasi tamu sebelum mencetak (Format F4).
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {/* Paper Size Selector */}
                                    <div className="grc-paper-toggle">
                                        <button
                                            type="button"
                                            onClick={() => setPaperSize("f4")}
                                            className={`grc-paper-toggle-btn ${paperSize === "f4" ? "active" : ""}`}
                                            title="Ukuran Folio / F4 (215 × 330 mm)"
                                        >
                                            F4 (Folio)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaperSize("a4")}
                                            className={`grc-paper-toggle-btn ${paperSize === "a4" ? "active" : ""}`}
                                            title="Ukuran Standard A4 (210 × 297 mm)"
                                        >
                                            A4
                                        </button>
                                    </div>

                                    <button
                                        onClick={handlePrintGRC}
                                        className="grc-btn-primary"
                                        style={{ backgroundColor: "#006241", height: "36px", padding: "0 18px" }}
                                    >
                                        <Printer size={15} />
                                        <span>Cetak GRC ({paperSize.toUpperCase()})</span>
                                    </button>
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="grc-btn-secondary"
                                        style={{ width: "36px", height: "36px", padding: 0 }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body: Split Form Left + Scaled A4 Right */}
                            <div className="grc-modal-body">
                                {/* Form Left Pane */}
                                <div className="grc-form-pane grc-no-print">
                                    {/* Section 01: Stay & Room */}
                                    <div className="grc-section-title">
                                        <span className="grc-section-num">01</span>
                                        <span>Kamar & Stay Details</span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">No. Kamar</label>
                                            <input
                                                type="text"
                                                value={grcData.roomNumber}
                                                onChange={e => setGrcData({ ...grcData, roomNumber: e.target.value })}
                                                className="grc-input grc-input-mono"
                                                placeholder="Contoh: 110"
                                            />
                                        </div>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Tarif Kamar (Rp)</label>
                                            <input
                                                type="text"
                                                value={grcData.roomRate}
                                                onChange={e => setGrcData({ ...grcData, roomRate: e.target.value })}
                                                className="grc-input grc-input-mono"
                                                placeholder="450000"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">No. Reservasi</label>
                                            <input
                                                type="text"
                                                value={grcData.bookingId}
                                                onChange={e => setGrcData({ ...grcData, bookingId: e.target.value })}
                                                className="grc-input grc-input-mono"
                                            />
                                        </div>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Tipe Kamar</label>
                                            <input
                                                type="text"
                                                value={grcData.roomType}
                                                onChange={e => setGrcData({ ...grcData, roomType: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Kode Harga</label>
                                            <input
                                                type="text"
                                                value={grcData.rateCode}
                                                onChange={e => setGrcData({ ...grcData, rateCode: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Jumlah Tamu (Pax)</label>
                                            <input
                                                type="number"
                                                value={grcData.noOfPax}
                                                onChange={e => setGrcData({ ...grcData, noOfPax: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="grc-field-group">
                                        <label className="grc-field-label">Periode Inap (Stay Period)</label>
                                        <input
                                            type="text"
                                            value={grcData.stayPeriod}
                                            onChange={e => setGrcData({ ...grcData, stayPeriod: e.target.value })}
                                            className="grc-input grc-input-mono"
                                        />
                                    </div>

                                    {/* Section 02: Guest Identity */}
                                    <div className="grc-section-title" style={{ marginTop: "12px" }}>
                                        <span className="grc-section-num">02</span>
                                        <span>Identitas & Kontak Tamu</span>
                                    </div>

                                    <div className="grc-field-group">
                                        <label className="grc-field-label">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            value={grcData.guestName}
                                            onChange={e => setGrcData({ ...grcData, guestName: e.target.value })}
                                            className="grc-input"
                                            style={{ fontWeight: 700 }}
                                        />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">No. Identitas / NIK</label>
                                            <input
                                                type="text"
                                                value={grcData.identityNo}
                                                onChange={e => setGrcData({ ...grcData, identityNo: e.target.value })}
                                                className="grc-input grc-input-mono"
                                                placeholder="KTP / Paspor..."
                                            />
                                        </div>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Kewarganegaraan</label>
                                            <input
                                                type="text"
                                                value={grcData.nationality}
                                                onChange={e => setGrcData({ ...grcData, nationality: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">No. Telp / HP</label>
                                            <input
                                                type="text"
                                                value={grcData.phone}
                                                onChange={e => setGrcData({ ...grcData, phone: e.target.value })}
                                                className="grc-input grc-input-mono"
                                            />
                                        </div>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Email</label>
                                            <input
                                                type="email"
                                                value={grcData.email}
                                                onChange={e => setGrcData({ ...grcData, email: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="grc-field-group">
                                        <label className="grc-field-label">Alamat Lengkap</label>
                                        <textarea
                                            value={grcData.address}
                                            onChange={e => setGrcData({ ...grcData, address: e.target.value })}
                                            rows={2}
                                            className="grc-input"
                                            style={{ height: "auto", padding: "8px 12px", resize: "none" }}
                                        />
                                    </div>

                                    {/* Section 03: Settlement */}
                                    <div className="grc-section-title" style={{ marginTop: "12px" }}>
                                        <span className="grc-section-num">03</span>
                                        <span>Metode Pembayaran & Petugas</span>
                                    </div>

                                    <div className="grc-field-group">
                                        <label className="grc-field-label">Checklist Pembayaran</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={grcData.paymentMethod === "personal"}
                                                    onChange={() => setGrcData({ ...grcData, paymentMethod: "personal" })}
                                                />
                                                <span>Personal Account</span>
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={grcData.paymentMethod === "company"}
                                                    onChange={() => setGrcData({ ...grcData, paymentMethod: "company" })}
                                                />
                                                <span>Company Account</span>
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={grcData.paymentMethod === "travel_agent"}
                                                    onChange={() => setGrcData({ ...grcData, paymentMethod: "travel_agent" })}
                                                />
                                                <span>Travel Agent (OTA)</span>
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={grcData.paymentMethod === "others"}
                                                    onChange={() => setGrcData({ ...grcData, paymentMethod: "others" })}
                                                />
                                                <span>Others</span>
                                            </label>
                                        </div>
                                        {grcData.paymentMethod === "travel_agent" && (
                                            <input
                                                type="text"
                                                value={grcData.travelAgentName}
                                                onChange={e => setGrcData({ ...grcData, travelAgentName: e.target.value })}
                                                placeholder="Nama OTA (TRAVELOKA / TIKET.COM)"
                                                className="grc-input"
                                                style={{ marginTop: "6px" }}
                                            />
                                        )}
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Checked In By (Staff)</label>
                                            <input
                                                type="text"
                                                value={grcData.checkedInBy}
                                                onChange={e => setGrcData({ ...grcData, checkedInBy: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                        <div className="grc-field-group">
                                            <label className="grc-field-label">Approved By</label>
                                            <input
                                                type="text"
                                                value={grcData.approvedBy}
                                                onChange={e => setGrcData({ ...grcData, approvedBy: e.target.value })}
                                                className="grc-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Right Pane */}
                                <div className="grc-preview-pane">
                                    <div className="grc-paper-wrapper" data-paper-size={paperSize}>
                                        <div className="grc-paper">
                                            <GRCPrintTemplate data={grcData} paperSize={paperSize} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dedicated Warm Pre-Rendered Native Print Portal attached to document.body */}
            {mounted && grcData && createPortal(
                <div id="grc-native-print-sheet" data-paper-size={paperSize}>
                    <GRCPrintTemplate data={grcData} paperSize={paperSize} />
                </div>,
                document.body
            )}
        </div>
    );
}
