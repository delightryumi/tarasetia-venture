"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase";
import { getHotelCollection } from "@/lib/firestoreHelper";
import {
    collection,
    onSnapshot,
    doc,
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
import {
    RateInventoryTab,
    DayInventoryStatus,
    RatePlanGridRow,
    RoomTypeInventoryRow,
    BulkUpdateParams
} from "./RateInventoryTypes";

export const useRateInventory = () => {
    const { activeHotelCode, activeHotelName, user } = useAuth();

    const isSuperadmin = user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "admin";
    const canStopSell = isSuperadmin || user?.permissions?.fo_stopsell === true;
    const canChangeRate = isSuperadmin || user?.permissions?.fo_rate_change === true;
    const canChangeInventory = isSuperadmin || user?.permissions?.fo_inventory_change === true;

    // Active sub-view tab: "inventory" | "rates" | "stopsell"
    const [activeTab, setActiveTab] = useState<RateInventoryTab>("inventory");

    // Date range: 14 days default
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    });
    const [daysCount, setDaysCount] = useState<number>(14);

    // Filters & Display Options
    const [channelFilter, setChannelFilter] = useState<string>("all");
    const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
    const [rateMode, setRateMode] = useState<"base" | "extra_adult" | "extra_child">("base");
    const [hideDerived, setHideDerived] = useState<boolean>(false);
    const [taxInclusive, setTaxInclusive] = useState<boolean>(false);

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

        const rtCol = getHotelCollection(db, "roomTypes", activeHotelCode);
        const unsub = onSnapshot(rtCol, (snap) => {
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
        }, (err) => {
            console.error("Error loading room types:", err);
            setLoading(false);
        });

        return () => unsub();
    }, [activeHotelCode]);

    // 2. Fetch Rate Plans (Real data only, no dummy fallback)
    useEffect(() => {
        if (!activeHotelCode || activeHotelCode === "0") return;

        const rpCol = getHotelCollection(db, "ratePlans", activeHotelCode);
        const unsub = onSnapshot(rpCol, (snap) => {
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
                    currency: data.currency || "IDR",
                    mealsIncluded: !!data.mealsIncluded,
                    cancellationPolicy: data.cancellationPolicy || "FREE",
                    minStay: Number(data.minStay ?? 1),
                    stopSell: !!data.stopSell,
                    channexRatePlanId: data.channexRatePlanId || undefined
                });
            });
            setRatePlans(rps);
        }, (err) => {
            console.error("Error loading rate plans:", err);
        });

        return () => unsub();
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
                    const rateKey = isChannelSpecific ? `channelRate_${channelCode}_${rp.id}_${dateStr}` : `rate_${rp.id}_${dateStr}`;
                    const stopSellKey = isChannelSpecific ? `channelStopSell_${channelCode}_${rp.id}_${dateStr}` : `stopSell_${rp.id}_${dateStr}`;
                    const adultKey = `adult_${rp.id}_${dateStr}`;
                    const childKey = `child_${rp.id}_${dateStr}`;

                    // Base rate from Master / Common Pool
                    const baseRateValue = Number(rp.roomRates?.[rt.id] ?? rp.baseRate ?? rt.basePrice ?? 0);
                    const commonPoolRate = dayOverride?.rates?.[rp.id] !== undefined 
                        ? Number(dayOverride.rates[rp.id]) 
                        : baseRateValue;

                    let currentRate = commonPoolRate;
                    let isChannelCustom = false;

                    const canSeparateRate = isChannelSpecific && (chConfig?.separationMode === "separated_rate" || chConfig?.separationMode === "separated_both");

                    if (canSeparateRate) {
                        if (stagedUpdates[rateKey] !== undefined) {
                            currentRate = Number(stagedUpdates[rateKey]) || 0;
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
                        } else if (dayOverride?.rates?.[rp.id] !== undefined) {
                            currentRate = Number(dayOverride.rates[rp.id]) || 0;
                        }
                    }

                    // Stop Sell
                    let currentStopSell = rp.stopSell || false;
                    if (isChannelSpecific) {
                        if (stagedUpdates[stopSellKey] !== undefined) {
                            currentStopSell = !!stagedUpdates[stopSellKey];
                        } else if (dayOverride?.channels?.[channelCode]?.rates?.[rp.id]?.stopSell !== undefined) {
                            currentStopSell = !!dayOverride.channels[channelCode].rates[rp.id].stopSell;
                        } else if (dayOverride?.channels?.[channelCode]?.stopSell !== undefined) {
                            currentStopSell = !!dayOverride.channels[channelCode].stopSell;
                        } else {
                            currentStopSell = dayOverride?.stopSell?.[rp.id] !== undefined ? !!dayOverride.stopSell[rp.id] : (rp.stopSell || false);
                        }
                    } else {
                        if (stagedUpdates[stopSellKey] !== undefined) {
                            currentStopSell = !!stagedUpdates[stopSellKey];
                        } else if (dayOverride?.stopSell?.[rp.id] !== undefined) {
                            currentStopSell = !!dayOverride.stopSell[rp.id];
                        }
                    }

                    // Extra Adult / Child
                    let currentAdultRate = Number((rp as any).extraAdultRate || 0);
                    if (stagedUpdates[adultKey] !== undefined) {
                        currentAdultRate = Number(stagedUpdates[adultKey]) || 0;
                    } else if (dayOverride?.extraAdultRates?.[rp.id] !== undefined) {
                        currentAdultRate = Number(dayOverride.extraAdultRates[rp.id]) || 0;
                    }

                    let currentChildRate = Number((rp as any).extraChildRate || 0);
                    if (stagedUpdates[childKey] !== undefined) {
                        currentChildRate = Number(stagedUpdates[childKey]) || 0;
                    } else if (dayOverride?.extraChildRates?.[rp.id] !== undefined) {
                        currentChildRate = Number(dayOverride.extraChildRates[rp.id]) || 0;
                    }

                    // Apply Tax Inclusive if enabled (11% PB1 / Tax)
                    if (taxInclusive) {
                        currentRate = Math.round(currentRate * 1.11);
                        currentAdultRate = Math.round(currentAdultRate * 1.11);
                        currentChildRate = Math.round(currentChildRate * 1.11);
                    }

                    // Restrictions: Min Stay, CTA, CTD
                    const minStayKey = `min_${rp.id}_${dateStr}`;
                    const ctaKey = `cta_${rp.id}_${dateStr}`;
                    const ctdKey = `ctd_${rp.id}_${dateStr}`;

                    let currentMinStay = Number((rp as any).minStay || 1);
                    if (stagedUpdates[minStayKey] !== undefined) {
                        currentMinStay = Number(stagedUpdates[minStayKey]) || 1;
                    } else if (dayOverride?.minStay?.[rp.id] !== undefined) {
                        currentMinStay = Number(dayOverride.minStay[rp.id]) || 1;
                    }

                    let currentCta = !!(rp as any).closedToArrival;
                    if (stagedUpdates[ctaKey] !== undefined) {
                        currentCta = !!stagedUpdates[ctaKey];
                    } else if (dayOverride?.cta?.[rp.id] !== undefined) {
                        currentCta = !!dayOverride.cta[rp.id];
                    }

                    let currentCtd = !!(rp as any).closedToDeparture;
                    if (stagedUpdates[ctdKey] !== undefined) {
                        currentCtd = !!stagedUpdates[ctdKey];
                    } else if (dayOverride?.ctd?.[rp.id] !== undefined) {
                        currentCtd = !!dayOverride.ctd[rp.id];
                    }

                    rpDaysStatus[dateStr] = {
                        ...baseDay,
                        rate: currentRate,
                        stopSell: currentStopSell,
                        minStay: currentMinStay,
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
                    currency: rp.currency || "IDR",
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
    }, [roomTypes, ratePlans, dailyRevenueMap, ariOverridesMap, stagedUpdates, dateList, taxInclusive, activeHotelCode, channelFilter, channelConfigs]);

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

    // Count unsaved staged edits
    const unsavedCount = useMemo(() => Object.keys(stagedUpdates).length, [stagedUpdates]);

    // Discard all staged changes
    const resetStaged = useCallback(() => {
        setStagedUpdates({});
        toast.info("Local changes discarded.");
    }, []);

    // Save all staged changes in batch to Firestore (Persisting both Common Pool & Per-Channel Overrides)
    const saveAllChanges = async () => {
        if (!activeHotelCode || unsavedCount === 0) return;
        setSaving(true);

        try {
            // Group staged edits by date
            const dateEditsMap: Record<string, {
                rates?: Record<string, number>;
                stopSell?: Record<string, boolean>;
                minStay?: Record<string, number>;
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
                } else if (type === "min") {
                    const id = parts.slice(1, parts.length - 1).join("_");
                    if (!dateEditsMap[dateStr].minStay) dateEditsMap[dateStr].minStay = {};
                    dateEditsMap[dateStr].minStay![id] = Math.max(1, Number(value) || 1);
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

            // Build delta payload for exact 1-call batch sync (Certification Standard)
            const deltaRates: any[] = [];
            const deltaAvail: any[] = [];

            Object.entries(dateEditsMap).forEach(([dStr, edits]) => {
                const rpIds = new Set([
                    ...Object.keys(edits.rates || {}),
                    ...Object.keys(edits.stopSell || {}),
                    ...Object.keys(edits.minStay || {}),
                    ...Object.keys(edits.cta || {}),
                    ...Object.keys(edits.ctd || {})
                ]);

                rpIds.forEach(rpId => {
                    const item: any = { ratePlanId: rpId, date: dStr };
                    if (edits.rates?.[rpId] !== undefined) item.rate = edits.rates[rpId];
                    if (edits.stopSell?.[rpId] !== undefined) item.stopSell = edits.stopSell[rpId];
                    if (edits.minStay?.[rpId] !== undefined) item.minStay = edits.minStay[rpId];
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

    // Apply Bulk Update across Date Range & Conditions
    const applyBulkUpdate = async (params: BulkUpdateParams) => {
        if (!activeHotelCode) return;
        setSaving(true);

        try {
            const start = new Date(params.dateFrom);
            const end = new Date(params.dateTo);
            const affectedDates: string[] = [];

            let curr = new Date(start);
            while (curr <= end) {
                const dayIndex = curr.getDay();
                if (params.daysOfWeek.includes(dayIndex)) {
                    const y = curr.getFullYear();
                    const m = String(curr.getMonth() + 1).padStart(2, "0");
                    const day = String(curr.getDate()).padStart(2, "0");
                    affectedDates.push(`${y}-${m}-${day}`);
                }
                curr.setDate(curr.getDate() + 1);
            }

            if (affectedDates.length === 0) {
                toast.warning("No dates match the selected day criteria.");
                setSaving(false);
                return;
            }

            if (params.rateAction !== "none" && !canChangeRate) {
                toast.error("You do not have permission to modify Rates.");
                setSaving(false);
                return;
            }
            if (params.stopSellAction !== "none" && !canStopSell) {
                toast.error("You do not have permission to modify Stop Sell.");
                setSaving(false);
                return;
            }
            if (params.inventoryAction !== "none" && !canChangeInventory) {
                toast.error("You do not have permission to modify Inventory.");
                setSaving(false);
                return;
            }

            // Identify target rate plans and room types
            const targetRoomTypes = (params.roomTypeIds.length === 0 || params.roomTypeIds.includes("all"))
                ? roomTypes
                : roomTypes.filter(rt => params.roomTypeIds.includes(rt.id));

            const targetRatePlans = (params.ratePlanIds.length === 0 || params.ratePlanIds.includes("all"))
                ? ratePlans
                : ratePlans.filter(rp => params.ratePlanIds.includes(rp.id));

            const batch = writeBatch(db);

            affectedDates.forEach(dateStr => {
                const docRef = doc(getHotelCollection(db, "ari_overrides", activeHotelCode), `${activeHotelCode}_${dateStr}`);
                const currentDoc = ariOverridesMap[dateStr] || {};
                const currentChannels = currentDoc.channels || {};

                const targetChannelId = params.channelId || "all";
                const isChannelSpecific = targetChannelId !== "all";

                if (isChannelSpecific) {
                    const channelData = currentChannels[targetChannelId] || { rates: {}, allotments: {} };
                    const newChRates = { ...(channelData.rates || {}) };
                    const newChAllotments = { ...(channelData.allotments || {}) };

                    if (params.rateAction !== "none") {
                        targetRatePlans.forEach(rp => {
                            const basePrice = Number(rp.baseRate || 0);
                            const currPrice = channelData.rates?.[rp.id]?.rate ?? (currentDoc.rates?.[rp.id] ?? basePrice);
                            let finalPrice = currPrice;
                            if (params.rateAction === "set" && params.rateValue !== undefined) {
                                finalPrice = params.rateValue;
                            } else if (params.rateAction === "inc_amount" && params.rateValue !== undefined) {
                                finalPrice = currPrice + params.rateValue;
                            } else if (params.rateAction === "dec_amount" && params.rateValue !== undefined) {
                                finalPrice = Math.max(0, currPrice - params.rateValue);
                            } else if (params.rateAction === "inc_percent" && params.rateValue !== undefined) {
                                finalPrice = Math.round(currPrice * (1 + params.rateValue / 100));
                            } else if (params.rateAction === "dec_percent" && params.rateValue !== undefined) {
                                finalPrice = Math.max(0, Math.round(currPrice * (1 - params.rateValue / 100)));
                            }
                            newChRates[rp.id] = { rate: finalPrice, isCustom: true };
                        });
                    }

                    if (params.stopSellAction === "close") {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), stopSell: true };
                        });
                    } else if (params.stopSellAction === "open") {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), stopSell: false };
                        });
                    }

                    if (params.minStayAction === "set" && params.minStayValue !== undefined) {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), minStay: params.minStayValue! };
                        });
                    } else if (params.minStayAction === "remove") {
                        targetRatePlans.forEach(rp => {
                            if (newChRates[rp.id]) delete newChRates[rp.id].minStay;
                        });
                    }

                    if (params.ctaAction === "close") {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), closedToArrival: true };
                        });
                    } else if (params.ctaAction === "open") {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), closedToArrival: false };
                        });
                    }

                    if (params.ctdAction === "close") {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), closedToDeparture: true };
                        });
                    } else if (params.ctdAction === "open") {
                        targetRatePlans.forEach(rp => {
                            newChRates[rp.id] = { ...(newChRates[rp.id] || {}), closedToDeparture: false };
                        });
                    }

                    if (params.inventoryAction === "set" && params.inventoryValue !== undefined) {
                        targetRoomTypes.forEach(rt => {
                            newChAllotments[rt.id] = { allotmentLimit: params.inventoryValue!, isCustom: true };
                        });
                    }

                    const mergedChannels = {
                        ...currentChannels,
                        [targetChannelId]: {
                            ...channelData,
                            rates: newChRates,
                            allotments: newChAllotments
                        }
                    };

                    batch.set(docRef, {
                        date: dateStr,
                        hotelCode: activeHotelCode,
                        channels: mergedChannels,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                } else {
                    const newRates = { ...(currentDoc.rates || {}) };
                    const newStopSell = { ...(currentDoc.stopSell || {}) };
                    const newMinStay = { ...(currentDoc.minStay || {}) };
                    const newCta = { ...(currentDoc.cta || {}) };
                    const newCtd = { ...(currentDoc.ctd || {}) };
                    const newInv = { ...(currentDoc.inventoryOverrides || {}) };

                    // Apply Rate Adjustments
                    if (params.rateAction !== "none") {
                        targetRatePlans.forEach(rp => {
                            const basePrice = Number(rp.baseRate || 0);
                            const currPrice = currentDoc.rates?.[rp.id] !== undefined ? currentDoc.rates[rp.id] : basePrice;

                            if (params.rateAction === "set" && params.rateValue !== undefined) {
                                newRates[rp.id] = params.rateValue;
                            } else if (params.rateAction === "inc_amount" && params.rateValue !== undefined) {
                                newRates[rp.id] = currPrice + params.rateValue;
                            } else if (params.rateAction === "dec_amount" && params.rateValue !== undefined) {
                                newRates[rp.id] = Math.max(0, currPrice - params.rateValue);
                            } else if (params.rateAction === "inc_percent" && params.rateValue !== undefined) {
                                newRates[rp.id] = Math.round(currPrice * (1 + params.rateValue / 100));
                            } else if (params.rateAction === "dec_percent" && params.rateValue !== undefined) {
                                newRates[rp.id] = Math.max(0, Math.round(currPrice * (1 - params.rateValue / 100)));
                            }
                        });
                    }

                    // Apply Stop Sell
                    if (params.stopSellAction === "close") {
                        targetRatePlans.forEach(rp => { newStopSell[rp.id] = true; });
                    } else if (params.stopSellAction === "open") {
                        targetRatePlans.forEach(rp => { newStopSell[rp.id] = false; });
                    }

                    // Apply Min Stay
                    if (params.minStayAction === "set" && params.minStayValue !== undefined) {
                        targetRatePlans.forEach(rp => { newMinStay[rp.id] = params.minStayValue!; });
                    } else if (params.minStayAction === "remove") {
                        targetRatePlans.forEach(rp => { delete newMinStay[rp.id]; });
                    }

                    // Apply CTA
                    if (params.ctaAction === "close") {
                        targetRatePlans.forEach(rp => { newCta[rp.id] = true; });
                    } else if (params.ctaAction === "open") {
                        targetRatePlans.forEach(rp => { newCta[rp.id] = false; });
                    }

                    // Apply CTD
                    if (params.ctdAction === "close") {
                        targetRatePlans.forEach(rp => { newCtd[rp.id] = true; });
                    } else if (params.ctdAction === "open") {
                        targetRatePlans.forEach(rp => { newCtd[rp.id] = false; });
                    }

                    // Apply Inventory Override
                    if (params.inventoryAction === "set" && params.inventoryValue !== undefined) {
                        targetRoomTypes.forEach(rt => { newInv[rt.id] = params.inventoryValue!; });
                    }

                    batch.set(docRef, {
                        date: dateStr,
                        hotelCode: activeHotelCode,
                        rates: newRates,
                        stopSell: newStopSell,
                        minStay: newMinStay,
                        cta: newCta,
                        ctd: newCtd,
                        inventoryOverrides: newInv,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }
            });

            await batch.commit();

            // Build delta payload for exact 1-call batch sync (Certification Standard)
            const deltaRates: any[] = [];
            const deltaAvail: any[] = [];

            affectedDates.forEach(dateStr => {
                const existingDoc = ariOverridesMap[dateStr] || {};
                const hasRateChange = params.rateAction !== "none";
                const hasStopSellChange = params.stopSellAction !== "none";
                const hasMinStayChange = params.minStayAction && params.minStayAction !== "none";
                const hasCtaChange = params.ctaAction && params.ctaAction !== "none";
                const hasCtdChange = params.ctdAction && params.ctdAction !== "none";

                if (hasRateChange || hasStopSellChange || hasMinStayChange || hasCtaChange || hasCtdChange) {
                    targetRatePlans.forEach(rp => {
                        const item: any = { ratePlanId: rp.id, date: dateStr };
                        if (hasRateChange) {
                            const basePrice = Number(rp.baseRate || 0);
                            const currPrice = existingDoc.rates?.[rp.id] !== undefined ? existingDoc.rates[rp.id] : basePrice;
                            let finalPrice = currPrice;
                            if (params.rateAction === "set" && params.rateValue !== undefined) finalPrice = params.rateValue;
                            else if (params.rateAction === "inc_amount" && params.rateValue !== undefined) finalPrice = currPrice + params.rateValue;
                            else if (params.rateAction === "dec_amount" && params.rateValue !== undefined) finalPrice = Math.max(0, currPrice - params.rateValue);
                            else if (params.rateAction === "inc_percent" && params.rateValue !== undefined) finalPrice = Math.round(currPrice * (1 + params.rateValue / 100));
                            else if (params.rateAction === "dec_percent" && params.rateValue !== undefined) finalPrice = Math.max(0, Math.round(currPrice * (1 - params.rateValue / 100)));
                            item.rate = finalPrice;
                        }
                        if (params.stopSellAction === "close") item.stopSell = true;
                        else if (params.stopSellAction === "open") item.stopSell = false;

                        if (params.minStayAction === "set" && params.minStayValue !== undefined) item.minStay = params.minStayValue;
                        else if (params.minStayAction === "remove") item.minStay = null;

                        if (params.ctaAction === "close") item.closedToArrival = true;
                        else if (params.ctaAction === "open") item.closedToArrival = false;

                        if (params.ctdAction === "close") item.closedToDeparture = true;
                        else if (params.ctdAction === "open") item.closedToDeparture = false;

                        deltaRates.push(item);
                    });
                }

                if (params.inventoryAction === "set" && params.inventoryValue !== undefined) {
                    targetRoomTypes.forEach(rt => {
                        deltaAvail.push({ roomTypeId: rt.id, date: dateStr, qty: params.inventoryValue! });
                    });
                }
            });

            setBulkModalOpen(false);
            if (deltaRates.length > 0 || deltaAvail.length > 0) {
                toast.success(`Bulk Update applied to ${affectedDates.length} date(s). Syncing delta to Channex...`);
                await syncDeltaToChannex({ rates: deltaRates, availability: deltaAvail });
            } else {
                toast.success(`Bulk Update applied to ${affectedDates.length} date(s).`);
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
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "delta",
                    delta: deltaPayload
                })
            });
            const data = await res.json();
            if (data.success) {
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
            const res = await fetch("/api/channex/sync-ari", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hotelCode: activeHotelCode,
                    type: "full_sync",
                    startDate: dateList[0],
                    daysAhead: daysAhead, // Default to 500 days for Channex PMS Certification Test 1
                    roomTypeId: roomTypeId || undefined
                })
            });
            const data = await res.json();
            if (data.success) {
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
        channelConfigs
    };
};
