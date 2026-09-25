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
    TrendingUp,
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
                toast.error(data.message || "Failed to verify connection status with Channel Manager");
            }
        } catch (err: any) {
            toast.error(`Ping connection error: ${err.message}`);
        } finally {
            setPingingId(null);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
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

    // Form fields (Inverted: Rate Plan as Master, with Room Checklist)
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formMeals, setFormMeals] = useState<boolean>(false);
    const [formBreakfastRate, setFormBreakfastRate] = useState<number>(75000);
    const [formPolicy, setFormPolicy] = useState<"FREE" | "NON_REFUNDABLE" | "MODERATE">("FREE");
    const [formMinStay, setFormMinStay] = useState<number>(1);
    const [formStopSell, setFormStopSell] = useState<boolean>(false);
    
    // Checklist of room types included in this Rate Plan
    const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
    // Per-room net PMS rates: { [roomTypeId]: number }
    const [roomRates, setRoomRates] = useState<Record<string, number>>({});

    const applyPreset = (name: string, code: string, meals: boolean) => {
        setFormName(name);
        setFormCode(code);
        setFormMeals(meals);
        if (meals && (!formBreakfastRate || formBreakfastRate === 0)) {
            setFormBreakfastRate(75000);
        }
    };

    const toggleRoomType = (rtId: string) => {
        setSelectedRoomTypeIds(prev =>
            prev.includes(rtId) ? prev.filter(id => id !== rtId) : [...prev, rtId]
        );
    };

    const handleSelectAllRooms = () => {
        setSelectedRoomTypeIds(roomTypes.map(r => r.id));
    };

    const handleDeselectAllRooms = () => {
        setSelectedRoomTypeIds([]);
    };

    const handleRoomRateChange = (rtId: string, val: number) => {
        setRoomRates(prev => ({
            ...prev,
            [rtId]: Math.max(0, val)
        }));
    };

    const openAddModal = () => {
        setEditingPlan(null);
        setFormName("Room Only (RO)");
        setFormCode("RO");
        setFormMeals(false);
        setFormBreakfastRate(75000);
        setFormPolicy("FREE");
        setFormMinStay(1);
        setFormStopSell(false);

        // Pre-check all rooms by default
        const allIds = roomTypes.map(r => r.id);
        setSelectedRoomTypeIds(allIds);

        const initialRates: Record<string, number> = {};
        roomTypes.forEach(rt => {
            initialRates[rt.id] = Number(rt.price || rt.basePrice || 500000);
        });
        setRoomRates(initialRates);
        setIsModalOpen(true);
    };

    const openEditModal = (plan: MyTaraRatePlan) => {
        setEditingPlan(plan);
        setFormName(plan.name || "");
        setFormCode(plan.code || "");
        setFormMeals(Boolean(plan.mealsIncluded));
        setFormBreakfastRate(Number(plan.breakfastRate || 75000));
        setFormPolicy(plan.cancellationPolicy || "FREE");
        setFormMinStay(plan.minStay || 1);
        setFormStopSell(Boolean(plan.stopSell));

        // Restore checked room types
        const initialSelected = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
            ? plan.roomTypeIds
            : (plan.roomTypeId ? [plan.roomTypeId] : roomTypes.map(r => r.id));
        setSelectedRoomTypeIds(initialSelected);

        const initialRates: Record<string, number> = {};
        roomTypes.forEach(rt => {
            if (plan.roomRates && plan.roomRates[rt.id] !== undefined) {
                initialRates[rt.id] = Number(plan.roomRates[rt.id]);
            } else if (plan.roomTypeId === rt.id && plan.baseRate) {
                initialRates[rt.id] = Number(plan.baseRate);
            } else {
                initialRates[rt.id] = Number(rt.price || rt.basePrice || plan.baseRate || 500000);
            }
        });
        setRoomRates(initialRates);
        setIsModalOpen(true);
    };

    const handleMealsToggle = (meals: boolean) => {
        setFormMeals(meals);
        if (meals && (!formBreakfastRate || formBreakfastRate === 0)) {
            setFormBreakfastRate(75000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRoomTypeIds.length === 0) {
            toast.error("Select at least 1 room category for this rate plan!");
            return;
        }

        const selectedRoomNames = selectedRoomTypeIds.map(id => {
            const rt = roomTypes.find(r => r.id === id);
            return rt?.name || "Standard Room";
        });

        const activeRates: Record<string, number> = {};
        selectedRoomTypeIds.forEach(id => {
            const rt = roomTypes.find(r => r.id === id);
            activeRates[id] = Number(roomRates[id] ?? rt?.price ?? rt?.basePrice ?? 500000);
        });

        const primaryRoomId = selectedRoomTypeIds[0] || "";
        const primaryRoomName = selectedRoomNames[0] || "";
        const primaryBaseRate = activeRates[primaryRoomId] || 500000;

        const payload: Omit<MyTaraRatePlan, "id"> = {
            hotelCode: activeHotelCode,
            name: formName,
            code: formCode,
            roomTypeId: primaryRoomId,
            roomTypeName: primaryRoomName,
            roomTypeIds: selectedRoomTypeIds,
            roomTypeNames: selectedRoomNames,
            roomRates: activeRates,
            baseRate: primaryBaseRate,
            currency: "IDR",
            mealsIncluded: formMeals,
            breakfastRate: formMeals ? Number(formBreakfastRate || 75000) : 0,
            cancellationPolicy: formPolicy,
            minStay: Number(formMinStay),
            stopSell: formStopSell
        };

        if (editingPlan) {
            await updateRatePlan(editingPlan.id, payload);
        } else {
            await addRatePlan(payload);
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
        const hasRoomMatch = p.roomTypeNames?.some(name => name.toLowerCase().includes(q));
        return (
            p.name?.toLowerCase().includes(q) ||
            p.code?.toLowerCase().includes(q) ||
            p.roomTypeName?.toLowerCase().includes(q) ||
            hasRoomMatch
        );
    });

    // KPI stats (Calculated across master rate plans and unique covered room types)
    const totalPlans = ratePlans.length;
    const allCoveredRoomIds = new Set<string>();
    ratePlans.forEach(p => {
        if (p.roomTypeIds && Array.isArray(p.roomTypeIds)) {
            p.roomTypeIds.forEach(id => allCoveredRoomIds.add(id));
        } else if (p.roomTypeId) {
            allCoveredRoomIds.add(p.roomTypeId);
        }
    });
    const coveredRooms = allCoveredRoomIds.size;

    let rateSum = 0;
    let rateCount = 0;
    ratePlans.forEach(p => {
        if (p.roomRates && Object.keys(p.roomRates).length > 0) {
            Object.values(p.roomRates).forEach(r => {
                rateSum += Number(r);
                rateCount++;
            });
        } else {
            rateSum += Number(p.baseRate || 0);
            rateCount++;
        }
    });
    const avgRate = rateCount > 0 ? Math.round(rateSum / rateCount) : 0;

    return (
        <div className={styles.container}>
            {/* 1. KPI Summary Strip */}
            <div className={styles.kpiSummaryStrip}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <Layers size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Total Rate Plans</span>
                        <span className={styles.kpiValue}>{totalPlans}</span>
                        <span className={styles.kpiSubtext}>Active rate structures</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <CheckCircle2 size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Assigned Room Types</span>
                        <span className={styles.kpiValue}>{coveredRooms} / {roomTypes.length}</span>
                        <span className={styles.kpiSubtext}>Categories configured</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <TrendingUp size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Average Base Rate (BAR)</span>
                        <span className={styles.kpiValue}>Rp {formatIDR(avgRate)}</span>
                        <span className={styles.kpiSubtext}>PMS net rate average</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiIconBox}>
                        <ShieldCheck size={18} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Channel Distribution</span>
                        <span className={styles.kpiValue}>2-Way Active</span>
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
                        placeholder="Search rate plans, rate codes, or room types..."
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
                            title="Auto-create standard Room Only & Bed and Breakfast plans for all room types"
                        >
                            <TrendingUp size={14} color="#b45309" />
                            <span>Auto-Generate Standard (RO &amp; BB)</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={openAddModal}
                        className={styles.btnAddRatePlan}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>+ New Rate Plan</span>
                    </button>
                </div>
            </div>

            {/* 3. Table / Empty State */}
            {ratePlans.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Layers size={24} />
                    </div>
                    <h3 style={{ margin: "4px 0", fontSize: "16px", color: "#0f172a" }}>No Rate Plans Configured</h3>
                    <p style={{ margin: "0 0 12px 0", fontSize: "12.5px", color: "#64748b", maxWidth: 450 }}>
                        Rate Plans define room pricing structures (such as Room Only, Bed &amp; Breakfast, Non-Refundable) distributed across OTA channels and the PMS front desk.
                    </p>
                    <div style={{ display: "flex", gap: "10px" }}>
                        {roomTypes.length > 0 && (
                            <button
                                type="button"
                                onClick={() => seedDefaultRatePlans(roomTypes)}
                                className={styles.btnSeed}
                                style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#166534" }}
                            >
                                <TrendingUp size={14} />
                                <span>Auto-Generate Standard Rates</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={openAddModal}
                            className={styles.btnAddRatePlan}
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Create New Rate Plan</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Rate Plan &amp; Code</th>
                                    <th>Assigned Room Types</th>
                                    <th>Base Net Rate (PMS)</th>
                                    <th>Meal Plan</th>
                                    <th>Cancellation Policy</th>
                                    <th>Min. Stay (MLOS)</th>
                                    <th>Sales Status</th>
                                    <th>Channel Sync</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
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
                                                        onClick={() => copyToClipboard(plan.id, "PMS Rate Plan ID")}
                                                        title="Click to copy PMS internal rate plan ID"
                                                    >
                                                        <Copy size={10} /> PMS ID: <b>{plan.id}</b>
                                                    </span>
                                                    <span
                                                        className={`${styles.idPill} ${plan.channexRatePlanId ? styles.idPillChannex : ""}`}
                                                        onClick={() => copyToClipboard(plan.channexRatePlanId || "", "Channel Rate Plan ID")}
                                                        title="Click to copy Channel Rate Plan UUID"
                                                    >
                                                        <Copy size={10} /> Channel ID: <b>{plan.channexRatePlanId || "(Not Synced)"}</b>
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.roomBadgesList}>
                                                {(() => {
                                                    const ids = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
                                                        ? plan.roomTypeIds
                                                        : (plan.roomTypeId ? [plan.roomTypeId] : []);
                                                    
                                                    if (ids.length === 0) {
                                                        return <span style={{ color: "#94a3b8", fontSize: 11 }}>All Room Types</span>;
                                                    }

                                                    if (ids.length === roomTypes.length && roomTypes.length > 1) {
                                                        return (
                                                            <span className={styles.roomBadgePill} style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
                                                                <BedDouble size={11} /> All Room Types ({ids.length})
                                                            </span>
                                                        );
                                                    }

                                                    const visible = ids.slice(0, 2);
                                                    const remaining = ids.length - 2;

                                                    return (
                                                        <>
                                                            {visible.map(id => {
                                                                const rt = roomTypes.find(r => r.id === id);
                                                                return (
                                                                    <span key={id} className={styles.roomBadgePill}>
                                                                        <BedDouble size={10} /> {rt?.name || plan.roomTypeName || id}
                                                                    </span>
                                                                );
                                                            })}
                                                            {remaining > 0 && (
                                                                <span 
                                                                    className={styles.roomBadgePillMore}
                                                                    title={ids.slice(2).map(id => roomTypes.find(r => r.id === id)?.name || id).join(", ")}
                                                                >
                                                                    +{remaining} more
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                {(() => {
                                                    const rates = plan.roomRates && Object.keys(plan.roomRates).length > 0
                                                        ? Object.values(plan.roomRates)
                                                        : [Number(plan.baseRate || 0)];
                                                    const minRate = Math.min(...rates);
                                                    const maxRate = Math.max(...rates);

                                                    if (minRate === maxRate || !isFinite(minRate)) {
                                                        return (
                                                            <span className={styles.rateMoneyCell}>
                                                                Rp {formatIDR(Number(plan.baseRate || minRate || 0))}
                                                            </span>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <span className={styles.rateMoneyCell} style={{ fontSize: 12.5 }}>
                                                                Rp {formatIDR(minRate)} - Rp {formatIDR(maxRate)}
                                                            </span>
                                                            <span style={{ fontSize: 10, color: "#64748b" }}>
                                                                Per room type
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td>
                                            {plan.mealsIncluded ? (
                                                <span className={styles.mealBadgeBreakfast} title={`USALI Allocation: Rp ${(plan.breakfastRate || 75000).toLocaleString('id-ID')} / pax`}>
                                                    <Coffee size={11} /> Bed &amp; Breakfast ({((plan.breakfastRate || 75000) / 1000).toFixed(0)}k/pax)
                                                </span>
                                            ) : (
                                                <span className={styles.mealBadgeRoomOnly}>
                                                    Room Only (EP)
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
                                                {plan.minStay || 1} Night(s)
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
                                                    Open
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                                <span className={plan.channexRatePlanId ? styles.statusSelling : styles.statusStopSell} style={{ width: "fit-content" }}>
                                                    <span className={plan.channexRatePlanId ? styles.dotGreen : styles.dotRed} />
                                                    {plan.channexRatePlanId ? "Synchronized" : "PMS Only"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handlePingRatePlan(plan)}
                                                    disabled={pingingId === plan.id}
                                                    className={styles.btnPing}
                                                    title="Ping test this rate plan against the distribution server"
                                                >
                                                    <Activity size={11} className={pingingId === plan.id ? "animate-spin" : ""} />
                                                    <span>{pingingId === plan.id ? "Pinging..." : "Ping ARI"}</span>
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
                                                    title="Delete Rate Plan"
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

            {/* 4. Elegant Enterprise Modal (Inverted Architecture: Rate Plan with Room Checklist) */}
            {isModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalBox} style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <span className={styles.modalCategoryTag}>Hotel PMS &amp; Distribution Setup</span>
                                <h3 className={styles.modalTitle}>
                                    {editingPlan ? "Edit Rate Plan" : "New Rate Plan"}
                                </h3>
                                <p className={styles.modalSubtitle}>
                                    Configure rate plan details, meal plan inclusions, cancellation policies, and assigned room types.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                {/* Quick Templates */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        <span>Quick Templates</span>
                                        <span className={styles.formLabelHint}>Click to apply standard hospitality rate templates</span>
                                    </label>
                                    <div className={styles.presetChipsRow}>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Room Only (RO)", "RO", false)}
                                            className={styles.presetChip}
                                        >
                                            🏠 Room Only (RO)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("With Breakfast (BB)", "BB", true)}
                                            className={styles.presetChip}
                                        >
                                            🍳 Bed &amp; Breakfast (BB)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Non-Refundable (NR)", "NR", false)}
                                            className={styles.presetChip}
                                        >
                                            🔒 Non-Refundable (NR)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Long Stay Package (LS)", "LS", false)}
                                            className={styles.presetChip}
                                        >
                                            🗓️ Long Stay (LS)
                                        </button>
                                    </div>
                                </div>

                                {/* Plan Name & Code */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Rate Plan Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                            placeholder="e.g. Best Available Rate (BAR) or Room Only (RO)"
                                            className={styles.formInput}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Rate Code (PMS / Channel)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formCode}
                                            onChange={e => setFormCode(e.target.value.toUpperCase())}
                                            placeholder="RO"
                                            className={styles.formInput}
                                            style={{ fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Meals & USALI Breakfast Allocation */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Meal Plan</span>
                                        </label>
                                        <div className={styles.segmentedGroup}>
                                            <button
                                                type="button"
                                                onClick={() => handleMealsToggle(false)}
                                                className={`${styles.segmentBtn} ${!formMeals ? styles.segmentBtnActive : ""}`}
                                            >
                                                <BedDouble size={13} />
                                                <span>Room Only (EP)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMealsToggle(true)}
                                                className={`${styles.segmentBtn} ${formMeals ? styles.segmentBtnActive : ""}`}
                                            >
                                                <Coffee size={13} />
                                                <span>Bed &amp; Breakfast (CP)</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Cancellation Policy</span>
                                        </label>
                                        <select
                                            value={formPolicy}
                                            onChange={e => setFormPolicy(e.target.value as any)}
                                            className={styles.formSelect}
                                        >
                                            <option value="FREE">Free Cancellation (Flexible)</option>
                                            <option value="NON_REFUNDABLE">Non-Refundable</option>
                                            <option value="MODERATE">Moderate (Free cancellation up to 3 days prior)</option>
                                        </select>
                                    </div>
                                </div>

                                {formMeals && (
                                    <div className={styles.formGroup} style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 8, border: '1px dashed rgba(245, 158, 11, 0.4)' }}>
                                        <label className={styles.formLabel} style={{ marginBottom: 4 }}>
                                            <span style={{ color: '#d97706', fontWeight: 700 }}>Breakfast Revenue Allocation (USALI Per Pax)</span>
                                            <span className={styles.formLabelHint}>Dynamic &amp; USALI Standard</span>
                                        </label>
                                        <div className={styles.currencyInputWrapper}>
                                            <span className={styles.currencyPrefix}>Rp</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={5000}
                                                value={formBreakfastRate}
                                                onChange={e => setFormBreakfastRate(Number(e.target.value) || 0)}
                                                className={styles.currencyInput}
                                                placeholder="75000"
                                                required
                                            />
                                        </div>
                                        <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                                            Complies with <strong>USALI (11th/12th Edition)</strong>: automatically allocated to <strong>F&amp;B Breakfast Revenue</strong> per pax per night; remaining balance posts to <strong>Rooms Revenue (Net)</strong>.
                                        </p>
                                    </div>
                                )}

                                {/* Min Stay & Stop Sell */}
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Minimum Stay (MLOS)</span>
                                        </label>
                                        <div className={styles.stepperWrapper}>
                                            <button
                                                type="button"
                                                onClick={() => setFormMinStay(prev => Math.max(1, prev - 1))}
                                                className={styles.stepperBtn}
                                            >
                                                <Minus size={13} />
                                            </button>
                                            <span className={styles.stepperValue}>{formMinStay} Night(s)</span>
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
                                            <span>Sales Status</span>
                                        </label>
                                        <div className={styles.segmentedGroup}>
                                            <button
                                                type="button"
                                                onClick={() => setFormStopSell(false)}
                                                className={`${styles.segmentBtn} ${!formStopSell ? styles.segmentBtnActive : ""}`}
                                            >
                                                <span className={styles.dotGreen} />
                                                <span>Open / Active</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormStopSell(true)}
                                                className={`${styles.segmentBtn} ${formStopSell ? styles.segmentBtnActive : ""}`}
                                            >
                                                <span className={styles.dotRed} />
                                                <span>Stop Sell (Closed)</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Checklist Section */}
                                <div className={styles.roomsChecklistSection}>
                                    <div className={styles.roomsChecklistHeader}>
                                        <div className={styles.roomsChecklistTitleBox}>
                                            <span className={styles.roomsChecklistTitle}>
                                                Assigned Room Types ({selectedRoomTypeIds.length} / {roomTypes.length} Selected)
                                            </span>
                                            <span className={styles.roomsChecklistSubtitle}>
                                                Check room types applicable for this rate plan and set the base net rate per night for each room
                                            </span>
                                        </div>
                                        <div className={styles.roomsChecklistActions}>
                                            <button
                                                type="button"
                                                onClick={handleSelectAllRooms}
                                                className={styles.btnChecklistAction}
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeselectAllRooms}
                                                className={styles.btnChecklistAction}
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.roomsChecklistList}>
                                        {roomTypes.map(rt => {
                                            const isChecked = selectedRoomTypeIds.includes(rt.id);
                                            const currentRate = roomRates[rt.id] !== undefined
                                                ? roomRates[rt.id]
                                                : Number(rt.price || rt.basePrice || 500000);

                                            return (
                                                <div
                                                    key={rt.id}
                                                    className={`${styles.roomCheckCard} ${isChecked ? styles.roomCheckCardActive : ""}`}
                                                >
                                                    <div
                                                        className={styles.roomCheckLeft}
                                                        onClick={() => toggleRoomType(rt.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleRoomType(rt.id)}
                                                            className={styles.roomCheckCheckbox}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <div className={styles.roomCheckInfo}>
                                                            <span className={styles.roomCheckName}>{rt.name}</span>
                                                            <span className={styles.roomCheckUnits}>
                                                                <BedDouble size={11} /> {rt.physicalRooms?.length || rt.roomCount || 0} Physical Units
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {isChecked ? (
                                                        <div className={styles.roomCheckPriceWrapper}>
                                                            <span className={styles.roomCheckPriceLabel}>Base Net Rate:</span>
                                                            <div className={styles.roomCheckPriceBox}>
                                                                <span className={styles.roomCheckPrefix}>Rp</span>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    step={5000}
                                                                    value={currentRate}
                                                                    onChange={e => handleRoomRateChange(rt.id, Number(e.target.value) || 0)}
                                                                    className={styles.roomCheckInput}
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.roomCheckDisabledText}>
                                                            (Excluded)
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={styles.btnCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingRates}
                                    className={styles.btnSubmit}
                                >
                                    {savingRates ? "Saving..." : editingPlan ? "Save Changes" : "+ Create Rate Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatePlanSection;
