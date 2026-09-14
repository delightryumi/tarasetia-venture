"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useConfirmationLetter } from "./useConfirmationLetter";
import ConfirmationLetterPreview from "./ConfirmationLetterPreview";
import {
    ConfirmationLetter,
    ClientType,
    LetterStatus,
    GuaranteeStatus,
    MealPlanCode
} from "./ConfirmationLetterTypes";
import styles from "./ConfirmationLetterLandscape.module.css";
import {
    FileText,
    Plus,
    Printer,
    PencilSimple,
    Trash,
    MagnifyingGlass,
    Buildings,
    Bank,
    UsersThree,
    CheckCircle,
    Clock,
    XCircle,
    PaperPlaneTilt,
    FloppyDisk,
    ArrowLeft,
    Bed,
    Coffee,
    CreditCard,
    Signature,
    DownloadSimple,
    ShieldCheck,
    CalendarCheck,
    Eye,
    EyeSlash,
    Sparkle
} from "@phosphor-icons/react";

export default function ConfirmationLetterSection() {
    const {
        letters,
        loading,
        activeTab,
        setActiveTab,
        formData,
        branding,
        availableRoomTypes,
        recentBookings,
        updateFormField,
        addRoomItem,
        removeRoomItem,
        updateRoomItem,
        addMeetingPackage,
        removeMeetingPackage,
        updateMeetingPackage,
        importFromBooking,
        saveLetter,
        deleteLetter,
        openForEdit,
        openCreateNew,
        saveHotelBankDetails
    } = useConfirmationLetter();

    // Filters for list view
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [showPreviewSheet, setShowPreviewSheet] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto-calculate nights and sync with all rooms
    const handleCheckInDateChange = (newDate: string) => {
        updateFormField("checkInDate", newDate);
        if (newDate && formData.checkOutDate) {
            const d1 = new Date(newDate);
            const d2 = new Date(formData.checkOutDate);
            const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
            if (!isNaN(diffDays) && diffDays > 0) {
                updateFormField("totalNights", diffDays);
                (formData.rooms || []).forEach((r, idx) => {
                    updateRoomItem(r.id || idx, "nights", diffDays);
                });
            }
        }
    };

    const handleCheckOutDateChange = (newDate: string) => {
        updateFormField("checkOutDate", newDate);
        if (formData.checkInDate && newDate) {
            const d1 = new Date(formData.checkInDate);
            const d2 = new Date(newDate);
            const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
            if (!isNaN(diffDays) && diffDays > 0) {
                updateFormField("totalNights", diffDays);
                (formData.rooms || []).forEach((r, idx) => {
                    updateRoomItem(r.id || idx, "nights", diffDays);
                });
            }
        }
    };

    // Bank Account Saving State & Action
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [bankSaveMessage, setBankSaveMessage] = useState<string | null>(null);

    const handleSaveBankDefault = async () => {
        const bankName = formData.paymentTerms?.bankName || "";
        const accountNumber = formData.paymentTerms?.bankAccountNumber || "";
        const accountName = formData.paymentTerms?.bankAccountName || "";

        if (!bankName || !accountNumber) {
            alert("Mohon lengkapi Nama Bank dan Nomor Rekening terlebih dahulu.");
            return;
        }

        setIsSavingBank(true);
        setBankSaveMessage(null);
        try {
            const res = await saveHotelBankDetails(bankName, accountName, accountNumber);
            if (res?.success) {
                setBankSaveMessage("Rekening bank berhasil disimpan sebagai default hotel!");
                setTimeout(() => setBankSaveMessage(null), 4000);
            } else {
                alert("Gagal menyimpan rekening bank: " + (res?.error || "Terjadi kesalahan"));
            }
        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setIsSavingBank(false);
        }
    };

    // Filter letters
    const filteredLetters = letters.filter(item => {
        const matchesSearch =
            (item.letterNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.contactPerson || item.picName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.eventName || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
        const matchesType = typeFilter === "ALL" || item.clientType === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const getStatusBadge = (status: LetterStatus, guarantee?: GuaranteeStatus) => {
        if (guarantee === "GUARANTEED" || status === "CONFIRMED") {
            return (
                <span className={`${styles.badge} ${styles.badgeConfirmed}`}>
                    <CheckCircle size={13} weight="fill" /> GUARANTEED
                </span>
            );
        }
        switch (status) {
            case "SENT":
                return (
                    <span className={`${styles.badge} ${styles.badgeSent}`}>
                        <PaperPlaneTilt size={13} weight="bold" /> SENT
                    </span>
                );
            case "CANCELLED":
                return (
                    <span className={`${styles.badge} ${styles.badgeCancelled}`}>
                        <XCircle size={13} weight="fill" /> CANCELLED
                    </span>
                );
            case "DRAFT":
            default:
                return (
                    <span className={`${styles.badge} ${styles.badgeDraft}`}>
                        <Clock size={13} weight="bold" /> DRAFT
                    </span>
                );
        }
    };

    const getClientTypeLabel = (type: ClientType) => {
        switch (type) {
            case "CORPORATE":
                return "Corporate (B2B)";
            case "GOVERNMENT":
                return "Government (Dinas / K/L)";
            case "GROUP":
                return "Group / Tour & Travel";
            case "FIT":
                return "Individual Guest (FIT)";
            default:
                return type;
        }
    };

    // Calculate live totals for the landscape footer
    const totalRoomsCount = (formData.rooms || []).reduce(
        (sum, r) => sum + (Number(r.roomCount || r.quantity) || 0),
        0
    );
    const totalRoomNightsCount = (formData.rooms || []).reduce(
        (sum, r) => sum + ((Number(r.roomCount || r.quantity) || 0) * (Number(r.nights) || 1)),
        0
    );
    const totalRoomsSubtotal = (formData.rooms || []).reduce(
        (sum, r) => sum + (Number(r.subtotal || r.totalAmount) || 0),
        0
    );

    const totalMicePaxCount = (formData.meetingPackages || []).reduce(
        (sum, m) => sum + (Number(m.pax) || 0),
        0
    );
    const totalMiceSubtotal = (formData.meetingPackages || []).reduce(
        (sum, m) => sum + (Number(m.subtotal || m.totalAmount) || 0),
        0
    );

    return (
        <div className={styles.container}>
            {/* ═══════════════════════════════════════════════════════════
               TOP COMMAND BAR (TARA PMS ENTERPRISE PROTOCOL)
               ═══════════════════════════════════════════════════════════ */}
            <div className={styles.topBar}>
                <div className={styles.topBarLeft}>
                    <div className={styles.topBarBadge}>
                        <FileText size={22} weight="duotone" />
                    </div>
                    <div>
                        <div className={styles.topBarTitleRow}>
                            <h1 className={styles.topBarTitle}>Confirmation Letter (CL)</h1>
                            {activeTab === "editor" && (
                                <span style={{ fontSize: "11px", color: "#b49b67", fontWeight: 700 }}>
                                    • {formData.letterNumber || "DRAFT CL"}
                                </span>
                            )}
                        </div>
                        <div className={styles.topBarMeta}>
                            Penerbitan Surat Perjanjian Reservasi Kamar & Fasilitas MICE (Hotel Reservation & Banquet Agreement) Resmi Bintang 5
                        </div>
                    </div>
                </div>

                <div className={styles.topBarActions}>
                    {activeTab === "list" ? (
                        <button
                            id="btn-create-new-cl"
                            className={`${styles.btnAction} ${styles.btnPrimary}`}
                            onClick={openCreateNew}
                        >
                            <Plus size={16} weight="bold" />
                            Buat Dokumen Konfirmasi Baru
                        </button>
                    ) : (
                        <>
                            <button
                                className={`${styles.btnAction} ${styles.btnSecondary}`}
                                onClick={() => setActiveTab("list")}
                            >
                                <ArrowLeft size={15} weight="bold" />
                                Arsip Dokumen
                            </button>

                            <button
                                className={`${styles.btnAction} ${styles.btnSecondary}`}
                                onClick={() => setShowPreviewSheet(prev => !prev)}
                                title="Buka / Tutup Tampilan Lembar Dokumen A4 di Bawah"
                            >
                                {showPreviewSheet ? (
                                    <>
                                        <EyeSlash size={15} /> Sembunyikan Lembar A4
                                    </>
                                ) : (
                                    <>
                                        <Eye size={15} /> Tampilkan Lembar A4
                                    </>
                                )}
                            </button>

                            <button
                                id="btn-save-cl"
                                className={`${styles.btnAction} ${styles.btnPrimary}`}
                                onClick={() => saveLetter()}
                            >
                                <FloppyDisk size={16} weight="bold" />
                                Simpan Konfirmasi
                            </button>

                            <button
                                id="btn-print-cl"
                                className={`${styles.btnAction} ${styles.btnSecondary}`}
                                onClick={() => window.print()}
                            >
                                <Printer size={16} weight="bold" />
                                Cetak PDF A4
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Navigation Tabs ── */}
            <div className={styles.navContainer}>
                <button
                    className={`${styles.navTabItem} ${activeTab === "list" ? styles.navTabItemActive : ""}`}
                    onClick={() => setActiveTab("list")}
                >
                    <FileText size={16} weight={activeTab === "list" ? "fill" : "regular"} />
                    Arsip Surat Konfirmasi ({letters.length})
                </button>
                <button
                    className={`${styles.navTabItem} ${activeTab === "editor" ? styles.navTabItemActive : ""}`}
                    onClick={() => setActiveTab("editor")}
                >
                    <PencilSimple size={16} weight={activeTab === "editor" ? "fill" : "regular"} />
                    {formData.id ? `Edit: ${formData.letterNumber}` : "Dossier Matrix Editor & Live Document Sheet"}
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════
               TAB 1: ARCHIVE LIST VIEW (HIGH-CONTRAST SPREADSHEET)
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === "list" && (
                <div className={styles.archiveCard}>
                    <div className={styles.archiveToolbar}>
                        <div className={styles.archiveSearch}>
                            <MagnifyingGlass size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.archiveSearchInput}
                                placeholder="Cari nomor surat, nama instansi, PIC, atau agenda kegiatan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className={styles.filterGroup}>
                            <select
                                className={styles.filterSelect}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Semua Status Reservasi</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Terkirim (Sent)</option>
                                <option value="CONFIRMED">Terkonfirmasi (Guaranteed)</option>
                                <option value="CANCELLED">Dibatalkan (Cancelled)</option>
                            </select>

                            <select
                                className={styles.filterSelect}
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="ALL">Semua Kategori Klien</option>
                                <option value="CORPORATE">Corporate (B2B)</option>
                                <option value="GOVERNMENT">Government (Dinas / K/L)</option>
                                <option value="GROUP">Group / Tour & Travel</option>
                                <option value="FIT">Individual Guest (FIT)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                            Memuat arsip Confirmation Letter...
                        </div>
                    ) : filteredLetters.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>
                                <FileText size={48} weight="thin" />
                            </div>
                            <h3 className={styles.emptyStateTitle}>Belum Ada Dokumen Confirmation Letter</h3>
                            <p className={styles.emptyStateText}>
                                {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                                    ? "Tidak ada dokumen yang cocok dengan filter pencarian."
                                    : "Terbitkan surat konfirmasi reservasi resmi berstandar hotel untuk tamu korporat atau instansi pemerintah."}
                            </p>
                            <button
                                className={`${styles.btnAction} ${styles.btnPrimary}`}
                                onClick={openCreateNew}
                            >
                                <Plus size={16} weight="bold" />
                                Buat Dokumen Konfirmasi Baru
                            </button>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.vhpTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.vhpTh}>No. Dokumen</th>
                                        <th className={styles.vhpTh}>Tgl Terbit</th>
                                        <th className={styles.vhpThLeft}>Instansi / Perusahaan</th>
                                        <th className={styles.vhpThLeft}>Agenda Kegiatan</th>
                                        <th className={styles.vhpTh}>Periode Menginap</th>
                                        <th className={styles.vhpTh}>Alokasi</th>
                                        <th className={styles.vhpThRight}>Total Nilai Kontrak</th>
                                        <th className={styles.vhpTh}>Status</th>
                                        <th className={styles.vhpTh} style={{ textAlign: "right" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLetters.map((item) => {
                                        const totalRooms = (item.rooms || []).reduce(
                                            (sum, r) => sum + (Number(r.roomCount || r.quantity) || 0),
                                            0
                                        );
                                        const totalPax = (item.meetingPackages || []).reduce(
                                            (sum, m) => sum + (Number(m.pax) || 0),
                                            0
                                        );

                                        return (
                                            <tr key={item.id} className={styles.vhpRow}>
                                                <td style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "11px" }}>
                                                    {item.letterNumber || "-"}
                                                </td>
                                                <td style={{ textAlign: "center", color: "#64748b", fontSize: "11px" }}>
                                                    {item.letterDate || "-"}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                                        {item.clientName || "-"}
                                                    </div>
                                                    <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                                                        {getClientTypeLabel(item.clientType)} • {item.contactPerson || item.picName || "-"}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {item.eventName || "Reservasi Kamar & Fasilitas Hotel"}
                                                    </div>
                                                    {item.spkNumber && (
                                                        <div style={{ fontSize: "10px", color: "#b49b67" }}>
                                                            SPK/PO: {item.spkNumber}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: "center", fontSize: "11px" }}>
                                                    <div><strong>CI:</strong> {item.checkInDate}</div>
                                                    <div style={{ color: "#64748b" }}><strong>CO:</strong> {item.checkOutDate} ({item.totalNights || 1} Mlm)</div>
                                                </td>
                                                <td style={{ textAlign: "center", fontSize: "11px" }}>
                                                    <div><strong>{totalRooms}</strong> Kamar</div>
                                                    {totalPax > 0 && <div style={{ color: "#64748b" }}>{totalPax} Pax MICE</div>}
                                                </td>
                                                <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a" }}>
                                                    {formatCurrency(item.grandTotal || 0)}
                                                </td>
                                                <td style={{ textAlign: "center" }}>
                                                    {getStatusBadge(item.status, item.guaranteeStatus)}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: "4px" }}>
                                                        <button
                                                            className={`${styles.btnAction} ${styles.btnSecondary}`}
                                                            style={{ padding: "4px 7px" }}
                                                            title="Pratinjau & Cetak A4"
                                                            onClick={() => openForEdit(item)}
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                        <button
                                                            className={`${styles.btnAction} ${styles.btnSecondary}`}
                                                            style={{ padding: "4px 7px" }}
                                                            title="Edit Matrix Dossier"
                                                            onClick={() => openForEdit(item)}
                                                        >
                                                            <PencilSimple size={14} />
                                                        </button>
                                                        <button
                                                            className={`${styles.btnAction} ${styles.btnDanger}`}
                                                            style={{ padding: "4px 7px" }}
                                                            title="Hapus Dokumen"
                                                            onClick={() => item.id && deleteLetter(item.id)}
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               TAB 2: TARA PMS LANDSCAPE INPUT CONSOLE (PLACED ON TOP)
               ═══════════════════════════════════════════════════════════ */}
            {activeTab === "editor" && (
                <div className={styles.landscapeConsole}>
                    {/* PMS Guest Folio Importer (Horizontal Fast Import Bar) */}
                    {recentBookings.length > 0 && (
                        <div
                            className={styles.vhpCard}
                            style={{
                                background: "rgba(180, 155, 103, 0.06)",
                                borderColor: "rgba(180, 155, 103, 0.35)",
                                padding: "8px 14px"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: "#8d7a52" }}>
                                    <DownloadSimple size={16} weight="bold" />
                                    <span>FAST IMPORT PMS: Tarik Data Reservasi Front Office Aktif</span>
                                </div>
                                <div style={{ flex: 1, minWidth: "300px", maxWidth: "650px" }}>
                                    <select
                                        className={styles.cellSelect}
                                        style={{ height: "28px", fontSize: "11.5px", borderColor: "rgba(180, 155, 103, 0.5)" }}
                                        onChange={(e) => {
                                            const selected = recentBookings.find(b => (b.id || b.bookingId || b.code) === e.target.value);
                                            if (selected) importFromBooking(selected);
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>-- Pilih Reservasi Front Office untuk Auto-Fill Matrix --</option>
                                        {recentBookings.map((b, idx) => (
                                            <option key={idx} value={b.id || b.bookingId || b.code}>
                                                {b.company && b.company !== "-" ? `[${b.company}] ` : ""}{b.guestName || b.customerName || "Tamu"} | {b.roomType || b.roomName || "Standard"} ({b.checkInDate || b.date} s/d {b.checkOutDate || "-"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CARD 1: INFORMASI INSTANSI, AGENDA & JADWAL */}
                    <div className={styles.vhpCard}>
                        <div className={styles.vhpCardHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Buildings size={17} weight="bold" />
                                <span>1. Profil Pemesan & Jadwal Reservasi (Organizer & Schedule)</span>
                            </div>
                            <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#8d7a52", background: "rgba(141, 122, 82, 0.1)", padding: "2px 10px", borderRadius: "4px" }}>
                                {formData.letterNumber || "DRAFT CL"}
                            </span>
                        </div>

                        <div className={styles.landscapeFormGrid}>
                            {/* Baris 1: Identitas Pemesan */}
                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Nama Instansi / Perusahaan *</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.clientName}
                                    onChange={(e) => updateFormField("clientName", e.target.value)}
                                    placeholder="Masukkan nama instansi pemerintah / korporat / perorangan"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Kategori Klien *</label>
                                <select
                                    className={styles.cellSelect}
                                    value={formData.clientType}
                                    onChange={(e) => updateFormField("clientType", e.target.value as ClientType)}
                                >
                                    <option value="CORPORATE">Corporate (B2B Swasta / BUMN)</option>
                                    <option value="GOVERNMENT">Government (K/L / Dinas Pemda)</option>
                                    <option value="GROUP">Group / Tour & Travel</option>
                                    <option value="FIT">Individual / Personal (FIT)</option>
                                </select>
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Status Jaminan Reservasi</label>
                                <select
                                    className={styles.cellSelect}
                                    value={formData.guaranteeStatus || "GUARANTEED"}
                                    onChange={(e) => updateFormField("guaranteeStatus", e.target.value as GuaranteeStatus)}
                                >
                                    <option value="GUARANTEED">GUARANTEED (Terjamin)</option>
                                    <option value="TENTATIVE">TENTATIVE (Sementara)</option>
                                    <option value="DEPOSIT_PENDING">DEPOSIT PENDING (Menunggu DP)</option>
                                </select>
                            </div>

                            {/* Baris 2: Narahubung / PIC */}
                            <div className={`${styles.fieldItem} ${styles.col4}`}>
                                <label className={styles.fieldLabel}>Nama Narahubung / PIC *</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.contactPerson || formData.picName || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("contactPerson", val);
                                        updateFormField("picName", val);
                                    }}
                                    placeholder="Nama lengkap penanggung jawab / booker"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col4}`}>
                                <label className={styles.fieldLabel}>No. WhatsApp / Telepon PIC *</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.phone || formData.contactPhone || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("phone", val);
                                        updateFormField("contactPhone", val);
                                    }}
                                    placeholder="Contoh: 08123456789"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col4}`}>
                                <label className={styles.fieldLabel}>Email PIC (Opsional)</label>
                                <input
                                    type="email"
                                    className={styles.cellInput}
                                    value={formData.email || formData.contactEmail || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("email", val);
                                        updateFormField("contactEmail", val);
                                    }}
                                    placeholder="email@instansi.com"
                                />
                            </div>

                            {/* Baris 3: Legal B2B & Agenda Acara */}
                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Nama Agenda Acara / Kegiatan (Opsional)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.eventName || ""}
                                    onChange={(e) => updateFormField("eventName", e.target.value)}
                                    placeholder="Contoh: Workshop Nasional / Rapat Koordinasi / Family Gathering"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Nomor SPK / PO / GL (Opsional)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.spkNumber || ""}
                                    onChange={(e) => updateFormField("spkNumber", e.target.value)}
                                    placeholder="No. SPK / PO / Surat Tugas"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>NPWP Klien (Opsional)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.npwp || ""}
                                    onChange={(e) => updateFormField("npwp", e.target.value)}
                                    placeholder="NPWP instansi pemesan"
                                />
                            </div>

                            {/* Sub-Section B: Divider Jadwal Menginap */}
                            <div className={styles.formSectionDivider}>
                                <span className={styles.formSectionDividerText}>
                                    <CalendarCheck size={15} weight="bold" /> Jadwal Menginap & Ketentuan Operasional
                                </span>
                            </div>

                            {/* Baris 4: Jadwal Menginap */}
                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Check-In (Kedatangan) *</label>
                                <input
                                    type="date"
                                    className={styles.cellInput}
                                    value={formData.checkInDate}
                                    onChange={(e) => handleCheckInDateChange(e.target.value)}
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Check-Out (Kepulangan) *</label>
                                <input
                                    type="date"
                                    className={styles.cellInput}
                                    value={formData.checkOutDate}
                                    onChange={(e) => handleCheckOutDateChange(e.target.value)}
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col2}`}>
                                <label className={styles.fieldLabel}>Malam</label>
                                <input
                                    type="number"
                                    className={styles.cellInput}
                                    style={{ fontWeight: 700, textAlign: "center" }}
                                    value={formData.totalNights || 1}
                                    min={1}
                                    onChange={(e) => {
                                        const nights = parseInt(e.target.value) || 1;
                                        updateFormField("totalNights", nights);
                                        (formData.rooms || []).forEach((r, idx) => {
                                            updateRoomItem(r.id || idx, "nights", nights);
                                        });
                                    }}
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col2}`}>
                                <label className={styles.fieldLabel}>Estimasi Tamu</label>
                                <input
                                    type="number"
                                    className={styles.cellInput}
                                    style={{ fontWeight: 700, textAlign: "center" }}
                                    value={formData.totalGuests || 2}
                                    min={1}
                                    onChange={(e) => updateFormField("totalGuests", parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col2}`}>
                                <label className={styles.fieldLabel}>Batas Rooming List</label>
                                <input
                                    type="date"
                                    className={styles.cellInput}
                                    value={formData.roomingListCutOffDate || ""}
                                    onChange={(e) => updateFormField("roomingListCutOffDate", e.target.value)}
                                />
                            </div>

                            {/* Baris 5: Ketentuan Operasional & Deposit */}
                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Kebijakan Deposit Insidential</label>
                                <select
                                    className={styles.cellSelect}
                                    value={formData.incidentalDepositPolicy || "Rp 200.000 / Kamar / Malam"}
                                    onChange={(e) => updateFormField("incidentalDepositPolicy", e.target.value)}
                                >
                                    <option value="Rp 200.000 / Kamar / Malam">Rp 200.000 / Kamar (Tunai / Pre-auth saat check-in)</option>
                                    <option value="Rp 300.000 / Kamar / Malam">Rp 300.000 / Kamar (Standar Bintang 4-5)</option>
                                    <option value="Kartu Kredit Pre-Auth Saat Check-In">Kartu Kredit Pre-Auth Saat Check-In</option>
                                    <option value="Dijamin Penuh oleh Master Account Instansi">Dijamin Penuh oleh Master Account Instansi</option>
                                    <option value="Bebas Incidental Deposit (Khusus VVIP)">Bebas Incidental Deposit (Khusus VVIP / Bebas Deposit)</option>
                                </select>
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Waktu Operasional Standar Hotel</label>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "11.5px", color: "#64748b", whiteSpace: "nowrap", fontWeight: 600 }}>CI:</span>
                                        <input
                                            type="text"
                                            className={styles.cellInput}
                                            value={formData.checkInTime || "14:00 WIB"}
                                            onChange={(e) => updateFormField("checkInTime", e.target.value)}
                                            placeholder="14:00 WIB"
                                        />
                                    </div>
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "11.5px", color: "#64748b", whiteSpace: "nowrap", fontWeight: 600 }}>CO:</span>
                                        <input
                                            type="text"
                                            className={styles.cellInput}
                                            value={formData.checkOutTime || "12:00 WIB"}
                                            onChange={(e) => updateFormField("checkOutTime", e.target.value)}
                                            placeholder="12:00 WIB"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: ALOKASI KAMAR & TARIF (TARA PMS LANDSCAPE SPREADSHEET TABLE) */}
                    <div className={styles.vhpCard}>
                        <div className={styles.vhpCardHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Bed size={16} weight="bold" />
                                <span>2. Tabel Alokasi Kamar & Harga Per Malam (Accommodation Allotment Matrix)</span>
                            </div>
                            <div className={styles.vhpHeaderActionRow}>
                                <button
                                    className={`${styles.btnAction} ${styles.btnPrimary}`}
                                    onClick={addRoomItem}
                                >
                                    <Plus size={14} weight="bold" />
                                    Tambah Baris Kamar
                                </button>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.vhpTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.vhpTh} style={{ width: "35px" }}>#</th>
                                        <th className={styles.vhpThLeft} style={{ width: "220px" }}>Tipe Kamar (Room Category)</th>
                                        <th className={styles.vhpTh} style={{ width: "130px" }}>Bedding</th>
                                        <th className={styles.vhpTh} style={{ width: "110px" }}>Meal Plan</th>
                                        <th className={styles.vhpTh} style={{ width: "80px" }}>Qty Kamar</th>
                                        <th className={styles.vhpTh} style={{ width: "70px" }}>Malam</th>
                                        <th className={styles.vhpThRight} style={{ width: "140px" }}>Tarif / Malam (Nett IDR)</th>
                                        <th className={styles.vhpThLeft}>Fasilitas & Inklusi Kamar</th>
                                        <th className={styles.vhpThRight} style={{ width: "140px" }}>Subtotal (IDR)</th>
                                        <th className={styles.vhpTh} style={{ width: "50px" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.rooms && formData.rooms.length > 0 ? (
                                        formData.rooms.map((room, idx) => {
                                            const qty = Number(room.roomCount || room.quantity) || 1;
                                            const nights = Number(room.nights) || formData.totalNights || 1;
                                            const rate = Number(room.ratePerNight || room.nightlyRate) || 0;
                                            const subtotal = qty * nights * rate;

                                            return (
                                                <tr key={room.id || idx} className={styles.vhpRow}>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td>
                                                        {availableRoomTypes && availableRoomTypes.length > 0 ? (
                                                            <select
                                                                className={styles.vhpTableInput}
                                                                value={room.roomTypeId || ""}
                                                                onChange={(e) => updateRoomItem(room.id || idx, "roomTypeId", e.target.value)}
                                                            >
                                                                <option value="">-- Pilih Tipe Kamar --</option>
                                                                {availableRoomTypes.map((rt) => (
                                                                    <option key={rt.id} value={rt.id}>
                                                                        {rt.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                className={styles.vhpTableInput}
                                                                value={room.roomTypeName || ""}
                                                                onChange={(e) => updateRoomItem(room.id || idx, "roomTypeName", e.target.value)}
                                                                placeholder="Deluxe King / Twin"
                                                            />
                                                        )}
                                                    </td>
                                                    <td>
                                                        {(() => {
                                                            const matchedRt = availableRoomTypes?.find(rt => rt.id === room.roomTypeId || rt.name === room.roomTypeName);
                                                            const rtBed = matchedRt?.bedType;
                                                            return (
                                                                <select
                                                                    className={styles.vhpTableInput}
                                                                    value={room.bedType || rtBed || "King Bed (180 x 200)"}
                                                                    onChange={(e) => updateRoomItem(room.id || idx, "bedType", e.target.value)}
                                                                >
                                                                    {rtBed && (
                                                                        <option value={rtBed}>
                                                                            ⭐ {rtBed} (Default Tipe Kamar)
                                                                        </option>
                                                                    )}
                                                                    <option value="King Bed (180 x 200)">King Bed (180 x 200)</option>
                                                                    <option value="Twin Bed (2x 100 x 200)">Twin Bed (2x 100 x 200)</option>
                                                                    <option value="Queen Bed (160 x 200)">Queen Bed (160 x 200)</option>
                                                                    <option value="Double Bed (140 x 200)">Double Bed (140 x 200)</option>
                                                                    <option value="Single Bed (90 x 200)">Single Bed (90 x 200)</option>
                                                                    <option value="Hollywood Twin">Hollywood Twin</option>
                                                                    <option value="Extra Bed / Rollaway">Extra Bed / Rollaway</option>
                                                                    {room.bedType && room.bedType !== rtBed && ![
                                                                        "King Bed (180 x 200)", "Twin Bed (2x 100 x 200)", "Queen Bed (160 x 200)",
                                                                        "Double Bed (140 x 200)", "Single Bed (90 x 200)", "Hollywood Twin", "Extra Bed / Rollaway"
                                                                    ].includes(room.bedType) && (
                                                                        <option value={room.bedType}>{room.bedType}</option>
                                                                    )}
                                                                </select>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={styles.vhpTableInput}
                                                            value={room.mealPlanCode || (room.includesBreakfast ? "BB" : "RO")}
                                                            onChange={(e) => {
                                                                const mp = e.target.value as MealPlanCode;
                                                                updateRoomItem(room.id || idx, "mealPlanCode", mp);
                                                                updateRoomItem(room.id || idx, "includesBreakfast", mp !== "RO");
                                                            }}
                                                        >
                                                            <option value="BB">BB (Bed & Breakfast)</option>
                                                            <option value="RO">RO (Room Only)</option>
                                                            <option value="HB">HB (Half Board)</option>
                                                            <option value="FB">FB (Full Board)</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={styles.vhpTableInput}
                                                            style={{ textAlign: "center", fontWeight: 700 }}
                                                            value={qty}
                                                            min={1}
                                                            onChange={(e) => updateRoomItem(room.id || idx, "quantity", parseInt(e.target.value) || 1)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={styles.vhpTableInput}
                                                            style={{ textAlign: "center" }}
                                                            value={nights}
                                                            min={1}
                                                            onChange={(e) => updateRoomItem(room.id || idx, "nights", parseInt(e.target.value) || 1)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={styles.vhpTableInput}
                                                            style={{ textAlign: "right", fontWeight: 700 }}
                                                            value={rate}
                                                            min={0}
                                                            step={25000}
                                                            onChange={(e) => updateRoomItem(room.id || idx, "ratePerNight", parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className={styles.vhpTableInput}
                                                            value={room.inclusions || ""}
                                                            onChange={(e) => updateRoomItem(room.id || idx, "inclusions", e.target.value)}
                                                            placeholder="Termasuk Sarapan 2 Pax, Free High-speed WiFi, Welcome Drink"
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a" }}>
                                                        {formatCurrency(subtotal)}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            className={styles.btnDanger}
                                                            onClick={() => removeRoomItem(room.id || idx)}
                                                            title="Hapus Baris Kamar"
                                                        >
                                                            <Trash size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={10} style={{ textAlign: "center", padding: "16px", color: "#94a3b8" }}>
                                                Belum ada alokasi kamar. Klik tombol &ldquo;Tambah Baris Kamar&rdquo; di atas untuk memasukkan kuota kamar.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className={styles.vhpFooterRow}>
                                        <td colSpan={4} style={{ textAlign: "right" }}>
                                            TOTAL ALOKASI AKOMODASI:
                                        </td>
                                        <td style={{ textAlign: "center", fontWeight: 800 }}>
                                            {totalRoomsCount} Kamar
                                        </td>
                                        <td style={{ textAlign: "center", fontWeight: 800 }}>
                                            {totalRoomNightsCount} RN
                                        </td>
                                        <td colSpan={2} style={{ textAlign: "right", color: "#64748b", fontSize: "11px" }}>
                                            SUBTOTAL AKOMODASI (IDR NETT):
                                        </td>
                                        <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a", fontSize: "12px" }}>
                                            {formatCurrency(totalRoomsSubtotal)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* CARD 3: PAKET MICE & RUANG PERTEMUAN (LANDSCAPE SPREADSHEET TABLE) */}
                    <div className={styles.vhpCard}>
                        <div className={styles.vhpCardHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <UsersThree size={16} weight="bold" />
                                <span>3. Tabel Paket MICE & Ruang Rapat / Jamuan (Function Space & Banquet Matrix)</span>
                            </div>
                            <div className={styles.vhpHeaderActionRow}>
                                <button
                                    className={`${styles.btnAction} ${styles.btnPrimary}`}
                                    onClick={addMeetingPackage}
                                >
                                    <Plus size={14} weight="bold" />
                                    Tambah Paket MICE
                                </button>
                            </div>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.vhpTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.vhpTh} style={{ width: "35px" }}>#</th>
                                        <th className={styles.vhpThLeft} style={{ width: "200px" }}>Nama Paket / Ruang Rapat</th>
                                        <th className={styles.vhpTh} style={{ width: "130px" }}>Layout Setup</th>
                                        <th className={styles.vhpTh} style={{ width: "80px" }}>Pax</th>
                                        <th className={styles.vhpTh} style={{ width: "70px" }}>Hari</th>
                                        <th className={styles.vhpThRight} style={{ width: "140px" }}>Tarif / Pax / Hari (Nett)</th>
                                        <th className={styles.vhpThLeft}>Perlengkapan Standar & Catering Termasuk</th>
                                        <th className={styles.vhpThRight} style={{ width: "140px" }}>Subtotal (IDR)</th>
                                        <th className={styles.vhpTh} style={{ width: "50px" }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.meetingPackages && formData.meetingPackages.length > 0 ? (
                                        formData.meetingPackages.map((pkg, idx) => {
                                            const pax = Number(pkg.pax) || 0;
                                            const days = Number(pkg.days) || 1;
                                            const rate = Number(pkg.ratePerPax) || 0;
                                            const subtotal = pax * days * rate;

                                            return (
                                                <tr key={pkg.id || idx} className={styles.vhpRow}>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#64748b" }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className={styles.vhpTableInput}
                                                            value={pkg.packageName || pkg.name || ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                updateMeetingPackage(pkg.id || idx, "packageName", val);
                                                                updateMeetingPackage(pkg.id || idx, "name", val);
                                                            }}
                                                            placeholder="Fullboard Meeting / Grand Ballroom"
                                                        />
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={styles.vhpTableInput}
                                                            value={pkg.roomSetup || "Classroom"}
                                                            onChange={(e) => updateMeetingPackage(pkg.id || idx, "roomSetup", e.target.value)}
                                                        >
                                                            <option value="Classroom">Classroom Setup</option>
                                                            <option value="U-Shape">U-Shape Setup</option>
                                                            <option value="Theater">Theater Setup</option>
                                                            <option value="Round Table">Round Table (Banquet)</option>
                                                            <option value="Boardroom">Boardroom</option>
                                                            <option value="Hollow Square">Hollow Square</option>
                                                            <option value="Reception / Standing">Reception / Standing</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={styles.vhpTableInput}
                                                            style={{ textAlign: "center", fontWeight: 700 }}
                                                            value={pax}
                                                            min={1}
                                                            onChange={(e) => updateMeetingPackage(pkg.id || idx, "pax", parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={styles.vhpTableInput}
                                                            style={{ textAlign: "center" }}
                                                            value={days}
                                                            min={1}
                                                            onChange={(e) => updateMeetingPackage(pkg.id || idx, "days", parseInt(e.target.value) || 1)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className={styles.vhpTableInput}
                                                            style={{ textAlign: "right", fontWeight: 700 }}
                                                            value={rate}
                                                            min={0}
                                                            step={10000}
                                                            onChange={(e) => updateMeetingPackage(pkg.id || idx, "ratePerPax", parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className={styles.vhpTableInput}
                                                            value={pkg.inclusions || ""}
                                                            onChange={(e) => updateMeetingPackage(pkg.id || idx, "inclusions", e.target.value)}
                                                            placeholder="2x Coffee Break, 1x Lunch, 1x Dinner, LCD Screen, Wireless Mic, Meeting Kit"
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a" }}>
                                                        {formatCurrency(subtotal)}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            className={styles.btnDanger}
                                                            onClick={() => removeMeetingPackage(pkg.id || idx)}
                                                            title="Hapus Paket MICE"
                                                        >
                                                            <Trash size={13} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={9} style={{ textAlign: "center", padding: "14px", color: "#94a3b8", fontStyle: "italic" }}>
                                                Hanya reservasi akomodasi kamar (tanpa paket pertemuan). Klik &ldquo;Tambah Paket MICE&rdquo; jika reservasi menyertakan ruang rapat atau jamuan F&B.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {formData.meetingPackages && formData.meetingPackages.length > 0 && (
                                    <tfoot>
                                        <tr className={styles.vhpFooterRow}>
                                            <td colSpan={3} style={{ textAlign: "right" }}>
                                                TOTAL MICE / FUNCTION SPACE:
                                            </td>
                                            <td style={{ textAlign: "center", fontWeight: 800 }}>
                                                {totalMicePaxCount} Pax
                                            </td>
                                            <td colSpan={3} style={{ textAlign: "right", color: "#64748b", fontSize: "11px" }}>
                                                SUBTOTAL PAKET MICE (IDR NETT):
                                            </td>
                                            <td style={{ textAlign: "right", fontWeight: 800, color: "#16a34a", fontSize: "12px" }}>
                                                {formatCurrency(totalMiceSubtotal)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* CARD 4: PROTOKOL PENAGIHAN, PERBANKAN & PENANDATANGAN RESMI */}
                    <div className={styles.vhpCard}>
                        <div className={styles.vhpCardHeader}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CreditCard size={17} weight="bold" />
                                <span>4. Protokol Penagihan, Rekening Bank Hotel & Penandatangan Resmi (Billing & Bank Details)</span>
                            </div>
                        </div>

                        <div className={styles.landscapeFormGrid}>
                            {/* Baris 1: Metode & Rekening Bank */}
                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Metode Penagihan Utama (Billing Arrangement) *</label>
                                <select
                                    className={styles.cellSelect}
                                    value={formData.paymentTerms?.billingArrangement || "Bill to Company (BTC)"}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        billingArrangement: e.target.value
                                    })}
                                >
                                    <option value="Bill to Company (BTC)">Bill to Company (BTC / Tagihan Invoice SPK Instansi)</option>
                                    <option value="Corporate SPK / Surat Jaminan">Corporate SPK / Surat Jaminan Dinas (Letter of Guarantee)</option>
                                    <option value="Bank Transfer (Full Pre-Payment)">Bank Transfer Sebelum Check-in (Full Pre-Payment)</option>
                                    <option value="Direct Payment (Tamu Bayar Mandiri)">Direct Payment (Tamu Bayar Langsung di Hotel Saat Check-in)</option>
                                    <option value="Deposit 50% & Pelunasan Saat Check-in">Deposit DP 50% & Pelunasan Saldo Saat Check-in</option>
                                </select>
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Nama Bank Hotel *</label>
                                <input
                                    type="text"
                                    list="bankOptionsList"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.bankName || branding.bankName || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        bankName: e.target.value
                                    })}
                                    placeholder="Contoh: BCA / Mandiri / BNI"
                                />
                                <datalist id="bankOptionsList">
                                    <option value="BCA" />
                                    <option value="Bank Mandiri" />
                                    <option value="BNI" />
                                    <option value="BRI" />
                                    <option value="Bank Syariah Indonesia (BSI)" />
                                    <option value="CIMB Niaga" />
                                    <option value="Permata Bank" />
                                </datalist>
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Nomor Rekening Bank Hotel *</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.bankAccountNumber || branding.bankAccountNumber || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        bankAccountNumber: e.target.value
                                    })}
                                    placeholder="137-00-xxxx-xxx"
                                />
                            </div>

                            {/* Baris 2: Atas Nama Rekening & Tombol Simpan Default */}
                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Nama Pemilik Rekening / Atas Nama (A.n) *</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.bankAccountName || branding.bankAccountName || branding.name || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        bankAccountName: e.target.value
                                    })}
                                    placeholder="PT Tara Setia Hospitality / Nama Badan Usaha Hotel"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col6}`} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={handleSaveBankDefault}
                                        disabled={isSavingBank}
                                        className={`${styles.btnAction} ${styles.btnPrimary}`}
                                        style={{ height: "34px", fontSize: "12px", padding: "0 16px", flexShrink: 0 }}
                                        title="Simpan nomor rekening ini agar selalu otomatis muncul pada Confirmation Letter berikutnya"
                                    >
                                        <FloppyDisk size={15} weight="bold" />
                                        {isSavingBank ? "Menyimpan..." : "Simpan Sebagai Default Bank Hotel"}
                                    </button>
                                    {bankSaveMessage && (
                                        <span style={{ fontSize: "11.5px", color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                            <CheckCircle size={15} weight="fill" /> {bankSaveMessage}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Sub-Section B: Ketentuan Pembayaran & Tagihan */}
                            <div className={styles.formSectionDivider}>
                                <span className={styles.formSectionDividerText}>
                                    <CreditCard size={15} weight="bold" /> Ketentuan Pembayaran DP & Master Account
                                </span>
                            </div>

                            {/* Baris 3: DP & Master Account */}
                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Nominal Uang Muka / DP (IDR)</label>
                                <input
                                    type="number"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.depositAmount || 0}
                                    min={0}
                                    step={100000}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        depositAmount: parseFloat(e.target.value) || 0
                                    })}
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Jatuh Tempo Pembayaran DP</label>
                                <input
                                    type="date"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.depositDueDate || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        depositDueDate: e.target.value
                                    })}
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Ketetapan Master Account (Tagihan Instansi)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.masterAccountBilling || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        masterAccountBilling: e.target.value
                                    })}
                                    placeholder="Sewa kamar dan paket meeting resmi dibebankan kepada instansi pemesan (Master Account BTC)."
                                />
                            </div>

                            {/* Baris 4: Personal Incidentals & Notes */}
                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Ketetapan Pengeluaran Pribadi (Personal Incidentals)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.personalIncidentalBilling || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        personalIncidentalBilling: e.target.value
                                    })}
                                    placeholder="Pengeluaran pribadi tamu (Minibar, Laundry, Room Service) diselesaikan langsung oleh masing-masing tamu saat check-out."
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col6}`}>
                                <label className={styles.fieldLabel}>Instruksi Penagihan & Faktur (Billing Notes)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.paymentTerms?.billingNotes || ""}
                                    onChange={(e) => updateFormField("paymentTerms", {
                                        ...formData.paymentTerms,
                                        billingNotes: e.target.value
                                    })}
                                    placeholder="Faktur tagihan resmi (Invoice) beserta kelengkapan SPK asli akan dikirimkan ke bagian keuangan instansi."
                                />
                            </div>

                            {/* Sub-Section C: Pejabat Penandatangan */}
                            <div className={styles.formSectionDivider}>
                                <span className={styles.formSectionDividerText}>
                                    <Signature size={15} weight="bold" /> Pejabat Penandatangan Resmi (Authorized Signatories)
                                </span>
                            </div>

                            {/* Baris 5: Signatories */}
                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Nama Pejabat Pihak Hotel *</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.signatoryHotel?.name || formData.hotelSignatory?.name || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("signatoryHotel", { ...formData.signatoryHotel, name: val });
                                        updateFormField("hotelSignatory", { ...formData.hotelSignatory, name: val });
                                    }}
                                    placeholder="Director of Sales & Marketing"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Jabatan Pejabat Pihak Hotel</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.signatoryHotel?.title || formData.hotelSignatory?.title || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("signatoryHotel", { ...formData.signatoryHotel, title: val });
                                        updateFormField("hotelSignatory", { ...formData.hotelSignatory, title: val });
                                    }}
                                    placeholder="Director of Sales / FOM"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Nama Pejabat Pihak Pemesan (PPK / Client)</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.signatoryClient?.name || formData.clientSignatory?.name || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("signatoryClient", { ...formData.signatoryClient, name: val });
                                        updateFormField("clientSignatory", { ...formData.clientSignatory, name: val });
                                    }}
                                    placeholder="Pejabat Pembuat Komitmen (PPK)"
                                />
                            </div>

                            <div className={`${styles.fieldItem} ${styles.col3}`}>
                                <label className={styles.fieldLabel}>Jabatan Pejabat Pihak Pemesan</label>
                                <input
                                    type="text"
                                    className={styles.cellInput}
                                    value={formData.signatoryClient?.title || formData.clientSignatory?.title || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateFormField("signatoryClient", { ...formData.signatoryClient, title: val });
                                        updateFormField("clientSignatory", { ...formData.clientSignatory, title: val });
                                    }}
                                    placeholder="PPK / General Manager"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FINANCIAL SUMMARY COUNTERS BAR */}
                    <div className={styles.financialBar}>
                        <div className={styles.financialCard}>
                            <div className={styles.financialLabel}>Subtotal Akomodasi</div>
                            <div className={styles.financialValue}>
                                {formatCurrency(totalRoomsSubtotal)}
                            </div>
                        </div>

                        <div className={styles.financialCard}>
                            <div className={styles.financialLabel}>Subtotal MICE & Banquet</div>
                            <div className={styles.financialValue}>
                                {formatCurrency(totalMiceSubtotal)}
                            </div>
                        </div>

                        <div className={styles.financialCard} style={{ borderColor: "#b49b67" }}>
                            <div className={styles.financialLabel} style={{ color: "#8d7a52" }}>
                                Total Perjanjian (Grand Total IDR)
                            </div>
                            <div className={`${styles.financialValue} ${styles.financialValueGold}`}>
                                {formatCurrency(formData.grandTotal || (totalRoomsSubtotal + totalMiceSubtotal))}
                            </div>
                        </div>

                        <div className={styles.financialCard}>
                            <div className={styles.financialLabel}>Ketentuan DP & Jaminan</div>
                            <div className={styles.financialValue} style={{ fontSize: "12.5px" }}>
                                {formData.paymentTerms?.depositAmount
                                    ? formatCurrency(formData.paymentTerms.depositAmount)
                                    : "Full Settlement BTC"}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                       LIVE 5-STAR HOTEL DOCUMENT SHEET (A4 PREVIEW BELOW CONSOLE)
                       ═══════════════════════════════════════════════════════════ */}
                    {showPreviewSheet && (
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    background: "#1e293b",
                                    color: "#dfd3b2",
                                    borderRadius: "6px 6px 0 0",
                                    fontSize: "12px",
                                    fontWeight: 700
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Printer size={16} />
                                    <span>Pratinjau Lembar Cetak Dokumen Resmi Hotel Bintang 5 (A4 Portrait Sheet)</span>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        className={`${styles.btnAction} ${styles.btnSecondary}`}
                                        style={{ padding: "3px 8px", fontSize: "11px" }}
                                        onClick={() => window.print()}
                                    >
                                        <Printer size={14} /> Cetak Langsung PDF A4
                                    </button>
                                </div>
                            </div>
                            <div className={styles.sheetSection}>
                                <ConfirmationLetterPreview letter={formData} branding={branding} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dedicated Native Print Portal attached to document.body (GRC & Invoice Architecture) */}
            {mounted && createPortal(
                <div id="cl-native-print-sheet">
                    <ConfirmationLetterPreview letter={formData} branding={branding} isPrintPortal={true} />
                </div>,
                document.body
            )}
        </div>
    );
}
