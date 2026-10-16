"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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
    Activity,
    LayoutGrid,
    List,
    SlidersHorizontal,
    ChevronDown,
    ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrencyAmount } from "@/lib/currency-utils";
import { toast } from "sonner";
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
        const unsub = onSnapshot(doc(db, "hotels", activeHotelCode), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const pId = data.channexPropertyId || data.channelManager?.channexPropertyId || data.channelManager?.propertyId || "";
                setChannexPropertyId(pId);
            }
        });
        return () => unsub();
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
        loading: loadingRates,
        saving: savingRates,
        addRatePlan,
        updateRatePlan,
        deleteRatePlan,
        seedDefaultRatePlans
    } = useRatePlans();

    const { roomTypes, loading: loadingRooms } = useRoomTypes();

    const { currencyCode, symbol, config: currConfig } = useCurrency();
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

    // KPI stats
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
            {/* 1. Editorial Header & Masthead */}
            <div className={styles.editorialMasthead}>
                <div className={styles.mastheadMeta}>
                    <span className={styles.mastheadEyebrow}>My Tara Central Reservation · Rate Portfolio</span>
                    <h2 className={styles.mastheadTitle}>Rate Plans &amp; Distribution</h2>
                    <p className={styles.mastheadDesc}>
                        Curated room tariff structures, USALI breakfast allocations, and live two-way ARI distribution across global OTA channels.
                    </p>
                </div>
                <div className={styles.mastheadActions}>
                    {channexPropertyId ? (
                        <div
                            className={styles.currencyPill}
                            onClick={() => copyToClipboard(channexPropertyId, "Channel Manager Property UUID")}
                            title={`Klik untuk menyalin Channel Manager Property UUID: ${channexPropertyId}`}
                            style={{ cursor: "pointer", fontFamily: "var(--font-geist-mono, monospace)" }}
                        >
                            <Copy size={11} />
                            <span>Property UUID: <b>{channexPropertyId}</b></span>
                        </div>
                    ) : null}
                    <div className={styles.currencyPill} title={`Base Currency: ${currConfig?.name || "IDR"}`}>
                        <span>{currConfig?.flag || "🇮🇩"}</span>
                        <span>{currConfig?.code || "IDR"}</span>
                        <span style={{ color: "#71717a" }}>({currConfig?.symbol || "Rp"})</span>
                    </div>
                </div>
            </div>

            {/* 2. Executive Stat Strip (Fluid & Non-Boxy) */}
            <div className={styles.statStrip}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <Layers size={13} /> Rate Structures
                    </span>
                    <span className={styles.statValue}>{totalPlans}</span>
                    <span className={styles.statSubtext}>Active tariff packages</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <CheckCircle2 size={13} /> Room Categories
                    </span>
                    <span className={styles.statValue}>{coveredRooms} / {roomTypes.length}</span>
                    <span className={styles.statSubtext}>Room inventory mapped</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <TrendingUp size={13} /> Average Base Rate (BAR)
                    </span>
                    <span className={styles.statValue}>{formatPlanRate(avgRate)}</span>
                    <span className={styles.statSubtext}>Net PMS base average</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <ShieldCheck size={13} /> Channel Sync
                    </span>
                    <span className={styles.statValue}>2-Way Live</span>
                    <span className={styles.statSubtext}>Channex ARI push ready</span>
                </div>
            </div>

            {/* 3. Editorial Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <Search size={14} color="#71717a" />
                        <input
                            type="text"
                            placeholder="Search rate plans, codes, or rooms..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.toolbarRight}>
                    {/* View Switcher: Folio Cards vs Ledger */}
                    <div className={styles.viewSwitcher}>
                        <button
                            type="button"
                            onClick={() => setViewMode("folio")}
                            className={`${styles.viewBtn} ${viewMode === "folio" ? styles.viewBtnActive : ""}`}
                            title="Switch to Editorial Folio Cards View"
                        >
                            <LayoutGrid size={13} />
                            <span>Folios</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("ledger")}
                            className={`${styles.viewBtn} ${viewMode === "ledger" ? styles.viewBtnActive : ""}`}
                            title="Switch to Editorial Ledger View"
                        >
                            <List size={13} />
                            <span>Ledger</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => seedDefaultRatePlans(roomTypes, currencyCode)}
                        disabled={savingRates}
                        className={styles.btnSeed}
                        title="Auto-create standard Best Available Rate and Bed & Breakfast plans"
                    >
                        <SlidersHorizontal size={13} />
                        <span>Generate Standard Rates</span>
                    </button>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className={styles.btnAddRatePlan}
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Create Rate Plan</span>
                    </button>
                </div>
            </div>

            {/* 4. Content Area: Folios or Ledger */}
            {filteredPlans.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Layers size={22} />
                    </div>
                    <h3 className={styles.emptyTitle}>
                        {ratePlans.length === 0 ? "No Rate Plans Configured" : "No Matching Rate Plans Found"}
                    </h3>
                    <p className={styles.emptySubtitle}>
                        {ratePlans.length === 0
                            ? "Establish your property tariff structures (such as Room Only, Bed & Breakfast, or Non-Refundable) to begin channel distribution."
                            : "Adjust your search filter above to locate specific rate plans or codes."}
                    </p>
                    {ratePlans.length === 0 && (
                        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                            <button
                                type="button"
                                onClick={() => seedDefaultRatePlans(roomTypes, currencyCode)}
                                disabled={savingRates}
                                className={styles.btnSeed}
                            >
                                <SlidersHorizontal size={13} />
                                <span>Generate Standard Rates</span>
                            </button>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className={styles.btnAddRatePlan}
                            >
                                <Plus size={14} strokeWidth={2.5} />
                                <span>Create New Rate Plan</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : viewMode === "folio" ? (
                /* VIEW A: Editorial Folio Cards */
                <div className={styles.folioGrid}>
                    {filteredPlans.map(plan => {
                        const rates = plan.roomRates && Object.keys(plan.roomRates).length > 0
                            ? Object.values(plan.roomRates)
                            : [Number(plan.baseRate || 0)];
                        const minRate = Math.min(...rates);
                        const maxRate = Math.max(...rates);
                        const isRange = minRate !== maxRate && isFinite(minRate) && isFinite(maxRate);

                        const ids = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
                            ? plan.roomTypeIds
                            : (plan.roomTypeId ? [plan.roomTypeId] : []);

                        return (
                            <div key={plan.id} className={styles.folioCard}>
                                {/* Header */}
                                <div className={styles.folioCardHeader}>
                                    <div className={styles.folioTitleArea}>
                                        <span className={styles.folioCodeBadge}>{plan.code || "STD"}</span>
                                        <h3 className={styles.folioPlanName}>{plan.name}</h3>
                                    </div>
                                    <div className={styles.folioTopActions}>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(plan)}
                                            className={styles.btnFolioAction}
                                            title="Edit Rate Plan"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteRatePlan(plan.id)}
                                            className={`${styles.btnFolioAction} ${styles.btnFolioDelete}`}
                                            title="Delete Rate Plan"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Price Showcase */}
                                <div className={styles.folioPriceBox}>
                                    <span className={styles.folioPriceLabel}>Net Base Tariff</span>
                                    <div className={styles.folioPriceAmount}>
                                        {isRange ? (
                                            `${formatPlanRate(minRate, plan.currency)} - ${formatPlanRate(maxRate, plan.currency)}`
                                        ) : (
                                            formatPlanRate(Number(plan.baseRate || minRate || 0), plan.currency)
                                        )}
                                    </div>
                                    <span className={styles.folioPriceSub}>
                                        Per night in {plan.currency || currConfig?.code || "IDR"} (PMS Net Rate)
                                    </span>
                                </div>

                                {/* Specs Grid */}
                                <div className={styles.folioSpecsGrid}>
                                    <div className={styles.folioSpecCol}>
                                        <span className={styles.folioSpecTitle}>Meal Inclusions</span>
                                        <span className={styles.folioSpecValue}>
                                            {plan.mealsIncluded ? (
                                                <>
                                                    <Coffee size={12} />
                                                    <span>Bed &amp; Breakfast</span>
                                                </>
                                            ) : (
                                                <span>Room Only (EP)</span>
                                            )}
                                        </span>
                                    </div>

                                    <div className={styles.folioSpecCol}>
                                        <span className={styles.folioSpecTitle}>Cancellation</span>
                                        <span className={styles.folioSpecValue}>
                                            {plan.cancellationPolicy === "NON_REFUNDABLE"
                                                ? "Non-Refundable"
                                                : plan.cancellationPolicy === "MODERATE"
                                                ? "Moderate Policy"
                                                : "Free Cancellation"}
                                        </span>
                                    </div>

                                    <div className={styles.folioSpecCol}>
                                        <span className={styles.folioSpecTitle}>Minimum Stay</span>
                                        <span className={styles.folioSpecValue}>
                                            {plan.minStay || 1} Night(s)
                                        </span>
                                    </div>

                                    <div className={styles.folioSpecCol}>
                                        <span className={styles.folioSpecTitle}>Sales Status</span>
                                        <span className={styles.folioSpecValue}>
                                            <span className={plan.stopSell ? styles.dotBlack : styles.dotGray} />
                                            {plan.stopSell ? "Stop Sell (Closed)" : "Open for Booking"}
                                        </span>
                                    </div>
                                </div>

                                {/* Assigned Rooms */}
                                <div className={styles.folioRoomsSection}>
                                    <div className={styles.folioRoomsHeader}>
                                        <span className={styles.folioRoomsLabel}>
                                            Linked Categories ({ids.length} of {roomTypes.length})
                                        </span>
                                    </div>
                                    <div className={styles.folioRoomBadges}>
                                        {ids.length === 0 ? (
                                            <span style={{ fontSize: 11, color: "#71717a" }}>All Room Types</span>
                                        ) : ids.length === roomTypes.length && roomTypes.length > 1 ? (
                                            <span className={styles.folioRoomPill}>
                                                <BedDouble size={11} /> All Room Categories ({ids.length})
                                            </span>
                                        ) : (
                                            <>
                                                {ids.slice(0, 3).map(id => {
                                                    const rt = roomTypes.find(r => r.id === id);
                                                    return (
                                                        <span key={id} className={styles.folioRoomPill}>
                                                            <BedDouble size={10} /> {rt?.name || plan.roomTypeName || id}
                                                        </span>
                                                    );
                                                })}
                                                {ids.length > 3 && (
                                                    <span className={styles.folioRoomPillMore}>
                                                        +{ids.length - 3} more
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Footer: Channel Sync & IDs */}
                                <div className={styles.folioCardFooter}>
                                    <div className={styles.folioSyncPill}>
                                        <span className={plan.channexRatePlanId ? styles.dotBlack : styles.dotGray} />
                                        <span>{plan.channexRatePlanId ? "Channel Synced" : "PMS Direct"}</span>
                                    </div>

                                    <div className={styles.folioIdList}>
                                        <span
                                            className={styles.idPill}
                                            onClick={() => copyToClipboard(plan.id, "PMS Plan ID")}
                                            title="Click to copy PMS Rate Plan ID"
                                        >
                                            <Copy size={10} /> PMS: <b>{plan.id}</b>
                                        </span>
                                        {/* Display Channel Manager UUID(s) full without truncation */}
                                        {plan.channexRatePlanIds && Object.keys(plan.channexRatePlanIds).length > 0 ? (
                                            Object.entries(plan.channexRatePlanIds).map(([rtId, cUuid]) => {
                                                const rt = roomTypes.find(r => r.id === rtId);
                                                const roomLabel = rt?.name
                                                    ? (rt.name.toLowerCase().includes("twin")
                                                        ? "Twin"
                                                        : rt.name.toLowerCase().includes("double")
                                                        ? "Double"
                                                        : rt.name)
                                                    : "Room";
                                                return (
                                                    <span
                                                        key={rtId}
                                                        className={`${styles.idPill} ${styles.idPillChannex}`}
                                                        onClick={() => copyToClipboard(cUuid, `${rt?.name || "Room"} Channel Manager Rate UUID`)}
                                                        title={`Click to copy Channel Manager Rate Plan UUID for ${rt?.name || rtId}: ${cUuid}`}
                                                    >
                                                        <Copy size={10} /> Channel Manager ({roomLabel}): <b>{cUuid}</b>
                                                    </span>
                                                );
                                            })
                                        ) : plan.channexRatePlanId ? (
                                            <span
                                                className={`${styles.idPill} ${styles.idPillChannex}`}
                                                onClick={() => copyToClipboard(plan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                                title={`Click to copy Channel Manager Rate Plan UUID: ${plan.channexRatePlanId}`}
                                            >
                                                <Copy size={10} /> Channel Manager: <b>{plan.channexRatePlanId}</b>
                                            </span>
                                        ) : (
                                            <span
                                                className={`${styles.idPill} ${styles.idPillUnsynced}`}
                                                onClick={() => toast.info("Rate Plan ini belum disinkronkan ke Channel Manager. Buka tab Go Live lalu jalankan Sync Master.")}
                                                title="Belum terdaftar di Channel Manager. Jalankan Go Live / Sync Master untuk mendaftarkan rate plan ini."
                                            >
                                                Channel Manager: <i>Not Synced</i>
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handlePingRatePlan(plan)}
                                            disabled={pingingId === plan.id}
                                            className={styles.btnFolioPing}
                                            title="Ping test ARI sync with Channel Manager"
                                        >
                                            <Activity size={10} className={pingingId === plan.id ? "animate-spin" : ""} />
                                            <span>{pingingId === plan.id ? "Pinging" : "Ping ARI"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* VIEW B: Editorial Ledger (Airy, Spacious Table) */
                <div className={styles.ledgerContainer}>
                    <div className={styles.ledgerResponsive}>
                        <table className={styles.ledgerTable}>
                            <thead>
                                <tr>
                                    <th>Rate Plan</th>
                                    <th>Assigned Rooms</th>
                                    <th>Base Net Rate</th>
                                    <th>Meal Plan</th>
                                    <th>Policy</th>
                                    <th>Min. Stay</th>
                                    <th>Status</th>
                                    <th>Sync</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlans.map(plan => {
                                    const rates = plan.roomRates && Object.keys(plan.roomRates).length > 0
                                        ? Object.values(plan.roomRates)
                                        : [Number(plan.baseRate || 0)];
                                    const minRate = Math.min(...rates);
                                    const maxRate = Math.max(...rates);
                                    const isRange = minRate !== maxRate && isFinite(minRate) && isFinite(maxRate);

                                    const ids = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
                                        ? plan.roomTypeIds
                                        : (plan.roomTypeId ? [plan.roomTypeId] : []);

                                    return (
                                        <React.Fragment key={plan.id}>
                                            <tr>
                                                <td>
                                                    <div className={styles.ledgerPlanCell}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <span className={styles.ledgerPlanName}>{plan.name}</span>
                                                            <span className={styles.folioCodeBadge}>
                                                                {plan.code || "STD"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandRow(plan.id)}
                                                            className={`${styles.btnIdToggle} ${expandedIdRows.includes(plan.id) ? styles.btnIdToggleActive : ""}`}
                                                            title="Lihat nomor ID PMS & UUID Channel Manager lengkap"
                                                        >
                                                            <Copy size={9} />
                                                            <span>{expandedIdRows.includes(plan.id) ? "Tutup ID" : "Lihat / Salin ID"}</span>
                                                            {expandedIdRows.includes(plan.id) ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span style={{ fontSize: 12, color: "#18181b" }}>
                                                        {ids.length === roomTypes.length
                                                            ? `All Rooms (${ids.length})`
                                                            : `${ids.length} Room(s)`}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.ledgerRateCell}>
                                                        {isRange ? (
                                                            `${formatPlanRate(minRate, plan.currency)} - ${formatPlanRate(maxRate, plan.currency)}`
                                                        ) : (
                                                            formatPlanRate(Number(plan.baseRate || minRate || 0), plan.currency)
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    {plan.mealsIncluded ? (
                                                        <span className={styles.badgeMonochrome}>
                                                            <Coffee size={11} /> Bed &amp; Breakfast
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#71717a", fontSize: 12 }}>
                                                            Room Only (EP)
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span className={styles.badgeMonochrome}>
                                                        {plan.cancellationPolicy || "FREE"}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                                                        {plan.minStay || 1} Night(s)
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span className={`${styles.badgeMonochrome} ${plan.stopSell ? styles.badgeStopSell : ""}`}>
                                                        <span className={plan.stopSell ? styles.dotGray : styles.dotBlack} />
                                                        {plan.stopSell ? "Stop Sell" : "Open"}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <span className={styles.folioSyncPill}>
                                                            <span className={plan.channexRatePlanId ? styles.dotBlack : styles.dotGray} />
                                                            {plan.channexRatePlanId ? "Synced" : "PMS"}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePingRatePlan(plan)}
                                                            disabled={pingingId === plan.id}
                                                            className={styles.btnFolioPing}
                                                            title="Ping test"
                                                        >
                                                            <Activity size={10} className={pingingId === plan.id ? "animate-spin" : ""} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(plan)}
                                                            className={styles.btnFolioAction}
                                                            title="Edit Plan"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteRatePlan(plan.id)}
                                                            className={`${styles.btnFolioAction} ${styles.btnFolioDelete}`}
                                                            title="Delete Plan"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedIdRows.includes(plan.id) && (
                                                <tr className={styles.ledgerIdTrayRow}>
                                                    <td colSpan={9} className={styles.ledgerIdTrayCell}>
                                                        <div className={styles.ledgerIdTrayInner}>
                                                            <span className={styles.ledgerIdTrayTitle}>Nomor ID Lengkap:</span>
                                                            <span
                                                                className={styles.ledgerIdTrayPill}
                                                                onClick={() => copyToClipboard(plan.id, "PMS Plan ID")}
                                                                title="Klik untuk menyalin PMS Rate Plan ID"
                                                            >
                                                                <Copy size={10} /> PMS ID: <b>{plan.id}</b>
                                                            </span>
                                                            {plan.channexRatePlanIds && Object.keys(plan.channexRatePlanIds).length > 0 ? (
                                                                Object.entries(plan.channexRatePlanIds).map(([rtId, cUuid]) => {
                                                                    const rt = roomTypes.find(r => r.id === rtId);
                                                                    const roomLabel = rt?.name || "Room";
                                                                    return (
                                                                        <span
                                                                            key={rtId}
                                                                            className={styles.ledgerIdTrayPill}
                                                                            onClick={() => copyToClipboard(cUuid, `${roomLabel} Channel Manager Rate UUID`)}
                                                                            title={`Klik untuk menyalin Channel Manager Rate UUID: ${cUuid}`}
                                                                        >
                                                                            <Copy size={10} /> Channel Manager ({roomLabel}): <b>{cUuid}</b>
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : plan.channexRatePlanId ? (
                                                                <span
                                                                    className={styles.ledgerIdTrayPill}
                                                                    onClick={() => copyToClipboard(plan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                                                    title={`Klik untuk menyalin Channel Manager Rate UUID: ${plan.channexRatePlanId}`}
                                                                >
                                                                    <Copy size={10} /> Channel Manager: <b>{plan.channexRatePlanId}</b>
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 5. Luxury Editorial Modal */}
            {isModalOpen && (
                <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
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
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.modalBody}>
                                {editingPlan && (
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                                        <span
                                            className={styles.idPill}
                                            onClick={() => copyToClipboard(editingPlan.id, "PMS Plan ID")}
                                            title="Click to copy PMS Rate Plan ID"
                                        >
                                            <Copy size={10} /> PMS ID: <b>{editingPlan.id}</b>
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
                                                        <Copy size={10} /> Channel Manager ({roomLabel}): <b>{cUuid}</b>
                                                    </span>
                                                );
                                            })
                                        ) : editingPlan.channexRatePlanId ? (
                                            <span
                                                className={`${styles.idPill} ${styles.idPillChannex}`}
                                                onClick={() => copyToClipboard(editingPlan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                                title={`Click to copy Channel Manager Rate Plan UUID: ${editingPlan.channexRatePlanId}`}
                                            >
                                                <Copy size={10} /> Channel Manager UUID: <b>{editingPlan.channexRatePlanId}</b>
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
                                        <span>Quick Templates</span>
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
                                                <BedDouble size={13} />
                                                <span>Room Only (EP)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMealsToggle(true)}
                                                className={`${styles.segmentBtn} ${formMeals ? styles.segmentBtnActive : ""}`}
                                            >
                                                <Coffee size={13} />
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
                                                <BedDouble size={18} color="#71717a" />
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
                                                                <BedDouble size={11} /> {rt.physicalRooms?.length || rt.roomCount || 0} Units
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
                                        }))}
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
