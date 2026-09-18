"use client";

import React, { useState } from "react";
import {
    Home,
    Coffee,
    ArrowLeft,
    Plus,
    Trash2,
    User,
    ShieldCheck,
    AlertCircle,
    Receipt,
    BedDouble,
    Globe,
    Phone,
    Mail,
    FileText,
    MapPin,
    Building,
    HelpCircle,
    Check,
    Play,
    ChevronDown,
    X,
    CreditCard
} from "lucide-react";
import { toast } from "sonner";
import styles from "./TransactionFormStyles.module.css";
import pmsStyles from "./AddReservation.module.css";
import { CHANNELS, BOOKING_TYPES, ChannelOption } from "./useTransactionForm";
import Modal from "./Modal";
import {
    SectionTitle,
    ChannelSelect,
    RoomTypeSelect,
    RatePlanSelect,
    OtherIncomeTypeSelect,
    TerminalInput,
    TypeCard,
    DateCard,
    RoomNumberSelect
} from "./TransactionComponents";

const formatCurrency = (val: number) => new Intl.NumberFormat("id-ID").format(val);

interface TerminalHeaderProps {
    checkIn: string;
    queueLength: number;
    saving: boolean;
    onCommit: () => void;
    onBack: () => void;
}

export function TerminalHeader({ checkIn, queueLength, saving, onCommit, onBack }: TerminalHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <div className={styles.headerLeft}>
                    <button 
                        onClick={onBack} 
                        className={styles.btnIcon}
                        title="Kembali"
                    >
                        <ArrowLeft size={16} strokeWidth={2} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-[14px] font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider" style={{ margin: 0 }}>
                            POS Forecast Terminal
                        </h1>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.terminalMeta}>
                        <span className={styles.terminalMetaLabel}>Date Terminal</span>
                        <span className={styles.terminalMetaValue}>{checkIn}</span>
                    </div>
                    <div className={styles.vDivider} />
                    <button 
                        onClick={onCommit}
                        disabled={queueLength === 0 || saving}
                        className={styles.btnPrimary}
                    >
                        <ShieldCheck size={14} />
                        {saving ? "MENYIMPAN..." : `COMMIT (${queueLength} TRX)`}
                    </button>
                </div>
            </div>
        </header>
    );
}

interface RevenueTypeSelectorProps {
    onSelect: (type: 'room' | 'other') => void;
}

export function RevenueTypeSelector({ onSelect }: RevenueTypeSelectorProps) {
    return (
        <div className={styles.selectWrapper}>
            <div className={styles.selectHeader}>
                <h2 className={styles.selectTitle}>Kategori Transaksi Baru</h2>
                <p className={styles.selectSubtitle}>Pilih salah satu kategori untuk memulai entri data</p>
            </div>
            
            <div className={styles.selectGrid}>
                <TypeCard 
                    label="Room Revenue" 
                    description="Transaksi pemesanan kamar hotel (OTA, Walk-in, Corporate, Direct Booking)"
                    icon={Home}
                    onClick={() => onSelect('room')}
                />
                <TypeCard 
                    label="Other Income" 
                    description="Pendapatan tambahan seperti Spa, Extra Bed, Laundry, dan Transportasi"
                    icon={Coffee}
                    onClick={() => onSelect('other')}
                />
            </div>
        </div>
    );
}

interface TransactionEntryFormProps {
    revenueType: 'room' | 'other';
    form: any;
    roomTypes: any[];
    ratePlans?: any[];
    selectedRatePlanId?: string;
    onSelectRatePlan?: (ratePlanId: string) => void;
    availableChannels?: ChannelOption[];
    updateForm: (field: string, value: any) => void;
    updateRoom: (idx: number, field: string, value: any) => void;
    addRoom?: () => void;
    removeRoom?: (idx: number) => void;
    updateNightRate: (idx: number, rate: any) => void;
    onCancel: () => void;
    onSubmit: () => void;
    onCommit?: () => void;
    getAvailableRoomNumbers: (roomTypeId: string) => string[];
    totalGross?: number;
    handleCancel?: () => void;
    saving?: boolean;
    isEditMode?: boolean;
}

