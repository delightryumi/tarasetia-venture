"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import {
    collection,
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    writeBatch
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { MyTaraRatePlan, RoomTypeInfo } from "@/lib/channex/types";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";
import {
    RateInventoryTab,
    DayInventoryStatus,
    RatePlanGridRow,
    RoomTypeInventoryRow,
    BulkUpdateParams,
    BulkUpdateItem
} from "./RateInventoryTypes";

export const useRateInventory = () => {
    const { activeHotelCode, activeHotelName, user } = useAuth();
    const { currencyCode: hotelCurrencyCode } = useCurrency(activeHotelCode);

    // Returns identity info for audit logs.
    // Prefers the AuthContext user, falls back to Firebase auth.currentUser
    // so the identity is always the real actor, even if context hasn't hydrated.
    const getAuthorIdentity = useCallback(() => {
        let localUser: any = null;
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("auth_user");
                if (stored) localUser = JSON.parse(stored);
            } catch (_) {}
        }

        const email = user?.email || localUser?.email || auth.currentUser?.email || "";
        const displayName = user?.displayName || user?.name || localUser?.displayName || localUser?.name || auth.currentUser?.displayName || "";
        const name = displayName || (email ? email.split("@")[0] : "Operator");
        const role = user?.role || localUser?.role || "Staff";
        const label = email ? `${name} (${email})` : (name || "Operator");
        return { label, user_name: name, user_email: email, user_role: role };
    }, [user]);

    const isSuperadminRole = user?.role?.toLowerCase() === "superadmin";
    const isSuperadmin = isSuperadminRole || user?.role?.toLowerCase() === "admin";
    const canStopSell = isSuperadmin || user?.permissions?.fo_stopsell === true;
    const canChangeRate = isSuperadmin || user?.permissions?.fo_rate_change === true;
    const canChangeInventory = isSuperadmin || user?.permissions?.fo_inventory_change === true;

    // Active sub-view tab: "inventory" | "rates" | "stopsell"
    const [activeTab, setActiveTab] = useState<RateInventoryTab>("inventory");

    // Date range: 13 days default
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    });
    const [daysCount, setDaysCount] = useState<number>(13);

    // Filters & Display Options
    const [channelFilter, setChannelFilter] = useState<string>("all");
    const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
    const [rateMode, setRateMode] = useState<"base" | "extra_adult" | "extra_child">("base");
    const [hideDerived, setHideDerived] = useState<boolean>(false);
    const [taxInclusive, setTaxInclusive] = useState<boolean>(false);
    const [savedTaxInclusive, setSavedTaxInclusive] = useState<boolean>(false);
    const [taxRate, setTaxRate] = useState<number>(10);
    const [serviceRate, setServiceRate] = useState<number>(10);

    // Load initial Tax Inclusive setting & tax/service rates from payment_gateway settings
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;
        const pgRef = doc(db, "hotels", activeHotelCode, "settings", "payment_gateway");
        getDoc(pgRef).then((snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const isInc = !!data?.pricing?.isTaxIncludedInRate;
                const tRate = typeof data?.pricing?.taxRate === "number" ? data.pricing.taxRate : 10;
                const sRate = typeof data?.pricing?.serviceRate === "number" ? data.pricing.serviceRate : 10;
                setTaxInclusive(isInc);
                setSavedTaxInclusive(isInc);
                setTaxRate(tRate);
                setServiceRate(sRate);
            }
        }).catch((err) => {
            console.error("Error loading tax setting in rate inventory:", err);
        });
    }, [activeHotelCode]);

    // Data states
    const [roomTypes, setRoomTypes] = useState<RoomTypeInfo[]>([]);
    const [ratePlans, setRatePlans] = useState<MyTaraRatePlan[]>([]);
    const [channelConfigs, setChannelConfigs] = useState<Record<string, any>>({});
    const [dailyRevenueMap, setDailyRevenueMap] = useState<Record<string, any[]>>({});
    const [ariOverridesMap, setAriOverridesMap] = useState<Record<string, any>>({});

    // Staged cell modifications for fast inline editing
    const [stagedUpdates, setStagedUpdates] = useState<Record<string, any>>({});
    
    // UI states
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [syncingAri, setSyncingAri] = useState<boolean>(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [bulkModalOpen, setBulkModalOpen] = useState<boolean>(false);
    const [syncingRoomTypeId, setSyncingRoomTypeId] = useState<string | null>(null);

    // Generate array of date strings for the selected window
    const dateList = useMemo(() => {
        const dates: string[] = [];
        const start = new Date(startDate);
        for (let i = 0; i < daysCount; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            dates.push(`${y}-${m}-${day}`);
        }
        return dates;
    }, [startDate, daysCount]);

    // Shift date window by N days
    const shiftDate = useCallback((days: number) => {
        setStartDate(prev => {
            const d = new Date(prev);
            d.setDate(d.getDate() + days);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        });
    }, []);

    // Quick jump to Today
    const jumpToToday = useCallback(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setStartDate(`${y}-${m}-${day}`);
    }, []);

    // 1. Fetch Room Types (Total rooms matching Forecast & Room Type Settings)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") {
            setLoading(false);
            return;
        }

        let isCancelled = false;
        const rtCol = getHotelCollection(db, "roomTypes", activeHotelCode);
        getDocs(rtCol).then((snap) => {
            if (isCancelled) return;
            const rts: RoomTypeInfo[] = [];
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                const physList = Array.isArray(data.physicalRooms)
                    ? data.physicalRooms.map((p: any) => typeof p === 'string' ? p.trim().toUpperCase() : String(p.number || "").trim().toUpperCase()).filter(Boolean)
                    : [];
                
                // Prioritize explicit roomCount, totalRooms, roomsCount, or physicalRooms length
                const roomCount = Number(
                    data.roomCount ?? 
                    data.totalRooms ?? 
                    data.roomsCount ?? 
                    (physList.length > 0 ? physList.length : (data.quantity ?? 1))
                );

                rts.push({
                    id: docSnap.id,
                    name: data.name || "Unnamed Room",
                    code: data.code || docSnap.id,
                    totalRooms: Math.max(1, roomCount),
                    basePrice: Number(data.basePrice ?? data.price ?? data.defaultRate ?? 0),
                    channexRoomTypeId: data.channexRoomTypeId || undefined,
                    physicalRooms: physList
                });
            });
            setRoomTypes(rts);
            setLoading(false);
        }).catch((err) => {
            console.error("Error loading room types:", err);
            if (!isCancelled) setLoading(false);
        });

        return () => {
            isCancelled = true;
        };
    }, [activeHotelCode]);

    // 2. Fetch Rate Plans (Real data only, no dummy fallback)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

        let isCancelled = false;
        const rpCol = getHotelCollection(db, "ratePlans", activeHotelCode);
        getDocs(rpCol).then((snap) => {
            if (isCancelled) return;
            const rps: MyTaraRatePlan[] = [];
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                rps.push({
                    id: docSnap.id,
                    hotelCode: activeHotelCode,
                    ...data,
                    roomTypeId: data.roomTypeId || "",
                    roomTypeName: data.roomTypeName || "",
                    roomTypeIds: Array.isArray(data.roomTypeIds) && data.roomTypeIds.length > 0
                        ? data.roomTypeIds
                        : (data.roomTypeId ? [data.roomTypeId] : []),
                    roomTypeNames: Array.isArray(data.roomTypeNames)
                        ? data.roomTypeNames
                        : (data.roomTypeName ? [data.roomTypeName] : []),
                    roomRates: data.roomRates || {},
                    name: data.name || "Standard Rate",
                    code: data.code || docSnap.id,
                    baseRate: Number(data.baseRate ?? data.rate ?? 0),
                    currency: (data.currency && data.currency !== "IDR") ? data.currency : (hotelCurrencyCode || data.currency || "IDR"),
                    mealsIncluded: !!data.mealsIncluded,
                    cancellationPolicy: data.cancellationPolicy || "FREE",
                    minStay: Number(data.minStay ?? 1),
                    stopSell: !!data.stopSell,
                    channexRatePlanId: data.channexRatePlanId || undefined,
                    channexRatePlanIds: data.channexRatePlanIds || undefined
                });
            });
            setRatePlans(rps);
        }).catch((err) => {
            console.error("Error loading rate plans:", err);
        });

        return () => {
            isCancelled = true;
        };
    }, [activeHotelCode]);

    // 3. Fetch Real Daily Bookings from daily_revenue / front office (100% Inline with Forecast & Overview)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0" || dateList.length === 0) return;

        const firstDate = dateList[0];
        const lastDate = dateList[dateList.length - 1];

        const q = query(
            getHotelCollection(db, "daily_revenue", activeHotelCode),
            where("date", ">=", firstDate),
            where("date", "<=", lastDate)
        );

        const unsub = onSnapshot(q, (snap) => {
            const revMap: Record<string, any[]> = {};
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                const docDate = data.date || docSnap.id.replace(`${activeHotelCode}_`, "") || docSnap.id;
                
                // Group & Deduplicate accommodation entries for this day (Identical to Forecast & Overview)
                const dayAccommodationGroups: Record<string, any[]> = {};

                (data.entries || []).forEach((e: any) => {
                    const isPOS = e.guestName?.startsWith('POS Order #') || Array.isArray(e.posItems) || !!e.revenueType;
                    if (isPOS) return;
                    if (e.status === "VOID" || e.status === "VOIDED") return;

                    const isPelunasan = e.isHidden || e.isPelunasan || e.type === "pelunasan_ar" || e.type === "pelunasan_reversal" || e.guestName?.startsWith("Koreksi Tanggal Pelunasan") || e.guestName?.startsWith("Pelunasan Piutang");
                    if (isPelunasan) return;

                    const isAcc = e.type === "accommodation" || (!e.type && e.guestName);
                    if (isAcc) {
                        const normGuestName = (e.guestName || "").trim().toLowerCase();
                        const roomIdent = String(e.roomNumber || e.roomTypeId || e.roomType || '').trim();
                        const cIn = e.checkInDate || e.checkIn || '';
                        const cOut = e.checkOutDate || e.checkOut || '';
                        const key = (normGuestName && cIn) 
                            ? `${normGuestName}_${roomIdent}_${cIn}_${cOut}` 
                            : (e.bookingId ? `b_${e.bookingId}` : `t_${e.timestamp}`);
                        if (!dayAccommodationGroups[key]) {
                            dayAccommodationGroups[key] = [];
                        }
                        dayAccommodationGroups[key].push(e);
                    }
                });

                const cleanDayEntries: any[] = [];
                Object.values(dayAccommodationGroups).forEach(group => {
                    const isCancelled = group.some(e => e.status === "CANCELLED" || e.status === "CANCEL" || e.paymentStatus === "CANCELLED" || e.paymentStatus === "CANCEL");
                    group.sort((a, b) => {
                        const tA = new Date(a.timestamp || 0).getTime();
                        const tB = new Date(b.timestamp || 0).getTime();
                        return tA - tB;
                    });
                    const rep = { ...group[group.length - 1] };
                    if (isCancelled) {
                        rep.status = "CANCELLED";
                        rep.paymentStatus = "CANCELLED";
                    }
                    if (!isCancelled) {
                        cleanDayEntries.push(rep);
                    }
                });

                revMap[docDate] = cleanDayEntries;
            });
            setDailyRevenueMap(revMap);
        }, (err) => {
            console.error("Error loading daily revenue occupancy:", err);
        });

        return () => unsub();
    }, [activeHotelCode, dateList]);

    // 4. Fetch ARI Overrides for Date Window
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0" || dateList.length === 0) return;

        const firstDate = dateList[0];
        const lastDate = dateList[dateList.length - 1];

        const q = query(
            getHotelCollection(db, "ari_overrides", activeHotelCode),
            where("date", ">=", firstDate),
            where("date", "<=", lastDate)
        );

        const unsub = onSnapshot(q, (snap) => {
            const ovMap: Record<string, any> = {};
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                ovMap[data.date] = data;
            });
            setAriOverridesMap(ovMap);
        }, (err) => {
            console.error("Error loading ARI overrides:", err);
        });

        return () => unsub();
    }, [activeHotelCode, dateList]);

    // 5. Compute Full Grid Matrix with Overrides & Staged Changes (Supporting Per-Channel Rates & Capped Allotment)
    const matrix: RoomTypeInventoryRow[] = useMemo(() => {
        const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const isChannelSpecific = channelFilter !== "all";
        const channelCode = channelFilter;
        const chConfig = channelConfigs[channelCode];

        return roomTypes.map(rt => {
            // Find real rate plans belonging to this room type
            const rtPlans = ratePlans.filter(rp => 
                rp.roomTypeId === rt.id || 
                (Array.isArray(rp.roomTypeIds) && rp.roomTypeIds.includes(rt.id)) ||
                (rp.roomTypeName && rp.roomTypeName.trim().toLowerCase() === rt.name.trim().toLowerCase()) ||
                (Array.isArray(rp.roomTypeNames) && rp.roomTypeNames.some(name => name?.trim().toLowerCase() === rt.name?.trim().toLowerCase()))
            );

            // Days status for room type summary row (inventory)
            const roomTypeDaysStatus: Record<string, DayInventoryStatus> = {};

            dateList.forEach(dateStr => {
                const dateObj = new Date(dateStr);
                const dayIndex = dateObj.getDay();
                const isWeekend = dayIndex === 0 || dayIndex === 6;
                const dayName = DAY_NAMES[dayIndex];
                const dayNumber = String(dateObj.getDate()).padStart(2, "0");
                const monthName = MONTH_NAMES[dateObj.getMonth()];

                // Active bookings for this room type on dateStr
                const dayEntries = dailyRevenueMap[dateStr] || [];
                let bookedCount = 0;

                dayEntries.forEach(entry => {
                    const isCancelled = ["CANCEL", "CANCELLED", "VOID", "VOIDED"].includes((entry.status || "").toUpperCase()) ||
                                        ["CANCEL", "CANCELLED"].includes((entry.paymentStatus || "").toUpperCase());
                    if (isCancelled) return;

                    const entryRoomTypeId = entry.roomTypeId;
                    const entryChannexRtId = entry.channexRoomTypeId;
                    const entryRoomTypeName = (entry.roomType || entry.type || "").trim().toLowerCase();
                    const entryRoomNumber = String(entry.roomNumber || "").trim().toUpperCase();
                    const currentRtName = rt.name.trim().toLowerCase();
                    const currentRtCode = rt.code.trim().toLowerCase();
                    const physRooms = (rt.physicalRooms || []).map(p => p.toUpperCase());

                    const isMatch =
                        (entryRoomTypeId && entryRoomTypeId === rt.id) ||
                        (entryChannexRtId && rt.channexRoomTypeId && entryChannexRtId === rt.channexRoomTypeId) ||
                        (entryRoomTypeName && (entryRoomTypeName === currentRtName || entryRoomTypeName === currentRtCode)) ||
                        (entryRoomNumber && physRooms.includes(entryRoomNumber)) ||
                        (roomTypes.length === 1);

                    if (isMatch) {
                        const count = Math.max(1, Number(entry.roomsCount || entry.roomCount) || 1);
                        bookedCount += count;
                    }
                });

                // Check manual inventory override or channel-specific allotment cap
                const dayOverride = ariOverridesMap[dateStr];
                const stagedInvKey = isChannelSpecific 
                    ? `channelAllotment_${channelCode}_${rt.id}_${dateStr}`
                    : `inv_${rt.id}_${dateStr}`;
                const hasStagedInv = stagedUpdates[stagedInvKey] !== undefined;
                
                const totalRooms = rt.totalRooms || 1;
                let availableRooms = Math.max(0, totalRooms - bookedCount);
                let isCapped = false;

                const chSeparationMode = chConfig?.separationMode || "merged";
                const canSeparateAllotment = isChannelSpecific && (chSeparationMode === "separated_allotment" || chSeparationMode === "separated_both");

                if (canSeparateAllotment) {
                    if (hasStagedInv) {
                        availableRooms = Number(stagedUpdates[stagedInvKey]) || 0;
                        isCapped = true;
                    } else if (dayOverride?.channels?.[channelCode]?.allotments?.[rt.id]?.allotmentLimit !== undefined) {
                        availableRooms = Number(dayOverride.channels[channelCode].allotments[rt.id].allotmentLimit) || 0;
                        isCapped = true;
                    } else {
                        // Inherit from physical shared available rooms
                        availableRooms = Math.max(0, totalRooms - bookedCount);
                    }
                } else if (isChannelSpecific) {
                    // Allotment is not separated: follows Common Pool physical available rooms
                    availableRooms = Math.max(0, totalRooms - bookedCount);
                    isCapped = false;
                } else {
                    if (hasStagedInv) {
                        availableRooms = Number(stagedUpdates[stagedInvKey]) || 0;
                    } else if (dayOverride?.inventoryOverrides?.[rt.id] !== undefined) {
                        availableRooms = Number(dayOverride.inventoryOverrides[rt.id]) || 0;
                    }
                }

                const occupancyPercent = totalRooms > 0 ? Math.min(100, Math.round((bookedCount / totalRooms) * 100)) : 0;

                roomTypeDaysStatus[dateStr] = {
                    date: dateStr,
                    dayName,
                    dayNumber,
                    monthName,
                    isWeekend,
                    totalRooms,
                    bookedRooms: bookedCount,
                    availableRooms,
                    occupancyPercent,
                    stopSell: false,
                    rate: rt.basePrice,
                    extraAdultRate: 0,
                    extraChildRate: 0,
                    isCapped
                };
            });

            // Process Rate Plan Rows
            const ratePlanRows: RatePlanGridRow[] = rtPlans.map(rp => {
                const rpDaysStatus: Record<string, DayInventoryStatus> = {};

                dateList.forEach(dateStr => {
                    const baseDay = roomTypeDaysStatus[dateStr];
                    const dayOverride = ariOverridesMap[dateStr];

                    // Check Staged Updates first, then Firestore Overrides, then Rate Plan Master Default
                    const rateKey = isChannelSpecific ? `channelRate_${channelCode}_${rt.id}_${rp.id}_${dateStr}` : `rate_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyRateKey = isChannelSpecific ? `channelRate_${channelCode}_${rp.id}_${dateStr}` : `rate_${rp.id}_${dateStr}`;
                    const stopSellKey = isChannelSpecific ? `channelStopSell_${channelCode}_${rt.id}_${rp.id}_${dateStr}` : `stopSell_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyStopSellKey = isChannelSpecific ? `channelStopSell_${channelCode}_${rp.id}_${dateStr}` : `stopSell_${rp.id}_${dateStr}`;
                    const adultKey = `adult_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyAdultKey = `adult_${rp.id}_${dateStr}`;
                    const childKey = `child_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyChildKey = `child_${rp.id}_${dateStr}`;

                    // Base rate from Master / Common Pool for this specific Room Type
                    const baseRateValue = Number(rp.roomRates?.[rt.id] ?? rp.baseRate ?? rt.basePrice ?? 0);
                    const roomRateOverride = dayOverride?.roomRates?.[rt.id]?.[rp.id] ?? dayOverride?.rates?.[`${rt.id}_${rp.id}`];
                    const commonPoolRate = roomRateOverride !== undefined 
                        ? Number(roomRateOverride) 
                        : (dayOverride?.rates?.[rp.id] !== undefined ? Number(dayOverride.rates[rp.id]) : baseRateValue);

                    let currentRate = commonPoolRate;
                    let isChannelCustom = false;

                    const canSeparateRate = isChannelSpecific && (chConfig?.separationMode === "separated_rate" || chConfig?.separationMode === "separated_both");

                    if (canSeparateRate) {
                        if (stagedUpdates[rateKey] !== undefined) {
                            currentRate = Number(stagedUpdates[rateKey]) || 0;
                            isChannelCustom = true;
                        } else if (stagedUpdates[legacyRateKey] !== undefined) {
                            currentRate = Number(stagedUpdates[legacyRateKey]) || 0;
                            isChannelCustom = true;
                        } else if (dayOverride?.channels?.[channelCode]?.rates?.[`${rt.id}_${rp.id}`]?.rate !== undefined) {
                            currentRate = Number(dayOverride.channels[channelCode].rates[`${rt.id}_${rp.id}`].rate) || 0;
                            isChannelCustom = true;
                        } else if (dayOverride?.channels?.[channelCode]?.rates?.[rp.id]?.rate !== undefined) {
                            currentRate = Number(dayOverride.channels[channelCode].rates[rp.id].rate) || 0;
                            isChannelCustom = true;
                        } else {
                            // Calculate derived rate with channel markup modifier
                            const markupPct = Number(chConfig?.markupPercent || 0);
                            const markupFixed = Number(chConfig?.markupFixed || 0);
                            currentRate = Math.round(commonPoolRate * (1 + markupPct / 100)) + markupFixed;
                        }
                    } else if (isChannelSpecific) {
                        // Rate is not separated for this channel: follows common pool rate!
                        currentRate = commonPoolRate;
                        isChannelCustom = false;
                    } else {
                        if (stagedUpdates[rateKey] !== undefined) {
                            currentRate = Number(stagedUpdates[rateKey]) || 0;
                        } else if (stagedUpdates[legacyRateKey] !== undefined) {
                            currentRate = Number(stagedUpdates[legacyRateKey]) || 0;
                        } else if (roomRateOverride !== undefined) {
                            currentRate = Number(roomRateOverride) || 0;
                        } else if (dayOverride?.rates?.[rp.id] !== undefined) {
                            currentRate = Number(dayOverride.rates[rp.id]) || 0;
                        }
                    }

                    // Stop Sell
                    const roomStopSellOverride = dayOverride?.roomStopSell?.[rt.id]?.[rp.id] ?? dayOverride?.stopSell?.[`${rt.id}_${rp.id}`];
                    let currentStopSell = rp.stopSell || false;
                    if (isChannelSpecific) {
                        if (stagedUpdates[stopSellKey] !== undefined) {
                            currentStopSell = !!stagedUpdates[stopSellKey];
                        } else if (stagedUpdates[legacyStopSellKey] !== undefined) {
                            currentStopSell = !!stagedUpdates[legacyStopSellKey];
                        } else if (dayOverride?.channels?.[channelCode]?.rates?.[`${rt.id}_${rp.id}`]?.stopSell !== undefined) {
                            currentStopSell = !!dayOverride.channels[channelCode].rates[`${rt.id}_${rp.id}`].stopSell;
                        } else if (dayOverride?.channels?.[channelCode]?.rates?.[rp.id]?.stopSell !== undefined) {
                            currentStopSell = !!dayOverride.channels[channelCode].rates[rp.id].stopSell;
                        } else if (dayOverride?.channels?.[channelCode]?.stopSell !== undefined) {
                            currentStopSell = !!dayOverride.channels[channelCode].stopSell;
                        } else {
                            currentStopSell = roomStopSellOverride !== undefined ? !!roomStopSellOverride : (dayOverride?.stopSell?.[rp.id] !== undefined ? !!dayOverride.stopSell[rp.id] : (rp.stopSell || false));
                        }
                    } else {
                        if (stagedUpdates[stopSellKey] !== undefined) {
                            currentStopSell = !!stagedUpdates[stopSellKey];
                        } else if (stagedUpdates[legacyStopSellKey] !== undefined) {
                            currentStopSell = !!stagedUpdates[legacyStopSellKey];
                        } else if (roomStopSellOverride !== undefined) {
                            currentStopSell = !!roomStopSellOverride;
                        } else if (dayOverride?.stopSell?.[rp.id] !== undefined) {
                            currentStopSell = !!dayOverride.stopSell[rp.id];
                        }
                    }

                    // Extra Adult / Child
                    let currentAdultRate = Number((rp as any).extraAdultRate || 0);
                    if (stagedUpdates[adultKey] !== undefined) {
                        currentAdultRate = Number(stagedUpdates[adultKey]) || 0;
                    } else if (stagedUpdates[legacyAdultKey] !== undefined) {
                        currentAdultRate = Number(stagedUpdates[legacyAdultKey]) || 0;
                    } else if (dayOverride?.extraAdultRates?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentAdultRate = Number(dayOverride.extraAdultRates[`${rt.id}_${rp.id}`]) || 0;
                    } else if (dayOverride?.extraAdultRates?.[rp.id] !== undefined) {
                        currentAdultRate = Number(dayOverride.extraAdultRates[rp.id]) || 0;
                    }

                    let currentChildRate = Number((rp as any).extraChildRate || 0);
                    if (stagedUpdates[childKey] !== undefined) {
                        currentChildRate = Number(stagedUpdates[childKey]) || 0;
                    } else if (stagedUpdates[legacyChildKey] !== undefined) {
                        currentChildRate = Number(stagedUpdates[legacyChildKey]) || 0;
                    } else if (dayOverride?.extraChildRates?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentChildRate = Number(dayOverride.extraChildRates[`${rt.id}_${rp.id}`]) || 0;
                    } else if (dayOverride?.extraChildRates?.[rp.id] !== undefined) {
                        currentChildRate = Number(dayOverride.extraChildRates[rp.id]) || 0;
                    }

                    // Apply Tax Inclusive if enabled (Dynamic PB1 + Service Charge from Payment Gateway settings)
                    if (taxInclusive) {
                        const taxMultiplier = 1 + (taxRate + serviceRate) / 100;
                        currentRate = Math.round(currentRate * taxMultiplier);
                        currentAdultRate = Math.round(currentAdultRate * taxMultiplier);
                        currentChildRate = Math.round(currentChildRate * taxMultiplier);
                    }

                    // Restrictions: Min Stay (Legacy, Arrival, Through), Max Stay, CTA, CTD
                    const minStayLegacyKey = `min_${rp.id}_${dateStr}`;
                    const minStayArrKey = `min_arr_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyMinStayArrKey = `min_arr_${rp.id}_${dateStr}`;
                    const minStayThruKey = `min_thru_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyMinStayThruKey = `min_thru_${rp.id}_${dateStr}`;
                    const maxStayKey = `max_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyMaxStayKey = `max_${rp.id}_${dateStr}`;
                    const ctaKey = `cta_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyCtaKey = `cta_${rp.id}_${dateStr}`;
                    const ctdKey = `ctd_${rt.id}_${rp.id}_${dateStr}`;
                    const legacyCtdKey = `ctd_${rp.id}_${dateStr}`;

                    // Min Stay Arrival
                    let currentMinStayArr = Number((rp as any).minStayArrival || (rp as any).minStay || 1);
                    if (stagedUpdates[minStayArrKey] !== undefined) {
                        currentMinStayArr = Number(stagedUpdates[minStayArrKey]) || 1;
                    } else if (stagedUpdates[legacyMinStayArrKey] !== undefined) {
                        currentMinStayArr = Number(stagedUpdates[legacyMinStayArrKey]) || 1;
                    } else if (stagedUpdates[minStayLegacyKey] !== undefined) {
                        currentMinStayArr = Number(stagedUpdates[minStayLegacyKey]) || 1;
                    } else if (dayOverride?.minStayArrival?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentMinStayArr = Number(dayOverride.minStayArrival[`${rt.id}_${rp.id}`]) || 1;
                    } else if (dayOverride?.minStayArrival?.[rp.id] !== undefined) {
                        currentMinStayArr = Number(dayOverride.minStayArrival[rp.id]) || 1;
                    } else if (dayOverride?.minStay?.[rp.id] !== undefined) {
                        currentMinStayArr = Number(dayOverride.minStay[rp.id]) || 1;
                    }

                    // Min Stay Through
                    let currentMinStayThru = Number((rp as any).minStayThrough || (rp as any).minStay || 1);
                    if (stagedUpdates[minStayThruKey] !== undefined) {
                        currentMinStayThru = Number(stagedUpdates[minStayThruKey]) || 1;
                    } else if (stagedUpdates[legacyMinStayThruKey] !== undefined) {
                        currentMinStayThru = Number(stagedUpdates[legacyMinStayThruKey]) || 1;
                    } else if (stagedUpdates[minStayLegacyKey] !== undefined) {
                        currentMinStayThru = Number(stagedUpdates[minStayLegacyKey]) || 1;
                    } else if (dayOverride?.minStayThrough?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentMinStayThru = Number(dayOverride.minStayThrough[`${rt.id}_${rp.id}`]) || 1;
                    } else if (dayOverride?.minStayThrough?.[rp.id] !== undefined) {
                        currentMinStayThru = Number(dayOverride.minStayThrough[rp.id]) || 1;
                    } else if (dayOverride?.minStay?.[rp.id] !== undefined) {
                        currentMinStayThru = Number(dayOverride.minStay[rp.id]) || 1;
                    }

                    // Max Stay
                    let currentMaxStay: number | undefined = (rp as any).maxStay ? Number((rp as any).maxStay) : undefined;
                    if (stagedUpdates[maxStayKey] !== undefined) {
                        currentMaxStay = stagedUpdates[maxStayKey] ? Number(stagedUpdates[maxStayKey]) : undefined;
                    } else if (stagedUpdates[legacyMaxStayKey] !== undefined) {
                        currentMaxStay = stagedUpdates[legacyMaxStayKey] ? Number(stagedUpdates[legacyMaxStayKey]) : undefined;
                    } else if (dayOverride?.maxStay?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentMaxStay = dayOverride.maxStay[`${rt.id}_${rp.id}`] ? Number(dayOverride.maxStay[`${rt.id}_${rp.id}`]) : undefined;
                    } else if (dayOverride?.maxStay?.[rp.id] !== undefined) {
                        currentMaxStay = dayOverride.maxStay[rp.id] ? Number(dayOverride.maxStay[rp.id]) : undefined;
                    }

                    let currentMinStay = currentMinStayArr; // unified fallback

                    let currentCta = !!(rp as any).closedToArrival;
                    if (stagedUpdates[ctaKey] !== undefined) {
                        currentCta = !!stagedUpdates[ctaKey];
                    } else if (stagedUpdates[legacyCtaKey] !== undefined) {
                        currentCta = !!stagedUpdates[legacyCtaKey];
                    } else if (dayOverride?.cta?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentCta = !!dayOverride.cta[`${rt.id}_${rp.id}`];
                    } else if (dayOverride?.cta?.[rp.id] !== undefined) {
                        currentCta = !!dayOverride.cta[rp.id];
                    }

                    let currentCtd = !!(rp as any).closedToDeparture;
                    if (stagedUpdates[ctdKey] !== undefined) {
                        currentCtd = !!stagedUpdates[ctdKey];
                    } else if (stagedUpdates[legacyCtdKey] !== undefined) {
                        currentCtd = !!stagedUpdates[legacyCtdKey];
                    } else if (dayOverride?.ctd?.[`${rt.id}_${rp.id}`] !== undefined) {
                        currentCtd = !!dayOverride.ctd[`${rt.id}_${rp.id}`];
                    } else if (dayOverride?.ctd?.[rp.id] !== undefined) {
                        currentCtd = !!dayOverride.ctd[rp.id];
                    }

                    rpDaysStatus[dateStr] = {
                        ...baseDay,
                        rate: currentRate,
                        stopSell: currentStopSell,
                        minStay: currentMinStay,
                        minStayArrival: currentMinStayArr,
                        minStayThrough: currentMinStayThru,
                        maxStay: currentMaxStay,
                        closedToArrival: currentCta,
                        closedToDeparture: currentCtd,
                        extraAdultRate: currentAdultRate,
                        extraChildRate: currentChildRate,
                        isChannelCustom
                    };
                });

                return {
                    ratePlanId: rp.id,
                    ratePlanName: rp.name,
                    ratePlanCode: rp.code,
                    roomTypeId: rt.id,
                    roomTypeName: rt.name,
                    mealsIncluded: !!rp.mealsIncluded,
                    currency: (rp.currency && rp.currency !== "IDR") ? rp.currency : (hotelCurrencyCode || rp.currency || "IDR"),
                    baseRate: Number(rp.roomRates?.[rt.id] ?? rp.baseRate ?? rt.basePrice ?? 0),
                    days: rpDaysStatus
                };
            });

            return {
                roomTypeId: rt.id,
                roomTypeName: rt.name,
                roomTypeCode: rt.code,
                totalPhysicalRooms: rt.totalRooms,
                basePrice: rt.basePrice,
                days: roomTypeDaysStatus,
                ratePlans: ratePlanRows
            };
        });
    }, [roomTypes, ratePlans, dailyRevenueMap, ariOverridesMap, stagedUpdates, dateList, taxInclusive, activeHotelCode, channelFilter, channelConfigs, hotelCurrencyCode]);

    // Filter matrix by selected room type
    const filteredMatrix = useMemo(() => {
        if (roomTypeFilter === "all") return matrix;
        return matrix.filter(r => r.roomTypeId === roomTypeFilter);
    }, [matrix, roomTypeFilter]);

    // Total Hotel Available Inventory Summary across dates
    const totalDailyAvailable = useMemo(() => {
        const totals: Record<string, number> = {};
        dateList.forEach(d => {
            let sum = 0;
            matrix.forEach(rt => {
                sum += rt.days[d]?.availableRooms || 0;
            });
            totals[d] = sum;
        });
        return totals;
    }, [matrix, dateList]);

    // Stage a cell edit with permission validation (Supporting Common Pool & Channel-specific keys)
    const stageEdit = useCallback((key: string, value: any) => {
        if ((key.startsWith("stopSell_") || key.startsWith("channelStopSell_")) && !canStopSell) {
            toast.error("Anda tidak memiliki akses untuk merubah Stop Sell.");
            return;
        }
        if ((key.startsWith("rate_") || key.startsWith("adult_") || key.startsWith("child_") || key.startsWith("channelRate_")) && !canChangeRate) {
            toast.error("Anda tidak memiliki akses untuk merubah Rate / Harga.");
            return;
        }
        if ((key.startsWith("inv_") || key.startsWith("channelAllotment_")) && !canChangeInventory) {
            toast.error("Anda tidak memiliki akses untuk merubah Inventory.");
            return;
        }

        // Validate separationMode when editing channel-specific overrides
        if (key.startsWith("channelRate_")) {
            const parts = key.split("_");
            const code = parts[1];
            const cfg = channelConfigs[code];
            if (cfg?.separationMode !== "separated_rate" && cfg?.separationMode !== "separated_both") {
                toast.warning(`Saluran ${cfg?.channelName || code} tidak diatur untuk pemisahan tarif di Channel Manager.`);
                return;
            }
        }
        if (key.startsWith("channelAllotment_")) {
            const parts = key.split("_");
            const code = parts[1];
            const cfg = channelConfigs[code];
            if (cfg?.separationMode !== "separated_allotment" && cfg?.separationMode !== "separated_both") {
                toast.warning(`Saluran ${cfg?.channelName || code} tidak diatur untuk pemisahan allotment di Channel Manager.`);
                return;
            }
        }

        setStagedUpdates(prev => ({ ...prev, [key]: value }));
    }, [canStopSell, canChangeRate, canChangeInventory, channelConfigs]);

    // Count unsaved staged edits (including Tax Inclusive toggle)
    const unsavedCount = useMemo(() => {
        const stagedCount = Object.keys(stagedUpdates).length;
        const isTaxDirty = taxInclusive !== savedTaxInclusive;
        return stagedCount + (isTaxDirty ? 1 : 0);
    }, [stagedUpdates, taxInclusive, savedTaxInclusive]);

    // Discard all staged changes
    const resetStaged = useCallback(() => {
        setStagedUpdates({});
        setTaxInclusive(savedTaxInclusive);
        toast.info("Local changes discarded.");
    }, [savedTaxInclusive]);

    // Save all staged changes in batch to Firestore (Persisting both Common Pool & Per-Channel Overrides)
    const saveAllChanges = async () => {
        if (!activeHotelCode || unsavedCount === 0) return;
        setSaving(true);

        try {
            // 1. Save Tax Inclusive toggle if changed
            const isTaxDirty = taxInclusive !== savedTaxInclusive;
            if (isTaxDirty) {
                const pgRef = doc(db, "hotels", activeHotelCode, "settings", "payment_gateway");
                const hotelRef = doc(db, "hotels", activeHotelCode);
                await Promise.all([
                    setDoc(pgRef, { pricing: { isTaxIncludedInRate: taxInclusive } }, { merge: true }),
                    setDoc(hotelRef, { isTaxIncludedInRate: taxInclusive }, { merge: true })
                ]);
                setSavedTaxInclusive(taxInclusive);
            }

            // 2. If no ARI grid cell overrides, finish early with success
            const hasGridEdits = Object.keys(stagedUpdates).length > 0;
            if (!hasGridEdits) {
                toast.success("Tax display setting saved successfully!");
                setSaving(false);
                return;
            }

            // Group staged edits by date
            const dateEditsMap: Record<string, {
                rates?: Record<string, number>;
                stopSell?: Record<string, boolean>;
                minStay?: Record<string, number>;
                minStayArrival?: Record<string, number>;
                minStayThrough?: Record<string, number>;
                maxStay?: Record<string, number>;
                cta?: Record<string, boolean>;
                ctd?: Record<string, boolean>;
                extraAdultRates?: Record<string, number>;
                extraChildRates?: Record<string, number>;
                inventoryOverrides?: Record<string, number>;
                channels?: Record<string, {
                    rates?: Record<string, any>;
                    allotments?: Record<string, any>;
                    stopSell?: boolean;
                }>;
            }> = {};

            Object.entries(stagedUpdates).forEach(([key, value]) => {
                const parts = key.split("_");
                const type = parts[0];
                const dateStr = parts[parts.length - 1];

                if (!dateEditsMap[dateStr]) {
                    dateEditsMap[dateStr] = {};
                }

                if (type === "channelRate") {
                    // format: channelRate_${channelCode}_${ratePlanId}_${dateStr}
                    const channelCode = parts[1];
                    const rpId = parts.slice(2, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].channels) dateEditsMap[dateStr].channels = {};
                    if (!dateEditsMap[dateStr].channels![channelCode]) dateEditsMap[dateStr].channels![channelCode] = { rates: {}, allotments: {} };
                    if (!dateEditsMap[dateStr].channels![channelCode].rates) dateEditsMap[dateStr].channels![channelCode].rates = {};
                    dateEditsMap[dateStr].channels![channelCode].rates![rpId] = {
                        rate: Number(value) || 0,
                        isCustom: true
                    };
                } else if (type === "channelAllotment") {
                    // format: channelAllotment_${channelCode}_${roomTypeId}_${dateStr}
                    const channelCode = parts[1];
                    const rtId = parts.slice(2, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].channels) dateEditsMap[dateStr].channels = {};
                    if (!dateEditsMap[dateStr].channels![channelCode]) dateEditsMap[dateStr].channels![channelCode] = { rates: {}, allotments: {} };
                    if (!dateEditsMap[dateStr].channels![channelCode].allotments) dateEditsMap[dateStr].channels![channelCode].allotments = {};
                    dateEditsMap[dateStr].channels![channelCode].allotments![rtId] = {
                        allotmentLimit: Number(value) || 0,
                        isCustom: true
                    };
                } else if (type === "channelStopSell") {
                    // format: channelStopSell_${channelCode}_${ratePlanId}_${dateStr}
                    const channelCode = parts[1];
                    const rpId = parts.slice(2, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].channels) dateEditsMap[dateStr].channels = {};
                    if (!dateEditsMap[dateStr].channels![channelCode]) dateEditsMap[dateStr].channels![channelCode] = { rates: {}, allotments: {} };
                    if (!dateEditsMap[dateStr].channels![channelCode].rates) dateEditsMap[dateStr].channels![channelCode].rates = {};
                    dateEditsMap[dateStr].channels![channelCode].rates![rpId] = {
                        ...(dateEditsMap[dateStr].channels![channelCode].rates![rpId] || {}),
                        stopSell: !!value
                    };
                } else if (type === "rate") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].rates) dateEditsMap[dateStr].rates = {};
                    dateEditsMap[dateStr].rates![id] = Number(value) || 0;
                } else if (type === "stopSell") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].stopSell) dateEditsMap[dateStr].stopSell = {};
                    dateEditsMap[dateStr].stopSell![id] = !!value;
                } else if (type === "adult") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].extraAdultRates) dateEditsMap[dateStr].extraAdultRates = {};
                    dateEditsMap[dateStr].extraAdultRates![id] = Number(value) || 0;
                } else if (type === "child") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].extraChildRates) dateEditsMap[dateStr].extraChildRates = {};
                    dateEditsMap[dateStr].extraChildRates![id] = Number(value) || 0;
                } else if (type === "inv") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].inventoryOverrides) dateEditsMap[dateStr].inventoryOverrides = {};
                    dateEditsMap[dateStr].inventoryOverrides![id] = Number(value) || 0;
                } else if (key.startsWith("min_arr_")) {
                    const id = key.substring(8, key.lastIndexOf("_"));
                    if (!dateEditsMap[dateStr].minStayArrival) dateEditsMap[dateStr].minStayArrival = {};
                    dateEditsMap[dateStr].minStayArrival![id] = Math.max(1, Number(value) || 1);
                } else if (key.startsWith("min_thru_")) {
                    const id = key.substring(9, key.lastIndexOf("_"));
                    if (!dateEditsMap[dateStr].minStayThrough) dateEditsMap[dateStr].minStayThrough = {};
                    dateEditsMap[dateStr].minStayThrough![id] = Math.max(1, Number(value) || 1);
                } else if (key.startsWith("max_")) {
                    const id = key.substring(4, key.lastIndexOf("_"));
                    if (!dateEditsMap[dateStr].maxStay) dateEditsMap[dateStr].maxStay = {};
                    dateEditsMap[dateStr].maxStay![id] = Number(value) ? Math.max(1, Number(value)) : 0;
                } else if (type === "min") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].minStay) dateEditsMap[dateStr].minStay = {};
                    dateEditsMap[dateStr].minStay![id] = Math.max(1, Number(value) || 1);
                    if (!dateEditsMap[dateStr].minStayArrival) dateEditsMap[dateStr].minStayArrival = {};
                    dateEditsMap[dateStr].minStayArrival![id] = Math.max(1, Number(value) || 1);
                    if (!dateEditsMap[dateStr].minStayThrough) dateEditsMap[dateStr].minStayThrough = {};
                    dateEditsMap[dateStr].minStayThrough![id] = Math.max(1, Number(value) || 1);
                } else if (type === "cta") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].cta) dateEditsMap[dateStr].cta = {};
                    dateEditsMap[dateStr].cta![id] = !!value;
                } else if (type === "ctd") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].ctd) dateEditsMap[dateStr].ctd = {};
                    dateEditsMap[dateStr].ctd![id] = !!value;
                }
            });

            // Batch commit to Firestore
            const batch = writeBatch(db);
            Object.entries(dateEditsMap).forEach(([dateStr, edits]) => {
                const docRef = doc(getHotelCollection(db, "ari_overrides", activeHotelCode), `${activeHotelCode}_${dateStr}`);
                const currentDoc = ariOverridesMap[dateStr] || {};
                const currentChannels = currentDoc.channels || {};

                const mergedChannels = { ...currentChannels };
                if (edits.channels) {
                    Object.entries(edits.channels).forEach(([chCode, chData]) => {
                        mergedChannels[chCode] = {
                            ...(mergedChannels[chCode] || {}),
                            rates: { ...(mergedChannels[chCode]?.rates || {}), ...(chData.rates || {}) },
                            allotments: { ...(mergedChannels[chCode]?.allotments || {}), ...(chData.allotments || {}) }
                        };
                    });
                }

                const updatedDoc = {
                    date: dateStr,
                    hotelCode: activeHotelCode,
                    rates: { ...(currentDoc.rates || {}), ...(edits.rates || {}) },
                    stopSell: { ...(currentDoc.stopSell || {}), ...(edits.stopSell || {}) },
                    minStay: { ...(currentDoc.minStay || {}), ...(edits.minStay || {}) },
                    minStayArrival: { ...(currentDoc.minStayArrival || {}), ...(edits.minStayArrival || {}) },
                    minStayThrough: { ...(currentDoc.minStayThrough || {}), ...(edits.minStayThrough || {}) },
                    maxStay: { ...(currentDoc.maxStay || {}), ...(edits.maxStay || {}) },
                    cta: { ...(currentDoc.cta || {}), ...(edits.cta || {}) },
                    ctd: { ...(currentDoc.ctd || {}), ...(edits.ctd || {}) },
                    extraAdultRates: { ...(currentDoc.extraAdultRates || {}), ...(edits.extraAdultRates || {}) },
                    extraChildRates: { ...(currentDoc.extraChildRates || {}), ...(edits.extraChildRates || {}) },
                    inventoryOverrides: { ...(currentDoc.inventoryOverrides || {}), ...(edits.inventoryOverrides || {}) },
                    channels: mergedChannels,
                    updatedAt: new Date().toISOString()
                };

                batch.set(docRef, updatedDoc, { merge: true });
            });

            await batch.commit();
            setStagedUpdates({});
            toast.success(`Successfully saved ${unsavedCount} change(s) to database. Syncing delta to Channex...`);

            // Record audit trail log to Firestore for any user making changes
            try {
                const { label: authorLabel, user_name, user_email, user_role } = getAuthorIdentity();
                const invLogRef = collection(db, "hotels", activeHotelCode, "channex_task_logs");
                const uniqueTaskId = `ari-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                await setDoc(doc(invLogRef, uniqueTaskId), {
                    action: "Inventory & Rate Grid Edit",
                    task_type: "INVENTORY_CHANGE",
                    channelName: channelFilter === "all" ? "Master Allotment & Rates" : channelFilter,
                    user: authorLabel,
                    user_label: authorLabel,
                    user_name,
                    user_email,
                    user_role,
                    started_at: new Date().toISOString(),
                    inserted_at: new Date().toISOString(),
                    execution_time_ms: 150,
                    result: "Success",
                    status: "COMPLETED",
                    task_id: uniqueTaskId,
                    task_ids: [uniqueTaskId],
                    diff: dateEditsMap,
                    details: {
                        totalEditedCells: unsavedCount,
                        affectedDates: Object.keys(dateEditsMap),
                        channelFilter: channelFilter
                    }
                });
            } catch (auditErr) {
                console.warn("[RateInventory Audit] Could not record edit log:", auditErr);
            }

            // Build delta payload for exact 1-call batch sync (Certification Standard)
            const deltaRates: any[] = [];
            const deltaAvail: any[] = [];

            Object.entries(dateEditsMap).forEach(([dStr, edits]) => {
                const rpIds = new Set([
                    ...Object.keys(edits.rates || {}),
                    ...Object.keys(edits.stopSell || {}),
                    ...Object.keys(edits.minStay || {}),
                    ...Object.keys(edits.minStayArrival || {}),
                    ...Object.keys(edits.minStayThrough || {}),
                    ...Object.keys(edits.maxStay || {}),
                    ...Object.keys(edits.cta || {}),
                    ...Object.keys(edits.ctd || {})
                ]);

                rpIds.forEach(rpId => {
                    let targetRtId: string | undefined;
                    let targetRpId = rpId;

                    // If rpId has format `${roomTypeId}_${ratePlanId}`
                    for (const rt of roomTypes) {
                        if (rpId.startsWith(`${rt.id}_`)) {
                            targetRtId = rt.id;
                            targetRpId = rpId.substring(rt.id.length + 1);
                            break;
                        }
                    }

                    const item: any = { ratePlanId: targetRpId, date: dStr };
                    if (targetRtId) item.roomTypeId = targetRtId;
                    if (edits.rates?.[rpId] !== undefined) item.rate = edits.rates[rpId];
                    if (edits.stopSell?.[rpId] !== undefined) item.stopSell = edits.stopSell[rpId];
                    if (edits.minStay?.[rpId] !== undefined) item.minStay = edits.minStay[rpId];
                    if (edits.minStayArrival?.[rpId] !== undefined) item.minStayArrival = edits.minStayArrival[rpId];
                    if (edits.minStayThrough?.[rpId] !== undefined) item.minStayThrough = edits.minStayThrough[rpId];
                    if (edits.maxStay?.[rpId] !== undefined) item.maxStay = edits.maxStay[rpId];
                    if (edits.cta?.[rpId] !== undefined) item.closedToArrival = edits.cta[rpId];
                    if (edits.ctd?.[rpId] !== undefined) item.closedToDeparture = edits.ctd[rpId];
                    deltaRates.push(item);
                });

                if (edits.inventoryOverrides) {
                    Object.entries(edits.inventoryOverrides).forEach(([rtId, qty]) => {
                        deltaAvail.push({ roomTypeId: rtId, date: dStr, qty: Number(qty) || 0 });
                    });
                }
            });

            if (deltaRates.length > 0 || deltaAvail.length > 0) {
                syncDeltaToChannex({ rates: deltaRates, availability: deltaAvail });
            }
        } catch (err: any) {
            console.error("Error saving ARI changes:", err);
            toast.error(`Gagal menyimpan perubahan: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Apply Bulk Update across Date Range & Conditions (Single or Multi-Type Batch)
    const applyBulkUpdate = async (params: BulkUpdateParams) => {
        if (!activeHotelCode) return;
        setSaving(true);

        try {
            // Determine items to process
            const isMultiMode = params.mode === "multi" && Array.isArray(params.items) && params.items.length > 0;
            
            const rawItems: BulkUpdateItem[] = isMultiMode
                ? params.items!
                : [{
                    id: "single-1",
                    roomTypeId: params.roomTypeIds && params.roomTypeIds.length > 0 ? params.roomTypeIds[0] : "all",
                    ratePlanId: params.ratePlanIds && params.ratePlanIds.length > 0 ? params.ratePlanIds[0] : "all",
                    dateFrom: params.dateFrom || "",
                    dateTo: params.dateTo || "",
                    daysOfWeek: params.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
                    channelId: params.channelId || "all",
                    rateAction: params.rateAction || "none",
                    rateValue: params.rateValue,
                    stopSellAction: params.stopSellAction || "none",
                    inventoryAction: params.inventoryAction || "none",
                    inventoryValue: params.inventoryValue,
                    minStayAction: params.minStayAction,
                    minStayValue: params.minStayValue,
                    minStayArrivalAction: params.minStayArrivalAction,
                    minStayArrivalValue: params.minStayArrivalValue,
                    minStayThroughAction: params.minStayThroughAction,
                    minStayThroughValue: params.minStayThroughValue,
                    maxStayAction: params.maxStayAction,
                    maxStayValue: params.maxStayValue,
                    ctaAction: params.ctaAction,
                    ctdAction: params.ctdAction
                }];

            if (rawItems.length === 0) {
                toast.warning("No update items to apply.");
                setSaving(false);
                return;
            }

            // Permission checks
            const hasRateAction = rawItems.some(it => it.rateAction && it.rateAction !== "none");
            if (hasRateAction && !canChangeRate) {
                toast.error("You do not have permission to modify Rates.");
                setSaving(false);
                return;
            }
            const hasStopSellAction = rawItems.some(it => it.stopSellAction && it.stopSellAction !== "none");
            if (hasStopSellAction && !canStopSell) {
                toast.error("You do not have permission to modify Stop Sell.");
                setSaving(false);
                return;
            }
            const hasInvAction = rawItems.some(it => it.inventoryAction && it.inventoryAction !== "none");
            if (hasInvAction && !canChangeInventory) {
                toast.error("You do not have permission to modify Inventory.");
                setSaving(false);
                return;
            }

            // Accumulators
            const dateDocsAccumulator: Record<string, {
                rates: Record<string, number>;
                stopSell: Record<string, boolean>;
                minStay: Record<string, number>;
                minStayArrival: Record<string, number>;
                minStayThrough: Record<string, number>;
                maxStay: Record<string, number>;
                cta: Record<string, boolean>;
                ctd: Record<string, boolean>;
                inventoryOverrides: Record<string, number>;
                channels: Record<string, any>;
            }> = {};

            const deltaRatesMap: Record<string, any> = {};
            const deltaAvailMap: Record<string, any> = {};
            const allAffectedDates = new Set<string>();

            for (const item of rawItems) {
                if (!item.dateFrom || !item.dateTo) continue;
                const start = new Date(item.dateFrom);
                const end = new Date(item.dateTo);
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) continue;

                const daysOfWeek = item.daysOfWeek && item.daysOfWeek.length > 0 ? item.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
                const itemDates: string[] = [];
                let curr = new Date(start);
                while (curr <= end) {
                    if (daysOfWeek.includes(curr.getDay())) {
                        const y = curr.getFullYear();
                        const m = String(curr.getMonth() + 1).padStart(2, "0");
                        const d = String(curr.getDate()).padStart(2, "0");
                        const dateStr = `${y}-${m}-${d}`;
                        itemDates.push(dateStr);
                        allAffectedDates.add(dateStr);
                    }
                    curr.setDate(curr.getDate() + 1);
                }

                if (itemDates.length === 0) continue;

                // Target Room Types
                const targetRoomTypes = (!item.roomTypeId || item.roomTypeId === "all")
                    ? (params.roomTypeIds && !params.roomTypeIds.includes("all") && params.roomTypeIds.length > 0
                        ? roomTypes.filter(rt => params.roomTypeIds!.includes(rt.id))
                        : roomTypes)
                    : roomTypes.filter(rt => rt.id === item.roomTypeId);

                // Target Rate Plans
                const targetRatePlans = (!item.ratePlanId || item.ratePlanId === "all")
                    ? (params.ratePlanIds && !params.ratePlanIds.includes("all") && params.ratePlanIds.length > 0
                        ? ratePlans.filter(rp => params.ratePlanIds!.includes(rp.id))
                        : ratePlans)
                    : ratePlans.filter(rp => rp.id === item.ratePlanId);

                const targetChannelId = item.channelId || params.channelId || "all";
                const isChannelSpecific = targetChannelId !== "all";

                itemDates.forEach(dateStr => {
                    if (!dateDocsAccumulator[dateStr]) {
                        const existing = ariOverridesMap[dateStr] || {};
                        dateDocsAccumulator[dateStr] = {
                            rates: { ...(existing.rates || {}) },
                            stopSell: { ...(existing.stopSell || {}) },
                            minStay: { ...(existing.minStay || {}) },
                            minStayArrival: { ...(existing.minStayArrival || {}) },
                            minStayThrough: { ...(existing.minStayThrough || {}) },
                            maxStay: { ...(existing.maxStay || {}) },
                            cta: { ...(existing.cta || {}) },
                            ctd: { ...(existing.ctd || {}) },
                            inventoryOverrides: { ...(existing.inventoryOverrides || {}) },
                            channels: { ...(existing.channels || {}) }
                        };
                    }
                    const docData = dateDocsAccumulator[dateStr];

                    if (isChannelSpecific) {
                        const channelData = docData.channels[targetChannelId] || { rates: {}, allotments: {} };
                        const chRates = { ...(channelData.rates || {}) };
                        const chAllotments = { ...(channelData.allotments || {}) };

                        if (item.rateAction && item.rateAction !== "none") {
                            targetRatePlans.forEach(rp => {
                                const basePrice = Number(rp.baseRate || 0);
                                const currPrice = channelData.rates?.[rp.id]?.rate ?? (docData.rates[rp.id] ?? basePrice);
                                let finalPrice = currPrice;
                                if (item.rateAction === "set" && item.rateValue !== undefined) {
                                    finalPrice = item.rateValue;
                                } else if (item.rateAction === "inc_amount" && item.rateValue !== undefined) {
                                    finalPrice = currPrice + item.rateValue;
                                } else if (item.rateAction === "dec_amount" && item.rateValue !== undefined) {
                                    finalPrice = Math.max(0, currPrice - item.rateValue);
                                } else if (item.rateAction === "inc_percent" && item.rateValue !== undefined) {
                                    finalPrice = Math.round((currPrice * (1 + item.rateValue / 100) + Number.EPSILON) * 100) / 100;
                                } else if (item.rateAction === "dec_percent" && item.rateValue !== undefined) {
                                    finalPrice = Math.max(0, Math.round((currPrice * (1 - item.rateValue / 100) + Number.EPSILON) * 100) / 100);
                                }
                                targetRoomTypes.forEach(rt => {
                                    const cKey = `${rt.id}_${rp.id}`;
                                    chRates[cKey] = { ...(chRates[cKey] || {}), rate: finalPrice, isCustom: true };
                                });
                            });
                        }

                        if (item.stopSellAction === "close") {
                            targetRoomTypes.forEach(rt => {
                                targetRatePlans.forEach(rp => {
                                    const cKey = `${rt.id}_${rp.id}`;
                                    chRates[cKey] = { ...(chRates[cKey] || {}), stopSell: true };
                                });
                            });
                        } else if (item.stopSellAction === "open") {
                            targetRoomTypes.forEach(rt => {
                                targetRatePlans.forEach(rp => {
                                    const cKey = `${rt.id}_${rp.id}`;
                                    chRates[cKey] = { ...(chRates[cKey] || {}), stopSell: false };
                                });
                            });
                        }

                        if (item.inventoryAction === "set" && item.inventoryValue !== undefined) {
                            targetRoomTypes.forEach(rt => {
                                chAllotments[rt.id] = { allotmentLimit: item.inventoryValue!, isCustom: true };
                            });
                        }

                        docData.channels[targetChannelId] = {
                            ...channelData,
                            rates: chRates,
                            allotments: chAllotments
                        };
                    } else {
                        // Common Pool / Master
                        if (item.rateAction && item.rateAction !== "none") {
                            targetRoomTypes.forEach(rt => {
                                targetRatePlans.forEach(rp => {
                                    const compoundKey = `${rt.id}_${rp.id}`;
                                    const basePrice = Number(rp.roomRates?.[rt.id] ?? rp.baseRate ?? rt.basePrice ?? 0);
                                    const currPrice = docData.rates[compoundKey] !== undefined 
                                        ? docData.rates[compoundKey] 
                                        : (docData.rates[rp.id] !== undefined ? docData.rates[rp.id] : basePrice);

                                    let finalPrice = currPrice;
                                    if (item.rateAction === "set" && item.rateValue !== undefined) {
                                        finalPrice = item.rateValue;
                                    } else if (item.rateAction === "inc_amount" && item.rateValue !== undefined) {
                                        finalPrice = currPrice + item.rateValue;
                                    } else if (item.rateAction === "dec_amount" && item.rateValue !== undefined) {
                                        finalPrice = Math.max(0, currPrice - item.rateValue);
                                    } else if (item.rateAction === "inc_percent" && item.rateValue !== undefined) {
                                        finalPrice = Math.round((currPrice * (1 + item.rateValue / 100) + Number.EPSILON) * 100) / 100;
                                    } else if (item.rateAction === "dec_percent" && item.rateValue !== undefined) {
                                        finalPrice = Math.max(0, Math.round((currPrice * (1 - item.rateValue / 100) + Number.EPSILON) * 100) / 100);
                                    }
                                    docData.rates[compoundKey] = finalPrice;
                                });
                            });
                        }

                        if (item.stopSellAction === "close") {
                            targetRoomTypes.forEach(rt => {
                                targetRatePlans.forEach(rp => { 
                                    docData.stopSell[`${rt.id}_${rp.id}`] = true;
                                });
                            });
                        } else if (item.stopSellAction === "open") {
                            targetRoomTypes.forEach(rt => {
                                targetRatePlans.forEach(rp => { 
                                    docData.stopSell[`${rt.id}_${rp.id}`] = false;
                                });
                            });
                        }

                        if (item.minStayArrivalAction === "set" && item.minStayArrivalValue !== undefined) {
                            targetRatePlans.forEach(rp => { 
                                docData.minStayArrival[rp.id] = item.minStayArrivalValue!; 
                                docData.minStay[rp.id] = item.minStayArrivalValue!;
                            });
                        } else if (item.minStayArrivalAction === "remove") {
                            targetRatePlans.forEach(rp => { delete docData.minStayArrival[rp.id]; });
                        }

                        if (item.minStayThroughAction === "set" && item.minStayThroughValue !== undefined) {
                            targetRatePlans.forEach(rp => { docData.minStayThrough[rp.id] = item.minStayThroughValue!; });
                        } else if (item.minStayThroughAction === "remove") {
                            targetRatePlans.forEach(rp => { delete docData.minStayThrough[rp.id]; });
                        }

                        if (item.maxStayAction === "set" && item.maxStayValue !== undefined) {
                            targetRatePlans.forEach(rp => { docData.maxStay[rp.id] = item.maxStayValue!; });
                        } else if (item.maxStayAction === "remove") {
                            targetRatePlans.forEach(rp => { delete docData.maxStay[rp.id]; });
                        }

                        if (item.minStayAction === "set" && item.minStayValue !== undefined) {
                            targetRatePlans.forEach(rp => { 
                                docData.minStay[rp.id] = item.minStayValue!; 
                                docData.minStayArrival[rp.id] = item.minStayValue!;
                                docData.minStayThrough[rp.id] = item.minStayValue!;
                            });
                        } else if (item.minStayAction === "remove") {
                            targetRatePlans.forEach(rp => { 
                                delete docData.minStay[rp.id]; 
                                delete docData.minStayArrival[rp.id];
                                delete docData.minStayThrough[rp.id];
                            });
                        }

                        if (item.ctaAction === "close") {
                            targetRatePlans.forEach(rp => { docData.cta[rp.id] = true; });
                        } else if (item.ctaAction === "open") {
                            targetRatePlans.forEach(rp => { docData.cta[rp.id] = false; });
                        }

                        if (item.ctdAction === "close") {
                            targetRatePlans.forEach(rp => { docData.ctd[rp.id] = true; });
                        } else if (item.ctdAction === "open") {
                            targetRatePlans.forEach(rp => { docData.ctd[rp.id] = false; });
                        }

                        if (item.inventoryAction === "set" && item.inventoryValue !== undefined) {
                            targetRoomTypes.forEach(rt => { docData.inventoryOverrides[rt.id] = item.inventoryValue!; });
                        }
                    }

                    // Accumulate Delta Payload for Channex Batch
                    const hasRateChange = item.rateAction && item.rateAction !== "none";
                    const hasStopSellChange = item.stopSellAction && item.stopSellAction !== "none";
                    const hasMinStayChange = item.minStayAction && item.minStayAction !== "none";
                    const hasMinStayArrChange = item.minStayArrivalAction && item.minStayArrivalAction !== "none";
                    const hasMinStayThruChange = item.minStayThroughAction && item.minStayThroughAction !== "none";
                    const hasMaxStayChange = item.maxStayAction && item.maxStayAction !== "none";
                    const hasCtaChange = item.ctaAction && item.ctaAction !== "none";
                    const hasCtdChange = item.ctdAction && item.ctdAction !== "none";

                    if (hasRateChange || hasStopSellChange || hasMinStayChange || hasMinStayArrChange || hasMinStayThruChange || hasMaxStayChange || hasCtaChange || hasCtdChange) {
                        targetRoomTypes.forEach(rt => {
                            targetRatePlans.forEach(rp => {
                                const deltaKey = `${rp.id}_${rt.id}_${dateStr}`;
                                if (!deltaRatesMap[deltaKey]) {
                                    deltaRatesMap[deltaKey] = {
                                        ratePlanId: rp.id,
                                        roomTypeId: rt.id,
                                        date: dateStr
                                    };
                                }
                                const deltaItem = deltaRatesMap[deltaKey];

                                if (hasRateChange) {
                                    const compoundKey = `${rt.id}_${rp.id}`;
                                    deltaItem.rate = docData.rates[compoundKey] ?? docData.rates[rp.id];
                                }
                                if (item.stopSellAction === "close") deltaItem.stopSell = true;
                                else if (item.stopSellAction === "open") deltaItem.stopSell = false;

                                if (item.minStayArrivalAction === "set" && item.minStayArrivalValue !== undefined) deltaItem.minStayArrival = item.minStayArrivalValue;
                                else if (item.minStayArrivalAction === "remove") deltaItem.minStayArrival = null;

                                if (item.minStayThroughAction === "set" && item.minStayThroughValue !== undefined) deltaItem.minStayThrough = item.minStayThroughValue;
                                else if (item.minStayThroughAction === "remove") deltaItem.minStayThrough = null;

                                if (item.maxStayAction === "set" && item.maxStayValue !== undefined) deltaItem.maxStay = item.maxStayValue;
                                else if (item.maxStayAction === "remove") deltaItem.maxStay = null;

                                if (item.minStayAction === "set" && item.minStayValue !== undefined) deltaItem.minStay = item.minStayValue;
                                else if (item.minStayAction === "remove") deltaItem.minStay = null;

                                if (item.ctaAction === "close") deltaItem.closedToArrival = true;
                                else if (item.ctaAction === "open") deltaItem.closedToArrival = false;

                                if (item.ctdAction === "close") deltaItem.closedToDeparture = true;
                                else if (item.ctdAction === "open") deltaItem.closedToDeparture = false;
                            });
                        });
                    }

                    if (item.inventoryAction === "set" && item.inventoryValue !== undefined) {
                        targetRoomTypes.forEach(rt => {
                            const availKey = `${rt.id}_${dateStr}`;
                            deltaAvailMap[availKey] = {
                                roomTypeId: rt.id,
                                date: dateStr,
                                qty: item.inventoryValue!
                            };
                        });
                    }
                });
            }

            const affectedDateList = Array.from(allAffectedDates);
            if (affectedDateList.length === 0) {
                toast.warning("No dates match the selected day criteria.");
                setSaving(false);
                return;
            }

            // Write all accumulated dates to Firestore in batches
            const entries = Object.entries(dateDocsAccumulator);
            const BATCH_SIZE = 400;
            for (let i = 0; i < entries.length; i += BATCH_SIZE) {
                const chunk = entries.slice(i, i + BATCH_SIZE);
                const batch = writeBatch(db);
                chunk.forEach(([dateStr, docData]) => {
                    const docRef = doc(getHotelCollection(db, "ari_overrides", activeHotelCode), `${activeHotelCode}_${dateStr}`);
                    batch.set(docRef, {
                        date: dateStr,
                        hotelCode: activeHotelCode,
                        ...docData,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                });
                await batch.commit();
            }

            // Record audit trail log to Firestore for bulk update
            try {
                const { label: authorLabel, user_name, user_email, user_role } = getAuthorIdentity();
                const bulkLogRef = collection(db, "hotels", activeHotelCode, "channex_task_logs");
                const uniqueBulkTaskId = `bulk-ari-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                await setDoc(doc(bulkLogRef, uniqueBulkTaskId), {
                    action: isMultiMode ? "Multi-Item Batched ARI Update" : "Bulk Inventory / Rate Update",
                    task_type: "BULK_UPDATE",
                    channelName: params.channelId ? params.channelId : "All Connected Channels",
                    user: authorLabel,
                    user_label: authorLabel,
                    user_name,
                    user_email,
                    user_role,
                    started_at: new Date().toISOString(),
                    inserted_at: new Date().toISOString(),
                    execution_time_ms: 320,
                    result: "Success",
                    status: "COMPLETED",
                    task_id: uniqueBulkTaskId,
                    task_ids: [uniqueBulkTaskId],
                    diff: {
                        mode: isMultiMode ? "multi" : "single",
                        itemsCount: rawItems.length,
                        affectedDatesCount: affectedDateList.length,
                        itemsSummary: rawItems.map(it => ({
                            roomTypeId: it.roomTypeId,
                            ratePlanId: it.ratePlanId,
                            dateRange: `${it.dateFrom} s/d ${it.dateTo}`,
                            rateValue: it.rateValue,
                            rateAction: it.rateAction
                        }))
                    },
                    details: params
                });
            } catch (auditErr) {
                console.warn("[RateInventory Audit] Could not record bulk log:", auditErr);
            }

            const deltaRates = Object.values(deltaRatesMap);
            const deltaAvail = Object.values(deltaAvailMap);

            setBulkModalOpen(false);
            if (deltaRates.length > 0 || deltaAvail.length > 0) {
                toast.success(`Batched update applied to ${affectedDateList.length} date(s). Executing 1 batched API call to Channex...`);
                await syncDeltaToChannex({ rates: deltaRates, availability: deltaAvail });
            } else {
                toast.success(`Bulk Update applied to ${affectedDateList.length} date(s).`);
            }
        } catch (err: any) {
            console.error("Error applying bulk update:", err);
            toast.error(`Failed to apply Bulk Update: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Export Grid Data to CSV
    const exportGridToCsv = () => {
        try {
            const headers = ["Room Type / Rate Plan", "Type", ...dateList];
            const rows: string[][] = [headers];

            matrix.forEach(rt => {
                // Room Type Inventory Row
                const invRow = [
                    rt.roomTypeName,
                    "INVENTORY",
                    ...dateList.map(d => String(rt.days[d]?.availableRooms ?? 0))
                ];
                rows.push(invRow);

                // Rate Plan Rows
                rt.ratePlans.forEach(rp => {
                    const rateRow = [
                        `  ${rp.ratePlanName}`,
                        "RATE (IDR)",
                        ...dateList.map(d => String(rp.days[d]?.rate ?? 0))
                    ];
                    rows.push(rateRow);

                    const stopRow = [
                        `  ${rp.ratePlanName}`,
                        "STOP_SELL",
                        ...dateList.map(d => rp.days[d]?.stopSell ? "CLOSED" : "OPEN")
                    ];
                    rows.push(stopRow);

                    const minStayRow = [
                        `  ${rp.ratePlanName}`,
                        "MIN_STAY",
                        ...dateList.map(d => String(rp.days[d]?.minStay ?? 1))
                    ];
                    rows.push(minStayRow);
                });
            });

            const csvContent = rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `rates_inventory_${activeHotelCode}_${startDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Rates & Inventory matrix exported to CSV successfully.");
        } catch (err: any) {
            console.error("Export error:", err);
            toast.error("Failed to export CSV: " + (err?.message || String(err)));
        }
    };

    // Delta sync to Channex (exact 1 call for restrictions and/or 1 call for availability)
    const syncDeltaToChannex = async (deltaPayload: { rates?: any[]; availability?: any[] }) => {
        if (!activeHotelCode) return;
        setSyncingAri(true);
        try {
            const { label: authorLabel, user_name, user_email, user_role } = getAuthorIdentity();
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "delta",
                    delta: deltaPayload,
                    user: authorLabel,
                    userName: user_name,
                    userEmail: user_email,
                    userRole: user_role
                })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof window !== "undefined") {
                    sessionStorage.removeItem(`ari_logs_${activeHotelCode}`);
                }
                setLastSyncedAt(new Date().toLocaleTimeString("en-US"));
                const taskMsg = data.taskIds && data.taskIds.length > 0
                    ? ` (Task ID: ${data.taskIds.join(", ")})`
                    : "";
                toast.success(`Delta sync to Channex successful!${taskMsg}`);
            } else {
                toast.error(data.message || "Delta sync to Channex failed.");
            }
        } catch (err: any) {
            console.error("Channex delta sync error:", err);
            toast.error("Failed to connect to Channex API for delta sync.");
        } finally {
            setSyncingAri(false);
        }
    };

    // Push ARI to Channex OTAs (Supports 500 days full sync or per-room sync)
    const syncAriToChannex = async (roomTypeId?: string, daysAhead: number = 500) => {
        if (!activeHotelCode) return;
        setSyncingAri(true);
        if (roomTypeId) setSyncingRoomTypeId(roomTypeId);
        try {
            const { label: fsLabel, user_name: fsName, user_email: fsEmail, user_role: fsRole } = getAuthorIdentity();
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "full_sync",
                    startDate: dateList[0],
                    daysAhead: daysAhead,
                    roomTypeId: roomTypeId || undefined,
                    user: fsLabel,
                    userName: fsName,
                    userEmail: fsEmail,
                    userRole: fsRole
                })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof window !== "undefined") {
                    sessionStorage.removeItem(`ari_logs_${activeHotelCode}`);
                }
                setLastSyncedAt(new Date().toLocaleTimeString("en-US"));
                const taskMsg = data.taskIds && data.taskIds.length > 0
                    ? ` (Task IDs: ${data.taskIds.join(", ")})`
                    : "";
                toast.success(roomTypeId ? `Room inventory successfully synced to OTAs.${taskMsg}` : `Full 500-day ARI successfully synced to Channex!${taskMsg}`);
            } else {
                toast.error(data.message || "Failed to sync to Channex.");
            }
        } catch (err: any) {
            console.error("Channex sync error:", err);
            toast.error("Failed to connect to Channex API.");
        } finally {
            setSyncingAri(false);
            setSyncingRoomTypeId(null);
        }
    };

    return {
        activeHotelCode,
        activeHotelName,
        activeTab,
        setActiveTab,
        startDate,
        setStartDate,
        daysCount,
        setDaysCount,
        dateList,
        shiftDate,
        jumpToToday,
        channelFilter,
        setChannelFilter,
        roomTypeFilter,
        setRoomTypeFilter,
        rateMode,
        setRateMode,
        hideDerived,
        setHideDerived,
        taxInclusive,
        setTaxInclusive,
        roomTypes,
        ratePlans,
        matrix: filteredMatrix,
        totalDailyAvailable,
        stagedUpdates,
        stageEdit,
        unsavedCount,
        saveAllChanges,
        resetStaged,
        bulkModalOpen,
        setBulkModalOpen,
        applyBulkUpdate,
        exportGridToCsv,
        syncAriToChannex,
        syncDeltaToChannex,
        loading,
        saving,
        syncingAri,
        syncingRoomTypeId,
        lastSyncedAt,
        canStopSell,
        canChangeRate,
        canChangeInventory,
        isSuperadmin: isSuperadminRole,
        channelConfigs
    };
};
