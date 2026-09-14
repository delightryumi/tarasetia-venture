"use client";

import React, { useState } from "react";
import { useRatePlans } from "@/lib/rate-plans/useRatePlans";
import { useRoomTypes } from "../rooms/useRoomTypes";
import { MyTaraRatePlan } from "@/lib/channex/types";
import {
    Plus,
    Trash2,
    Edit2,
    Search,
    Coffee,
    Sparkles,
    ShieldCheck,
    Layers,
    X,
    CheckCircle2,
    BedDouble,
    Minus,
    Copy,
    Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import styles from "./RatePlanSection.module.css";

interface RatePlanSectionProps {
    embedded?: boolean;
}

export const RatePlanSection: React.FC<RatePlanSectionProps> = ({ embedded = false }) => {
    const { activeHotelCode } = useAuth();
    const [pingingId, setPingingId] = useState<string | null>(null);

    const handlePingRatePlan = async (plan: MyTaraRatePlan) => {
        setPingingId(plan.id);
        try {
            const res = await fetch("/api/channex/ping", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "rate_plan",
                    id: plan.id,
                    channexId: plan.channexRatePlanId
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message || "Gagal melakukan ping ke Channex");
            }
        } catch (err: any) {
            toast.error(`Koneksi Ping Error: ${err.message}`);
        } finally {
            setPingingId(null);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} disalin ke clipboard!`);
    };
    const {
        ratePlans,
        loading: loadingRates,
        saving: savingRates,
        addRatePlan,
        updateRatePlan,
        deleteRatePlan,
        seedDefaultRatePlans
    } = useRatePlans();

    const { roomTypes, loading: loadingRooms } = useRoomTypes();

    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MyTaraRatePlan | null>(null);

    // Form fields
    const [formRoomTypeId, setFormRoomTypeId] = useState("");
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formBaseRate, setFormBaseRate] = useState<number>(500000);
    const [formMeals, setFormMeals] = useState<boolean>(false);
    const [formPolicy, setFormPolicy] = useState<"FREE" | "NON_REFUNDABLE" | "MODERATE">("FREE");
    const [formMinStay, setFormMinStay] = useState<number>(1);
    const [formStopSell, setFormStopSell] = useState<boolean>(false);

    const openAddModal = () => {
        setEditingPlan(null);
        const defaultRoom = roomTypes[0];
        setFormRoomTypeId(defaultRoom?.id || "");
        setFormName(defaultRoom ? `${defaultRoom.name} - Room Only` : "");
        setFormCode(defaultRoom ? `${(defaultRoom.name || "RM").slice(0, 3).toUpperCase()}-RO` : "RP-01");
        setFormBaseRate(500000);
        setFormMeals(false);
        setFormPolicy("FREE");
        setFormMinStay(1);
        setFormStopSell(false);
        setIsModalOpen(true);
    };

    const openEditModal = (plan: MyTaraRatePlan) => {
        setEditingPlan(plan);
        setFormRoomTypeId(plan.roomTypeId || "");
        setFormName(plan.name || "");
        setFormCode(plan.code || "");
        setFormBaseRate(Number(plan.baseRate || 0));
        setFormMeals(Boolean(plan.mealsIncluded));
        setFormPolicy(plan.cancellationPolicy || "FREE");
        setFormMinStay(plan.minStay || 1);
        setFormStopSell(Boolean(plan.stopSell));
        setIsModalOpen(true);
    };

    const handleRoomTypeChange = (rtId: string) => {
        setFormRoomTypeId(rtId);
        const rt = roomTypes.find(r => r.id === rtId);
        if (rt && !editingPlan) {
            setFormName(`${rt.name} - ${formMeals ? "With Breakfast" : "Room Only"}`);
            setFormCode(`${(rt.name || "RM").slice(0, 3).toUpperCase()}-${formMeals ? "BB" : "RO"}`);
        }
    };

    const handleMealsToggle = (meals: boolean) => {
        setFormMeals(meals);
        const rt = roomTypes.find(r => r.id === formRoomTypeId);
        if (rt && !editingPlan) {
            setFormName(`${rt.name} - ${meals ? "With Breakfast" : "Room Only"}`);
            setFormCode(`${(rt.name || "RM").slice(0, 3).toUpperCase()}-${meals ? "BB" : "RO"}`);
        }
    };

    const adjustPrice = (delta: number) => {
        setFormBaseRate(prev => Math.max(0, prev + delta));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const selectedRoom = roomTypes.find(r => r.id === formRoomTypeId);
        const roomName = selectedRoom?.name || "Standard Room";

        if (editingPlan) {
            await updateRatePlan(editingPlan.id, {
                roomTypeId: formRoomTypeId,
                roomTypeName: roomName,
                name: formName,
                code: formCode,
                baseRate: Number(formBaseRate),
                mealsIncluded: formMeals,
                cancellationPolicy: formPolicy,
                minStay: Number(formMinStay),
                stopSell: formStopSell
            });
        } else {
            await addRatePlan({
                hotelCode: "",
                roomTypeId: formRoomTypeId,
                roomTypeName: roomName,
                name: formName,
                code: formCode,
                baseRate: Number(formBaseRate),
                currency: "IDR",
                mealsIncluded: formMeals,
                cancellationPolicy: formPolicy,
                minStay: Number(formMinStay),
                stopSell: formStopSell
            });
        }
        setIsModalOpen(false);
    };

    const formatIDR = (val: number) => {
        return new Intl.NumberFormat("id-ID").format(val);
    };

    // Filter
    const filteredPlans = ratePlans.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.name?.toLowerCase().includes(q) ||
            p.code?.toLowerCase().includes(q) ||
            p.roomTypeName?.toLowerCase().includes(q)
        );
    });

    // KPI stats
    const totalPlans = ratePlans.length;
    const coveredRooms = new Set(ratePlans.map(p => p.roomTypeId)).size;
    const avgRate = totalPlans > 0
        ? Math.round(ratePlans.reduce((acc, p) => acc + Number(p.baseRate || 0), 0) / totalPlans)
        : 0;

    return (
        <div className={styles.container}>
            {/* 1. KPI Summary Strip */}
            <div className={styles.kpiSummaryStrip}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <Layers size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Total Rate Plan</span>
                        <span className={styles.kpiValue}>{totalPlans}</span>
                        <span className={styles.kpiSubtext}>Paket harga aktif</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Kategori Tercover</span>
                        <span className={styles.kpiValue}>{coveredRooms} / {roomTypes.length}</span>
                        <span className={styles.kpiSubtext}>Tipe kamar memiliki rate</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <Sparkles size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Rata-rata Base Rate</span>
                        <span className={styles.kpiValue}>Rp {formatIDR(avgRate)}</span>
                        <span className={styles.kpiSubtext}>Harga dasar Net PMS</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <ShieldCheck size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Status Channex</span>
                        <span className={styles.kpiValue}>2-Way</span>
                        <span className={styles.kpiSubtext}>ARI Push Ready</span>
                    </div>
                </div>
            </div>

            {/* 2. Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={15} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Cari rate plan, kode, atau tipe kamar..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.toolbarActions}>
                    {ratePlans.length === 0 && roomTypes.length > 0 && (
                        <button
                            type="button"
                            onClick={() => seedDefaultRatePlans(roomTypes)}
                            disabled={savingRates}
                            className={styles.btnSeed}
                            title="Buat paket otomatis Room Only & Breakfast untuk semua tipe kamar"
                        >
                            <Sparkles size={14} color="#b45309" />
                            <span>⚡ Auto-Generate Standar (RO &amp; BB)</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={openAddModal}
                        className={styles.btnAddRatePlan}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>+ Tambah Rate Plan</span>
                    </button>
                </div>
            </div>

            {/* 3. Table / Empty State */}
            {ratePlans.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Layers size={24} />
                    </div>
                    <h3 style={{ margin: "4px 0", fontSize: "16px", color: "#0f172a" }}>Belum Ada Rate Plan</h3>
                    <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "#64748b", maxWidth: 450 }}>
                        Rate Plan mendefinisikan paket harga jual kamar (seperti Room Only, Termasuk Sarapan, Non-Refundable) yang akan didistribusikan ke OTA melalui Channel Manager.
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {roomTypes.length > 0 && (
                            <button
                                type="button"
                                onClick={() => seedDefaultRatePlans(roomTypes)}
                                className={styles.btnSeed}
                                style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}
                            >
                                <Sparkles size={14} />
                                <span>Generate Otomatis Dari Tipe Kamar</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={openAddModal}
                            className={styles.btnAddRatePlan}
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Buat Rate Plan Manual</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Kode &amp; Nama Rate Plan</th>
                                    <th>Kategori Kamar Induk</th>
                                    <th>Base Net Rate (PMS)</th>
                                    <th>Paket Makan</th>
                                    <th>Kebijakan Batal</th>
                                    <th>Min. Stay</th>
                                    <th>Status Jual</th>
                                    <th>Channex Sync</th>
                                    <th style={{ textAlign: "right" }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlans.map(plan => (
                                    <tr key={plan.id}>
                                        <td>
                                            <div className={styles.planNameCell}>
                                                <span className={styles.planName}>{plan.name}</span>
                                                <span className={styles.planCodeBadge}>{plan.code || "STD-01"}</span>
                                                <div className={styles.idList}>
                                                    <span
                                                        className={styles.idPill}
                                                        onClick={() => copyToClipboard(plan.id, "ID Rate Plan PMS")}
                                                        title="Klik untuk salin ID Rate Plan Internal PMS"
                                                    >
                                                        <Copy size={10} /> PMS ID: <b>{plan.id}</b>
                                                    </span>
                                                    <span
                                                        className={`${styles.idPill} ${plan.channexRatePlanId ? styles.idPillChannex : ""}`}
                                                        onClick={() => copyToClipboard(plan.channexRatePlanId || "", "Channex Rate Plan ID")}
                                                        title="Klik untuk salin UUID Rate Plan Channex"
                                                    >
                                                        <Copy size={10} /> Channex ID: <b>{plan.channexRatePlanId || "(Belum Sync)"}</b>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                <span style={{ fontWeight: 600, color: "#334155" }}>
                                                    {plan.roomTypeName || "Standard"}
                                                </span>
                                                <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
                                                    Room ID: {plan.roomTypeId}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.rateMoneyCell}>
                                                Rp {formatIDR(Number(plan.baseRate || 0))}
                                            </span>
                                        </td>
                                        <td>
                                            {plan.mealsIncluded ? (
                                                <span className={styles.mealBadgeBreakfast}>
                                                    <Coffee size={11} /> Breakfast
                                                </span>
                                            ) : (
                                                <span className={styles.mealBadgeRoomOnly}>
                                                    Room Only
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`${styles.policyBadge} ${
                                                plan.cancellationPolicy === "NON_REFUNDABLE"
                                                    ? styles.policyNonRef
                                                    : plan.cancellationPolicy === "MODERATE"
                                                    ? styles.policyModerate
                                                    : styles.policyFree
                                            }`}>
                                                {plan.cancellationPolicy || "FREE"}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                                                {plan.minStay || 1} Malam
                                            </span>
                                        </td>
                                        <td>
                                            {plan.stopSell ? (
                                                <span className={styles.statusStopSell}>
                                                    <span className={styles.dotRed} />
                                                    Stop Sell
                                                </span>
                                            ) : (
                                                <span className={styles.statusSelling}>
                                                    <span className={styles.dotGreen} />
                                                    Buka
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                                <span className={plan.channexRatePlanId ? styles.statusSelling : styles.statusStopSell} style={{ width: "fit-content" }}>
                                                    <span className={plan.channexRatePlanId ? styles.dotGreen : styles.dotRed} />
                                                    {plan.channexRatePlanId ? "Tersinkron" : "Lokal PMS"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePingRatePlan(plan)}
                                                    disabled={pingingId === plan.id}
                                                    className={styles.btnPing}
                                                    title="Uji coba koneksi ping Rate Plan ini ke Channex Server"
                                                >
                                                    <Activity size={11} className={pingingId === plan.id ? "animate-spin" : ""} />
                                                    <span>{pingingId === plan.id ? "Pinging..." : "⚡ Test Ping"}</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actionsCell} style={{ justifyContent: "flex-end" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(plan)}
                                                    className={styles.btnActionEdit}
                                                >
                                                    <Edit2 size={12} />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteRatePlan(plan.id)}
                                                    className={styles.btnActionDelete}
                                                    title="Hapus Rate Plan"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. Elegant Enterprise Modal */}
            {isModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <span className={styles.modalCategoryTag}>Hotel PMS &amp; Distribution Setup</span>
                                <h3 className={styles.modalTitle}>
                                    {editingPlan ? "Edit Paket Rate Plan" : "Tambah Rate Plan Baru"}
                                </h3>
                                <p className={styles.modalSubtitle}>
                                    Tentukan harga Net PMS dasar, kebijakan sarapan, dan aturan pembatalan OTA.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                {/* Room Type Selector */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        <span>Kategori Kamar Terkait</span>
                                        <span className={styles.formLabelHint}>Wajib dipilih</span>
                                    </label>
                                    <select
                                        value={formRoomTypeId}
                                        onChange={e => handleRoomTypeChange(e.target.value)}
                                        className={styles.formSelect}
                                        required
                                    >
                                        <option value="" disabled>Pilih Kategori Kamar</option>
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.id}>
                                                {rt.name} ({rt.physicalRooms?.length || rt.roomCount || 0} Unit Fisik)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Plan Name & Code */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Nama Rate Plan</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                            placeholder="Contoh: Deluxe King - Room Only"
                                            className={styles.formInput}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Kode Rate (PMS/OTA)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formCode}
                                            onChange={e => setFormCode(e.target.value.toUpperCase())}
                                            placeholder="DLX-RO"
                                            className={styles.formInput}
                                            style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Base Rate Currency Input */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        <span>Harga Dasar Net PMS (Per Malam)</span>
                                        <span className={styles.formLabelHint}>Sebelum komisi/markup OTA</span>
                                    </label>
                                    <div className={styles.currencyInputWrapper}>
                                        <span className={styles.currencyPrefix}>Rp</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={5000}
                                            value={formBaseRate}
                                            onChange={e => setFormBaseRate(Number(e.target.value) || 0)}
                                            className={styles.currencyInput}
                                            required
                                        />
                                    </div>
                                    <div className={styles.presetChipsRow}>
                                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Preset Cepat:</span>
                                        <button type="button" onClick={() => adjustPrice(50000)} className={styles.presetChip}>+50rb</button>
                                        <button type="button" onClick={() => adjustPrice(100000)} className={styles.presetChip}>+100rb</button>
                                        <button type="button" onClick={() => adjustPrice(250000)} className={styles.presetChip}>+250rb</button>
                                        <button type="button" onClick={() => adjustPrice(-50000)} className={styles.presetChip}>-50rb</button>
                                    </div>
                                </div>

                                {/* Meals & Cancellation Policy */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Paket Makanan</span>
                                        </label>
                                        <div className={styles.segmentedGroup}>
                                            <button
                                                type="button"
                                                onClick={() => handleMealsToggle(false)}
                                                className={`${styles.segmentBtn} ${!formMeals ? styles.segmentBtnActive : ""}`}
                                            >
                                                <BedDouble size={13} />
                                                <span>Room Only</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMealsToggle(true)}
                                                className={`${styles.segmentBtn} ${formMeals ? styles.segmentBtnActive : ""}`}
                                            >
                                                <Coffee size={13} />
                                                <span>With Breakfast</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Kebijakan Pembatalan</span>
                                        </label>
                                        <select
                                            value={formPolicy}
                                            onChange={e => setFormPolicy(e.target.value as any)}
                                            className={styles.formSelect}
                                        >
                                            <option value="FREE">Free Cancellation (Bebas Batal)</option>
                                            <option value="NON_REFUNDABLE">Non-Refundable (Tidak Dapat Batal)</option>
                                            <option value="MODERATE">Moderate (Batal s/d H-3)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Min Stay & Stop Sell */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Min. Stay</span>
                                        </label>
                                        <div className={styles.stepperWrapper}>
                                            <button
                                                type="button"
                                                onClick={() => setFormMinStay(prev => Math.max(1, prev - 1))}
                                                className={styles.stepperBtn}
                                            >
                                                <Minus size={13} />
                                            </button>
                                            <span className={styles.stepperValue}>{formMinStay} Malam</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormMinStay(prev => prev + 1)}
                                                className={styles.stepperBtn}
                                            >
                                                <Plus size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Status Penjualan</span>
                                        </label>
                                        <div className={styles.segmentedGroup}>
                                            <button
                                                type="button"
                                                onClick={() => setFormStopSell(false)}
                                                className={`${styles.segmentBtn} ${!formStopSell ? styles.segmentBtnActive : ""}`}
                                            >
                                                <span className={styles.dotGreen} />
                                                <span>Buka (Open)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormStopSell(true)}
                                                className={`${styles.segmentBtn} ${formStopSell ? styles.segmentBtnActive : ""}`}
                                            >
                                                <span className={styles.dotRed} />
                                                <span>Stop Sell</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.btnCancel}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingRates}
                                    className={styles.btnSubmit}
                                >
                                    {savingRates ? "Menyimpan..." : editingPlan ? "Simpan Perubahan" : "+ Tambahkan Rate Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
