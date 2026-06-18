import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Scale, ArrowRightLeft } from "lucide-react";
import { GlobalPnLResult, PnlExpenseItem, PnlIncomeItem } from "@/lib/pnl-utils";
import { GeneralLedger } from "./GeneralLedger";
import { BalanceSheet } from "./BalanceSheet";
import { CashFlow } from "./CashFlow";
import styles from "./statements.module.css";

interface FinancialStatementsProps {
    pnlResult: GlobalPnLResult;
    rawTransactions: any[];
    expenses: PnlExpenseItem[];
    customIncomes: PnlIncomeItem[];
    nonCommissionRevenue: PnlIncomeItem[];
    posOrders: any[];
    payrollDetails: any[];
    month: string;
    startingBalance: number;
    updateStartingBalance: (val: number) => void;
    fixedAssetsValue: number;
    updateFixedAssetsValue: (val: number) => void;
    vatPaid: number;
    updateVatPaid: (val: number) => void;
    feePaid: number;
    updateFeePaid: (val: number) => void;
    scPaid: number;
    updateScPaid: (val: number) => void;
    lbPaid: number;
    updateLbPaid: (val: number) => void;
    formatIDR: (val: number) => string;
}

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({
    pnlResult, rawTransactions, expenses, customIncomes, nonCommissionRevenue, posOrders, payrollDetails, month, startingBalance, updateStartingBalance, fixedAssetsValue, updateFixedAssetsValue,
    vatPaid, updateVatPaid, feePaid, updateFeePaid, scPaid, updateScPaid, lbPaid, updateLbPaid, formatIDR
}) => {
    const [activeTab, setActiveTab] = useState<"gl" | "bs" | "cf">("gl");

    return (
        <div className={styles.flexColumn} style={{ gap: "32px", width: "100%", maxWidth: "1152px", margin: "0 auto" }}>
            {/* Header Tabs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <button
                    onClick={() => setActiveTab("gl")}
                    className={`${styles.tabButton} ${activeTab === "gl" ? styles.tabButtonActive : ""}`}
                >
                    <BookOpen size={16} />
                    Buku Besar
                </button>
                <button
                    onClick={() => setActiveTab("bs")}
                    className={`${styles.tabButton} ${activeTab === "bs" ? styles.tabButtonActive : ""}`}
                >
                    <Scale size={16} />
                    Neraca
                </button>
                <button
                    onClick={() => setActiveTab("cf")}
                    className={`${styles.tabButton} ${activeTab === "cf" ? styles.tabButtonActive : ""}`}
                >
                    <ArrowRightLeft size={16} />
                    Arus Kas
                </button>
            </div>

            <div style={{ position: "relative" }}>
                <AnimatePresence mode="wait">
                    {activeTab === "gl" && (
                        <motion.div key="gl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <GeneralLedger 
                                rawTransactions={rawTransactions} 
                                expenses={expenses} 
                                customIncomes={customIncomes} 
                                nonCommissionRevenue={nonCommissionRevenue} 
                                posOrders={posOrders}
                                payrollDetails={payrollDetails}
                                month={month}
                                startingBalance={startingBalance}
                                formatIDR={formatIDR} 
                                vatPaid={vatPaid}
                                feePaid={feePaid}
                                scPaid={scPaid}
                                lbPaid={lbPaid}
                            />
                        </motion.div>
                    )}
                    {activeTab === "bs" && (
                        <motion.div key="bs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <BalanceSheet 
                                pnlResult={pnlResult} 
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
                                rawTransactions={rawTransactions}
                                expenses={expenses}
                                formatIDR={formatIDR} 
                                month={month}
                            />
                        </motion.div>
                    )}
                    {activeTab === "cf" && (
                        <motion.div key="cf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <CashFlow 
                                pnlResult={pnlResult} 
                                startingBalance={startingBalance} 
                                formatIDR={formatIDR} 
                                rawTransactions={rawTransactions}
                                expenses={expenses}
                                fixedAssetsValue={fixedAssetsValue}
                                vatPaid={vatPaid}
                                feePaid={feePaid}
                                scPaid={scPaid}
                                lbPaid={lbPaid}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