export function TransactionEntryForm({
    revenueType,
    form,
    roomTypes,
    ratePlans = [],
    selectedRatePlanId = "",
    onSelectRatePlan = () => {},
    availableChannels = [],
    updateForm,
    updateRoom,
    addRoom,
    removeRoom,
    updateNightRate,
    onCancel,
    onSubmit,
    onCommit,
    getAvailableRoomNumbers,
    totalGross: propTotalGross,
    handleCancel,
    saving = false,
    isEditMode = false
}: TransactionEntryFormProps) {
    const [modalData, setModalData] = useState<{ type: string; data: any } | null>(null);
    const [showGroupMenu, setShowGroupMenu] = useState(false);
    const startD = form.checkIn ? new Date(form.checkIn) : null;
    const endD = form.checkOut ? new Date(form.checkOut) : null;
    const nights = (startD && endD && endD > startD) ? Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) : 1;

    const totalGross = propTotalGross !== undefined ? propTotalGross : (
        revenueType === "room"
            ? (form.nightRates || []).reduce((acc: number, r: any) => acc + (Number(r) || 0), 0)
            : (Number(form.totalAmount) || 0)
    );

    React.useEffect(() => {
        const handleWheel = () => {
            const active = document.activeElement as HTMLElement | null;
            if (active && (active.tagName === "INPUT" || active.tagName === "SELECT")) {
                active.blur();
            }
        };
        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    if (revenueType === 'room') {
        return (
            <div className={pmsStyles.pmsCard}>
                {/* Top Navigation */}
                <div className={pmsStyles.topNav}>
                    <button 
                        type="button" 
                        onClick={handleCancel || onCancel} 
                        className={pmsStyles.backButton}
                        title="Back"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                        <span>{isEditMode ? `Edit Reservation (${form.bookingId || "Booking"})` : "Add Reservation"}</span>
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                    {/* Row 1: Stay Timeline Bar (Exact Single-Line eZee PMS Format) */}
                    <div className={pmsStyles.stayTimelineBar}>
                        {/* Check-in Date & Time */}
                        <div className={pmsStyles.timelineGroup}>
                            <label className={pmsStyles.fieldLabel}>Check-in</label>
                            <div className={pmsStyles.dateTimeRow}>
                                <input 
                                    type="date" 
                                    className={`${pmsStyles.fieldInput} ${pmsStyles.dateInput}`}
                                    value={form.checkIn}
                                    onChange={(e) => updateForm("checkIn", e.target.value)}
                                />
                                <input 
                                    type="time" 
                                    className={`${pmsStyles.fieldInput} ${pmsStyles.timeInput}`}
                                    value={form.checkInTime || "18:30"}
                                    onChange={(e) => updateForm("checkInTime", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Nights Badge */}
                        <div className={pmsStyles.nightsBadge}>
                            <span className={pmsStyles.nightsNum}>{nights}</span>
                            <span className={pmsStyles.nightsText}>Nights</span>
                        </div>

                        {/* Check-out Date & Time */}
                        <div className={pmsStyles.timelineGroup}>
                            <label className={pmsStyles.fieldLabel}>Check-out</label>
                            <div className={pmsStyles.dateTimeRow}>
                                <input 
                                    type="date" 
                                    className={`${pmsStyles.fieldInput} ${pmsStyles.dateInput}`}
                                    value={form.checkOut}
                                    onChange={(e) => updateForm("checkOut", e.target.value)}
                                />
                                <input 
                                    type="time" 
                                    className={`${pmsStyles.fieldInput} ${pmsStyles.timeInput}`}
                                    value={form.checkOutTime || "11:00"}
                                    onChange={(e) => updateForm("checkOutTime", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Room(s) Count */}
                        <div className={pmsStyles.timelineGroup}>
                            <label className={pmsStyles.fieldLabel}>Room(s)</label>
                            <input 
                                type="number" 
                                min={1}
                                max={50}
                                className={`${pmsStyles.fieldInput} ${pmsStyles.roomCountInput}`}
                                value={form.rooms?.length || 1}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                onChange={(e) => {
                                    const targetCount = Math.max(1, parseInt(e.target.value) || 1);
                                    const currentCount = form.rooms?.length || 1;
                                    if (targetCount > currentCount && addRoom) {
                                        for (let i = 0; i < targetCount - currentCount; i++) addRoom();
                                    } else if (targetCount < currentCount && removeRoom) {
                                        for (let i = 0; i < currentCount - targetCount; i++) removeRoom(currentCount - 1 - i);
                                    }
                                }}
                            />
                        </div>

                        {/* Reservation Type */}
                        <div className={pmsStyles.timelineGroup}>
                            <label className={pmsStyles.fieldLabel}>Reservation Type</label>
                            <select 
                                className={`${pmsStyles.fieldSelect} ${pmsStyles.reservationTypeSelect}`}
                                value={form.bookingType || "Confirmed"}
                                onChange={(e) => updateForm("bookingType", e.target.value)}
                            >
                                {BOOKING_TYPES.map((bt) => (
                                    <option key={bt} value={bt}>{bt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Booking Source */}
                    <div className={pmsStyles.sourceRow}>
                        <div className={pmsStyles.timelineGroup} style={{ flex: 1, minWidth: "260px" }}>
                            <label className={pmsStyles.fieldLabel}>Booking Source</label>
                            <select 
                                className={`${pmsStyles.fieldSelect} ${pmsStyles.sourceSelect}`}
                                style={{ width: "100%", minWidth: "220px" }}
                                value={form.channel || "Direct / Walk-in"}
                                onChange={(e) => {
                                    const selectedVal = e.target.value;
                                    updateForm("channel", selectedVal);
                                    
                                    // Also auto-sync businessSource according to category if available
                                    const matched = (availableChannels || []).find(c => c.name === selectedVal);
                                    if (matched) {
                                        if (matched.category === "Direct") updateForm("businessSource", "Direct / Walk-in");
                                        else if (matched.category === "OTA") updateForm("businessSource", "OTA / Online Channel");
                                        else if (matched.category === "Corporate") updateForm("businessSource", "Corporate / Perusahaan");
                                        else if (matched.category === "Wholesaler") updateForm("businessSource", "Wholesaler");
                                        else if (matched.category === "Government") updateForm("businessSource", "Government / Dinas");
                                        else if (matched.category === "Travel Agent") updateForm("businessSource", "Travel Agent / FIT");
                                    }
                                }}
                            >
                                {availableChannels && availableChannels.length > 0 ? (
                                    <>
                                        {/* Direct group */}
                                        {availableChannels.some(c => c.category === "Direct") && (
                                            <optgroup label="Direct / Langsung">
                                                {availableChannels.filter(c => c.category === "Direct").map((c, idx) => (
                                                    <option key={`direct-${c.name}-${idx}`} value={c.name}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {/* OTA group */}
                                        {availableChannels.some(c => c.category === "OTA") && (
                                            <optgroup label="Saluran OTA (Connected)">
                                                {availableChannels.filter(c => c.category === "OTA").map((c, idx) => (
                                                    <option key={`ota-${c.code || c.name}-${idx}`} value={c.name}>{c.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {/* Travel Agent & Partners */}
                                        {availableChannels.some(c => !["Direct", "OTA"].includes(c.category)) && (
                                            <optgroup label="Travel Agent & Mitra Khusus">
                                                {availableChannels.filter(c => !["Direct", "OTA"].includes(c.category)).map((c, idx) => (
                                                    <option key={`agent-${c.code || c.name}-${idx}`} value={c.name}>
                                                        {c.name} ({c.category})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </>
                                ) : (
                                    CHANNELS.map((ch) => (
                                        <option key={ch.name} value={ch.name}>{ch.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Rate Offered & Checkboxes */}
                    <div className={pmsStyles.checkboxesBar}>
                        <span className={pmsStyles.rateOfferedLabel}>Rate Offered:</span>
                        <label className={pmsStyles.checkboxLabel}>
                            <input 
                                type="checkbox"
                                checked={!!form.isContract}
                                onChange={(e) => updateForm("isContract", e.target.checked)}
                            />
                            <span>Contract</span>
                        </label>
                        <label className={pmsStyles.checkboxLabel}>
                            <input 
                                type="checkbox"
                                checked={!!form.bookAllAvailable}
                                onChange={(e) => updateForm("bookAllAvailable", e.target.checked)}
                            />
                            <span>Book All Available Rooms</span>
                        </label>
                        <label className={pmsStyles.checkboxLabel}>
                            <input 
                                type="checkbox"
                                checked={!!form.isCompliment}
                                onChange={(e) => updateForm("isCompliment", e.target.checked)}
                            />
                            <span>Complimentary Room</span>
                        </label>
                    </div>

                    {form.isCompliment && (
                        <div style={{ marginBottom: 12 }}>
                            <TerminalInput 
                                label="Complimentary Reason (Required)"
                                value={form.complimentReason}
                                onChange={(val: string) => updateForm("complimentReason", val)}
                                placeholder="EXAMPLE: VIP GUEST / OWNER / SERVICE RECOVERY"
                                icon={AlertCircle}
                            />
                        </div>
                    )}

                    {/* Room Allocation Table */}
                    <div className={pmsStyles.tableWrapper}>
                        <table className={pmsStyles.pmsTable}>
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '150px' }}>Room Type</th>
                                    <th style={{ width: '85px', minWidth: '82px' }}>Room No.</th>
                                    <th style={{ minWidth: '190px' }}>Rate Type</th>
                                    <th style={{ width: '56px', minWidth: '52px', textAlign: 'center' }}>Adult</th>
                                    <th style={{ width: '56px', minWidth: '52px', textAlign: 'center' }}>Child</th>
                                    <th style={{ width: '115px', minWidth: '105px' }}>Rate (Rp)</th>
                                    <th style={{ width: '28px', textAlign: 'center' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.rooms?.map((rm: any, idx: number) => {
                                    const availableNumbers = getAvailableRoomNumbers(rm.roomTypeId || "");
                                    const currentRoomTypeId = rm.roomTypeId || form.rooms[0]?.roomTypeId;
                                    const rtObj = roomTypes.find(t => t.id === currentRoomTypeId);
                                    const filteredRatePlans = ratePlans.filter((rp: any) => {
                                        if (!currentRoomTypeId) return true;
                                        if (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.length > 0) {
                                            return rp.roomTypeIds.includes(currentRoomTypeId);
                                        }
                                        if (!rp.roomTypeId) return true;
                                        if (rp.roomTypeId === currentRoomTypeId) return true;
                                        if (rtObj?.name && rp.name && (
                                            rp.name.toLowerCase().includes(rtObj.name.toLowerCase()) ||
                                            rtObj.name.toLowerCase().includes(rp.name.toLowerCase())
                                        )) return true;
                                        return false;
                                    });

                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <select
                                                    className={`${pmsStyles.fieldSelect} ${pmsStyles.tableSelect}`}
                                                    value={rm.roomTypeId || ""}
                                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                                    onChange={(e) => {
                                                        updateRoom(idx, "roomTypeId", e.target.value);
                                                        updateRoom(idx, "roomNumber", "");
                                                    }}
                                                >
                                                    <option value="">-Select-</option>
                                                    {roomTypes.map((rt) => (
                                                        <option key={rt.id} value={rt.id}>
                                                            {rt.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    className={`${pmsStyles.fieldSelect} ${pmsStyles.tableSelectSm}`}
                                                    value={rm.roomNumber || ""}
                                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                                    onChange={(e) => updateRoom(idx, "roomNumber", e.target.value)}
                                                >
                                                    <option value="">-Select-</option>
                                                    {availableNumbers.map((num: string) => (
                                                        <option key={num} value={num}>
                                                            {num}
                                                        </option>
                                                    ))}
                                                    {rm.roomNumber && !availableNumbers.includes(rm.roomNumber) && (
                                                        <option value={rm.roomNumber}>{rm.roomNumber}</option>
                                                    )}
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    className={`${pmsStyles.fieldSelect} ${pmsStyles.tableSelect}`}
                                                    value={rm.ratePlanId || rm.rateCode || ""}
                                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateRoom(idx, "ratePlanId", val);
                                                        const matched = ratePlans.find((p) => p.id === val || p.code === val);
                                                        if (matched) {
                                                            updateRoom(idx, "rateCode", matched.code || matched.name);
                                                            const applicableRate = (matched.roomRates && matched.roomRates[rm.roomTypeId])
                                                                ? Number(matched.roomRates[rm.roomTypeId])
                                                                : Number(matched.baseRate || 0);
                                                            if (applicableRate) {
                                                                updateRoom(idx, "price", applicableRate.toString());
                                                                if (idx === 0) updateNightRate(0, applicableRate);
                                                            }
                                                            if (matched.breakfastRate !== undefined) {
                                                                updateRoom(idx, "breakfastRate", matched.breakfastRate);
                                                            }
                                                            if (matched.mealsIncluded !== undefined) {
                                                                updateRoom(idx, "mealsIncluded", matched.mealsIncluded);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <option value="">-Select-</option>
                                                    {filteredRatePlans.map((rp: any) => (
                                                        <option key={rp.id || rp.code} value={rp.id || rp.code}>
                                                            {rp.name || rp.code} {rp.mealsIncluded ? `(Inc. Bft Rp ${(rp.breakfastRate || 75000).toLocaleString('id-ID')})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <select
                                                    className={`${pmsStyles.fieldSelect} ${pmsStyles.tableSelectMini}`}
                                                    value={rm.adults || 1}
                                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                                    onChange={(e) => updateRoom(idx, "adults", Number(e.target.value) || 1)}
                                                >
                                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <select
                                                    className={`${pmsStyles.fieldSelect} ${pmsStyles.tableSelectMini}`}
                                                    value={rm.children || 0}
                                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                                    onChange={(e) => updateRoom(idx, "children", Number(e.target.value) || 0)}
                                                >
                                                    {[0, 1, 2, 3, 4].map((n) => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className={`${pmsStyles.fieldInput} ${pmsStyles.tableRateInput}`}
                                                    placeholder="0.00"
                                                    value={rm.price ?? ""}
                                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateRoom(idx, "price", val);
                                                        if (idx === 0) updateNightRate(0, val);
                                                    }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {form.rooms.length > 1 && removeRoom && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRoom(idx)}
                                                        className={pmsStyles.btnDeleteRow}
                                                        title="Delete room"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Actions Below */}
                    <div className={pmsStyles.tableActionsBar} style={{ position: 'relative' }}>
                        {addRoom && (
                            <button type="button" onClick={addRoom} className={pmsStyles.btnAddRoom}>
                                Add Room
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={() => setShowGroupMenu(prev => !prev)}
                            className={pmsStyles.btnGroupOptions}
                            style={form.bookAllAvailable || (form.rooms && form.rooms.length > 1) ? { borderColor: '#1f2937', color: '#1f2937', fontWeight: 600 } : {}}
                            title="Group Options"
                        >
                            <span>Group Options</span>
                            <ChevronDown size={12} />
                        </button>

                        {showGroupMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '34px',
                                left: addRoom ? '88px' : '0px',
                                background: 'var(--pms-card-bg)',
                                border: '1px solid var(--pms-border)',
                                borderRadius: '4px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 50,
                                minWidth: '230px',
                                padding: '4px 0',
                                fontSize: '12px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (form.rooms && form.rooms[0]?.price) {
                                            const p = form.rooms[0].price;
                                            form.rooms.forEach((_: any, i: number) => {
                                                if (i > 0) updateRoom(i, "price", p);
                                            });
                                        }
                                        setShowGroupMenu(false);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pms-text-primary)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pms-surface)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <span>💰 Set Same Rate For All Rooms</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.rooms.forEach((_: any, i: number) => updateRoom(i, "adults", 2));
                                        setShowGroupMenu(false);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pms-text-primary)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pms-surface)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <span>👥 Set 2 Adults For All Rooms</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.rooms.forEach((rm: any, i: number) => {
                                            const rt = roomTypes.find((r: any) => r.id === rm.roomTypeId);
                                            if (rt) updateRoom(i, "price", (rt.basePrice || rt.price || 0).toString());
                                        });
                                        setShowGroupMenu(false);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--pms-text-primary)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pms-surface)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <span>🔄 Reset To Standard Rates</span>
                                </button>
                                {form.rooms && form.rooms.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateForm("bookAllAvailable", false);
                                            setShowGroupMenu(false);
                                        }}
                                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', borderTop: '1px solid var(--pms-border-light)', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pms-surface)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <span>✕ Revert to Single Room</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* GUEST INFORMATION Section */}
                    <div className={pmsStyles.sectionTitle}>GUEST INFORMATION</div>

                    <div className={pmsStyles.guestGrid}>
                        {/* Guest Name compound input */}
                        <div>
                            <label className={pmsStyles.fieldLabel}>Guest Name</label>
                            <div className={pmsStyles.guestNameCompound}>
                                <select 
                                    className={pmsStyles.salutationSelect}
                                    value={form.salutation || "Mr."}
                                    onChange={(e) => updateForm("salutation", e.target.value)}
                                >
                                    <option value="Mr.">Mr.</option>
                                    <option value="Mrs.">Mrs.</option>
                                    <option value="Ms.">Ms.</option>
                                </select>
                                <input 
                                    type="text" 
                                    className={pmsStyles.guestNameInput}
                                    value={form.guestName}
                                    onChange={(e) => updateForm("guestName", e.target.value)}
                                    placeholder="Full Name"
                                    required
                                />
                                <div className={pmsStyles.guestUserIcon}>
                                    <User size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className={pmsStyles.fieldLabel}>Mobile</label>
                            <input 
                                type="text" 
                                className={pmsStyles.fieldInput}
                                value={form.phone}
                                onChange={(e) => updateForm("phone", e.target.value)}
                                placeholder="Mobile"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className={pmsStyles.fieldLabel}>Email</label>
                            <input 
                                type="email" 
                                className={pmsStyles.fieldInput}
                                value={form.email}
                                onChange={(e) => updateForm("email", e.target.value)}
                                placeholder="Email"
                            />
                        </div>
                    </div>

                    {/* Address Fields */}
                    <div className={pmsStyles.guestAddressGrid}>
                        <div>
                            <label className={pmsStyles.fieldLabel}>Address</label>
                            <input 
                                type="text" 
                                className={pmsStyles.fieldInput}
                                value={form.address}
                                onChange={(e) => updateForm("address", e.target.value)}
                                placeholder="Address"
                            />
                        </div>
                        <div>
                            <label className={pmsStyles.fieldLabel}>Zip</label>
                            <input 
                                type="text" 
                                className={pmsStyles.fieldInput}
                                value={form.zipCode || ""}
                                onChange={(e) => updateForm("zipCode", e.target.value)}
                                placeholder="Zip Code"
                            />
                        </div>
                        <div>
                            <label className={pmsStyles.fieldLabel}>Country</label>
                            <input 
                                type="text" 
                                className={pmsStyles.fieldInput}
                                value={form.country || "Indonesia"}
                                onChange={(e) => updateForm("country", e.target.value)}
                                placeholder="Country"
                            />
                        </div>
                        <div>
                            <label className={pmsStyles.fieldLabel}>City / State</label>
                            <input 
                                type="text" 
                                className={pmsStyles.fieldInput}
                                value={form.city || ""}
                                onChange={(e) => updateForm("city", e.target.value)}
                                placeholder="City / State"
                            />
                        </div>
                    </div>

                    {/* ADDITIONAL INFORMATION */}
                    <div className={pmsStyles.sectionTitle}>ADDITIONAL INFORMATION</div>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                        <label className={pmsStyles.checkboxLabel}>
                            <input 
                                type="checkbox"
                                checked={!!form.sendEmailVoucher}
                                onChange={(e) => updateForm("sendEmailVoucher", e.target.checked)}
                            />
                            <span>Email booking voucher</span>
                        </label>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label className={pmsStyles.fieldLabel}>Special Request / Remarks (Optional)</label>
                        <input 
                            type="text" 
                            className={pmsStyles.fieldInput}
                            value={form.note || ""}
                            onChange={(e) => updateForm("note", e.target.value)}
                            placeholder="e.g.: Early check-in requested, high floor, non-smoking"
                        />
                    </div>

                    {/* Bottom Actions */}
                    <div className={pmsStyles.formBottomActions}>
                        <button 
                            type="button" 
                            onClick={handleCancel || onCancel} 
                            className={pmsStyles.btnCancel}
                        >
                            Batal
                        </button>
                        {onSubmit && (
                            <button 
                                type="button" 
                                onClick={onSubmit} 
                                className={pmsStyles.btnQueueSecondary}
                                title="Tambahkan transaksi ke antrean tanpa langsung menyimpan"
                            >
                                <Plus size={14} />
                                <span>+ Antrean (Queue)</span>
                            </button>
                        )}
                        <button 
                            type="button" 
                            onClick={onCommit || onSubmit} 
                            disabled={saving}
                            className={pmsStyles.btnBookNowPrimary}
                        >
                            {saving ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>{isEditMode ? "Simpan Perubahan" : "Simpan Booking (Book Now)"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {modalData && (
                    <Modal onClose={() => setModalData(null)}>
                        <pre>{JSON.stringify(modalData.data, null, 2)}</pre>
                    </Modal>
                )}
            </div>
        );
    }

    // OTHER INCOME ENTRY FORM
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft} onClick={() => setModalData({ type: 'transactionEntry', data: { revenueType, form } })} style={{ cursor: 'pointer' }}>
                    <div className={`${styles.dotAccent} ${styles.dotTerracotta}`} />
                    <span className={styles.cardTitle}>
                        {isEditMode ? "Edit Transaksi - Other Income" : "Entri Transaksi - Other Income"}
                    </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className={styles.cardHeaderBtn}>
                    Ubah Kategori
                </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <SectionTitle number="01" label="Kategori & Keterangan Pendapatan Lain" />
                    
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.inputLabel}>Kategori Transaksi</label>
                            <OtherIncomeTypeSelect 
                                value={form.incomeType}
                                options={["Other"]}
                                onChange={(val: string) => updateForm("incomeType", val)}
                            />
                        </div>
                        <TerminalInput 
                            label="Keterangan (Description)"
                            value={form.guestName}
                            onChange={(val: string) => updateForm("guestName", val)}
                            placeholder="CONTOH: SEWA SEPEDA MOTOR / EXTRA BED"
                            icon={User}
                        />
                        <TerminalInput 
                            label="Nama Staff (Staff Name)"
                            value={form.staffName}
                            onChange={(val: string) => updateForm("staffName", val)}
                            placeholder="CONTOH: ADI / SARI"
                            icon={User}
                        />
                    </div>

                    <SectionTitle number="02" label="Tanggal & Pembayaran (Sesuai DSR)" />
                    <div className={styles.formGrid} style={{ rowGap: '12px' }}>
                        <div className={styles.colSpan2} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--f-surface)', border: '1px solid var(--f-hairline)', borderRadius: '8px' }}>
                            <input 
                                type="checkbox" 
                                id="isComplimentOther"
                                checked={!!form.isCompliment}
                                onChange={(e) => updateForm("isCompliment", e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--f-sage)' }}
                            />
                            <label htmlFor="isComplimentOther" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--f-foreground)', cursor: 'pointer' }}>
                                Tandai sebagai Compliment (Kompensasi / Gratis)
                            </label>
                        </div>

                        {form.isCompliment && (
                            <div className={styles.colSpan2}>
                                <TerminalInput 
                                    label="Alasan Compliment (Wajib)"
                                    value={form.complimentReason}
                                    onChange={(val: string) => updateForm("complimentReason", val)}
                                    placeholder="CONTOH: KELUARGA OWNER / KOMPENSASI"
                                    icon={AlertCircle}
                                />
                            </div>
                        )}

                        <DateCard 
                            label="Tanggal Transaksi"
                            value={form.checkIn}
                            onChange={(val: string) => updateForm("checkIn", val)}
                            type="check-in"
                        />
                        <TerminalInput 
                            label="Total Harga (Total Amount)"
                            value={form.totalAmount}
                            onChange={(val: string) => {
                                const num = Number(val) || 0;
                                updateForm("totalAmount", num);
                                if (form.paidCash === "" && form.paidEdc === "" && form.paidQris === "" && form.paidTransfer === "") {
                                    updateForm("paidCash", num);
                                    updateForm("payHotel", num);
                                }
                            }}
                            placeholder="0"
                            type="number"
                            isAmount={true}
                        />

                        {!form.isCompliment && (
                            <>
                                <TerminalInput 
                                    label="💵 Cash Tunai"
                                    value={form.paidCash}
                                    onChange={(val: string) => updateForm("paidCash", Number(val) || 0)}
                                    placeholder="0"
                                    type="number"
                                    isAmount={true}
                                />
                                <TerminalInput 
                                    label="💳 EDC BCA / Mandiri"
                                    value={form.paidEdc}
                                    onChange={(val: string) => updateForm("paidEdc", Number(val) || 0)}
                                    placeholder="0"
                                    type="number"
                                    isAmount={true}
                                />
                                <TerminalInput 
                                    label="📱 QRIS Payment"
                                    value={form.paidQris}
                                    onChange={(val: string) => updateForm("paidQris", Number(val) || 0)}
                                    placeholder="0"
                                    type="number"
                                    isAmount={true}
                                />
                                <TerminalInput 
                                    label="🏦 Bank Transfer"
                                    value={form.paidTransfer}
                                    onChange={(val: string) => updateForm("paidTransfer", Number(val) || 0)}
                                    placeholder="0"
                                    type="number"
                                    isAmount={true}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* General Notes */}
                <div style={{ paddingTop: '8px' }}>
                    <TerminalInput 
                        label="Catatan Tambahan (Optional Notes)"
                        value={form.note}
                        onChange={(val: string) => updateForm("note", val)}
                        placeholder="CONTOH: KETERANGAN TAMBAHAN TRANSAKSI"
                    />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--f-hairline)' }}>
                    <button type="button" onClick={onCancel} className={styles.btnSecondary}>
                        Batal
                    </button>
                    <button type="submit" className={styles.btnPrimary}>
                        <Plus size={15} />
                        Tambah Ke Draft Review
                    </button>
                </div>
            </form>

            {modalData && (
                <Modal onClose={() => setModalData(null)}>
                    <pre>{JSON.stringify(modalData.data, null, 2)}</pre>
                </Modal>
            )}
        </div>
    );
}

interface ReviewSidebarProps {
    revenueType: 'room' | 'other';
    form: any;
    roomTypes: any[];
    totalGross: number;
    queue: any[];
    saving: boolean;
    updateForm?: (field: string, value: any) => void;
    onCommit: () => void;
    onSubmit?: () => void;
    onCancel?: () => void;
    isEditMode?: boolean;
}

export function ReviewSidebar({
    revenueType,
    form,
    roomTypes,
    totalGross,
    queue,
    saving,
    updateForm,
    onCommit,
    onSubmit,
    onCancel,
    isEditMode = false
}: ReviewSidebarProps) {
    const startD = form.checkIn ? new Date(form.checkIn) : null;
    const endD = form.checkOut ? new Date(form.checkOut) : null;
    const nights = (startD && endD && endD > startD) ? Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) : 1;

    // Calculate current recorded payment and remaining Due Amount
    const currentPaid = (Number(form.paidCash) || 0) + 
                        (Number(form.paidEdc) || 0) + 
                        (Number(form.paidQris) || 0) + 
                        (Number(form.paidTransfer) || 0) + 
                        (Number(form.paidOta) || 0) + 
                        (form.paidCash === "" && form.paidEdc === "" && form.paidQris === "" && form.paidTransfer === "" && form.paidOta === "" 
                            ? (Number(form.payHotel) || 0) + (Number(form.payTransfer) || 0) 
                            : 0);

    const dueAmount = form.isCompliment ? 0 : Math.max(0, totalGross - currentPaid);

    const handleAddPayment = () => {
        if (!updateForm) return;

        if (totalGross <= 0) {
            toast.warning("Silakan tentukan tipe kamar dan tarif terlebih dahulu.");
            return;
        }

        if (dueAmount <= 0) {
            toast.info("Tagihan sudah lunas (Due Amount: Rp 0).");
            return;
        }

        const isOTAChannel = form.channel && !["Walk-in", "Direct"].includes(form.channel);

        if (currentPaid === 0) {
            if (isOTAChannel) {
                updateForm("paidOta", dueAmount);
                updateForm("paidCash", 0);
                updateForm("paidEdc", 0);
                updateForm("paidQris", 0);
                updateForm("paidTransfer", 0);
                updateForm("payHotel", 0);
                updateForm("payTransfer", dueAmount);
                toast.success(`Pembayaran OTA Virtual Rp ${formatCurrency(dueAmount)} (Due Amount) berhasil dicatat.`);
            } else {
                updateForm("paidCash", dueAmount);
                updateForm("paidEdc", 0);
                updateForm("paidQris", 0);
                updateForm("paidTransfer", 0);
                updateForm("paidOta", 0);
                updateForm("payHotel", dueAmount);
                updateForm("payTransfer", 0);
                toast.success(`Pembayaran Cash FO Rp ${formatCurrency(dueAmount)} (Due Amount) berhasil dicatat.`);
            }
        } else {
            if (Number(form.paidEdc) > 0) {
                const nextVal = Number(form.paidEdc) + dueAmount;
                updateForm("paidEdc", nextVal);
                updateForm("payHotel", (Number(form.payHotel) || 0) + dueAmount);
                toast.success(`Sisa Due Amount Rp ${formatCurrency(dueAmount)} ditambahkan ke EDC.`);
            } else if (Number(form.paidTransfer) > 0) {
                const nextVal = Number(form.paidTransfer) + dueAmount;
                updateForm("paidTransfer", nextVal);
                updateForm("payHotel", (Number(form.payHotel) || 0) + dueAmount);
                updateForm("payTransfer", (Number(form.payTransfer) || 0) + dueAmount);
                toast.success(`Sisa Due Amount Rp ${formatCurrency(dueAmount)} ditambahkan ke Bank Transfer.`);
            } else if (Number(form.paidOta) > 0) {
                const nextVal = Number(form.paidOta) + dueAmount;
                updateForm("paidOta", nextVal);
                updateForm("payTransfer", (Number(form.payTransfer) || 0) + dueAmount);
                toast.success(`Sisa Due Amount Rp ${formatCurrency(dueAmount)} ditambahkan ke OTA Virtual.`);
            } else {
                const nextVal = (Number(form.paidCash) || 0) + dueAmount;
                updateForm("paidCash", nextVal);
                updateForm("payHotel", (Number(form.payHotel) || 0) + dueAmount);
                toast.success(`Sisa Due Amount Rp ${formatCurrency(dueAmount)} ditambahkan ke Cash FO.`);
            }
        }
    };

    const formatDateStandard = (dateStr: string) => {
        if (!dateStr) return "-";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    return (
        <aside className={pmsStyles.rightColumn}>
            <div className={pmsStyles.billingCard}>
                {/* Header */}
                <div className={pmsStyles.billingHeader}>
                    <h2 className={pmsStyles.billingTitle}>
                        {isEditMode ? "Billing Summary (Edit)" : "Billing Summary"}
                    </h2>
                    <span className={pmsStyles.badgeConfirm}>
                        {form.bookingType || "Confirmed"}
                    </span>
                </div>

                {/* Stay Summary Row */}
                <div className={pmsStyles.staySummaryRow}>
                    <div className={pmsStyles.staySummaryCol}>
                        <span className={pmsStyles.staySummaryLabel}>Check-in</span>
                        <span className={pmsStyles.staySummaryDate}>{formatDateStandard(form.checkIn)}</span>
                    </div>
                    <span className={pmsStyles.staySummaryArrow}>⟶</span>
                    <div className={pmsStyles.staySummaryCol} style={{ alignItems: 'flex-end' }}>
                        <span className={pmsStyles.staySummaryLabel}>Check-out</span>
                        <span className={pmsStyles.staySummaryDate}>{formatDateStandard(form.checkOut)}</span>
                    </div>
                </div>

                {/* Financial Breakdown */}
                <div className={pmsStyles.breakdownList}>
                    <div className={pmsStyles.breakdownItem}>
                        <span>Room Charges</span>
                        <span style={{ fontWeight: 600, color: 'var(--pms-text-primary)' }}>
                            Rp {form.isCompliment ? "0.00" : (totalGross === 0 ? "0.00" : formatCurrency(totalGross))}
                        </span>
                    </div>
                    <div className={pmsStyles.breakdownItem}>
                        <span>Taxes</span>
                        <span style={{ color: 'var(--pms-text-muted)' }}>0.00</span>
                    </div>
                    {currentPaid > 0 && (
                        <div className={pmsStyles.breakdownItem} style={{ color: '#059669', fontWeight: 600 }}>
                            <span>Paid Amount</span>
                            <span>- Rp {formatCurrency(currentPaid)}</span>
                        </div>
                    )}
                    <div className={pmsStyles.breakdownTotal}>
                        <span>Due Amount</span>
                        <span style={{ color: dueAmount > 0 ? 'var(--pms-accent, #b45309)' : '#059669', fontWeight: 700 }}>
                            Rp {form.isCompliment ? "0.00" : formatCurrency(dueAmount)}
                        </span>
                    </div>
                </div>

                {/* Bill To */}
                <div className={pmsStyles.billToRow}>
                    <label className={pmsStyles.billToLabel}>Bill To</label>
                    <select
                        className={`${pmsStyles.fieldSelect} ${pmsStyles.billToSelect}`}
                        value={form.paymentRecipient || "-Select-"}
                        onChange={(e) => updateForm && updateForm("paymentRecipient", e.target.value)}
                    >
                        <option value="-Select-">-Select-</option>
                        <option value="Hotel / Front Desk">Hotel / Front Desk</option>
                        <option value="OTA / City Ledger">OTA / City Ledger</option>
                        <option value="Company / BTC">Company / BTC</option>
                    </select>
                </div>

                {/* Section: Payment Mode */}
                {!form.isCompliment && (
                    <div style={{ marginBottom: 14 }}>
                        <div className={pmsStyles.paymentModeRow}>
                            <label className={pmsStyles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={form.paymentModeEnabled !== false}
                                    onChange={(e) => updateForm && updateForm("paymentModeEnabled", e.target.checked)}
                                />
                                <span style={{ fontWeight: 600 }}>Payment Mode (Opsional)</span>
                            </label>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '10.5px', color: 'var(--pms-text-muted)', lineHeight: 1.35 }}>
                            Pencatatan pembayaran bersifat opsional. Jika tidak diisi, pemesanan tetap diproses dengan status <b>Belum Bayar</b> dan langsung mengurangi ketersediaan inventori kamar.
                        </p>

                        {form.paymentModeEnabled !== false && (
                            <div className={pmsStyles.paymentSection}>
                                {/* Quick 1-Click Settlement Shortcuts */}
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pms-text-secondary)', marginBottom: 6 }}>
                                    ⚡ QUICK SETTLEMENT:
                                </div>
                                <div className={pmsStyles.shortcutGrid}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!updateForm) return;
                                            updateForm("paidCash", totalGross);
                                            updateForm("paidEdc", 0);
                                            updateForm("paidQris", 0);
                                            updateForm("paidTransfer", 0);
                                            updateForm("paidOta", 0);
                                            updateForm("payHotel", totalGross);
                                            updateForm("payTransfer", 0);
                                        }}
                                        className={`${pmsStyles.shortcutBtn} ${Number(form.paidCash || 0) === totalGross && totalGross > 0 ? pmsStyles.shortcutBtnActive : ''}`}
                                    >
                                        💵 CASH
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!updateForm) return;
                                            updateForm("paidCash", 0);
                                            updateForm("paidEdc", totalGross);
                                            updateForm("paidQris", 0);
                                            updateForm("paidTransfer", 0);
                                            updateForm("paidOta", 0);
                                            updateForm("payHotel", totalGross);
                                            updateForm("payTransfer", 0);
                                        }}
                                        className={`${pmsStyles.shortcutBtn} ${Number(form.paidEdc || 0) === totalGross && totalGross > 0 ? pmsStyles.shortcutBtnActive : ''}`}
                                    >
                                        💳 EDC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!updateForm) return;
                                            updateForm("paidCash", 0);
                                            updateForm("paidEdc", 0);
                                            updateForm("paidQris", totalGross);
                                            updateForm("paidTransfer", 0);
                                            updateForm("paidOta", 0);
                                            updateForm("payHotel", totalGross);
                                            updateForm("payTransfer", 0);
                                        }}
                                        className={`${pmsStyles.shortcutBtn} ${Number(form.paidQris || 0) === totalGross && totalGross > 0 ? pmsStyles.shortcutBtnActive : ''}`}
                                    >
                                        📱 QRIS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!updateForm) return;
                                            updateForm("paidCash", 0);
                                            updateForm("paidEdc", 0);
                                            updateForm("paidQris", 0);
                                            updateForm("paidTransfer", totalGross);
                                            updateForm("paidOta", 0);
                                            updateForm("payHotel", totalGross);
                                            updateForm("payTransfer", totalGross);
                                        }}
                                        className={`${pmsStyles.shortcutBtn} ${Number(form.paidTransfer || 0) === totalGross && totalGross > 0 ? pmsStyles.shortcutBtnActive : ''}`}
                                    >
                                        🏦 TRANSFER
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!updateForm) return;
                                            updateForm("paidCash", 0);
                                            updateForm("paidEdc", 0);
                                            updateForm("paidQris", 0);
                                            updateForm("paidTransfer", 0);
                                            updateForm("paidOta", totalGross);
                                            updateForm("payHotel", 0);
                                            updateForm("payTransfer", totalGross);
                                        }}
                                        className={`${pmsStyles.shortcutBtn} ${Number(form.paidOta || 0) === totalGross && totalGross > 0 ? pmsStyles.shortcutBtnActive : ''}`}
                                    >
                                        🌐 OTA
                                    </button>
                                </div>

                                {/* Granular Settlement Inputs */}
                                <div className={pmsStyles.granularInputs}>
                                    <TerminalInput 
                                        label="💵 Cash FO (Front Desk Cash)"
                                        value={form.paidCash}
                                        onChange={(val: string) => {
                                            if (!updateForm) return;
                                            const num = Number(val) || 0;
                                            updateForm("paidCash", num);
                                            updateForm("payHotel", num + Number(form.paidEdc || 0) + Number(form.paidQris || 0) + Number(form.paidTransfer || 0));
                                        }}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                    <TerminalInput 
                                        label="💳 EDC BCA / Mandiri / Card"
                                        value={form.paidEdc}
                                        onChange={(val: string) => {
                                            if (!updateForm) return;
                                            const num = Number(val) || 0;
                                            updateForm("paidEdc", num);
                                            updateForm("payHotel", Number(form.paidCash || 0) + num + Number(form.paidQris || 0) + Number(form.paidTransfer || 0));
                                        }}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                    <TerminalInput 
                                        label="📱 QRIS Hotel"
                                        value={form.paidQris}
                                        onChange={(val: string) => {
                                            if (!updateForm) return;
                                            const num = Number(val) || 0;
                                            updateForm("paidQris", num);
                                            updateForm("payHotel", Number(form.paidCash || 0) + Number(form.paidEdc || 0) + num + Number(form.paidTransfer || 0));
                                        }}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                    <TerminalInput 
                                        label="🏦 Bank Transfer Rekening Hotel"
                                        value={form.paidTransfer}
                                        onChange={(val: string) => {
                                            if (!updateForm) return;
                                            const num = Number(val) || 0;
                                            updateForm("paidTransfer", num);
                                            updateForm("payHotel", Number(form.paidCash || 0) + Number(form.paidEdc || 0) + Number(form.paidQris || 0) + num);
                                            updateForm("payTransfer", num + Number(form.paidOta || 0));
                                        }}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                    <TerminalInput 
                                        label="🌐 OTA Virtual / City Ledger"
                                        value={form.paidOta}
                                        onChange={(val: string) => {
                                            if (!updateForm) return;
                                            const num = Number(val) || 0;
                                            updateForm("paidOta", num);
                                            updateForm("payTransfer", num + Number(form.paidTransfer || 0));
                                        }}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Payment Action Button (Reads Due Amount & Records Payment, does NOT commit booking) */}
                <button 
                    type="button" 
                    onClick={handleAddPayment} 
                    className={pmsStyles.btnAddPayment}
                >
                    <CreditCard size={15} />
                    <span>Add Payment</span>
                </button>

                {/* Queue Commit Section */}
                {queue.length > 0 && (
                    <div className={pmsStyles.pendingQueueFooter}>
                        <div className={pmsStyles.pendingQueueRow}>
                            <span className={pmsStyles.pendingQueueLabel}>Antrean Transaksi</span>
                            <span className={pmsStyles.pendingQueueCount}>{queue.length} Item Pending</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={onCommit} 
                            disabled={saving}
                            className={`${styles.btnPrimary} ${pmsStyles.btnCommitQueue}`}
                        >
                            <ShieldCheck size={16} />
                            {saving ? "MENYIMPAN..." : `COMMIT SEMUA (${queue.length} TRX)`}
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

interface QueueTableProps {
    queue: any[];
    removeFromQueue: (idx: number) => void;
}

export function QueueTable({ queue, removeFromQueue }: QueueTableProps) {
  const [modalData, setModalData] = useState<{ type: string; data: any } | null>(null);
    return (
        <div className={pmsStyles.queueCard}>
            <div className={pmsStyles.queueHeader}>
                <div className={pmsStyles.queueHeaderLeft}>
                    <div className={pmsStyles.queueIconBox}>
                        <Receipt size={18} />
                    </div>
                    <div>
                        <h3 className={pmsStyles.queueTitle}>Daftar Antrean Reservasi ({queue.length})</h3>
                        <p className={pmsStyles.queueSubtitle}>Audit dan verifikasi sebelum commit transaksi</p>
                    </div>
                </div>
            </div>
            <div className={pmsStyles.tableContainer}>
                <table className={pmsStyles.pmsTable}>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Detail Tamu</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'right' }}>Paid</th>
                            <th style={{ textAlign: 'right' }}>Balance</th>
                            <th style={{ textAlign: 'center', width: '110px' }}>Status</th>
                            <th style={{ textAlign: 'center', width: '80px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queue.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--pms-text-muted)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <AlertCircle size={28} strokeWidth={1.5} />
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Tidak ada transaksi dalam antrean</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            queue.map((item, idx) => {
                                const channelLogo = CHANNELS.find(c => c.name === item.channel)?.logo;
                                const paidCash = item.payHotel || 0;
                                const paidTransfer = item.payTransfer || 0;
                                const totalPaid = paidCash + paidTransfer;
                                const balanceVal = Math.max(0, (item.amount || 0) - totalPaid);

                                return (
                                    <tr key={idx} className={pmsStyles.queueRowHover} onClick={() => setModalData({ type: 'queueItem', data: item })}>
                                        <td style={{ fontFamily: 'var(--pms-font-mono)', fontWeight: 600 }}>{item.effectiveDate || item.checkInDate}</td>
                                        <td>
                                            <div className={styles.detailCellInner}>
                                                <div className={styles.detailCellRow1}>
                                                    {channelLogo && (
                                                        channelLogo === "globe" ? (
                                                            <Globe className="w-4 h-4 opacity-60 mr-1 flex-shrink-0" />
                                                        ) : (
                                                            <img src={channelLogo} className="w-4 h-4 object-contain opacity-60" alt="" />
                                                        )
                                                    )}
                                                    <span className={styles.guestNameText}>{item.guestName || "-"}</span>
                                                </div>
                                                <div className={styles.detailCellRow2}>
                                                    <span>{item.type === 'other_income' ? (item.incomeCategory || 'Other') : (item.roomType || 'Room')} {item.roomNumber || ''}</span>
                                                    <span className={styles.bulletSeparator} />
                                                    <span>Staff: {item.staffName || 'System'}</span>
                                                    {item.type !== 'other_income' && (
                                                        <>
                                                            <span className={styles.bulletSeparator} />
                                                            <span className={styles.channelTagText}>{item.channel}</span>
                                                        </>
                                                    )}
                                                    {item.isCompliment && (
                                                        <>
                                                            <span className={styles.bulletSeparator} />
                                                            <span className={styles.channelTagText} style={{ backgroundColor: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' }}>COMPLIMENT</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'var(--pms-font-mono)', fontWeight: '700' }}>
                                            Rp {item.isCompliment ? 0 : formatCurrency(item.amount)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                                                    Rp {item.isCompliment ? 0 : formatCurrency(totalPaid)}
                                                </span>
                                                {!item.isCompliment && (paidCash > 0 || paidTransfer > 0) && (
                                                    <span className="text-[9px] text-stone-400 font-medium uppercase tracking-wider">
                                                        {paidCash > 0 && `Cash: Rp ${formatCurrency(paidCash)}`}
                                                        {paidCash > 0 && paidTransfer > 0 && " | "}
                                                        {paidTransfer > 0 && `Trf: Rp ${formatCurrency(paidTransfer)}`}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className={`font-mono font-bold ${balanceVal > 0 && !item.isCompliment ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`}>
                                                Rp {item.isCompliment ? 0 : formatCurrency(balanceVal)}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {(() => {
                                                const status = item.paymentStatus || (item.isCompliment ? "Lunas" : (balanceVal === 0 ? "Lunas" : (totalPaid > 0 ? "DP / Partial" : "Belum Bayar")));
                                                
                                                if (item.isCompliment) {
                                                    return (
                                                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
                                                            COMP
                                                        </span>
                                                    );
                                                }
                                                if (status === "Lunas" || status === "PAID") {
                                                    return (
                                                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                                                            LUNAS
                                                        </span>
                                                    );
                                                }
                                                if (status === "DP / Partial" || status === "PARTIAL") {
                                                    return (
                                                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                                                            DP
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30">
                                                        BELUM BAYAR
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                            <button onClick={() => removeFromQueue(idx)} className={styles.tableActionBtn}>
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {queue.length > 0 && (
                        <tfoot style={{ backgroundColor: 'rgba(250, 250, 249, 0.5)' }}>
                            <tr>
                                <td colSpan={7} className={styles.tableCell} style={{ fontSize: '9px', fontWeight: '500', color: 'var(--f-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>
                                    Total Items: {queue.length}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Footer Branding */}
            <div className={styles.footerBranding}>
                <div className={styles.footerBrandingLine} />
                <a 
                    href="https://mytara.id" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.footerLink}
                >
                    <span className={styles.footerTitle}>Institutional Terminal</span>
                    <div className={styles.footerMeta}>
                        <span>Powered by</span>
                        <span className={styles.footerBrandText}>Tara</span>
                    </div>
                </a>
            </div>
        </div>
    );
}
