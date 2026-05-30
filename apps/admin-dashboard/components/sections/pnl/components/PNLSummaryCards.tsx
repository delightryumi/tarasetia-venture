"use client";

import React from "react";
import { GlobalPnLResult } from "@/lib/pnl-utils";
import { RoomRevenueSection }     from "./sections/RoomRevenueSection";
import { FnBLedgerSection }       from "./sections/FnBLedgerSection";
import { FnBPerformanceSection }  from "./sections/FnBPerformanceSection";
import { ExecutiveSummarySection } from "./sections/ExecutiveSummarySection";

interface PNLSummaryCardsProps {
    pnlResult:               GlobalPnLResult | null;
    loading:                 boolean;
    vatPercentage:           number;
    mgmtFeePercentage:       number;
    serviceChargePercentage: number;
    lostBreakagePercentage:  number;
    onVatChange:     (v: number) => void;
    onFeeChange:     (v: number) => void;
    onServiceChange: (v: number) => void;
    onLostChange:    (v: number) => void;
    rise:            any;
    formatIDR:       (v: number) => string;
    onCardClick:     (cardId: string) => void;
}

export const PNLSummaryCards: React.FC<PNLSummaryCardsProps> = ({
    pnlResult, loading, rise,
    vatPercentage, mgmtFeePercentage, serviceChargePercentage, lostBreakagePercentage,
    onVatChange, onFeeChange, onServiceChange, onLostChange,
    onCardClick,
}) => {
    return (
        <div className="flex flex-col gap-10">
            <RoomRevenueSection    pnlResult={pnlResult} loading={loading} rise={rise} onCardClick={onCardClick} />
            <FnBLedgerSection      pnlResult={pnlResult} loading={loading} rise={rise} onCardClick={onCardClick} />
            <FnBPerformanceSection pnlResult={pnlResult} loading={loading} rise={rise} onCardClick={onCardClick} />
            <ExecutiveSummarySection
                pnlResult={pnlResult} loading={loading} rise={rise}
                vatPercentage={vatPercentage}
                mgmtFeePercentage={mgmtFeePercentage}
                serviceChargePercentage={serviceChargePercentage}
                lostBreakagePercentage={lostBreakagePercentage}
                onVatChange={onVatChange}
                onFeeChange={onFeeChange}
                onServiceChange={onServiceChange}
                onLostChange={onLostChange}
                onCardClick={onCardClick}
            />
        </div>
    );
};
