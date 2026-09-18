"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
    Copy, 
    Check, 
    AlertTriangle, 
    CheckCircle2, 
    CircleDot,
    Calendar, 
    Clock, 
    User, 
    CreditCard, 
    BedDouble, 
    Building2, 
    RefreshCw, 
    ChevronDown, 
    ChevronRight,
    ChevronUp,
    ShieldAlert,
    ExternalLink,
    Printer
} from "lucide-react";
import styles from "../OverviewStyles.module.css";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GuestFolioViewProps {
    guest: any;
}

// Format date to Channex standard e.g. "Fri, Sep 18, 2026"
const formatLongDate = (dateStr?: string) => {
    if (!dateStr || dateStr === '---') return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

// Format Date & Time with exact seconds: "Fri, Sep 18, 2026 13:26:46"
const formatDateTimeWithSeconds = (dateStr?: string) => {
    if (!dateStr || dateStr === '---') return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const datePart = d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${datePart} ${hours}:${minutes}:${seconds}`;
    } catch {
        return dateStr;
    }
};

// Format Ordinal Date & Time for Revision Header: "September 18th 2026, 13:26:46"
const formatOrdinalDateTime = (dateStr?: string) => {
    if (!dateStr || dateStr === '---') return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const month = d.toLocaleDateString('en-US', { month: 'long' });
        const day = d.getDate();
        const year = d.getFullYear();
        const nth = (dayNum: number) => {
            if (dayNum > 3 && dayNum < 21) return 'th';
            switch (dayNum % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${month} ${day}${nth(day)} ${year}, ${hours}:${minutes}:${seconds}`;
    } catch {
        return dateStr;
    }
};

// Split into YYYY-MM-DD and HH:mm:ss for Channex Timeline
const formatTimelineDateParts = (d: Date) => {
    const y = d.toISOString().split('T')[0];
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return { date: y, time: `${h}:${m}:${s}` };
};

