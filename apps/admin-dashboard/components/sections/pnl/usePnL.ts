import { useState, useEffect } from "react";
import { processPnLData } from "@/lib/pnl-logic";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { useCorePnLData } from "./hooks/useCorePnLData";
import { useFrontOfficeData, YEARS, MONTHS } from "./hooks/useFrontOfficeData";
import { usePosOrdersData } from "./hooks/usePosOrdersData";

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
        hotelGopPercentages,
        updateVat,
        updateMgmtFee,
        updateMgmtFeeRoom,
        updateMgmtFeeFnb,
        updateServiceCharge,
        updateLostBreakage,
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
        posExpAlacarte,
        posExpBanquet,
        posExpFood,
        posExpBeverage,
        posGrossRevenue,
        posNettRevenue,
        posServiceCharge,
        posTaxAmount,
        posLostBreakageAmount,
        posTotalServiceTax,
        posServiceRate,
        posTaxRateIndividual,
        posLostBreakageRate,
        posTaxRateCombined,
        refetchPOSData
    } = usePosOrdersData(month, viewMode);

    const loading = loadingCore || loadingFO || loadingPOS;

    const fetchData = async () => {
        await Promise.all([
            refetchCoreData(),
            refetchFOData(),
            refetchPOSData()
        ]);
    };

    useEffect(() => {
        const result = processPnLData(
            rawTransactions, 
            customIncomes, 
            nonCommissionRevenue, 
            expenses, 
            investors, 
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
            lostBreakagePercentage
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

        setPnlResult(result.pnlResult);
    }, [
        rawTransactions, customIncomes, nonCommissionRevenue, expenses, investors, vatPercentage, hotelGopPercentages, allHotels, mgmtFeeRoomPercentage, mgmtFeeFnbPercentage,
        posRevAlacarte, posRevBanquet, posRevFood, posRevBeverage, posExpAlacarte, posExpBanquet, posExpFood, posExpBeverage,
        posGrossRevenue, posNettRevenue, posServiceCharge, posTaxAmount, posLostBreakageAmount, posTotalServiceTax,
        posServiceRate, posTaxRateIndividual, posLostBreakageRate, posTaxRateCombined,
        serviceChargePercentage, lostBreakagePercentage
    ]);

    return {
        viewMode, setViewMode,
        displayMode, setDisplayMode,
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
        hotelGopPercentages, updateHotelGop,
        yearTrendData,
        multiYearTrendData,
        showDatePicker, setShowDatePicker,
        fetchData,
        posOrders
    };
};
