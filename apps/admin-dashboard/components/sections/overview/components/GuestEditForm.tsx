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
    const checkInDate = formData.checkIn ? new Date(formData.checkIn) : null;
    const checkOutDate = formData.checkOut ? new Date(formData.checkOut) : null;
    const calculatedNights = (checkInDate && checkOutDate && checkOutDate > checkInDate)
        ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
        : 1;

    const totalAmount = Number(formData.totalAmount) || 0;
    const paidCash = Number(formData.paidCash || 0);
    const paidEdc = Number(formData.paidEdc || 0);
    const paidQris = Number(formData.paidQris || 0);
    const paidTransfer = Number(formData.paidTransfer || 0);
    const paidOta = Number(formData.paidOta || 0);

    const hasGranular = (formData.paidCash !== undefined || formData.paidEdc !== undefined || formData.paidQris !== undefined || formData.paidTransfer !== undefined || formData.paidOta !== undefined);
    const legacyPayHotel = !hasGranular ? Number(formData.payHotel || 0) : 0;
    const legacyPayTransfer = !hasGranular ? Number(formData.payTransfer || 0) : 0;

    const totalPaid = paidCash + paidEdc + paidQris + paidTransfer + paidOta + legacyPayHotel + legacyPayTransfer;
    const balance = totalAmount - totalPaid;
    const isLunas = balance <= 0;
    const isOTA = formData.channel && formData.channel !== "Walk-in" && formData.channel !== "Direct";
    const avgRatePerNight = calculatedNights > 0 ? Math.round(totalAmount / calculatedNights) : totalAmount;

    const handleSwitchPaymentMethod = (target: "cash" | "edc" | "qris" | "transfer" | "ota") => {
        const targetAmount = totalAmount > 0 ? totalAmount : 0;
        const newPaidCash = target === "cash" ? targetAmount : 0;
        const newPaidEdc = target === "edc" ? targetAmount : 0;
        const newPaidQris = target === "qris" ? targetAmount : 0;
        const newPaidTransfer = target === "transfer" ? targetAmount : 0;
        const newPaidOta = target === "ota" ? targetAmount : 0;

        const newPayHotel = newPaidCash + newPaidEdc + newPaidQris + newPaidTransfer;
        const newPayTransfer = newPaidOta + newPaidTransfer;

        setFormData({
            ...formData,
            paidCash: newPaidCash,
            paidEdc: newPaidEdc,
            paidQris: newPaidQris,
            paidTransfer: newPaidTransfer,
            paidOta: newPaidOta,
            payHotel: newPayHotel,
            payTransfer: newPayTransfer,
            paymentStatus: targetAmount > 0 ? "Lunas" : (formData.paymentStatus || "Belum Bayar"),
            status: formData.status === "CANCELLED" ? "CONFIRMED" : (formData.status || "CONFIRMED")
        });
    };

    const activeMethod = 
        (paidCash > 0 && paidEdc === 0 && paidQris === 0 && paidTransfer === 0 && paidOta === 0) ? "cash" :
        (paidEdc > 0 && paidCash === 0 && paidQris === 0 && paidTransfer === 0 && paidOta === 0) ? "edc" :
        (paidQris > 0 && paidCash === 0 && paidEdc === 0 && paidTransfer === 0 && paidOta === 0) ? "qris" :
        (paidTransfer > 0 && paidCash === 0 && paidEdc === 0 && paidQris === 0 && paidOta === 0) ? "transfer" :
        (paidOta > 0 && paidCash === 0 && paidEdc === 0 && paidQris === 0 && paidTransfer === 0) ? "ota" : null;

    const handlePaymentStatusClick = (statusName: string) => {
        if (statusName === "Lunas") {
            if (isOTA) {
                handleSwitchPaymentMethod("ota");
            } else {
                handleSwitchPaymentMethod("cash");
            }
        } else if (statusName === "Belum Bayar") {
            setFormData({
                ...formData,
                paidCash: 0,
                paidEdc: 0,
                paidQris: 0,
                paidTransfer: 0,
                paidOta: 0,
                payHotel: 0,
                payTransfer: 0,
                paymentStatus: "Belum Bayar",
                status: "CONFIRMED"
            });
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
                            Cash: {paidCash.toLocaleString('id-ID')} | EDC: {paidEdc.toLocaleString('id-ID')} | QRIS: {paidQris.toLocaleString('id-ID')} | TF: {paidTransfer.toLocaleString('id-ID')} | OTA: {paidOta.toLocaleString('id-ID')}
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
                            const currentPaid = (Number(formData.paidCash || 0) + Number(formData.paidEdc || 0) + Number(formData.paidQris || 0) + Number(formData.paidTransfer || 0) + Number(formData.paidOta || 0)) || (Number(formData.payHotel || 0) + Number(formData.payTransfer || 0));
                            const nextStatus = currentPaid >= newTotal ? "Lunas" : (currentPaid > 0 ? "DP / Partial" : "Belum Bayar");
                            setFormData({
                                ...formData, 
                                totalAmount: newTotal,
                                paymentStatus: nextStatus,
                                status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                            });
                        }} 
                    />

                    {/* Quick 1-Click Payment Method Switcher */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--f-surface-soft, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px solid var(--f-hairline)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--f-muted)' }}>
                                ⚡ GANTI METODE PAYMENT (100% LUNAS):
                            </span>
                            {activeMethod && (
                                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-sage, #16a34a)', backgroundColor: 'rgba(22, 163, 74, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                                    ✓ AKTIF: {activeMethod.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => handleSwitchPaymentMethod("cash")}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: activeMethod === 'cash' ? '#16a34a' : 'var(--f-surface)',
                                    color: activeMethod === 'cash' ? '#ffffff' : 'var(--f-body)',
                                    border: activeMethod === 'cash' ? '1px solid #16a34a' : '1px solid var(--f-hairline)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: activeMethod === 'cash' ? '0 2px 4px rgba(22, 163, 74, 0.2)' : 'none'
                                }}
                            >
                                💵 CASH FO
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchPaymentMethod("edc")}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: activeMethod === 'edc' ? '#2563eb' : 'var(--f-surface)',
                                    color: activeMethod === 'edc' ? '#ffffff' : 'var(--f-body)',
                                    border: activeMethod === 'edc' ? '1px solid #2563eb' : '1px solid var(--f-hairline)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: activeMethod === 'edc' ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none'
                                }}
                            >
                                💳 EDC CARD
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchPaymentMethod("qris")}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: activeMethod === 'qris' ? '#9333ea' : 'var(--f-surface)',
                                    color: activeMethod === 'qris' ? '#ffffff' : 'var(--f-body)',
                                    border: activeMethod === 'qris' ? '1px solid #9333ea' : '1px solid var(--f-hairline)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: activeMethod === 'qris' ? '0 2px 4px rgba(147, 51, 234, 0.2)' : 'none'
                                }}
                            >
                                📱 QRIS
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchPaymentMethod("transfer")}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: activeMethod === 'transfer' ? '#0284c7' : 'var(--f-surface)',
                                    color: activeMethod === 'transfer' ? '#ffffff' : 'var(--f-body)',
                                    border: activeMethod === 'transfer' ? '1px solid #0284c7' : '1px solid var(--f-hairline)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: activeMethod === 'transfer' ? '0 2px 4px rgba(2, 132, 199, 0.2)' : 'none'
                                }}
                            >
                                🏦 BANK TF
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchPaymentMethod("ota")}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: activeMethod === 'ota' ? '#d97706' : 'var(--f-surface)',
                                    color: activeMethod === 'ota' ? '#ffffff' : 'var(--f-body)',
                                    border: activeMethod === 'ota' ? '1px solid #d97706' : '1px solid var(--f-hairline)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: activeMethod === 'ota' ? '0 2px 4px rgba(217, 119, 6, 0.2)' : 'none'
                                }}
                            >
                                🌐 OTA VIRTUAL
                            </button>
                        </div>
                    </div>
                    
                    {/* Granular Payment Channel Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Cash FO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                💵 Cash Tunai di FO
                            </span>
                            <input
                                type="number"
                                value={formData.paidCash !== undefined ? formData.paidCash : (legacyPayHotel || "")}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = val + Number(formData.paidEdc || 0) + Number(formData.paidQris || 0) + Number(formData.paidTransfer || 0) + Number(formData.paidOta || 0);
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        paidCash: val,
                                        payHotel: val + Number(formData.paidEdc || 0) + Number(formData.paidQris || 0) + Number(formData.paidTransfer || 0),
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                                placeholder="0"
                            />
                        </div>

                        {/* EDC Card */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                💳 EDC BCA / Mandiri / Card
                            </span>
                            <input
                                type="number"
                                value={formData.paidEdc !== undefined ? formData.paidEdc : ""}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = Number(formData.paidCash || 0) + val + Number(formData.paidQris || 0) + Number(formData.paidTransfer || 0) + Number(formData.paidOta || 0);
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        paidEdc: val,
                                        payHotel: Number(formData.paidCash || 0) + val + Number(formData.paidQris || 0) + Number(formData.paidTransfer || 0),
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                                placeholder="0"
                            />
                        </div>

                        {/* QRIS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                📱 QRIS Hotel
                            </span>
                            <input
                                type="number"
                                value={formData.paidQris !== undefined ? formData.paidQris : ""}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = Number(formData.paidCash || 0) + Number(formData.paidEdc || 0) + val + Number(formData.paidTransfer || 0) + Number(formData.paidOta || 0);
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        paidQris: val,
                                        payHotel: Number(formData.paidCash || 0) + Number(formData.paidEdc || 0) + val + Number(formData.paidTransfer || 0),
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                                placeholder="0"
                            />
                        </div>

                        {/* Bank Transfer */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                🏦 Bank Transfer ke Hotel
                            </span>
                            <input
                                type="number"
                                value={formData.paidTransfer !== undefined ? formData.paidTransfer : ""}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = Number(formData.paidCash || 0) + Number(formData.paidEdc || 0) + Number(formData.paidQris || 0) + val + Number(formData.paidOta || 0);
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        paidTransfer: val,
                                        payHotel: Number(formData.paidCash || 0) + Number(formData.paidEdc || 0) + Number(formData.paidQris || 0) + val,
                                        payTransfer: val + Number(formData.paidOta || 0),
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                                placeholder="0"
                            />
                        </div>

                        {/* OTA Virtual Card */}
                        <div className={styles.colSpan2} style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                            <span className={styles.guestSubtext} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--f-muted)', marginLeft: '2px' }}>
                                🌐 OTA Virtual Card / City Ledger (Channel Collect)
                            </span>
                            <input
                                type="number"
                                value={formData.paidOta !== undefined ? formData.paidOta : (legacyPayTransfer || "")}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const newPaid = Number(formData.paidCash || 0) + Number(formData.paidEdc || 0) + Number(formData.paidQris || 0) + Number(formData.paidTransfer || 0) + val;
                                    const nextStatus = newPaid >= totalAmount ? "Lunas" : (newPaid > 0 ? "DP / Partial" : "Belum Bayar");
                                    setFormData({
                                        ...formData,
                                        paidOta: val,
                                        payTransfer: Number(formData.paidTransfer || 0) + val,
                                        paymentStatus: nextStatus,
                                        status: nextStatus === "Lunas" ? "CONFIRMED" : formData.status
                                    });
                                }}
                                style={{
                                    width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px',
                                    border: '1px solid var(--f-hairline)', backgroundColor: 'var(--f-surface)',
                                    fontSize: '11px', fontFamily: 'var(--f-font-mono)', color: 'var(--f-body)', outline: 'none'
                                }}
                                placeholder="0"
                            />
                        </div>
                    </div>
                    
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
