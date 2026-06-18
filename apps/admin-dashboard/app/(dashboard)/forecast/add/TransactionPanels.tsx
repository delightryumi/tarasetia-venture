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
    Globe
} from "lucide-react";
import styles from "./TransactionFormStyles.module.css";
import { CHANNELS } from "./useTransactionForm";
import Modal from "./Modal";
import {
    SectionTitle,
    ChannelSelect,
    RoomTypeSelect,
    OtherIncomeTypeSelect,
    TerminalInput,
    TypeCard,
    DateCard
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
    updateForm: (field: string, value: any) => void;
    updateRoom: (idx: number, field: string, value: any) => void;
    updateNightRate: (idx: number, rate: any) => void;
    onCancel: () => void;
    onSubmit: () => void;
}

export function TransactionEntryForm({
    revenueType,
    form,
    roomTypes,
    updateForm,
    updateRoom,
    updateNightRate,
    onCancel,
    onSubmit
}: TransactionEntryFormProps) {
  const [modalData, setModalData] = useState<{ type: string; data: any } | null>(null);
    const startD = form.checkIn ? new Date(form.checkIn) : null;
    const endD = form.checkOut ? new Date(form.checkOut) : null;
    const nights = (startD && endD && endD > startD) ? Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) : 1;

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft} onClick={() => setModalData({ type: 'transactionEntry', data: { revenueType, form } })} style={{ cursor: 'pointer' }}>
                    <div className={`${styles.dotAccent} ${revenueType === 'room' ? styles.dotSage : styles.dotTerracotta}`} />
                    <span className={styles.cardTitle}>
                        Entri Transaksi - {revenueType === 'room' ? "Room Revenue" : "Other Income"}
                    </span>
                </div>
                 <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className={styles.cardHeaderBtn}>
                     Ubah Kategori
                 </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {revenueType === 'room' ? (
                    /* ROOM REVENUE ENTRY FORM */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <SectionTitle number="01" label="Informasi Guest & Durasi Menginap" />
                        <div className={styles.formGrid}>
                            <TerminalInput 
                                label="Nama Tamu (Guest Name)"
                                value={form.guestName}
                                onChange={(val: string) => updateForm("guestName", val)}
                                placeholder="CONTOH: BUDI SANTOSO"
                                icon={User}
                            />
                            <TerminalInput 
                                label="Nama Staff (Staff Name)"
                                value={form.staffName}
                                onChange={(val: string) => updateForm("staffName", val)}
                                placeholder="CONTOH: ADI / SARI"
                                icon={User}
                            />
                            <div className={styles.colSpan2}>
                                <div className={styles.dateCardsContainer}>
                                    <DateCard 
                                        label="Check In"
                                        value={form.checkIn}
                                        onChange={(val: string) => updateForm("checkIn", val)}
                                        type="check-in"
                                    />
                                    <DateCard 
                                        label="Check Out"
                                        value={form.checkOut}
                                        onChange={(val: string) => updateForm("checkOut", val)}
                                        type="check-out"
                                    />
                                </div>
                            </div>
                        </div>

                        <SectionTitle number="02" label="Kamar & Saluran Pemesanan (OTA / Channel)" />
                        <div className={styles.formGrid} style={{ rowGap: '12px' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.inputLabel}>Tipe Kamar (Room Type)</label>
                                <RoomTypeSelect 
                                    value={form.rooms[0].roomTypeId}
                                    options={roomTypes}
                                    onChange={(val: string) => updateRoom(0, "roomTypeId", val)}
                                />
                            </div>
                            <TerminalInput 
                                label="Nomor Kamar (Room Number)"
                                value={form.rooms[0].roomNumber}
                                onChange={(val: string) => updateRoom(0, "roomNumber", val)}
                                placeholder="CONTOH: 102 atau 205"
                                icon={BedDouble}
                            />
                            <div className={styles.formGroup}>
                                <label className={styles.inputLabel}>Saluran Pemesanan (Channel)</label>
                                <ChannelSelect 
                                    value={form.channel}
                                    onChange={(val: string) => updateForm("channel", val)}
                                />
                            </div>
                            {startD && Array.from({ length: nights }).map((_, idx) => {
                                const currentD = new Date(startD);
                                currentD.setDate(currentD.getDate() + idx);
                                const dateLabel = currentD.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                                const label = nights > 1 ? `Room Rate Malam ${idx + 1} (${dateLabel})` : "Total Room Rate per Malam";
                                return (
                                    <TerminalInput 
                                        key={idx}
                                        label={label}
                                        value={form.nightRates[idx] ?? ""}
                                        onChange={(val: string) => updateNightRate(idx, val)}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                );
                            })}
                        </div>

                        <SectionTitle number="03" label="Rincian Pembayaran & Pendapatan Bersih" />
                        <div className={styles.formGrid} style={{ rowGap: '12px' }}>
                            <div className={styles.colSpan2} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--f-surface)', border: '1px solid var(--f-hairline)', borderRadius: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    id="isComplimentRoom"
                                    checked={!!form.isCompliment}
                                    onChange={(e) => updateForm("isCompliment", e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--f-sage)' }}
                                />
                                <label htmlFor="isComplimentRoom" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--f-foreground)', cursor: 'pointer' }}>
                                    Tandai sebagai Compliment (Kompensasi / Gratis)
                                </label>
                            </div>
                            
                            {form.isCompliment && (
                                <div className={styles.colSpan2}>
                                    <TerminalInput 
                                        label="Alasan Compliment (Wajib)"
                                        value={form.complimentReason}
                                        onChange={(val: string) => updateForm("complimentReason", val)}
                                        placeholder="CONTOH: KELUARGA OWNER / KOMPENSASI AC RUSAK"
                                        icon={AlertCircle}
                                    />
                                </div>
                            )}

                            {!form.isCompliment && (
                                <>
                                    <TerminalInput 
                                        label="Pembayaran Cash di Hotel (Pay at Hotel)"
                                        value={form.payHotel}
                                        onChange={(val: string) => updateForm("payHotel", Number(val))}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                    <TerminalInput 
                                        label="Pembayaran Virtual / OTA (Debit, QRIS, dsb.)"
                                        value={form.payTransfer}
                                        onChange={(val: string) => updateForm("payTransfer", Number(val))}
                                        placeholder="0"
                                        type="number"
                                        isAmount={true}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* OTHER INCOME ENTRY FORM */
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

                        <SectionTitle number="02" label="Tanggal & Pembayaran" />
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
                                    updateForm("totalAmount", Number(val));
                                    updateForm("payHotel", Number(val)); // Sync automatically for Pay at Hotel
                                }}
                                placeholder="0"
                                type="number"
                                isAmount={true}
                            />
                        </div>
                    </div>
                )}

                {/* General Notes for both */}
                <div style={{ paddingTop: '8px' }}>
                    <TerminalInput 
                        label="Catatan Tambahan (Optional Notes)"
                        value={form.note}
                        onChange={(val: string) => updateForm("note", val)}
                        placeholder="CONTOH: TAMU MINTA LATE CHECK-OUT ATAU NO-SMOKING ROOM"
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
    onCommit: () => void;
}