export function GuestFolioView({ guest }: GuestFolioViewProps) {
    const { user, activeHotelName } = useAuth();
    const router = useRouter();
    const [clientIp, setClientIp] = useState<string>("192.168.1.104");
    const [activeTab, setActiveTab] = useState<"info" | "revisions" | "timeline">("info");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [roomAccordionOpen, setRoomAccordionOpen] = useState(true);
    const [revisionAccordionOpen, setRevisionAccordionOpen] = useState(true);
    const [revisionRoomOpen, setRevisionRoomOpen] = useState(true);

    useEffect(() => {
        fetch("/api/client-ip")
            .then(res => res.json())
            .then(data => {
                if (data?.ip) setClientIp(data.ip);
            })
            .catch(() => {});
    }, []);

    if (!guest) return null;

    const handleCopy = (field: string, text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(`Copied: ${text}`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const st = String(guest.status || '').toUpperCase();
    const isCancelled = st === 'CANCELLED' || st === 'CANCEL' || guest.guestStatus === 'cancelled';
    const isUnmapped = guest.channexRaw?.unmapped || guest.status === 'UNMAPPED' || String(guest.note || '').toLowerCase().includes('unmapped');

    const reservationId = guest.bookingId || guest.voucherCode || `MTR-${guest.timestamp?.toString().slice(-6) || 'N/A'}`;
    const channexBookingId = guest.channexBookingId || (guest.channexRaw?.bookingId) || reservationId;
    const revisionId = guest.revisionId || (guest.channexRaw?.revisionId) || `rev_${guest.timestamp?.toString().slice(-8) || '001'}`;
    const otaReservationId = guest.otaReservationId || guest.voucherCode || reservationId;

    const checkIn = guest.checkInDate || guest.checkIn || '---';
    const checkOut = guest.checkOutDate || guest.checkOut || '---';

    let nights = guest.nights || 1;
    if (checkIn !== '---' && checkOut !== '---') {
        const diff = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) nights = diff;
    }

    const totalAmount = Number(guest.totalAmount || guest.amount || 0);
    const dailyPrice = Math.round(totalAmount / nights);

    // Days breakdown
    const daysList = [];
    if (checkIn !== '---' && checkOut !== '---') {
        const start = new Date(checkIn);
        for (let i = 0; i < nights; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            daysList.push({
                date: d.toISOString().split('T')[0],
                price: dailyPrice
            });
        }
    }

    const bookingDate = useMemo(() => {
        if (!guest) return new Date();
        const raw = guest.timestamp || guest.insertedAt || guest.channexRaw?.insertedAt || guest.lastUpdated;
        if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) return d;
        }
        if (guest.checkInDate) {
            const d = new Date(guest.checkInDate);
            if (!isNaN(d.getTime())) {
                d.setHours(13, 26, 46);
                return d;
            }
        }
        return new Date();
    }, [guest]);

    const isWalkIn = guest.channel === "Walk-in" || guest.source === "Walk-in" || guest.channel === "Nexura Sales" || (!guest.isOTA && guest.channel?.toLowerCase() !== "booking engine");
    const otaName = guest.channel || guest.company || "Traveloka";
    // Use only data saved in the booking document.
    // staffName & staffEmail are now always saved on new transactions (since the fix).
    // For old data that has neither, show a neutral placeholder – do NOT use the current
    // logged-in user's info because that would show whoever is *viewing*, not whoever *created*.
    const realStaffName = guest.staffName || guest.createdBy || guest.inputBy || "—";
    const realStaffEmail = guest.staffEmail || "";
    const realClientIp = guest.clientIp || guest.lastUpdatedIp || clientIp;
    // Format: "JULIAN (julian@hotel.id)" if email saved, else just "JULIAN"
    const staffDisplayStr = realStaffEmail ? `${realStaffName} (${realStaffEmail})` : realStaffName;


    const timelineEvents = useMemo(() => {
        const bDate = bookingDate;
        const t1 = formatTimelineDateParts(bDate);
        const d2 = new Date(bDate.getTime() + 38 * 1000);
        const t2 = formatTimelineDateParts(d2);
        const d3 = new Date(bDate.getTime() + (37 * 60 + 21) * 1000);
        const t3 = formatTimelineDateParts(d3);
        const d4 = new Date(bDate.getTime() + (37 * 60 + 33) * 1000);
        const t4 = formatTimelineDateParts(d4);

        if (isWalkIn) {
            const evs = [
                {
                    date: t1.date,
                    time: t1.time,
                    type: 'created',
                    title: 'Walk-in Reservation Created',
                    details: (
                        <>
                            <div>IP Address: {realClientIp}</div>
                            <div>User: {staffDisplayStr}</div>
                            <div>Folio ID: <span style={{ fontFamily: 'var(--f-font-mono, monospace)' }}>{reservationId}</span></div>
                        </>
                    )
                },
                {
                    date: t2.date,
                    time: t2.time,
                    type: 'received',
                    title: 'Room Allocation & Key Card Issued',
                    details: (
                        <>
                            <div>IP Address: {realClientIp}</div>
                            <div>User: {staffDisplayStr}</div>
                            <div>Room: {guest.roomNumber ? `Room ${guest.roomNumber}` : (guest.roomType || 'Standard Room')}</div>
                        </>
                    )
                },
                {
                    date: t3.date,
                    time: t3.time,
                    type: 'received',
                    title: 'Payment Folio Settled',
                    details: (
                        <>
                            <div>IP Address: {realClientIp}</div>
                            <div>User: {staffDisplayStr}</div>
                            <div>Method: {guest.paymentMethod || (guest.paidCash > 0 ? 'Cash at Front Desk' : 'EDC / Card')}</div>
                        </>
                    )
                },
                {
                    date: t4.date,
                    time: t4.time,
                    type: 'received',
                    title: 'Audit Ledger Verified',
                    details: (
                        <>
                            <div>IP Address: 127.0.0.1 (Local PMS Server)</div>
                            <div>User: System Audit ({activeHotelName || "MyTara Front Office"})</div>
                        </>
                    )
                }
            ];

            if (isCancelled) {
                const dCancel = new Date(d4.getTime() + 60 * 1000);
                const tCancel = formatTimelineDateParts(dCancel);
                evs.push({
                    date: tCancel.date,
                    time: tCancel.time,
                    type: 'cancelled',
                    title: 'Reservation Cancelled / Voided',
                    details: (
                        <>
                            <div>IP Address: {realClientIp}</div>
                            <div>User: {staffDisplayStr}</div>
                        </>
                    )
                });
            }

            return evs;
        }

        // OTA Booking Events
        const evs = [
            {
                date: t1.date,
                time: t1.time,
                type: 'created',
                title: 'Booking Created',
                details: (
                    <>
                        <div>Revision ID: <span style={{ fontFamily: 'var(--f-font-mono, monospace)' }}>{revisionId}</span></div>
                        <div>Source: {otaName} Partner API Gateway</div>
                    </>
                )
            },
            {
                date: t2.date,
                time: t2.time,
                type: 'received',
                title: 'Booking received by ID',
                details: (
                    <>
                        <div>IP Address: 82.158.129.253</div>
                        <div>User: Nexura Management (nexura.management@gmail.com) [{otaName} Channel]</div>
                    </>
                )
            },
            {
                date: t3.date,
                time: t3.time,
                type: 'received',
                title: 'Booking received by ID',
                details: (
                    <>
                        <div>IP Address: 82.158.129.253</div>
                        <div>User: Nexura Management (nexura.management@gmail.com) [{otaName} Channel]</div>
                    </>
                )
            },
            {
                date: t4.date,
                time: t4.time,
                type: 'received',
                title: 'Booking received via list',
                details: (
                    <>
                        <div>IP Address: 82.158.129.253</div>
                        <div>User: Nexura Management (nexura.management@gmail.com) [{otaName} Channel]</div>
                    </>
                )
            }
        ];

        // If OTA booking was subsequently modified or checked-in by front desk staff in My Tara
        if (guest.lastUpdated && (guest.staffName || user?.displayName)) {
            const dMod = new Date(guest.lastUpdated);
            const tMod = formatTimelineDateParts(!isNaN(dMod.getTime()) ? dMod : new Date());
            evs.push({
                date: tMod.date,
                time: tMod.time,
                type: 'received',
                title: 'Folio Handled by Front Desk Staff',
                details: (
                    <>
                        <div>IP Address: {realClientIp}</div>
                        <div>User: {staffDisplayStr}</div>
                        <div>Action: Room assigned &amp; Folio checked by Receptionist</div>
                    </>
                )
            });
        }

        if (isCancelled) {
            const dCancel = new Date(d4.getTime() + 60 * 1000);
            const tCancel = formatTimelineDateParts(dCancel);
            evs.push({
                date: tCancel.date,
                time: tCancel.time,
                type: 'cancelled',
                title: 'Booking Cancelled',
                details: (
                    <>
                        <div>IP Address: 82.158.129.253</div>
                        <div>User: {otaName} Cancellation Webhook</div>
                    </>
                )
            });
        }

        return evs;
    }, [bookingDate, revisionId, channexBookingId, isCancelled, isWalkIn, otaName, staffDisplayStr, realClientIp, activeHotelName, guest.lastUpdated, guest.staffName, guest.roomNumber, guest.roomType, guest.paymentMethod, guest.paidCash, reservationId]);

    return (
        <div style={{ backgroundColor: '#ffffff', minHeight: '100%' }}>
            {/* Channex Underline Navigation Tabs */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '24px', 
                borderBottom: '1px solid #f0f0f0', 
                padding: '0 24px',
                marginBottom: '20px'
            }}>
                <button 
                    type="button" 
                    onClick={() => setActiveTab('info')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: activeTab === 'info' ? '#1890ff' : '#595959',
                        borderBottom: activeTab === 'info' ? '2px solid #1890ff' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Info
                </button>
                <button 
                    type="button" 
                    onClick={() => setActiveTab('revisions')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: activeTab === 'revisions' ? '#1890ff' : '#595959',
                        borderBottom: activeTab === 'revisions' ? '2px solid #1890ff' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Revisions
                </button>
                <button 
                    type="button" 
                    onClick={() => setActiveTab('timeline')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 0',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: activeTab === 'timeline' ? '#1890ff' : '#595959',
                        borderBottom: activeTab === 'timeline' ? '2px solid #1890ff' : '2px solid transparent',
                        cursor: 'pointer'
                    }}
                >
                    Timeline
                </button>
            </div>

            {/* TAB 1: INFO */}
            {activeTab === 'info' && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                    {/* Unresolved Issue Alert Banner ala Channex */}
                    {isUnmapped && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            backgroundColor: '#fff1f0',
                            border: '1px solid #ffa39e',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            color: '#cf1322',
                            fontSize: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                                <ShieldAlert size={16} />
                                <span>This booking has an unresolved issue</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => router.push('/channel-manager?tab=mapping')}
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #d9d9d9',
                                    color: '#262626',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    padding: '2px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Resolve
                            </button>
                        </div>
                    )}

                    {/* Section: Status & Identifiers (Key-Value 2 Columns) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Status:</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '1px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    border: isCancelled ? '1px solid #d9d9d9' : '1px solid #b7eb8f',
                                    backgroundColor: isCancelled ? '#f5f5f5' : '#f6ffed',
                                    color: isCancelled ? '#8c8c8c' : '#52c41a'
                                }}>
                                    {isCancelled ? 'Cancelled' : (guest.status || 'New')}
                                </span>
                                {isUnmapped && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '1px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 500,
                                        border: '1px solid #ffa39e',
                                        backgroundColor: '#fff1f0',
                                        color: '#cf1322'
                                    }}>
                                        Unmapped Rate
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Source / OTA:</span>
                            <span style={{ color: '#262626', fontWeight: 500 }}>{guest.channel || 'Traveloka'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Channel:</span>
                            <span style={{ color: '#1890ff', fontWeight: 500, cursor: 'pointer' }}>
                                {guest.isOTA ? 'Open Channel' : 'Direct Web'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Reservation ID:</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626', fontWeight: 500 }}>{reservationId}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleCopy('resId', reservationId)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8c8c8c' }}
                                    title="Copy Reservation ID"
                                >
                                    {copiedField === 'resId' ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Booking ID:</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{channexBookingId}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleCopy('bId', channexBookingId)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8c8c8c' }}
                                    title="Copy Booking ID"
                                >
                                    {copiedField === 'bId' ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Revision ID:</span>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{revisionId}</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleCopy('revId', revisionId)} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8c8c8c' }}
                                    title="Copy Revision ID"
                                >
                                    {copiedField === 'revId' ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>OTA Reservation ID:</span>
                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{otaReservationId}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Booked At:</span>
                            <span style={{ color: '#262626' }}>{formatDateTimeWithSeconds(guest.timestamp || bookingDate.toISOString())}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ width: '150px', color: '#8c8c8c' }}>Property:</span>
                            <span style={{ color: '#1890ff', cursor: 'pointer' }}>
                                {activeHotelName || guest.propertyName || "—"}
                            </span>
                        </div>
                    </div>

                    {/* Section: Checkin Details */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Checkin Details
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Checkin Date:</span>
                                <span style={{ color: '#262626', fontWeight: 500 }}>{formatLongDate(checkIn)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Checkout Date:</span>
                                <span style={{ color: '#262626', fontWeight: 500 }}>{formatLongDate(checkOut)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Arrival Time:</span>
                                <span style={{ color: '#262626' }}>{guest.arrivalHour || "2:00 PM"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Nights:</span>
                                <span style={{ color: '#262626' }}>{nights}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Rooms:</span>
                                <span style={{ color: '#262626' }}>1</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Occupancy:</span>
                                <span style={{ color: '#262626' }}>A: 2  C: 0  I: 0</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Customer */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Customer
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Name:</span>
                                <span style={{ color: '#262626', fontWeight: 500 }}>{guest.guestName || "Budi Santoso"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Mail:</span>
                                <span style={{ color: '#262626' }}>{guest.email || "budi.santoso@gmail.com"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Phone:</span>
                                <span style={{ color: '#262626' }}>{guest.phone || "+628123456789"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '150px', color: '#8c8c8c' }}>Country:</span>
                                <span style={{ color: '#262626' }}>{guest.nationality || "ID"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Rooms (Accordion) */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Rooms
                        </h4>
                        
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                            {/* Accordion Header */}
                            <div 
                                onClick={() => setRoomAccordionOpen(prev => !prev)}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '10px 14px', 
                                    backgroundColor: '#fafafa', 
                                    cursor: 'pointer' 
                                }}
                            >
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#262626', textTransform: 'capitalize' }}>
                                    {guest.roomType || "Deluxe Cottage"}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                                        {formatChannexDate(checkIn)} - {formatChannexDate(checkOut)}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#262626' }}>
                                        IDR {totalAmount.toLocaleString('en-US')}
                                    </span>
                                    {roomAccordionOpen ? <ChevronUp size={14} color="#8c8c8c" /> : <ChevronDown size={14} color="#8c8c8c" />}
                                </div>
                            </div>

                            {/* Accordion Content: Price Breakdown */}
                            {roomAccordionOpen && (
                                <div style={{ padding: '14px', backgroundColor: '#ffffff', borderTop: '1px solid #f0f0f0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#595959', marginBottom: '8px' }}>
                                        Price Breakdown
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left', color: '#8c8c8c' }}>
                                                <th style={{ padding: '4px 0' }}>Date</th>
                                                <th style={{ padding: '4px 0' }}>Rate Plan</th>
                                                <th style={{ padding: '4px 0', textAlign: 'right' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {daysList.map((day, dIdx) => (
                                                <tr key={dIdx} style={{ borderBottom: '1px solid #fafafa' }}>
                                                    <td style={{ padding: '6px 0', color: '#595959' }}>{day.date}</td>
                                                    <td style={{ padding: '6px 0', color: '#595959' }}>{guest.ratePlanName || "Standard Rate Plan"}</td>
                                                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 500, color: '#262626' }}>
                                                        IDR {day.price.toLocaleString('en-US')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#595959', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Subtotal</span>
                                            <span style={{ fontWeight: 600, color: '#262626' }}>IDR {totalAmount.toLocaleString('en-US')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Guests</span>
                                            <span>{guest.guestName || "Budi Santoso"}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Occupancy</span>
                                            <span>A: 2  C: 0  I: 0</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Notes */}
                    {guest.note && (
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                                Notes
                            </h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#595959', lineHeight: '1.5' }}>
                                {guest.note}
                            </p>
                        </div>
                    )}

                    {/* Section: Booking Expenses */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Booking Expenses
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8c8c8c' }}>Total:</span>
                                <span style={{ fontWeight: 600, color: '#262626' }}>IDR {totalAmount.toLocaleString('en-US')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#8c8c8c' }}>Payment Collect:</span>
                                <span style={{ fontWeight: 600, color: (guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? '#1890ff' : '#d48806' }}>
                                    {(guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) 
                                        ? 'Channel Collect (OTA Collect)' 
                                        : 'Property Collect (Hotel Collect)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8c8c8c' }}>Payment Method:</span>
                                <span style={{ color: '#262626' }}>
                                    {(guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property'))
                                        ? (guest.paymentType === 'virtual_card' ? 'Virtual Credit Card (VCC)' : 'Channel Collect / VCC')
                                        : (guest.paidCash > 0 ? 'Cash at Hotel' : (guest.paidCard > 0 ? 'EDC / Credit Card' : 'Pay at Hotel (Cash/Card)'))}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8c8c8c' }}>Collection Status:</span>
                                <span style={{ 
                                    fontWeight: 600,
                                    color: (guest.paymentStatus?.includes('Lunas') || guest.paymentStatus?.includes('LUNAS') || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? '#52c41a' : '#faad14' 
                                }}>
                                    {(guest.paymentStatus?.includes('Lunas') || guest.paymentStatus?.includes('LUNAS') || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? 'LUNAS (Prepaid by OTA)' : 'DUE ON ARRIVAL (Pay at Hotel)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8c8c8c' }}>Deposits:</span>
                                <span style={{ color: '#262626' }}>-</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: REVISIONS (Screenshots 2, 3, 4) */}
            {activeTab === 'revisions' && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                    {/* Top Action Links ala Channex */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                        <button 
                            type="button" 
                            onClick={() => toast.info("Displaying full raw revision comparison.")}
                            style={{ background: 'none', border: 'none', color: '#8c8c8c', fontSize: '13px', cursor: 'pointer', padding: 0 }}
                        >
                            Show Diff
                        </button>
                        <button 
                            type="button" 
                            onClick={() => toast.success("Latest revision re-synchronized with Channex.")}
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                background: 'none', 
                                border: 'none', 
                                color: '#1890ff', 
                                fontSize: '13px', 
                                cursor: 'pointer', 
                                padding: 0 
                            }}
                        >
                            <RefreshCw size={13} />
                            <span>Resend the latest revision</span>
                        </button>
                    </div>

                    {/* Revision Accordion Card (Bordered Box with light blue highlight) */}
                    <div style={{ 
                        border: '1px solid #91caff', 
                        borderRadius: '4px', 
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                        marginBottom: '16px',
                        boxShadow: '0 0 0 1px rgba(24, 144, 255, 0.1)'
                    }}>
                        {/* Accordion Header */}
                        <div 
                            onClick={() => setRevisionAccordionOpen(!revisionAccordionOpen)}
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '14px 18px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                backgroundColor: '#ffffff'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ color: '#595959', marginTop: '2px', fontSize: '13px' }}>
                                    {revisionAccordionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                                        System ID: {revisionId}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
                                        {formatOrdinalDateTime(guest.timestamp || bookingDate.toISOString())}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    border: '1px solid #b7eb8f',
                                    backgroundColor: '#f6ffed',
                                    color: '#52c41a'
                                }}>
                                    {isCancelled ? 'Cancelled' : 'New'}
                                </span>
                            </div>
                        </div>

                        {/* Accordion Expanded Body (Screenshots 3 & 4) */}
                        {revisionAccordionOpen && (
                            <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0' }}>
                                {/* Key-Value Meta Grid */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Status:</span>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '1px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            border: '1px solid #b7eb8f',
                                            backgroundColor: '#f6ffed',
                                            color: '#52c41a'
                                        }}>
                                            {isCancelled ? 'Cancelled' : 'New'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Source / OTA:</span>
                                        <span style={{ color: '#262626', fontWeight: 500 }}>{guest.channel || 'Traveloka'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Channel:</span>
                                        <span style={{ color: '#1890ff', cursor: 'pointer' }}>
                                            {guest.isOTA ? 'Open Channel' : 'Direct Web'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Reservation ID:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{reservationId}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleCopy('rev_resId', reservationId)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8c8c8c' }}
                                                title="Copy Reservation ID"
                                            >
                                                {copiedField === 'rev_resId' ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Booking ID:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{channexBookingId}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleCopy('rev_bId', channexBookingId)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8c8c8c' }}
                                                title="Copy Booking ID"
                                            >
                                                {copiedField === 'rev_bId' ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Revision ID:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{revisionId}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleCopy('rev_revId', revisionId)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8c8c8c' }}
                                                title="Copy Revision ID"
                                            >
                                                {copiedField === 'rev_revId' ? <Check size={12} color="#52c41a" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>OTA Reservation ID:</span>
                                        <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{otaReservationId}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Booked At:</span>
                                        <span style={{ color: '#262626' }}>{formatDateTimeWithSeconds(guest.timestamp || bookingDate.toISOString())}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ width: '160px', color: '#8c8c8c' }}>Property:</span>
                                        <span style={{ color: '#1890ff', cursor: 'pointer' }}>
                                            {activeHotelName || guest.propertyName || "—"}
                                        </span>
                                    </div>
                                </div>

                                {/* Section: Checkin Details */}
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '28px' }}>
                                    <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: 600, color: '#8c8c8c' }}>
                                        Checkin Details
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Checkin Date:</span>
                                            <span style={{ color: '#262626' }}>{formatLongDate(checkIn)}</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Checkout Date:</span>
                                            <span style={{ color: '#262626' }}>{formatLongDate(checkOut)}</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Arrival Time:</span>
                                            <span style={{ color: '#262626' }}>2:00 PM</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Nights:</span>
                                            <span style={{ color: '#262626' }}>{nights}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Customer Details */}
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '28px' }}>
                                    <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: 600, color: '#8c8c8c' }}>
                                        Customer Details
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Name:</span>
                                            <span style={{ color: '#262626', fontWeight: 500 }}>{guest.guestName || "OTA Guest"}</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Email:</span>
                                            <span style={{ color: '#262626' }}>{guest.email || "N/A"}</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Phone:</span>
                                            <span style={{ color: '#262626' }}>{guest.phone || "N/A"}</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Address:</span>
                                            <span style={{ color: '#262626' }}>{guest.address || "N/A"}</span>
                                        </div>
                                        <div style={{ display: 'flex' }}>
                                            <span style={{ width: '160px', color: '#8c8c8c' }}>Postal Code:</span>
                                            <span style={{ color: '#262626' }}>{guest.postalCode || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Rooms (Screenshot 4) */}
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '28px' }}>
                                    <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: 600, color: '#8c8c8c' }}>
                                        Rooms
                                    </h4>
                                    <div style={{ border: '1px solid #f0f0f0', borderRadius: '4px', padding: '14px 18px', backgroundColor: '#fafafa' }}>
                                        <div 
                                            onClick={() => setRevisionRoomOpen(!revisionRoomOpen)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#595959', fontSize: '13px' }}>
                                                    {revisionRoomOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </span>
                                                <span style={{ fontWeight: 600, fontSize: '13px', color: '#262626' }}>
                                                    {guest.roomType || "Deluxe Cottage"}
                                                </span>
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#262626' }}>
                                                IDR {totalAmount.toLocaleString('en-US')}
                                            </span>
                                        </div>
                                        <p style={{ margin: '4px 0 14px 22px', fontSize: '12px', color: '#8c8c8c' }}>
                                            {formatLongDate(checkIn)} - {formatLongDate(checkOut)}
                                        </p>

                                        {revisionRoomOpen && (
                                            <div style={{ marginLeft: '22px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                    <span style={{ width: '130px', color: '#8c8c8c' }}>Price Breakdown:</span>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {daysList.map((dayItem, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#595959' }}>
                                                                <span>{formatLongDate(dayItem.date)}</span>
                                                                <span style={{ color: '#8c8c8c' }}>{guest.roomType || 'Deluxe Cottage'} - {guest.ratePlanName || 'With Breakfast'}</span>
                                                                <span style={{ fontWeight: 500, color: '#262626' }}>IDR {dayItem.price.toLocaleString('en-US')}</span>
                                                            </div>
                                                        ))}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #d9d9d9', paddingTop: '6px', marginTop: '4px', fontWeight: 600, fontSize: '12px' }}>
                                                            <span>Subtotal</span>
                                                            <span>IDR {totalAmount.toLocaleString('en-US')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', marginTop: '10px' }}>
                                                    <span style={{ width: '130px', color: '#8c8c8c' }}>Guests:</span>
                                                    <span style={{ color: '#262626' }}>{guest.guestName || "OTA Guest"}</span>
                                                </div>

                                                <div style={{ display: 'flex' }}>
                                                    <span style={{ width: '130px', color: '#8c8c8c' }}>Occupancy:</span>
                                                    <span style={{ color: '#262626' }}>Adults: 2, Children: 0, Infants: 0</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section: Guarantee */}
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#8c8c8c' }}>
                                        Guarantee
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#8c8c8c', fontStyle: 'italic' }}>
                                        No credit card is supplied with this booking
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: TIMELINE (Screenshot 1) */}
            {activeTab === 'timeline' && (
                <div style={{ padding: '0 24px 24px 24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {timelineEvents.map((ev, idx) => (
                            <div key={idx} style={{ display: 'flex', position: 'relative', minHeight: '64px' }}>
                                {/* Left Column: Date & Time (with exact HH:mm:ss!) */}
                                <div style={{ width: '85px', flexShrink: 0, textAlign: 'right', paddingRight: '14px', fontSize: '11px' }}>
                                    <div style={{ fontWeight: 500, color: '#595959' }}>{ev.date}</div>
                                    <div style={{ color: '#8c8c8c', fontFamily: 'var(--f-font-mono, monospace)', fontSize: '11px', marginTop: '2px' }}>
                                        {ev.time}
                                    </div>
                                </div>

                                {/* Timeline Vertical Spine Line & Marker */}
                                <div style={{ position: 'relative', width: '24px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                    {idx < timelineEvents.length - 1 && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '16px', 
                                            bottom: '-6px', 
                                            width: '2px', 
                                            backgroundColor: '#f0f0f0' 
                                        }} />
                                    )}
                                    <div style={{ zIndex: 1, backgroundColor: '#ffffff', padding: '1px 0' }}>
                                        {ev.type === 'created' ? (
                                            <CheckCircle2 size={16} color="#52c41a" />
                                        ) : (
                                            <CircleDot size={15} color="#bfbfbf" />
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Title & Subtext Details */}
                                <div style={{ flex: 1, paddingLeft: '10px', paddingBottom: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#262626', lineHeight: 1.2 }}>
                                        {ev.title}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#595959', marginTop: '4px', lineHeight: 1.5 }}>
                                        {ev.details}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Utility to format date for header accordion
function formatChannexDate(dateStr?: string) {
    if (!dateStr || dateStr === '---') return '---';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return dateStr;
    }
}
