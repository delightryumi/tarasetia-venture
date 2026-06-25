"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt } from "lucide-react";
import { formatIDR } from "@/lib/pnl-utils";
import { ExpenseSection }    from "./components/ExpenseSection";
import { usePnL }            from "./usePnL";
import { PNLHeader }         from "./components/PNLHeader";
import { PNLSummaryCards }   from "./components/PNLSummaryCards";
import { PNLCharts }         from "./components/PNLCharts";
import { PNLFooter }         from "./components/PNLFooter";
import { PNLDrillDownModal } from "./components/PNLDrillDownModal";
import { useDrillDown }      from "./hooks/useDrillDown";
import { usePnLExport }      from "./hooks/usePnLExport";
import FinancialBreakdown    from "./components/FinancialBreakdown";
import "./PNLStyles.css";

/* ── Animations ── */
const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const rise = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT — thin orchestrator
══════════════════════════════════════════════════════ */
export function PNLSection() {
    const {
        viewMode, setViewMode,
        displayMode, setDisplayMode,
        month, setMonth,
        loading, pnlResult,
        expenses, vatPercentage, mgmtFeePercentage,
        mgmtFeeRoomPercentage, mgmtFeeFnbPercentage,
        serviceChargePercentage, lostBreakagePercentage,
        yearTrendData, multiYearTrendData,
        showDatePicker, setShowDatePicker,
        fetchData, updateVat, updateMgmtFee,
        updateMgmtFeeRoom, updateMgmtFeeFnb,
        updateServiceCharge, updateLostBreakage, updateStartingBalance,
        rawTransactions, customIncomes, posOrders, nonCommissionRevenue,
        startingBalance, fixedAssetsValue, updateFixedAssetsValue,
        vatPaid, updateVatPaid, feePaid, updateFeePaid, scPaid, updateScPaid, lbPaid, updateLbPaid,
        payrollDetails
    } = usePnL();

    const [retainedPercent, setRetainedPercent] = React.useState(0);

    const [y, mStr] = month.split("-");

    const sharedExpensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const mgmtExpensesTotal = 0;
    const totalNonComm = pnlResult?.card2_NonCommRevenue || 0;
    const finalMgmtNet = pnlResult?.card12_ReconOwner || 0;
    const gopPercentage = pnlResult?.gopBasis && pnlResult.gopBasis > 0 ? (pnlResult.gopFee / pnlResult.gopBasis) * 100 : 0;
    const totalRevenueHotelCollect = pnlResult?.card3_RevHotelCollect || 0;

    /* ── Drill-down state & logic ── */
    const drillDown = useDrillDown({
        pnlResult, rawTransactions, customIncomes, expenses, posOrders,
        vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage,
        month, payrollDetails
    });

    /* ── Export handlers ── */
    const { handleExportExcel, handleExportPDF, handleExportDrillExcel } = usePnLExport({
        pnlResult, expenses, viewMode, month, year: y,
        selectedDrillDownTitle: drillDown.selectedDrillDown?.title,
        drillItems: drillDown.modalData?.filtered,
        rawTransactions,
        posOrders,
        payrollDetails,
        startingBalance,
        fixedAssetsValue,
        vatPaid,
        feePaid,
        scPaid,
        lbPaid,
        customIncomes,
        nonCommissionRevenue,
    });

    return (
        <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="w-full max-w-[1440px] mx-auto px-6 md:px-10 py-8 flex flex-col gap-12 font-instrument"
        >
            {/* Header */}
            <PNLHeader
                viewMode={viewMode}         setViewMode={setViewMode}
                displayMode={displayMode}   setDisplayMode={setDisplayMode}
                month={month}               setMonth={setMonth}
                showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                rise={rise}
            />

            {/* Cards or Charts */}
            <AnimatePresence mode="wait">
                {displayMode === "cards" ? (
                    <PNLSummaryCards
                        pnlResult={pnlResult}
                        loading={loading}
                        vatPercentage={vatPercentage}
                        mgmtFeeRoomPercentage={mgmtFeeRoomPercentage}
                        mgmtFeeFnbPercentage={mgmtFeeFnbPercentage}
                        serviceChargePercentage={serviceChargePercentage}
                        lostBreakagePercentage={lostBreakagePercentage}
                        onVatChange={updateVat}
                        onFeeRoomChange={updateMgmtFeeRoom}
                        onFeeFnbChange={updateMgmtFeeFnb}
                        onServiceChange={updateServiceCharge}
                        onLostChange={updateLostBreakage}
                        rise={rise}
                        formatIDR={formatIDR}
                        onCardClick={drillDown.handleCardClick}
                    />
                ) : (
                    <motion.div
                        key="charts-view"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="flex flex-col gap-10"
                    >
                        <PNLCharts
                            viewMode={viewMode}
                            pnlResult={pnlResult}
                            yearTrendData={yearTrendData}
                            multiYearTrendData={multiYearTrendData}
                            monthStr={mStr}
                            yearStr={y}
                            formatIDR={formatIDR}
                        />

                        {pnlResult && (
                            <FinancialBreakdown
                                pnlResult={pnlResult}
                                customIncomes={customIncomes}
                                nonCommissionRevenue={nonCommissionRevenue}
                                expenses={expenses}
                                sharedExpensesTotal={sharedExpensesTotal}
                                mgmtExpensesTotal={mgmtExpensesTotal}
                                totalNonComm={totalNonComm}
                                finalMgmtNet={finalMgmtNet}
                                vatPercentage={vatPercentage}
                                gopPercentage={gopPercentage}
                                totalRevenueHotelCollect={totalRevenueHotelCollect}
                                retainedPercent={retainedPercent}
                                setRetainedPercent={setRetainedPercent}
                                mgmtFeeRoomPercentage={mgmtFeeRoomPercentage}
                                mgmtFeeFnbPercentage={mgmtFeeFnbPercentage}
                                serviceChargePercentage={serviceChargePercentage}
                                lostBreakagePercentage={lostBreakagePercentage}
                            />
                        )}
                    </motion.div>
                )}

            </AnimatePresence>

            {/* Drill-Down Modal */}
            <PNLDrillDownModal
                isOpen={drillDown.isDrillDownModalOpen}
                onClose={drillDown.closeModal}
                selectedDrillDown={drillDown.selectedDrillDown}
                modalData={drillDown.modalData}
                isFbPerformanceCard={drillDown.isFbPerformanceCard}
                fbPerformanceData={drillDown.fbPerformanceData}
                costConfig={drillDown.costConfig}
                modalBadgeInfo={drillDown.modalBadgeInfo}
                isKpiCard={drillDown.isKpiCard}
                kpiData={drillDown.kpiData}
                drillDownSearchQuery={drillDown.drillDownSearchQuery}
                setDrillDownSearchQuery={drillDown.setDrillDownSearchQuery}
                drillDownTab={drillDown.drillDownTab}
                setDrillDownTab={drillDown.setDrillDownTab}
                onExportDrillExcel={handleExportDrillExcel}
                month={month}
            />

            {/* Expense Input Section */}
            {viewMode === "monthly" ? (
                <ExpenseSection month={month} expenses={expenses} onRefresh={fetchData} />
            ) : loading ? (
                <div className="bg-white dark:bg-[#1a1a1a] border border-stone-100 dark:border-[#262626] rounded-2xl p-10 text-center shadow-xl shadow-stone-200/20 dark:shadow-none">
                    <p className="text-stone-500 dark:text-[#a1a1aa] animate-pulse font-medium">Memuat data Profit & Loss...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1a1a1a] border border-stone-100 dark:border-[#262626] rounded-[10px] p-10 text-center shadow-xl shadow-stone-200/20 dark:shadow-none">
                    <div className="w-16 h-16 bg-stone-50 dark:bg-[#1f1f1f] rounded-[10px] flex items-center justify-center mx-auto mb-6 text-stone-300 dark:text-[#a1a1aa]">
                        <Receipt size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2 uppercase tracking-tight">Annual Expense Audit</h3>
                    <p className="text-stone-400 dark:text-[#a1a1aa] text-[13px] max-w-md mx-auto leading-relaxed">
                        The yearly PnL view provides a consolidated report of all operational costs. To edit or add specific expenses, please switch back to{" "}
                        <button onClick={() => setViewMode("monthly")} className="mx-1 text-sage font-bold hover:underline">
                            Monthly View
                        </button>.
                    </p>
                </div>
            )}

            <PNLFooter rise={rise} />
        </motion.div>
    );
}