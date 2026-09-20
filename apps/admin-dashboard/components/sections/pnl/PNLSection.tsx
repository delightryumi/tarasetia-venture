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
        isStartup,
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
        payrollDetails,
        ratePlans,
        hotelBreakfastRate
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
        month, payrollDetails,
        ratePlans, hotelBreakfastRate
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
            className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-8 font-instrument"
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
                        isStartup={isStartup}
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
                        className="flex flex-col gap-6"
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
                                isStartup={isStartup}
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
                <ExpenseSection isStartup={isStartup} month={month} expenses={expenses} onRefresh={fetchData} />
            ) : loading ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md p-8 text-center shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium text-sm">Loading Profit &amp; Loss Financial Statements...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md p-8 text-center shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center mx-auto mb-4 text-slate-500 dark:text-slate-400">
                        <Receipt size={24} />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                        ANNUAL FINANCIAL CONSOLIDATION
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-tight">
                        Annual Operating Cost Consolidation
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs max-w-lg mx-auto leading-relaxed">
                        The annual view consolidates all operational expenses across the full fiscal year. To record or audit direct cash disbursements and vouchers, switch back to{" "}
                        <button onClick={() => setViewMode("monthly")} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                            Monthly Ledger
                        </button>.
                    </p>
                </div>
            )}

            <PNLFooter rise={rise} />
        </motion.div>
    );
}