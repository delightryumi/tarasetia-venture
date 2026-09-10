"use client";

import React, { useState } from "react";
import styles from "../OverviewStyles.module.css";

interface GuestEditFormProps {
    formData: any;
    setFormData: (val: any) => void;
    roomTypes: any[];
    guest: any;
}

const CHANNELS = [
    { name: "Traveloka", logo: "/channels/traveloka.png" },
    { name: "Booking.com", logo: "/channels/booking_com.png" },
    { name: "Tiket.com", logo: "/channels/tiket_com.png" },
    { name: "Agoda", logo: "/channels/agoda.png" },
    { name: "Airbnb", logo: "/channels/airbnb.png" },
    { name: "Trip.com", logo: "/channels/trip.png" },
    { name: "Expedia", logo: "/channels/expedia.png" },
    { name: "MG Bedbank", logo: "/channels/mg.png" },
    { name: "Walk-in", logo: "/channels/walk_in.png" },
    { name: "Booking Engine", logo: "globe" },
];

export function GuestEditForm({ formData, setFormData, roomTypes, guest }: GuestEditFormProps) {
    const [additionalCash, setAdditionalCash] = useState<number | "">("");
    const [additionalTransfer, setAdditionalTransfer] = useState<number | "">("");

    const checkInDate = formData.checkIn ? new Date(formData.checkIn) : null;
    const checkOutDate = formData.checkOut ? new Date(formData.checkOut) : null;
    const calculatedNights = (checkInDate && checkOutDate && checkOutDate > checkInDate)
        ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
        : 1;

    const totalAmount = Number(formData.totalAmount) || 0;
    const payHotel = Number(formData.payHotel) || 0;
    const payTransfer = Number(formData.payTransfer) || 0;
    const totalPaid = payHotel + payTransfer;
    const balance = totalAmount - totalPaid;
    const isLunas = balance <= 0;
    const isOTA = formData.channel && formData.channel !== "Walk-in" && formData.channel !== "Direct";
    const avgRatePerNight = calculatedNights > 0 ? Math.round(totalAmount / calculatedNights) : totalAmount;

    const handleSettleFull = (target: "hotel" | "ota") => {
        if (target === "ota") {
            const newPayTransfer = isOTA ? totalAmount : Math.max(0, totalAmount - payHotel);
            const newPayHotel = isOTA ? 0 : payHotel;
            setFormData({
                ...formData,
                payHotel: newPayHotel,
                payTransfer: newPayTransfer,
                paymentStatus: "Lunas",
                status: formData.status === "CANCELLED" ? "CONFIRMED" : (formData.status || "CONFIRMED")
            });
            if (guest) {
                const origTransfer = Number(guest.payTransfer || guest.paidTransfer || 0);
                setAdditionalTransfer(Math.max(0, newPayTransfer - origTransfer));
                setAdditionalCash("");
            }
        } else {
            const newPayHotel = !isOTA ? totalAmount : Math.max(0, totalAmount - payTransfer);
            const newPayTransfer = !isOTA ? 0 : payTransfer;
            setFormData({
                ...formData,
                payHotel: newPayHotel,
                payTransfer: newPayTransfer,
                paymentStatus: "Lunas",
                status: formData.status === "CANCELLED" ? "CONFIRMED" : (formData.status || "CONFIRMED")
            });
            if (guest) {
                const origCash = Number(guest.payHotel || guest.paidCash || 0);
                setAdditionalCash(Math.max(0, newPayHotel - origCash));
                setAdditionalTransfer("");
            }
        }
    };

    const handlePaymentStatusClick = (statusName: string) => {
        if (statusName === "Lunas") {
            if (isOTA) {
                handleSettleFull("ota");
            } else {
                handleSettleFull("hotel");
            }
        } else if (statusName === "Belum Bayar") {
            setFormData({
                ...formData,
                payHotel: 0,
                payTransfer: 0,
                paymentStatus: "Belum Bayar",
                status: "CONFIRMED"
            });
            setAdditionalCash("");
            setAdditionalTransfer("");
        } else if (statusName === "DP / Partial") {
            setFormData({
                ...formData,
                paymentStatus: "DP / Partial",
                status: "CONFIRMED"
            });
        } else if (statusName === "CANCELLED") {
            setFormData({
                ...formData,
                paymentStatus: "CANCELLED",
                status: "CANCELLED"
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Section 01: Identity */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>01</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Identity & Stay</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="Guest Name (Nama Lengkap)" value={formData.guestName} onChange={(v: string) => setFormData({...formData, guestName: v})} />
                        <NexuraInputLabel label="Booking ID (No Reservasi)" value={formData.bookingId} onChange={(v: string) => setFormData({...formData, bookingId: v})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="Check-in" type="date" value={formData.checkIn} onChange={(v: string) => setFormData({...formData, checkIn: v})} />
                        <NexuraInputLabel label="Check-out" type="date" value={formData.checkOut} onChange={(v: string) => setFormData({...formData, checkOut: v})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="No. Identitas (NIK / Paspor)" value={formData.nik || formData.identityNo || ""} onChange={(v: string) => setFormData({...formData, nik: v, identityNo: v})} />
                        <NexuraInputLabel label="No. Telp / HP" value={formData.phone || ""} onChange={(v: string) => setFormData({...formData, phone: v})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="Warga Negara (Nationality)" value={formData.nationality || "INDONESIA"} onChange={(v: string) => setFormData({...formData, nationality: v})} />
                        <NexuraInputLabel label="Email" type="email" value={formData.email || ""} onChange={(v: string) => setFormData({...formData, email: v})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <NexuraInputLabel label="Perusahaan (Company)" value={formData.company || "-"} onChange={(v: string) => setFormData({...formData, company: v})} />
                        <NexuraInputLabel label="Jumlah Tamu (Pax)" type="number" value={formData.pax || 1} onChange={(v: string) => setFormData({...formData, pax: Number(v)})} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Alamat Lengkap Sesuai KTP (Address)</span>
                        <textarea
                            value={formData.address || ""}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            rows={2}
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--f-surface)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                fontSize: '11px',
                                color: 'var(--f-body)',
                                outline: 'none',
                                border: '1px solid var(--f-hairline)',
                                resize: 'none'
                            }}
                            placeholder="Alamat lengkap tamu..."
                        />
                    </div>
                </div>
            </section>

            {/* Section 02: Assignment */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>02</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Stay Details</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Room Category</label>
                        <select
                            value={formData.roomTypeId}
                            onChange={e => {
                                const selectedId = e.target.value;
                                const selectedRoom = roomTypes.find(r => r.id === selectedId);
                                setFormData({
                                    ...formData, 
                                    roomTypeId: selectedId,
                                    roomType: selectedRoom ? selectedRoom.name : formData.roomType,
                                    roomNumber: "" // Reset room number
                                });
                            }}
                            style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--f-hairline)',
                                backgroundColor: 'var(--f-surface)',
                                fontSize: '11px',
                                color: 'var(--f-body)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value=""></option>
                            {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    {(() => {
                        const selectedRoomTypeObj = roomTypes.find(r => r.id === formData.roomTypeId);
                        const availableRooms = selectedRoomTypeObj?.physicalRooms || [];
                        return availableRooms.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Room Number</label>
                                <select
                                    value={formData.roomNumber}
                                    onChange={e => setFormData({...formData, roomNumber: e.target.value})}
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        padding: '0 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--f-hairline)',
                                        backgroundColor: 'var(--f-surface)',
                                        fontSize: '11px',
                                        color: 'var(--f-body)',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value=""></option>
                                    {availableRooms.map((room: any, idx: number) => {
                                        const roomNum = typeof room === "object" ? (room.number || room.name || "") : String(room);
                                        const roomLabel = typeof room === "object" ? (room.name ? `${room.number} - ${room.name}` : room.number) : String(room);
                                        return (
                                            <option key={idx} value={roomNum}>{roomLabel || roomNum}</option>
                                        );
                                    })}
                                </select>
                            </div>
                        ) : (
                            <NexuraInputLabel label="Room Number" value={formData.roomNumber} onChange={(v: string) => setFormData({...formData, roomNumber: v})} />
                        );
                    })()}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>Channel Source</label>
                        <select
                            value={formData.channel}
                            onChange={e => setFormData({...formData, channel: e.target.value})}
                            style={{
                                width: '100%',
                                height: '40px',
                                padding: '0 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--f-hairline)',
                                backgroundColor: 'var(--f-surface)',
                                fontSize: '11px',
                                color: 'var(--f-body)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {CHANNELS.map(c => <option key={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <NexuraInputLabel label="Staff In-Charge" value={formData.staffName} onChange={(v: string) => setFormData({...formData, staffName: v})} />
                    <NexuraInputLabel label="Rate Code (Kode Harga)" value={formData.rateCode || "-"} onChange={(v: string) => setFormData({...formData, rateCode: v})} />
                    <NexuraInputLabel label="Upgrade Kamar Dari" value={formData.upgradeFrom || ""} onChange={(v: string) => setFormData({...formData, upgradeFrom: v})} />
                    <NexuraInputLabel label="Upgrade Kamar Ke" value={formData.upgradeTo || ""} onChange={(v: string) => setFormData({...formData, upgradeTo: v})} />
                </div>
            </section>

            {/* Section 03: Financials & Settlement */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>03</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Financials & Settlement</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                
                {/* Stay Info Summary Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--f-surface-soft)', borderRadius: '8px', border: '1px solid var(--f-hairline)' }}>
                    <div>
                        <span className={styles.guestSubtext} style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--f-muted)' }}>Total Tagihan ({calculatedNights} Malam)</span>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: 'var(--f-body)' }}>
                            Rp {totalAmount.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--f-muted)' }}>
                            @ Rp {avgRatePerNight.toLocaleString('id-ID')}/mlm
                        </span>
                    </div>
                    <div>
                        <span className={styles.guestSubtext} style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--f-muted)' }}>Total Terbayar</span>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: 'var(--f-sage, #5a734e)' }}>
                            Rp {totalPaid.toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--f-muted)' }}>
                            Hotel: {payHotel.toLocaleString('id-ID')} | OTA: {payTransfer.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div>
                        <span className={styles.guestSubtext} style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--f-muted)' }}>Sisa Tagihan</span>
                        <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', color: isLunas ? '#16a34a' : '#ea580c' }}>
                            Rp {Math.max(0, balance).toLocaleString('id-ID')}
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: isLunas ? '#16a34a' : '#ea580c' }}>
                            {isLunas ? "✓ LUNAS (100%)" : "BELUM LUNAS"}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <NexuraInputLabel 
                        label="Total Gross Amount (Total Tarif Kamar Keseluruhan)" 
                        type="number" 
                        value={formData.totalAmount} 
                        onChange={(v: string) => {
                            const newTotal = Number(v) || 0;
                            const currentPaid = Number(formData.payHotel || 0) + Number(formData.payTransfer || 0);
                            const nextStatus = currentPaid >= newTotal ? "Lunas" : (currentPaid > 0 ? "DP / Partial" : "Belum Bayar");
                            setFormData({
                                ...formData, 
                                totalAmount: newTotal,
                                paymentStatus: nextStatus,
                                status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                            });
                        }} 
                    />
                    
                    {/* Payment Channel Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Hotel Payment */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                    Terbayar di Hotel (Cash/EDC)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleSettleFull("hotel")}
                                    style={{
                                        fontSize: '8px', fontWeight: 700, padding: '2px 6px',
                                        borderRadius: '4px', backgroundColor: 'rgba(120, 128, 105, 0.15)',
                                        color: 'var(--f-sage)', border: '1px solid var(--f-sage)', cursor: 'pointer'
                                    }}
                                    title="Lunaskan sisa pembayaran ke akun Hotel Cash/EDC"
                                >
                                    LUNASKAN HOTEL
                                </button>
                            </div>
                            <input
                                type="number"
                                value={formData.payHotel}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = val + Number(formData.payTransfer || 0);
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        payHotel: val,
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                            />
                        </div>

                        {/* OTA Payment */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                    Terbayar via OTA (Virtual/TF)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleSettleFull("ota")}
                                    style={{
                                        fontSize: '8px', fontWeight: 700, padding: '2px 6px',
                                        borderRadius: '4px', backgroundColor: 'rgba(120, 128, 105, 0.15)',
                                        color: 'var(--f-sage)', border: '1px solid var(--f-sage)', cursor: 'pointer'
                                    }}
                                    title="Lunaskan sisa pembayaran ke akun OTA Virtual Card"
                                >
                                    LUNASKAN OTA
                                </button>
                            </div>
                            <input
                                type="number"
                                value={formData.payTransfer}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = Number(formData.payHotel || 0) + val;
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        payTransfer: val,
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* OTA Hotel Cash Conflict Warning & Auto-Fix */}
                    {isOTA && payHotel > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                            <span style={{ fontSize: '9px', color: '#b91c1c', fontWeight: 600 }}>
                                ⚠️ Terdeteksi Rp {payHotel.toLocaleString('id-ID')} di Hotel Cash pada reservasi {formData.channel}.
                            </span>
                            <button
                                type="button"
                                onClick={() => handleSettleFull("ota")}
                                style={{
                                    padding: '4px 10px', fontSize: '8px', fontWeight: 700, borderRadius: '4px',
                                    backgroundColor: '#b91c1c', color: '#fff', border: 'none', cursor: 'pointer'
                                }}
                            >
                                Pindahkan 100% ke OTA
                            </button>
                        </div>
                    )}

                    {/* Quick Settlement Banner if balance > 0 */}
                    {balance > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'rgba(234, 88, 12, 0.08)', borderRadius: '6px', border: '1px dashed rgba(234, 88, 12, 0.4)' }}>
                            <div style={{ fontSize: '10px', color: '#c2410c', fontWeight: 600 }}>
                                Sisa belum lunas: <strong>Rp {balance.toLocaleString('id-ID')}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleSettleFull(isOTA ? "ota" : "hotel")}
                                    style={{
                                        padding: '4px 10px', fontSize: '9px', fontWeight: 700, borderRadius: '4px',
                                        backgroundColor: '#1A1C14', color: '#fff', border: 'none', cursor: 'pointer'
                                    }}
                                >
                                    ⚡ Lunaskan via {isOTA ? 'OTA' : 'Hotel'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSettleFull(isOTA ? "hotel" : "ota")}
                                    style={{
                                        padding: '4px 10px', fontSize: '9px', fontWeight: 700, borderRadius: '4px',
                                        backgroundColor: 'var(--f-surface)', color: 'var(--f-body)', border: '1px solid var(--f-hairline)', cursor: 'pointer'
                                    }}
                                >
                                    + via {isOTA ? 'Hotel' : 'OTA'}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Payment Status Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        <label className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                            Payment Status (Pilih Status Pembayaran)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {["Lunas", "Belum Bayar", "DP / Partial", "CANCELLED"].map(s => {
                                const isSelected = formData.paymentStatus === s || (s === "Lunas" && isLunas && formData.paymentStatus !== "CANCELLED");
                                return (
                                    <button 
                                        key={s}
                                        type="button"
                                        onClick={() => handlePaymentStatusClick(s)}
                                        style={{
                                            height: '36px',
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: isSelected ? '1px solid var(--f-sage)' : '1px solid var(--f-hairline)',
                                            backgroundColor: isSelected ? '#1A1C14' : 'var(--f-canvas)',
                                            color: isSelected ? '#ffffff' : 'var(--f-muted)',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {s === "Lunas" ? "✓ LUNAS" : s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 04: Remarks */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span className={styles.guestSubtext} style={{ fontWeight: 700, backgroundColor: 'rgba(120, 128, 105, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>04</span>
                    <h3 className={styles.headerTitle} style={{ fontSize: '11px', margin: 0 }}>Remarks</h3>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--f-hairline)' }} />
                </div>
                <textarea
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    rows={3}
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--f-surface)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '11px',
                        color: 'var(--f-body)',
                        outline: 'none',
                        border: '1px solid var(--f-hairline)',
                        resize: 'none',
                        transition: 'all 0.15s'
                    }}
                    placeholder="Enter internal audit notes..."
                />
            </section>
        </div>
    );
}

function NexuraInputLabel({ label, value, onChange, type = "text" }: { label: string, value: any, onChange: any, type?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>{label}</span>
            <input
                type={type} value={value} onChange={e => onChange(e.target.value)}
                onWheel={(e) => e.currentTarget.type === "number" && e.currentTarget.blur()}
                style={{
                    width: '100%',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--f-hairline)',
                    backgroundColor: 'var(--f-surface)',
                    fontSize: '11px',
                    fontFamily: type === 'date' || type === 'number' ? 'var(--f-font-mono)' : 'inherit',
                    color: 'var(--f-body)',
                    outline: 'none',
                    transition: 'all 0.15s'
                }}
            />
        </div>
    );
}
