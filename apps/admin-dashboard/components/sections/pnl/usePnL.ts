import { useState, useEffect } from "react";
import { processPnLData } from "@/lib/pnl-logic";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { useCorePnLData } from "./hooks/useCorePnLData";
import { useForecast } from "../forecast/useForecast";
import { useFrontOfficeData, YEARS, MONTHS } from "./hooks/useFrontOfficeData";
import { usePosOrdersData } from "./hooks/usePosOrdersData";
import { usePayrollData } from "./hooks/usePayrollData";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export { YEARS, MONTHS };

export const usePnL = () => {
    const { activeHotelCode } = useAuth();
    const [isStartup, setIsStartup] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
    const [displayMode, setDisplayMode] = useState<"cards" | "charts">("cards");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [pnlResult, setPnlResult] = useState<GlobalPnLResult | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

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
            }
        }, (err) => {
            console.error("Error listening to hotel doc in usePnL:", err);
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
                allHotels,
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
                payrollExpense
            );

            result.pnlResult.revAlacarte = posRevAlacarte;
            result.pnlResult.revBanquet = posRevBanquet;
            result.pnlResult.revFood = posRevFood;
            result.pnlResult.revBeverage = posRevBeverage;

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

            const totalRooms = allHotels.reduce((sum, h) => sum + (h.roomCount || 0), 0);
            // Override OCC and RevPAR with forecast values for consistency
            result.pnlResult.occ = forecastOcc ?? 0;
            result.pnlResult.revPar = forecastRevPar ?? 0;
            // Preserve existing KPI calculation if needed
            result.pnlResult.kpiRevPar = result.pnlResult.totalRevenue / (totalRooms || 1);

            setPnlResult(result.pnlResult);
        }, [
            rawTransactions, customIncomes, nonCommissionRevenue, expenses, investors, vatPercentage, hotelGopPercentages, allHotels, mgmtFeeRoomPercentage, mgmtFeeFnbPercentage,
            posRevAlacarte, posRevBanquet, posRevFood, posRevBeverage, posRevOther, posExpAlacarte, posExpBanquet, posExpFood, posExpBeverage, posExpOther,
            posGrossRevenue, posNettRevenue, posServiceCharge, posTaxAmount, posLostBreakageAmount, posTotalServiceTax, posComplimentValue,
            posServiceRate, posTaxRateIndividual, posLostBreakageRate, posTaxRateCombined,
            serviceChargePercentage, lostBreakagePercentage,
            forecastOcc, forecastRevPar, payrollExpense
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
        payrollDetails
    };
};
