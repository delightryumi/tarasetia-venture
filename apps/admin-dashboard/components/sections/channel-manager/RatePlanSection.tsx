"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRatePlans } from "@/lib/rate-plans/useRatePlans";
import { useRoomTypes } from "../rooms/useRoomTypes";
import { MyTaraRatePlan } from "@/lib/channex/types";
import {
    Plus,
    X,
    BedDouble,
    Coffee,
    Minus,
    Copy
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAmount } from "@/lib/currency-utils";
import { toast } from "sonner";
import { RatePlanDesktopView } from "./RatePlanDesktopView";
import { RatePlanMobileView } from "./RatePlanMobileView";
import styles from "./RatePlanSection.module.css";

interface RatePlanSectionProps {
    embedded?: boolean;
}

export const RatePlanSection: React.FC<RatePlanSectionProps> = ({ embedded = false }) => {
    const { activeHotelCode } = useAuth();
    const [pingingId, setPingingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"folio" | "ledger">("folio");
    const [channexPropertyId, setChannexPropertyId] = useState<string>("");
    const [expandedIdRows, setExpandedIdRows] = useState<string[]>([]);

    const toggleExpandRow = (id: string) => {
        setExpandedIdRows(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setChannexPropertyId("");
            return;
        }
        getDoc(doc(db, "hotels", activeHotelCode)).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const pId = data.channexPropertyId || data.channelManager?.channexPropertyId || data.channelManager?.propertyId || "";
                setChannexPropertyId(pId);
            }
        }).catch(err => console.warn("RatePlan load property id note:", err));
    }, [activeHotelCode]);

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
        saving: savingRates,
        addRatePlan,
        updateRatePlan,
        deleteRatePlan,
        seedDefaultRatePlans
    } = useRatePlans();

    const { roomTypes } = useRoomTypes();

    const { currencyCode, config: currConfig } = useCurrency();
    const isIDR = (currencyCode || "IDR").toUpperCase() === "IDR";
    const defaultFallbackRoomPrice = isIDR ? 500000 : (currencyCode === "JPY" ? 5000 : 50);
    const defaultBreakfastFee = isIDR ? 75000 : (currencyCode === "JPY" ? 1000 : 10);
    const stepValue = currConfig?.step || (isIDR ? "5000" : "1");

    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MyTaraRatePlan | null>(null);

    // Form fields
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formMeals, setFormMeals] = useState<boolean>(false);
    const [formBreakfastRate, setFormBreakfastRate] = useState<number>(defaultBreakfastFee);
    const [formPolicy, setFormPolicy] = useState<"FREE" | "NON_REFUNDABLE" | "MODERATE">("FREE");
    const [formMinStay, setFormMinStay] = useState<number>(1);
    const [formStopSell, setFormStopSell] = useState<boolean>(false);

    // Checklist of room types included in this Rate Plan
    const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
    // Per-room net PMS rates: { [roomTypeId]: number }
    const [roomRates, setRoomRates] = useState<Record<string, number>>({});

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen]);

    const applyPreset = (name: string, code: string, meals: boolean) => {
        setFormName(name);
        setFormCode(code);
        setFormMeals(meals);
        if (meals && (!formBreakfastRate || formBreakfastRate === 0)) {
            setFormBreakfastRate(defaultBreakfastFee);
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
        setFormName("Best Available Rate");
        setFormCode("BAR");
        setFormMeals(false);
        setFormBreakfastRate(defaultBreakfastFee);
        setFormPolicy("FREE");
        setFormMinStay(1);
        setFormStopSell(false);

        // Pre-check all rooms by default
        const allIds = roomTypes.map(r => r.id);
        setSelectedRoomTypeIds(allIds);

        const initialRates: Record<string, number> = {};
        roomTypes.forEach(rt => {
            initialRates[rt.id] = Number(rt.price || rt.basePrice || defaultFallbackRoomPrice);
        });
        setRoomRates(initialRates);
        setIsModalOpen(true);
    };

    const openEditModal = (plan: MyTaraRatePlan) => {
        setEditingPlan(plan);
        setFormName(plan.name || "");
        setFormCode(plan.code || "");
        setFormMeals(Boolean(plan.mealsIncluded));
        setFormBreakfastRate(Number(plan.breakfastRate || defaultBreakfastFee));
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
                initialRates[rt.id] = Number(rt.price || rt.basePrice || plan.baseRate || defaultFallbackRoomPrice);
            }
        });
        setRoomRates(initialRates);
        setIsModalOpen(true);
    };

    const handleMealsToggle = (meals: boolean) => {
        setFormMeals(meals);
        if (meals && (!formBreakfastRate || formBreakfastRate === 0)) {
            setFormBreakfastRate(defaultBreakfastFee);
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
            activeRates[id] = Number(roomRates[id] ?? rt?.price ?? rt?.basePrice ?? defaultFallbackRoomPrice);
        });

        const primaryRoomId = selectedRoomTypeIds[0] || "";
        const primaryRoomName = selectedRoomNames[0] || "";
        const primaryBaseRate = activeRates[primaryRoomId] || defaultFallbackRoomPrice;

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
            currency: currencyCode || editingPlan?.currency || "IDR",
            mealsIncluded: formMeals,
            breakfastRate: formMeals ? Number(formBreakfastRate || defaultBreakfastFee) : 0,
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

    const formatPlanRate = (val: number, planCurr?: string) => {
        return formatCurrencyAmount(val, planCurr || currencyCode);
    };

    const commonProps = {
        ratePlans,
        roomTypes,
        currencyCode,
        currConfig,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        openAddModal,
        openEditModal,
        deleteRatePlan,
        handlePingRatePlan,
        pingingId,
        seedDefaultRatePlans,
        savingRates,
        copyToClipboard,
        expandedIdRows,
        toggleExpandRow,
        formatPlanRate,
        channexPropertyId
    };

    return (
        <div className={styles.sectionContainer}>
            {/* Desktop View */}
            <div className={styles.desktopOnly}>
                <RatePlanDesktopView {...commonProps} />
            </div>

            {/* Mobile View */}
            <div className={styles.mobileOnly}>
                <RatePlanMobileView {...commonProps} />
            </div>

            {/* Executive Dialog Modal */}
            {isModalOpen && (
                <div
                    className={styles.modalBackdrop}
                    onClick={() => setIsModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={editingPlan ? "Configure Rate Plan" : "Create Rate Plan"}
                >
                    <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalHeaderLeft}>
                                <span className={styles.modalCategoryTag}>Hotel CRS &amp; Distribution Architecture</span>
                                <h3 className={styles.modalTitle}>
                                    {editingPlan ? "Configure Rate Plan" : "Create Rate Plan"}
                                </h3>
                                <p className={styles.modalSubtitle}>
                                    Define tariff structure, USALI meal allocations, cancellation rules, and room assignments.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className={styles.modalCloseBtn}
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.modalBody}>
                                {editingPlan && (
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                                        <span
                                            className={styles.idPill}
                                            onClick={() => copyToClipboard(editingPlan.id, "PMS Plan ID")}
                                            title="Click to copy PMS Rate Plan ID"
                                        >
                                            <Copy size={9} /> PMS ID: <b>{editingPlan.id}</b>
                                        </span>
                                        {editingPlan.channexRatePlanIds && Object.keys(editingPlan.channexRatePlanIds).length > 0 ? (
                                            Object.entries(editingPlan.channexRatePlanIds).map(([rtId, cUuid]) => {
                                                const rt = roomTypes.find(r => r.id === rtId);
                                                const roomLabel = rt?.name || rtId;
                                                return (
                                                    <span
                                                        key={rtId}
                                                        className={`${styles.idPill} ${styles.idPillChannex}`}
                                                        onClick={() => copyToClipboard(cUuid, `${roomLabel} Channel Manager Rate UUID`)}
                                                        title={`Click to copy Channel Manager Rate Plan UUID: ${cUuid}`}
                                                    >
                                                        <Copy size={9} /> Channel Manager ({roomLabel}): <b>{cUuid}</b>
                                                    </span>
                                                );
                                            })
                                        ) : editingPlan.channexRatePlanId ? (
                                            <span
                                                className={`${styles.idPill} ${styles.idPillChannex}`}
                                                onClick={() => copyToClipboard(editingPlan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                                title={`Click to copy Channel Manager Rate Plan UUID: ${editingPlan.channexRatePlanId}`}
                                            >
                                                <Copy size={9} /> Channel Manager UUID: <b>{editingPlan.channexRatePlanId}</b>
                                            </span>
                                        ) : (
                                            <span
                                                className={`${styles.idPill} ${styles.idPillUnsynced}`}
                                                onClick={() => toast.info("Rate Plan ini belum disinkronkan ke Channel Manager. Buka tab Go Live lalu jalankan Sync Master.")}
                                                title="Belum terdaftar di Channel Manager"
                                            >
                                                Channel Manager: <i>Not Synced (Run Sync Master)</i>
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Quick Templates */}
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        <span>Quick Presets</span>
                                        <span className={styles.formLabelHint}>Standard hospitality rate presets</span>
                                    </label>
                                    <div className={styles.presetChipsRow}>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Best Available Rate", "BAR", false)}
                                            className={`${styles.presetChip} ${formCode === "BAR" ? styles.presetChipActive : ""}`}
                                        >
                                            Best Available Rate (BAR)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Bed & Breakfast Rate", "BB", true)}
                                            className={`${styles.presetChip} ${formCode === "BB" ? styles.presetChipActive : ""}`}
                                        >
                                            Bed &amp; Breakfast Rate (BB)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Room Only (RO)", "RO", false)}
                                            className={`${styles.presetChip} ${formCode === "RO" ? styles.presetChipActive : ""}`}
                                        >
                                            Room Only (RO)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Non-Refundable (NR)", "NR", false)}
                                            className={`${styles.presetChip} ${formCode === "NR" ? styles.presetChipActive : ""}`}
                                        >
                                            Non-Refundable (NR)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyPreset("Long Stay Special (LS)", "LS", false)}
                                            className={`${styles.presetChip} ${formCode === "LS" ? styles.presetChipActive : ""}`}
                                        >
                                            Long Stay (LS)
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
                                            placeholder="e.g. Best Available Rate (BAR)"
                                            className={styles.formInput}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            <span>Rate Code</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formCode}
                                            onChange={e => setFormCode(e.target.value.toUpperCase())}
                                            placeholder="BAR"
                                            className={styles.formInput}
                                            style={{ fontFamily: "var(--font-geist-mono, monospace)", textTransform: "uppercase" }}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Meals & Policy */}
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
                                                <BedDouble size={12} />
                                                <span>Room Only (EP)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMealsToggle(true)}
                                                className={`${styles.segmentBtn} ${formMeals ? styles.segmentBtnActive : ""}`}
                                            >
                                                <Coffee size={12} />
                                                <span>Bed &amp; Breakfast</span>
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
                                    <div className={styles.allocationBox}>
                                        <div className={styles.allocationBoxTitle}>
                                            <span>Breakfast Revenue Allocation (USALI Per Pax)</span>
                                            <span className={styles.formLabelHint}>Per pax per night</span>
                                        </div>
                                        <div className={styles.currencyInputWrapper}>
                                            <span className={styles.currencyPrefix}>{currConfig?.symbol || "Rp"}</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step={stepValue}
                                                value={formBreakfastRate}
                                                onChange={e => setFormBreakfastRate(Number(e.target.value) || 0)}
                                                className={styles.currencyInput}
                                                placeholder={String(defaultBreakfastFee)}
                                                required
                                            />
                                        </div>
                                        <p className={styles.allocationBoxDesc}>
                                            Complies with <strong>USALI standards</strong>: automatically separated into <strong>F&amp;B Breakfast Revenue</strong> per guest per night; remaining balance credited to Rooms Revenue.
                                        </p>
                                    </div>
                                )}

                                {/* Min Stay & Sales Status */}
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
                                                <Minus size={12} />
                                            </button>
                                            <span className={styles.stepperValue}>{formMinStay} Night(s)</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormMinStay(prev => prev + 1)}
                                                className={styles.stepperBtn}
                                            >
                                                <Plus size={12} />
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
                                                <span className={styles.dotBlack} />
                                                <span>Open / Active</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormStopSell(true)}
                                                className={`${styles.segmentBtn} ${formStopSell ? styles.segmentBtnActive : ""}`}
                                            >
                                                <span className={styles.dotGray} />
                                                <span>Stop Sell</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Checklist */}
                                <div className={styles.roomsChecklistSection}>
                                    <div className={styles.roomsChecklistHeader}>
                                        <div className={styles.roomsChecklistTitleBox}>
                                            <span className={styles.roomsChecklistTitle}>
                                                Assigned Room Categories ({selectedRoomTypeIds.length} / {roomTypes.length} Selected)
                                            </span>
                                            <span className={styles.roomsChecklistSubtitle}>
                                                Select applicable room categories and specify base net tariff per night
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
                                        {roomTypes.length === 0 ? (
                                            <div className={styles.emptyRoomsNote}>
                                                <BedDouble size={16} color="#71717a" />
                                                <span>Belum ada kategori tipe kamar. Tambahkan Room Type terlebih dahulu di tab Master Room Types.</span>
                                            </div>
                                        ) : (
                                            roomTypes.map(rt => {
                                                const isChecked = selectedRoomTypeIds.includes(rt.id);
                                                const currentRate = roomRates[rt.id] !== undefined
                                                    ? roomRates[rt.id]
                                                    : Number(rt.price || rt.basePrice || defaultFallbackRoomPrice);

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
                                                                    <BedDouble size={10} /> {rt.physicalRooms?.length || rt.roomCount || 0} Units
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isChecked ? (
                                                            <div className={styles.roomCheckPriceWrapper}>
                                                                <span className={styles.roomCheckPriceLabel}>Base Rate:</span>
                                                                <div className={styles.roomCheckPriceBox}>
                                                                    <span className={styles.roomCheckPrefix}>{currConfig?.symbol || "Rp"}</span>
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        step={stepValue}
                                                                        value={currentRate}
                                                                        onChange={e => handleRoomRateChange(rt.id, Number(e.target.value) || 0)}
                                                                        className={styles.roomCheckInput}
                                                                        placeholder={String(defaultFallbackRoomPrice)}
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
                                            })
                                        )}
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
                                    {savingRates ? "Saving..." : editingPlan ? "Save Changes" : "Create Rate Plan"}
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
