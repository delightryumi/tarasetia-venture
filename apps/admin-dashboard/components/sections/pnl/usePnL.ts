import { useState, useEffect } from "react";
import { processPnLData } from "@/lib/pnl-logic";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { useCorePnLData } from "./hooks/useCorePnLData";
import { useForecast } from "../forecast/useForecast";
import { useFrontOfficeData, YEARS, MONTHS } from "./hooks/useFrontOfficeData";
import { usePosOrdersData } from "./hooks/usePosOrdersData";
import { usePayrollData } from "./hooks/usePayrollData";

export { YEARS, MONTHS };

export const usePnL = () => {
    const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
    const [displayMode, setDisplayMode] = useState<"cards" | "charts">("cards");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [pnlResult, setPnlResult] = useState<GlobalPnLResult | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

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
