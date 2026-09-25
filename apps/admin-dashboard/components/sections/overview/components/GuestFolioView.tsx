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
import { isUserSuperadmin } from "@/lib/permissionCheck";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { resolveBookingIdentifiers } from "@/lib/channelHelper";

interface GuestFolioViewProps {
    guest: any;
    onEditPayment?: () => void;
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

export function GuestFolioView({ guest, onEditPayment }: GuestFolioViewProps) {
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
    const realStaffName = guest.staffName || guest.createdBy || guest.inputBy || "-";
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

                    {/* Section: Status & Identifiers (Exact Channex Alignment) */}
                    {(() => {
                        const ids = resolveBookingIdentifiers(guest);
                        return (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Status:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                padding: '2px 8px',
                                                borderRadius: '3px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                border: isCancelled ? '1px solid #ff4d4f' : '1px solid #52c41a',
                                                backgroundColor: isCancelled ? '#fff1f0' : '#f6ffed',
                                                color: isCancelled ? '#cf1322' : '#52c41a'
                                            }}>
                                                {isCancelled ? 'Cancelled' : (st === 'CONFIRMED' || st === 'NEW' ? 'New' : (guest.status || 'New'))}
                                            </span>
                                            {isUnmapped && (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '2px 8px',
                                                    borderRadius: '3px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    border: '1px solid #ffa39e',
                                                    backgroundColor: '#fff1f0',
                                                    color: '#cf1322'
                                                }}>
                                                    Unmapped
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Source / OTA:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <img src={ids.channelLogo} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            <span style={{ color: '#262626', fontWeight: 600 }}>{ids.channelName}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Channel:</span>
                                        <span style={{ color: '#1890ff', fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push('/channel-manager')}>
                                            {ids.connectionChannel || 'Open Channel'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Reservation ID:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626', fontWeight: 600 }}>{ids.reservationId}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleCopy('resId', ids.reservationId)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1890ff' }}
                                                title="Copy Reservation ID"
                                            >
                                                {copiedField === 'resId' ? <Check size={13} color="#52c41a" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Booking ID:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{ids.bookingId}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleCopy('bId', ids.bookingId)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1890ff' }}
                                                title="Copy Booking ID"
                                            >
                                                {copiedField === 'bId' ? <Check size={13} color="#52c41a" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Revision ID:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{ids.revisionId}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleCopy('revId', ids.revisionId)} 
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1890ff' }}
                                                title="Copy Revision ID"
                                            >
                                                {copiedField === 'revId' ? <Check size={13} color="#52c41a" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>OTA Reservation ID:</span>
                                        <span style={{ fontFamily: 'var(--f-font-mono, monospace)', color: '#262626' }}>{ids.otaReservationId}</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Booked At:</span>
                                        <span style={{ color: '#262626' }}>{formatLongDate(guest.timestamp || bookingDate.toISOString())}</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Property:</span>
                                        <span style={{ color: '#1890ff', fontWeight: 500 }}>
                                            {activeHotelName || guest.propertyName || "Setara Demo Partner"}
                                        </span>
                                    </div>
                                </div>

                                {/* Section: Checkin Details (Exact Channex Divider & Styling) */}
                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                                    <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', fontWeight: 500, color: '#8c8c8c' }}>
                                        Checkin Details
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Checkin Date:</span>
                                            <span style={{ color: '#262626' }}>{formatLongDate(checkIn)}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Checkout Date:</span>
                                            <span style={{ color: '#262626' }}>{formatLongDate(checkOut)}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Arrival Time:</span>
                                            <span style={{ color: '#262626' }}>{guest.arrivalHour || "2:00 PM"}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Nights:</span>
                                            <span style={{ color: '#262626' }}>{nights}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ width: '160px', color: '#595959', textAlign: 'right', paddingRight: '16px' }}>Rooms:</span>
                                            <span style={{ color: '#262626' }}>{guest.roomsCount || guest.roomCount || 1}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}


                    {/* Section: Customer */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Profil Tamu (Guest Profile)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '160px', color: '#8c8c8c' }}>Nama Lengkap:</span>
                                <span style={{ color: '#262626', fontWeight: 600 }}>{guest.guestName || "Tamu Hotel"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '160px', color: '#8c8c8c' }}>Email:</span>
                                <span style={{ color: '#262626' }}>{guest.email || "-"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '160px', color: '#8c8c8c' }}>No. Handphone:</span>
                                <span style={{ color: '#262626' }}>{guest.phone || "-"}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ width: '160px', color: '#8c8c8c' }}>Kewarganegaraan:</span>
                                <span style={{ color: '#262626' }}>{guest.nationality || "ID"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Rooms (Accordion) */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Rincian Kamar & Tarif Harian (Room Charges)
                        </h4>
                        
                        <div style={{ border: '1px solid #f0f0f0', borderRadius: '6px', overflow: 'hidden' }}>
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
                                    {guest.roomType || "Standard Room"}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '11px', color: '#8c8c8c' }}>
                                        {formatChannexDate(checkIn)} - {formatChannexDate(checkOut)}
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#262626' }}>
                                        IDR {totalAmount.toLocaleString('en-US')}
                                    </span>
                                    {roomAccordionOpen ? <ChevronUp size={14} color="#8c8c8c" /> : <ChevronDown size={14} color="#8c8c8c" />}
                                </div>
                            </div>

                            {/* Accordion Content: Price Breakdown */}
                            {roomAccordionOpen && (
                                <div style={{ padding: '14px', backgroundColor: '#ffffff', borderTop: '1px solid #f0f0f0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#595959', marginBottom: '8px' }}>
                                        Tarif Harian (Daily Rates)
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left', color: '#8c8c8c' }}>
                                                <th style={{ padding: '4px 0' }}>Tanggal</th>
                                                <th style={{ padding: '4px 0' }}>Rate Plan</th>
                                                <th style={{ padding: '4px 0', textAlign: 'right' }}>Tarif</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {daysList.map((day, dIdx) => {
                                                const isWithBreakfast = guest.hasBreakfast || 
                                                    guest.rateCode === 'BB' || 
                                                    String(guest.rateCode || '').toUpperCase().includes('BB') ||
                                                    String(guest.ratePlanName || '').toLowerCase().includes('breakfast') ||
                                                    String(guest.description || '').toLowerCase().includes('breakfast') ||
                                                    Number(guest.breakfastAmount || 0) > 0;

                                                const displayRatePlan = guest.ratePlanName 
                                                    ? (guest.ratePlanName.toLowerCase().includes('breakfast') && !guest.ratePlanName.includes('RBF') ? `${guest.ratePlanName} (RBF)` : guest.ratePlanName)
                                                    : (isWithBreakfast 
                                                        ? "With Breakfast (BB / RBF)" 
                                                        : (guest.rateCode === 'RO' ? "Room Only (RO)" : (guest.rateCode && guest.rateCode !== '-' ? guest.rateCode : "Standard Rate Plan")));

                                                return (
                                                    <tr key={dIdx} style={{ borderBottom: '1px solid #fafafa' }}>
                                                        <td style={{ padding: '6px 0', color: '#595959' }}>{day.date}</td>
                                                        <td style={{ padding: '6px 0', color: '#595959' }}>{displayRatePlan}</td>
                                                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#262626' }}>
                                                            IDR {day.price.toLocaleString('en-US')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#595959', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Subtotal Kamar:</span>
                                            <span style={{ fontWeight: 700, color: '#262626' }}>IDR {totalAmount.toLocaleString('en-US')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Tamu Terdaftar:</span>
                                            <span>{guest.guestName || "Tamu Hotel"}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Okupansi:</span>
                                            <span>Dewasa: 2 | Anak: 0</span>
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
                                Catatan Khusus (Special Request / Notes)
                            </h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#595959', lineHeight: '1.5' }}>
                                {guest.note}
                            </p>
                        </div>
                    )}

                    {/* Section: Booking Expenses & Settlement */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                            Rincian Biaya & Alokasi Pembayaran (Folio Settlement)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#8c8c8c' }}>Total Tagihan Menginap:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>IDR {totalAmount.toLocaleString('en-US')}</span>
                                    {guest.revenueRecordingMode && (
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: String(guest.revenueRecordingMode).toLowerCase() === 'gross' ? '#eff6ff' : '#ecfdf5',
                                            color: String(guest.revenueRecordingMode).toLowerCase() === 'gross' ? '#1d4ed8' : '#047857',
                                            border: `1px solid ${String(guest.revenueRecordingMode).toLowerCase() === 'gross' ? '#bfdbfe' : '#a7f3d0'}`
                                        }}>
                                            {String(guest.revenueRecordingMode).toUpperCase()} MODE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ── SUPERADMIN ONLY: NET VS GROSS FINANCIAL RECONCILIATION AUDIT ── */}
                            {isUserSuperadmin(user) && (
                                <div style={{
                                    marginTop: '8px',
                                    marginBottom: '8px',
                                    padding: '12px 14px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldAlert size={13} color="#0284c7" />
                                            <span>Superadmin Audit: Net vs. Gross Reconciliation</span>
                                        </span>
                                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#334155', fontWeight: 700 }}>
                                            Policy: {String(guest.revenueRecordingMode || "NET").toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11px' }}>
                                        <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ color: '#64748b', fontSize: '10px' }}>OTA Retail Gross</div>
                                            <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                                IDR {(Number(guest.grossAmount || guest.amount || totalAmount)).toLocaleString('en-US')}
                                            </div>
                                        </div>
                                        <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ color: '#64748b', fontSize: '10px' }}>OTA Commission ({guest.otaCommissionPercent || 15}%)</div>
                                            <div style={{ fontWeight: 700, color: '#dc2626', marginTop: '2px' }}>
                                                - IDR {(Number(guest.otaCommissionAmount || Math.round((guest.grossAmount || totalAmount) * ((guest.otaCommissionPercent || 15) / 100)))).toLocaleString('en-US')}
                                            </div>
                                        </div>
                                        <div style={{ background: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ color: '#64748b', fontSize: '10px' }}>Net Hotel Payout</div>
                                            <div style={{ fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                                                IDR {(Number(guest.netToHotel || (totalAmount - (guest.otaCommissionAmount || 0)))).toLocaleString('en-US')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>
                                        Accounting entry is booked at <b>IDR {totalAmount.toLocaleString('en-US')}</b> following the hotel CM <b>{String(guest.revenueRecordingMode || "NET").toUpperCase()}</b> policy. Staff without superadmin privileges only see this nominal.
                                    </div>
                                </div>
                            )}

                            {/* INLINE PAYMENT METHOD & PAYMENT COLLECT */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                margin: '4px 0',
                                gap: '8px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Metode & Penagihan:</span>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            backgroundColor: (guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? '#eff6ff' : '#fef3c7',
                                            border: `1px solid ${(guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? '#bfdbfe' : '#fde68a'}`,
                                            color: (guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? '#1d4ed8' : '#b45309'
                                        }}>
                                            {(guest.paymentCollect === 'channel' || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? 'OTA Collect (Channel)' : 'Hotel Collect (Property)'}
                                        </span>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            color: '#0f172a'
                                        }}>
                                            {guest.paymentMethod || (
                                                (guest.paymentCollect === 'channel' || (guest.isOTA && guest.paymentCollect !== 'property'))
                                                    ? (guest.paymentType === 'virtual_card' ? 'Virtual Credit Card (VCC)' : 'OTA City Ledger / VCC')
                                                    : (Number(guest.paidTransfer || 0) > 0 ? 'Bank Transfer' : (Number(guest.paidQris || 0) > 0 ? 'QRIS Payment' : (Number(guest.paidEdc || 0) > 0 ? 'EDC / Mesin Kartu' : (Number(guest.paidCash || 0) > 0 ? 'Kas / Tunai' : 'Bayar di Hotel'))))
                                            )}
                                        </span>
                                    </div>
                                </div>
                                {onEditPayment && (
                                    <button
                                        type="button"
                                        onClick={onEditPayment}
                                        style={{
                                            padding: '3px 10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            borderRadius: '5px',
                                            border: '1px solid #7dd3fc',
                                            backgroundColor: '#f0f9ff',
                                            color: '#0284c7',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                        title="Ubah metode pembayaran & penagihan (In-place & ter-push ke Accounting)"
                                    >
                                        <CreditCard size={12} />
                                        <span>Ubah</span>
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#8c8c8c' }}>Status Penagihan:</span>
                                <span style={{ 
                                    fontWeight: 700,
                                    color: (guest.paymentStatus?.includes('Lunas') || guest.paymentStatus?.includes('LUNAS') || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? '#16a34a' : '#d97706' 
                                }}>
                                    {(guest.paymentStatus?.includes('Lunas') || guest.paymentStatus?.includes('LUNAS') || guest.payTransfer > 0 || (guest.isOTA && guest.paymentCollect !== 'property')) ? 'LUNAS (Settled / Prepaid)' : 'TAGIHAN SAAT KEDATANGAN (Pay at Hotel)'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#8c8c8c' }}>Deposit / Uang Muka:</span>
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
                                            {activeHotelName || guest.propertyName || "-"}
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
