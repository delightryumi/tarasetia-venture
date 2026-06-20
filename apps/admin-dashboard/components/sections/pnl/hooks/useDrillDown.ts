"use client";

import React from "react";
import { DrillDownData, GlobalPnLResult, PnlIncomeItem, PnlExpenseItem } from "@/lib/pnl-utils";
import { getDrillDownData, ExtendedTransaction } from "@/lib/pnl-logic";

interface UseDrillDownOptions {
    pnlResult:               GlobalPnLResult | null;
    rawTransactions:         ExtendedTransaction[];
    customIncomes:           PnlIncomeItem[];
    expenses:                PnlExpenseItem[];
    posOrders:               any[];
    vatPercentage:           number;
    mgmtFeePercentage:       number;
    serviceChargePercentage: number;
    lostBreakagePercentage:  number;
    month:                   string;
    payrollDetails?:         any[];
}

export function useDrillDown({
    pnlResult, rawTransactions, customIncomes, expenses, posOrders,
    vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage,
    payrollDetails
}: UseDrillDownOptions) {
    const [selectedDrillDown,    setSelectedDrillDown]    = React.useState<DrillDownData | null>(null);
    const [isDrillDownModalOpen, setIsDrillDownModalOpen] = React.useState(false);
    const [drillDownSearchQuery, setDrillDownSearchQuery] = React.useState("");
    const [drillDownTab,         setDrillDownTab]         = React.useState<"all" | "income" | "expense">("all");

    const handleCardClick = (cardId: string) => {
        if (!pnlResult) return;
        let drillDown = getDrillDownData(
            cardId, rawTransactions, customIncomes, expenses, posOrders,
            vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage,
            payrollDetails
        );

        if (drillDown && drillDown.items) {
          drillDown.items = drillDown.items.map(item => {
            if (item.id === 'vat-calc' || item.id === 'ded-vat' || item.id === 'recon-vat') {
              return { ...item, amount: pnlResult.card11_VAT || 0 };
            }
            if (item.id === 'mgmt-calc' || item.id === 'ded-mgmt' || item.id === 'recon-mgmt') {
              return { ...item, amount: pnlResult.card9_FeeGross || 0 };
            }
            if (item.id === 'service-calc' || item.id === 'ded-service' || item.id === 'recon-service') {
              return { ...item, amount: pnlResult.summaryServiceCharge || 0 };
            }
            if (item.id === 'lost-calc' || item.id === 'ded-lost' || item.id === 'recon-lost') {
              return { ...item, amount: pnlResult.summaryLostBreakage || 0 };
            }
            if (item.id === 'recon-gop') {
              return { ...item, amount: pnlResult.card7_TotalGOP || 0 };
            }
            return item;
          });
        }

        setSelectedDrillDown(drillDown);
        setDrillDownSearchQuery("");
        if (cardId === "Compliment Deductions") {
          setDrillDownTab("expense"); // Auto-show expenses for compliment deductions
        } else {
          setDrillDownTab("all");
        }
        setIsDrillDownModalOpen(true);
    };

    const closeModal = () => setIsDrillDownModalOpen(false);

    /* ── Derived memo: filtered + aggregated modal data ── */
    const modalData = React.useMemo(() => {
        if (!selectedDrillDown) return null;

        const searched = selectedDrillDown.items.filter((item) => {
            const q = drillDownSearchQuery.toLowerCase();
            return (
                (item.description ?? "").toLowerCase().includes(q) ||
                (item.source      ?? "").toLowerCase().includes(q) ||
                (item.department  ?? "").toLowerCase().includes(q) ||
                (item.docType     ?? "").toLowerCase().includes(q)
            );
        });

        const filtered = searched.filter((item) => {
            if (drillDownTab === "income")  return item.type !== "expense";
            if (drillDownTab === "expense") return item.type === "expense";
            return true;
        });

        const totalIncome  = searched.filter((i) => i.type !== "expense").reduce((s, i) => s + i.amount, 0);
        const totalExpense = searched.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
        const netFlow      = filtered.reduce((s, i) => s + (i.type === "expense" ? -i.amount : i.amount), 0);

        return { searched, filtered, totalIncome, totalExpense, netFlow };
    }, [selectedDrillDown, drillDownSearchQuery, drillDownTab]);

    /* ── F&B performance card detection ── */
    const isFbPerformanceCard = React.useMemo(() => {
        if (!selectedDrillDown) return false;
        return [
            "Food A la Carte Performance",
            "Banquet Performance",
            "Total F&B A la Carte Performance",
            "Beverage A la Carte Performance",
        ].includes(selectedDrillDown.title);
    }, [selectedDrillDown]);

    /* ── F&B breakdown data (for performance cards) ── */
    const fbPerformanceData = React.useMemo(() => {
        if (!selectedDrillDown || !isFbPerformanceCard || !pnlResult || !modalData) return null;

        const serviceRate        = Number(pnlResult.posServiceRate       || 0);
        const taxRateIndividual  = Number(pnlResult.posTaxRateIndividual || 0);
        const lostBreakageRateV  = Number(pnlResult.posLostBreakageRate  || 0);
        const taxRateCombined    = serviceRate + taxRateIndividual + lostBreakageRateV;

        const totalDiscount    = modalData.searched.filter((i) => i.type !== "expense").reduce((s, i) => s + (i.discount || 0), 0);
        const grossRevenue     = modalData.totalIncome;
        const netRevenue       = taxRateCombined > 0 ? grossRevenue / (1 + taxRateCombined / 100) : grossRevenue;
        const subtotal         = netRevenue + totalDiscount;
        const serviceCharge    = netRevenue * (serviceRate       / 100);
        const taxAmount        = netRevenue * (taxRateIndividual / 100);
        const lostBreakageAmt  = netRevenue * (lostBreakageRateV / 100);
        const expensesTotal    = modalData.totalExpense;
        const netProfit        = netRevenue - expensesTotal;
        const costPercentage   = netRevenue > 0 ? (expensesTotal / netRevenue) * 100 : 0;

        return {
            serviceRate, taxRateIndividual, lostBreakageRate: lostBreakageRateV, taxRateCombined,
            grossRevenue, netRevenue, serviceCharge, taxAmount, totalDiscount, subtotal,
            lostBreakageAmount: lostBreakageAmt, expenses: expensesTotal, netProfit, costPercentage,
        };
    }, [selectedDrillDown, isFbPerformanceCard, modalData, pnlResult]);

    /* ── Cost thresholds per card type ── */
    const costConfig = React.useMemo(() => {
        if (!selectedDrillDown) return { costLabel: "COGS", healthyThreshold: 35, warningThreshold: 50 };
        switch (selectedDrillDown.title) {
            case "Food A la Carte Performance":    return { costLabel: "Food Cost",    healthyThreshold: 30, warningThreshold: 40 };
            case "Beverage A la Carte Performance":return { costLabel: "Beverage Cost",healthyThreshold: 18, warningThreshold: 25 };
            case "Banquet Performance":            return { costLabel: "Banquet Cost", healthyThreshold: 45, warningThreshold: 50 };
            default:                               return { costLabel: "Total Cost",   healthyThreshold: 30, warningThreshold: 40 };
        }
    }, [selectedDrillDown]);

    /* ── Badge colour for cost percentage ── */
    const modalBadgeInfo = React.useMemo(() => {
        if (!fbPerformanceData || !costConfig) return { color: "", text: "" };
        const cp = fbPerformanceData.costPercentage;
        if (cp === 0)                          return { color: "bg-neutral-100 text-neutral-500 border border-neutral-200", text: "No Data" };
        if (cp <= costConfig.healthyThreshold) return { color: "bg-emerald-50 text-emerald-600 border border-emerald-100",  text: `Healthy (≤${costConfig.healthyThreshold}%)` };
        if (cp <= costConfig.warningThreshold) return { color: "bg-amber-50 text-amber-600 border border-amber-100",        text: `Warning (${costConfig.healthyThreshold}-${costConfig.warningThreshold}%)` };
        return                                        { color: "bg-rose-50 text-rose-600 border border-rose-100",           text: `Critical (>${costConfig.warningThreshold}%)` };
    }, [fbPerformanceData, costConfig]);

    /* ── KPI card detection ── */
    const isKpiCard = React.useMemo(() => {
        if (!selectedDrillDown) return false;
        return ["OCC", "ARR", "RevPAR"].includes(selectedDrillDown.title);
    }, [selectedDrillDown]);

    const kpiData = React.useMemo(() => {
        if (!selectedDrillDown || !isKpiCard || !pnlResult) return null;
        return {
            occ: pnlResult.occ || 0,
            arr: pnlResult.arr || 0,
            revPar: pnlResult.revPar || 0,
            roomsAvailable: pnlResult.roomsAvailable || 0,
            roomsSold: pnlResult.roomsSold || 0,
            totalRooms: pnlResult.totalRooms || 0,
            daysInPeriod: pnlResult.daysInPeriod || 0,
            ledgerRoomRevenue: pnlResult.ledgerRoomRevenue || 0,
        };
    }, [selectedDrillDown, isKpiCard, pnlResult]);

    return {
        /* state */
        selectedDrillDown, isDrillDownModalOpen,
        drillDownSearchQuery, setDrillDownSearchQuery,
        drillDownTab,         setDrillDownTab,
        /* actions */
        handleCardClick, closeModal,
        /* derived */
        modalData, isFbPerformanceCard, fbPerformanceData, costConfig, modalBadgeInfo,
        isKpiCard, kpiData,
    };
}
