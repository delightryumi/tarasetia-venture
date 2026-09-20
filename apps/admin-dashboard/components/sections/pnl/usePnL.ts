import { useState, useEffect } from "react";
import { processPnLData } from "@/lib/pnl-engine/process";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { useCorePnLData } from "./hooks/useCorePnLData";
import { useForecast } from "../forecast/useForecast";
import { useFrontOfficeData, YEARS, MONTHS } from "./hooks/useFrontOfficeData";
import { usePosOrdersData } from "./hooks/usePosOrdersData";
import { usePayrollData } from "./hooks/usePayrollData";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, getDocs } from "firebase/firestore";
import { getHotelCollection } from "@/lib/firestoreHelper";
import { detectBreakfastAllocation } from "@/lib/breakfast-utils";

export { YEARS, MONTHS };

export const usePnL = () => {
    const { activeHotelCode } = useAuth();
    const [isStartup, setIsStartup] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
    const [displayMode, setDisplayMode] = useState<"cards" | "charts" | "statements">("cards");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [pnlResult, setPnlResult] = useState<GlobalPnLResult | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [ratePlans, setRatePlans] = useState<any[]>([]);
    const [hotelBreakfastRate, setHotelBreakfastRate] = useState<number | undefined>(undefined);

    useEffect(() => {
        let codeToUse = activeHotelCode;
        if ((!codeToUse || codeToUse === "0") && typeof window !== "undefined") {
            const stored = localStorage.getItem("active_hotel_code");
            if (stored && stored !== "0") {
                codeToUse = stored;
            }
        }

        if (!codeToUse || codeToUse === "0") {
            setIsStartup(false);
            return;
        }

        const docRef = doc(db, "hotels", codeToUse);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const rawPlan = String(data.billing?.plan || data.plan || "").toLowerCase().trim();
                const planStr = rawPlan.replace(/[\s_-]+/g, "");
                const isStartupPlan = planStr === "startup" || planStr === "starup" || planStr === "basic";

                const activeModules: string[] = data.billing?.activeModules || data.activeModules || [];
                const hasFO = activeModules.includes("front-office") || activeModules.includes("overview") || activeModules.includes("forecast");
                const hasHK = activeModules.includes("housekeeping");

                const isStartupMode = isStartupPlan || (activeModules.length > 0 && !hasFO && !hasHK);
                setIsStartup(isStartupMode);

                const bRate = Number(data.settings?.breakfastRate || data.settings?.defaultBreakfastRate || data.breakfastRate);
                if (bRate > 0) {
                    setHotelBreakfastRate(bRate);
                }
            }
        }, (err) => {
            console.error("Error listening to hotel doc in usePnL:", err);
        });

        getDocs(getHotelCollection(db, "ratePlans", codeToUse)).then((snap) => {
            const list: any[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
            setRatePlans(list);
        }).catch((err) => {
            console.warn("Could not fetch ratePlans in usePnL:", err);
        });

        return () => unsubscribe();
    }, [activeHotelCode]);

    const {
        loadingCore,
        allHotels,
        customIncomes,
        nonCommissionRevenue,
        expenses,
        investors,
        vatPercentage,
        mgmtFeePercentage,
        mgmtFeeRoomPercentage,
        mgmtFeeFnbPercentage,
        serviceChargePercentage,
        lostBreakagePercentage,
        startingBalance,
        fixedAssetsValue,
        vatPaid,
        feePaid,
        scPaid,
        lbPaid,
        hotelGopPercentages,
        updateVat,
        updateMgmtFee,
        updateMgmtFeeRoom,
        updateMgmtFeeFnb,
        updateServiceCharge,
        updateLostBreakage,
        updateStartingBalance,
        updateFixedAssetsValue,
        updateVatPaid,
        updateFeePaid,
        updateScPaid,
        updateLbPaid,
        updateHotelGop,
        refetchCoreData
    } = useCorePnLData(month, viewMode);

    const {
        loadingFO,
        rawTransactions,
        yearTrendData,
        multiYearTrendData,
        refetchFOData
    } = useFrontOfficeData(month, viewMode);

        const {
            loadingPOS,
            posOrders,
            posRevAlacarte,
            posRevBanquet,
            posRevFood,
            posRevBeverage,
            posRevOther,
            posExpAlacarte,
            posExpBanquet,
            posExpFood,
            posExpBeverage,
            posExpOther,
            posGrossRevenue,
            posNettRevenue,
            posServiceCharge,
            posTaxAmount,
            posLostBreakageAmount,
            posTotalServiceTax,
            posComplimentValue,
            posServiceRate,
            posTaxRateIndividual,
            posLostBreakageRate,
            posTaxRateCombined,
            refetchPOSData
        } = usePosOrdersData(month, viewMode);

        const { loading: forecastLoading, occ: forecastOcc, revPar: forecastRevPar } = useForecast(viewMode, month);
        const { loadingPayroll, payrollExpense, payrollDetails, refetchPayrollData } = usePayrollData(month, viewMode);

        const loading = loadingCore || loadingFO || loadingPOS || forecastLoading || loadingPayroll;

        const fetchData = async () => {
            await Promise.all([
                refetchCoreData(),
                refetchFOData(),
                refetchPOSData(),
                refetchPayrollData()
            ]);
        };

        useEffect(() => {
            const currentHotelCode = activeHotelCode || (typeof window !== "undefined" ? localStorage.getItem("active_hotel_code") : null);
            const isSingleHotel = currentHotelCode && currentHotelCode !== "0";
            const targetHotels = isSingleHotel
                ? allHotels.filter(h => h.id === currentHotelCode)
                : allHotels;

            let resolvedTotalRooms = targetHotels.reduce((sum, h) => sum + (h.roomCount || 0), 0);
            if (resolvedTotalRooms === 0 && isSingleHotel) {
                const single = allHotels.find(h => h.id === currentHotelCode);
                resolvedTotalRooms = single?.roomCount || 8;
            }
            if (resolvedTotalRooms === 0) resolvedTotalRooms = 8;

            const effectiveHotels = targetHotels.length > 0 ? targetHotels : allHotels;

            // Forecast data fetched via hook above
            const result = processPnLData(
                rawTransactions,
                customIncomes,
                nonCommissionRevenue,
                expenses,
                investors,
                month,
                viewMode,
                vatPercentage,
                hotelGopPercentages,
                effectiveHotels,
                mgmtFeeRoomPercentage,
                mgmtFeeFnbPercentage,
                posRevAlacarte,
                posRevBanquet,
                posRevFood,
                posRevBeverage,
                posExpAlacarte,
                posExpBanquet,
                posExpFood,
                posExpBeverage,
                serviceChargePercentage,
                lostBreakagePercentage,
                posComplimentValue,
                posRevOther,
                posExpOther,
                payrollExpense,
                ratePlans,
                hotelBreakfastRate
            );

            result.pnlResult.revAlacarte = result.pnlResult.revTotalFnb;
            result.pnlResult.revBanquet = posRevBanquet;
            result.pnlResult.revFood = result.pnlResult.revFoodAlacarte;
            result.pnlResult.revBeverage = result.pnlResult.revBeverageAlacarte;

            result.pnlResult.posGrossRevenue = posGrossRevenue;
            result.pnlResult.posNettRevenue = posNettRevenue;
            result.pnlResult.posServiceCharge = posServiceCharge;
            result.pnlResult.posTaxAmount = posTaxAmount;
            result.pnlResult.posLostBreakageAmount = posLostBreakageAmount;
            result.pnlResult.posTotalServiceTax = posTotalServiceTax;

            result.pnlResult.posServiceRate = posServiceRate;
            result.pnlResult.posTaxRateIndividual = posTaxRateIndividual;
            result.pnlResult.posLostBreakageRate = posLostBreakageRate;
            result.pnlResult.posTaxRateCombined = posTaxRateCombined;

            const totalRooms = resolvedTotalRooms;
            const daysInPeriod = viewMode === "monthly"
                ? new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate()
                : 365;
            const roomsAvailable = totalRooms * daysInPeriod;

            // Synchronize Room Payment Method metrics directly from rawTransactions
            const isAccTx = (t: any) => {
                const isPOS = t.guestName?.startsWith("POS Order") || !!t.posItems || !!t.revenueType;
                const isPelunasan = t.isHidden || t.isPelunasan || t.type === "pelunasan_ar" || t.type === "pelunasan_reversal" || t.guestName?.startsWith("Koreksi Tanggal Pelunasan") || t.guestName?.startsWith("Pelunasan Piutang");
                return !isPOS && !isPelunasan && (t.type === "accommodation" || (!t.type && t.guestName));
            };
            const isOtaTx = (t: any) => {
                const ch = (t.channel || "").toLowerCase().trim();
                return ch !== "" && !["direct", "walk-in", "internal", "-", "direct / walk-in", "offline"].includes(ch);
            };

            const roomsSold = rawTransactions
                .filter(isAccTx)
                .reduce((sum, t: any) => sum + Math.max(1, Number(t.roomsCount || t.roomCount || t.quantity) || 1), 0);

            // Compute precise OCC, ARR, and RevPAR (ensuring RevPAR = ARR * (OCC/100))
            result.pnlResult.totalRooms = totalRooms;
            result.pnlResult.daysInPeriod = daysInPeriod;
            result.pnlResult.roomsAvailable = roomsAvailable;
            result.pnlResult.roomsSold = roomsSold;
            result.pnlResult.ledgerRoomRevenue = result.pnlResult.revRoom || 0;

            if (roomsAvailable > 0) {
                result.pnlResult.occ = (roomsSold / roomsAvailable) * 100;
                result.pnlResult.arr = roomsSold > 0 ? (result.pnlResult.revRoom || 0) / roomsSold : 0;
                result.pnlResult.revPar = (result.pnlResult.revRoom || 0) / roomsAvailable;
            } else if (forecastOcc !== undefined && forecastOcc > 0) {
                result.pnlResult.occ = forecastOcc;
                result.pnlResult.revPar = forecastRevPar ?? 0;
                result.pnlResult.arr = (result.pnlResult.occ > 0) ? (result.pnlResult.revPar / (result.pnlResult.occ / 100)) : (result.pnlResult.arr || 0);
            }
            result.pnlResult.kpiRevPar = (result.pnlResult.card1_TotalRevenue || 0) / (totalRooms || 1);

            const getNetRoomAmount = (t: any) => {
                const alloc = detectBreakfastAllocation(t, { ratePlans, hotelBreakfastRate });
                return (alloc.hasBreakfast && !alloc.isPreSplit && alloc.breakfastAmount > 0)
                    ? alloc.netRoomAmount
                    : Number(t.amount || 0);
            };

            const calcCash = rawTransactions
                .filter(isAccTx)
                .filter(t => {
                    if (isOtaTx(t)) return false;
                    const pm = (t.paymentMethod || "").toLowerCase().trim();
                    const isCashOnly = pm === "cash" || pm === "tunai" || (Number(t.paidCash || 0) > 0 && !pm.includes("qris") && !pm.includes("transfer") && !pm.includes("bank") && !pm.includes("edc") && !pm.includes("ledger"));
                    return isCashOnly;
                })
                .reduce((sum, t) => sum + getNetRoomAmount(t), 0);

            const calcDirectCashless = rawTransactions
                .filter(isAccTx)
                .filter(t => {
                    if (isOtaTx(t)) return false;
                    const pm = (t.paymentMethod || "").toLowerCase().trim();
                    const isCashOnly = pm === "cash" || pm === "tunai" || (Number(t.paidCash || 0) > 0 && !pm.includes("qris") && !pm.includes("transfer") && !pm.includes("bank") && !pm.includes("edc") && !pm.includes("ledger"));
                    return !isCashOnly;
                })
                .reduce((sum, t) => sum + getNetRoomAmount(t), 0);

            const calcOtaBreakdown: Record<string, number> = {};
            const calcOta = rawTransactions
                .filter(isAccTx)
                .filter(isOtaTx)
                .reduce((sum, t) => {
                    const amt = getNetRoomAmount(t);
                    const chName = (t.channel || "").trim() || "Other OTA";
                    calcOtaBreakdown[chName] = (calcOtaBreakdown[chName] || 0) + amt;
                    return sum + amt;
                }, 0);

            result.pnlResult.revCashHotel = calcCash;
            result.pnlResult.revDirectCashless = calcDirectCashless;
            result.pnlResult.revOta = calcOta;
            result.pnlResult.otaBreakdown = calcOtaBreakdown;

            setPnlResult({ ...result.pnlResult });
        }, [
            rawTransactions, customIncomes, nonCommissionRevenue, expenses, investors, vatPercentage, hotelGopPercentages, allHotels, mgmtFeeRoomPercentage, mgmtFeeFnbPercentage,
            posRevAlacarte, posRevBanquet, posRevFood, posRevBeverage, posRevOther, posExpAlacarte, posExpBanquet, posExpFood, posExpBeverage, posExpOther,
            posGrossRevenue, posNettRevenue, posServiceCharge, posTaxAmount, posLostBreakageAmount, posTotalServiceTax, posComplimentValue,
            posServiceRate, posTaxRateIndividual, posLostBreakageRate, posTaxRateCombined,
            serviceChargePercentage, lostBreakagePercentage,
            forecastOcc, forecastRevPar, payrollExpense,
            ratePlans, hotelBreakfastRate
        ]);

    return {
        isStartup,
        viewMode, setViewMode,
        displayMode, setDisplayMode,
        forecastLoading,

        month, setMonth,
        loading,
        pnlResult,
        rawTransactions,
        allHotels,
        customIncomes,
        nonCommissionRevenue,
        expenses,
        investors,
        vatPercentage, updateVat,
        mgmtFeePercentage, updateMgmtFee,
        mgmtFeeRoomPercentage, updateMgmtFeeRoom,
        mgmtFeeFnbPercentage, updateMgmtFeeFnb,
        serviceChargePercentage, updateServiceCharge,
        lostBreakagePercentage, updateLostBreakage,
        startingBalance, updateStartingBalance,
        fixedAssetsValue, updateFixedAssetsValue,
        vatPaid, updateVatPaid,
        feePaid, updateFeePaid,
        scPaid, updateScPaid,
        lbPaid, updateLbPaid,
        hotelGopPercentages, updateHotelGop,
        yearTrendData,
        multiYearTrendData,
        showDatePicker, setShowDatePicker,
        fetchData,
        posOrders,
        payrollDetails,
        ratePlans,
        hotelBreakfastRate
    };
};
