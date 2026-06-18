"use client";

import React from "react";
import { motion } from "framer-motion";
import { formatIDR } from "@/lib/pnl-utils";
import { usePnL } from "@/components/sections/pnl/usePnL";
import { PNLHeader } from "@/components/sections/pnl/components/PNLHeader";
import { FinancialStatements } from "@/components/sections/pnl/components/statements/FinancialStatements";
import { usePnLExport } from "@/components/sections/pnl/hooks/usePnLExport";
import "@/components/sections/pnl/PNLStyles.css";

const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const rise = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function StatementsPage() {
    const {
        viewMode, setViewMode,
        displayMode, setDisplayMode,
        month, setMonth,
        loading, pnlResult,
        expenses,
        showDatePicker, setShowDatePicker,
        rawTransactions, customIncomes, posOrders, nonCommissionRevenue,
        startingBalance, fixedAssetsValue, updateFixedAssetsValue,
        vatPaid, updateVatPaid, feePaid, updateFeePaid, scPaid, updateScPaid, lbPaid, updateLbPaid,
        payrollDetails, updateStartingBalance,
    } = usePnL();

    const [y] = month.split("-");

    const { handleExportExcel, handleExportPDF } = usePnLExport({
        pnlResult, expenses, viewMode, month, year: y,
        selectedDrillDownTitle: undefined,
        drillItems: undefined,
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
                viewMode={viewMode}
                setViewMode={setViewMode}
                displayMode={"statements"}
                setDisplayMode={() => {}}
                month={month}
                setMonth={setMonth}
                showDatePicker={showDatePicker}
                setShowDatePicker={setShowDatePicker}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                rise={rise}
                hideDisplayMode={true}
            />

            <motion.div
                key="statements-view"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-10"
            >
                {pnlResult ? (
                    <FinancialStatements
                        pnlResult={pnlResult}
                        rawTransactions={rawTransactions}
                        expenses={expenses}
                        customIncomes={customIncomes}
                        nonCommissionRevenue={nonCommissionRevenue}
                        posOrders={posOrders}
                        payrollDetails={payrollDetails}
                        month={month}
                        startingBalance={startingBalance}
                        updateStartingBalance={updateStartingBalance}
                        fixedAssetsValue={fixedAssetsValue}
                        updateFixedAssetsValue={updateFixedAssetsValue}
                        vatPaid={vatPaid}
                        updateVatPaid={updateVatPaid}
                        feePaid={feePaid}
                        updateFeePaid={updateFeePaid}
                        scPaid={scPaid}
                        updateScPaid={updateScPaid}
                        lbPaid={lbPaid}
                        updateLbPaid={updateLbPaid}
                        formatIDR={formatIDR}
                    />
                ) : loading ? (
                    <div className="bg-white dark:bg-[#1a1a1a] border border-stone-100 dark:border-[#262626] rounded-2xl p-10 text-center shadow-xl shadow-stone-200/20 dark:shadow-none">
                        <p className="text-stone-500 dark:text-[#a1a1aa] animate-pulse font-medium">Memuat data Laporan Keuangan...</p>
                    </div>
                ) : null}
            </motion.div>
        </motion.div>
    );
}