export function ReviewSidebar({
    revenueType,
    form,
    roomTypes,
    totalGross,
    queue,
    saving,
    onCommit
}: ReviewSidebarProps) {
    const [modalData, setModalData] = useState<{ type: string; data: any } | null>(null);
    const currentChannel = CHANNELS.find(c => c.name === form.channel);
    
    return (
        <aside className={styles.rightSidebarCol}>
            <div className={`${styles.card} ${styles.sidebar}`} onClick={() => setModalData({ type: 'reviewSidebar', data: { revenueType, form, totalGross, queue } })} style={{ cursor: 'pointer' }}>
                <div className={styles.sidebarInner}>
                    <div className={styles.sidebarHeader}>
                        <h2 className={styles.sidebarTitle}>Review Transaksi</h2>
                        <p className={styles.sidebarSubtitle}>Audit validasi internal ({queue.length + 1} items)</p>
                    </div>

                    {/* CURRENT DRAFT ENTRY */}
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarStatusHeader}>
                            <div className={styles.sidebarStatusDot} />
                            <span className={styles.sidebarStatusText}>Draft Sekarang</span>
                        </div>
                        <div className={styles.draftCard}>
                            <div className={`${styles.draftCardRow} ${styles.draftCardDivider}`}>
                                <span className={styles.draftLabel}>Guest Name</span>
                                <span className={styles.draftValue} style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.guestName || '0'}</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className={styles.draftCardRow}>
                                    <span className={styles.draftLabel}>{revenueType === 'room' ? "Periode" : "Tanggal"}</span>
                                    <span className={styles.draftValue}>
                                        {form.checkIn} {revenueType === 'room' && `— ${form.checkOut || '0'}`}
                                    </span>
                                </div>
                                <div className={styles.draftCardRow}>
                                    <span className={styles.draftLabel}>{revenueType === 'room' ? "Room" : "Kategori"}</span>
                                    <span className={styles.draftValue}>
                                        {revenueType === 'room' ? (
                                            `${roomTypes.find(r => r.id === form.rooms[0].roomTypeId)?.name || 'N/A'} - ${form.rooms[0].roomNumber || 'No Room'}`
                                        ) : (
                                            form.incomeType || 'Belum Dipilih'
                                        )}
                                    </span>
                                </div>
                                <div className={styles.draftCardRow}>
                                    <span className={styles.draftLabel}>Staff</span>
                                    <span className={styles.draftValue} style={{ color: 'var(--f-sage)' }}>{form.staffName || 'NOT SET'}</span>
                                </div>
                                {revenueType === 'room' && (
                                    <div className={styles.draftCardRow}>
                                        <span className={styles.draftLabel}>Channel</span>
                                        <div className="flex items-center gap-2">
                                            {currentChannel?.logo && (
                                                currentChannel.logo === "globe" ? (
                                                    <Globe size={14} className="text-stone-400 opacity-60" />
                                                ) : (
                                                    <img src={currentChannel.logo} className="w-3.5 h-3.5 object-contain opacity-60" alt="" />
                                                )
                                            )}
                                            <span className={styles.draftValue}>{form.channel}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {form.note && (
                                <div className={styles.draftNote}>
                                    <p className={styles.draftNoteText}>"{form.note}"</p>
                                </div>
                            )}

                            {form.isCompliment && (
                                <div className={styles.draftNote}>
                                    <p className={styles.draftNoteText} style={{ color: '#ef4444' }}>
                                        COMPLIMENT: {form.complimentReason || 'Alasan belum diisi'}
                                    </p>
                                </div>
                            )}

                            <div className={styles.draftAmountSection}>
                                <div className={styles.draftAmountRow}>
                                    <span>Pay at Hotel</span>
                                    <span className={styles.draftAmountValue}>Rp {formatCurrency(form.isCompliment ? 0 : (form.payHotel || 0))}</span>
                                </div>
                                {revenueType === 'room' && (
                                    <div className={styles.draftAmountRow}>
                                        <span>Virtual Payment / OTA</span>
                                        <span className={styles.draftAmountValue}>Rp {formatCurrency(form.isCompliment ? 0 : (form.payTransfer || 0))}</span>
                                    </div>
                                )}
                                <div className={styles.draftTotalRow}>
                                    <span>Total Gross {form.isCompliment && "(Compliment Value)"}</span>
                                    <span className={styles.draftTotalValue}>Rp {formatCurrency(totalGross || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CUMULATIVE SUMMARY */}
                    <div className={styles.sidebarSection} style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--f-hairline)' }}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryTotalRow}>
                                <span className={styles.summaryTotalLabel}>Total</span>
                                <span className={styles.summaryTotalValue}>Rp {formatCurrency(queue.reduce((acc, item) => acc + item.amount, 0) + totalGross)}</span>
                            </div>
                            
                            <div className={styles.summaryBreakdown}>
                                <div className={styles.summaryBreakdownRow}>
                                    <span className={styles.summaryBreakdownLabel}>Total Pay at Hotel</span>
                                    <span className={styles.summaryBreakdownValue}>Rp {formatCurrency(queue.reduce((acc, item) => acc + item.payHotel, 0) + (Number(form.payHotel) || 0))}</span>
                                </div>
                                <div className={styles.summaryBreakdownRow}>
                                    <span className={styles.summaryBreakdownLabel}>Total Virtual Payment / OTA</span>
                                    <span className={styles.summaryBreakdownValue}>Rp {formatCurrency(queue.reduce((acc, item) => acc + item.payTransfer, 0) + (Number(form.payTransfer) || 0))}</span>
                                </div>
                                <div className={styles.summaryBalanceRow}>
                                    <span className={styles.summaryBalanceLabel}>Balance</span>
                                    <span className={styles.summaryBalanceValue}>Rp {formatCurrency((queue.reduce((acc, item) => acc + item.amount, 0) + totalGross) - (queue.reduce((acc, item) => acc + item.payHotel, 0) + (Number(form.payHotel) || 0)) - (queue.reduce((acc, item) => acc + item.payTransfer, 0) + (Number(form.payTransfer) || 0)))}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: '40px' }}>
                        <button 
                            onClick={onCommit} 
                            disabled={saving || queue.length === 0} 
                            className={styles.sidebarActionBtn}
                        >
                            {saving ? (
                                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <>
                                    <span className={styles.sidebarActionBtnTitle}>SYNC {queue.length} ITEMS TO SERVER</span>
                                    <span className={styles.sidebarActionBtnSubtitle}>{queue.length} Items Pending</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
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
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
                <div className={styles.tableHeaderLeft}>
                    <div className={styles.tableHeaderIcon}>
                        <Receipt size={20} />
                    </div>
                    <div>
                        <h3 className={styles.tableTitle}>Queue List ({queue.length})</h3>
                        <p className={styles.tableSubtitle}>Final audit before submission</p>
                    </div>
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table className={styles.tableElement}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.tableCell}>Date</th>
                            <th className={styles.tableCell}>Guest Detail</th>
                            <th className={styles.tableCell} style={{ textAlign: 'right' }}>Total</th>
                            <th className={styles.tableCell} style={{ textAlign: 'right' }}>Paid</th>
                            <th className={styles.tableCell} style={{ textAlign: 'right' }}>Balance</th>
                            <th className={styles.tableCell} style={{ textAlign: 'center', width: '100px' }}>Status</th>
                            <th className={styles.tableCell} style={{ textAlign: 'center', width: '80px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queue.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.tableCell} style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <div className={styles.tableEmptyState}>
                                        <AlertCircle size={32} strokeWidth={1.5} />
                                        <p className={styles.tableEmptyText}>No items in queue</p>
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
                                    <tr key={idx} className={styles.tableRow} onClick={() => setModalData({ type: 'queueItem', data: item })}>
                                        <td className={`${styles.tableCell} ${styles.dateCell}`}>{item.effectiveDate || item.checkInDate}</td>
                                        <td className={styles.tableCell}>
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
                                        <td className={styles.tableCell} style={{ textAlign: 'right', fontFamily: 'var(--f-font-mono)', fontWeight: '700' }}>
                                            Rp {item.isCompliment ? 0 : formatCurrency(item.amount)}
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono font-bold text-stone-850 dark:text-stone-150">
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
                                        <td className={styles.tableCell} style={{ textAlign: 'right' }}>
                                            <span className={`font-mono font-bold ${balanceVal > 0 && !item.isCompliment ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`}>
                                                Rp {item.isCompliment ? 0 : formatCurrency(balanceVal)}
                                            </span>
                                        </td>
                                        <td className={styles.tableCell} style={{ textAlign: 'center' }}>
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
                                        <td className={styles.tableCell} style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
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
                    href="#" 
                    className={styles.footerLink}
                >
                    <span className={styles.footerTitle}>Institutional Terminal</span>
                    <div className={styles.footerMeta}>
                        <span>Powered by</span>
                        <span className={styles.footerBrandText}>Setara Venture</span>
                    </div>
                </a>
            </div>
        </div>
    );
}
