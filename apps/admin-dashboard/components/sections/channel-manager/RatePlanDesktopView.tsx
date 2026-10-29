"use client";

import React, { useState } from "react";
import { MyTaraRatePlan } from "@/lib/channex/types";
import {
    Plus,
    Trash2,
    Edit2,
    Search,
    Coffee,
    TrendingUp,
    ShieldCheck,
    Layers,
    CheckCircle2,
    BedDouble,
    Copy,
    Activity,
    LayoutGrid,
    List,
    SlidersHorizontal,
    ChevronDown,
    ChevronRight,
    Check
} from "lucide-react";
import { toast } from "sonner";
import styles from "./RatePlanDesktopView.module.css";

export interface RatePlanDesktopViewProps {
    ratePlans: MyTaraRatePlan[];
    roomTypes: any[];
    currencyCode: string;
    currConfig: any;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    viewMode: "folio" | "ledger";
    setViewMode: (m: "folio" | "ledger") => void;
    openAddModal: () => void;
    openEditModal: (plan: MyTaraRatePlan) => void;
    deleteRatePlan: (id: string) => Promise<any> | void;
    handlePingRatePlan: (plan: MyTaraRatePlan) => Promise<void>;
    pingingId: string | null;
    seedDefaultRatePlans: (roomTypes: any[], currencyCode: string) => Promise<any> | void;
    savingRates: boolean;
    copyToClipboard: (text: string, label: string) => void;
    expandedIdRows: string[];
    toggleExpandRow: (id: string) => void;
    formatPlanRate: (val: number, planCurr?: string) => string;
    channexPropertyId?: string;
}

export const RatePlanDesktopView: React.FC<RatePlanDesktopViewProps> = ({
    ratePlans,
    roomTypes,
    currencyCode,
    currConfig,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    openAddModal,
    openEditModal,
    deleteRatePlan,
    handlePingRatePlan,
    pingingId,
    seedDefaultRatePlans,
    savingRates,
    copyToClipboard,
    expandedIdRows,
    toggleExpandRow,
    formatPlanRate,
    channexPropertyId
}) => {
    // Filter rate plans
    const filteredPlans = ratePlans.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const hasRoomMatch = p.roomTypeNames?.some(name => name.toLowerCase().includes(q));
        return (
            p.name?.toLowerCase().includes(q) ||
            p.code?.toLowerCase().includes(q) ||
            p.roomTypeName?.toLowerCase().includes(q) ||
            hasRoomMatch
        );
    });

    // KPI stats calculations
    const totalPlans = ratePlans.length;
    const allCoveredRoomIds = new Set<string>();
    ratePlans.forEach(p => {
        if (p.roomTypeIds && Array.isArray(p.roomTypeIds)) {
            p.roomTypeIds.forEach(id => allCoveredRoomIds.add(id));
        } else if (p.roomTypeId) {
            allCoveredRoomIds.add(p.roomTypeId);
        }
    });
    const coveredRooms = allCoveredRoomIds.size;

    let rateSum = 0;
    let rateCount = 0;
    ratePlans.forEach(p => {
        if (p.roomRates && Object.keys(p.roomRates).length > 0) {
            Object.values(p.roomRates).forEach(r => {
                rateSum += Number(r);
                rateCount++;
            });
        } else {
            rateSum += Number(p.baseRate || 0);
            rateCount++;
        }
    });
    const avgRate = rateCount > 0 ? Math.round(rateSum / rateCount) : 0;

    return (
        <div className={styles.container}>
            {/* 1. Header & Masthead */}
            <div className={styles.editorialMasthead}>
                <div className={styles.mastheadMeta}>
                    <span className={styles.mastheadEyebrow}>Central Reservation · Rate Portfolio</span>
                    <h2 className={styles.mastheadTitle}>Master Rate Plans &amp; Distribution</h2>
                    <p className={styles.mastheadDesc}>
                        Curated room tariff structures, USALI breakfast allocations, and live two-way ARI distribution across global OTA channels.
                    </p>
                </div>
                <div className={styles.mastheadActions}>
                    {channexPropertyId ? (
                        <div
                            className={styles.currencyPill}
                            onClick={() => copyToClipboard(channexPropertyId, "Channel Manager Property UUID")}
                            title={`Click to copy Channel Manager Property UUID: ${channexPropertyId}`}
                            style={{ cursor: "pointer" }}
                        >
                            <Copy size={11} />
                            <span>Property UUID: <b>{channexPropertyId}</b></span>
                        </div>
                    ) : null}
                    <div className={styles.currencyPill} title={`Base Currency: ${currConfig?.name || "IDR"}`}>
                        <span>{currConfig?.flag || "ID"}</span>
                        <span>{currConfig?.code || "IDR"}</span>
                        <span style={{ color: "#71717a" }}>({currConfig?.symbol || "Rp"})</span>
                    </div>
                </div>
            </div>

            {/* 2. Compact Stat Strip */}
            <div className={styles.statStrip}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <Layers size={12} /> Rate Plans
                    </span>
                    <span className={styles.statValue}>{totalPlans}</span>
                    <span className={styles.statSubtext}>Active tariff packages</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <CheckCircle2 size={12} /> Room Coverage
                    </span>
                    <span className={styles.statValue}>{coveredRooms} / {roomTypes.length}</span>
                    <span className={styles.statSubtext}>Room inventory mapped</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <TrendingUp size={12} /> Average Base Rate
                    </span>
                    <span className={styles.statValue}>{formatPlanRate(avgRate)}</span>
                    <span className={styles.statSubtext}>Net PMS base average</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>
                        <ShieldCheck size={12} /> Channel Sync
                    </span>
                    <span className={styles.statValue}>2-Way Live</span>
                    <span className={styles.statSubtext}>ARI push ready</span>
                </div>
            </div>

            {/* 3. Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.searchWrapper}>
                        <Search size={13} color="#71717a" />
                        <input
                            type="text"
                            placeholder="Search rate plans, codes, or rooms..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.toolbarRight}>
                    {/* View Switcher: Folios vs Ledger */}
                    <div className={styles.viewSwitcher}>
                        <button
                            type="button"
                            onClick={() => setViewMode("folio")}
                            className={`${styles.viewBtn} ${viewMode === "folio" ? styles.viewBtnActive : ""}`}
                            title="Switch to Compact Folio Cards View"
                        >
                            <LayoutGrid size={12} />
                            <span>Folios</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("ledger")}
                            className={`${styles.viewBtn} ${viewMode === "ledger" ? styles.viewBtnActive : ""}`}
                            title="Switch to High-Density Ledger View"
                        >
                            <List size={12} />
                            <span>Ledger</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => seedDefaultRatePlans(roomTypes, currencyCode)}
                        disabled={savingRates}
                        className={styles.btnSeed}
                        title="Auto-create standard Best Available Rate and Bed & Breakfast plans"
                    >
                        <SlidersHorizontal size={12} />
                        <span>Generate Standard Rates</span>
                    </button>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className={styles.btnAddRatePlan}
                    >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>Create Rate Plan</span>
                    </button>
                </div>
            </div>

            {/* 4. Content Area: Folios or Ledger */}
            {filteredPlans.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <Layers size={20} />
                    </div>
                    <h3 className={styles.emptyTitle}>
                        {ratePlans.length === 0 ? "No Rate Plans Configured" : "No Matching Rate Plans Found"}
                    </h3>
                    <p className={styles.emptySubtitle}>
                        {ratePlans.length === 0
                            ? "Establish your property tariff structures (such as Room Only, Bed & Breakfast, or Non-Refundable) to begin channel distribution."
                            : "Adjust your search filter above to locate specific rate plans or codes."}
                    </p>
                    {ratePlans.length === 0 && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <button
                                type="button"
                                onClick={() => seedDefaultRatePlans(roomTypes, currencyCode)}
                                disabled={savingRates}
                                className={styles.btnSeed}
                            >
                                <SlidersHorizontal size={12} />
                                <span>Generate Standard Rates</span>
                            </button>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className={styles.btnAddRatePlan}
                            >
                                <Plus size={13} strokeWidth={2.5} />
                                <span>Create New Rate Plan</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : viewMode === "folio" ? (
                /* Compact Folio Cards Grid */
                <div className={styles.folioGrid}>
                    {filteredPlans.map(plan => {
                        const rates = plan.roomRates && Object.keys(plan.roomRates).length > 0
                            ? Object.values(plan.roomRates)
                            : [Number(plan.baseRate || 0)];
                        const minRate = Math.min(...rates);
                        const maxRate = Math.max(...rates);
                        const isRange = minRate !== maxRate && isFinite(minRate) && isFinite(maxRate);

                        const ids = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
                            ? plan.roomTypeIds
                            : (plan.roomTypeId ? [plan.roomTypeId] : []);

                        // Channel sync UUID handling
                        const syncedRoomCount = plan.channexRatePlanIds ? Object.keys(plan.channexRatePlanIds).length : 0;
                        const isChannelSynced = Boolean(syncedRoomCount > 0 || plan.channexRatePlanId);
                        const primaryUuid = plan.channexRatePlanId || (plan.channexRatePlanIds ? Object.values(plan.channexRatePlanIds)[0] : "");

                        return (
                            <div key={plan.id} className={styles.folioCard}>
                                {/* Header */}
                                <div className={styles.folioCardHeader}>
                                    <div className={styles.folioTitleArea}>
                                        <span className={styles.folioCodeBadge}>{plan.code || "STD"}</span>
                                        <h3 className={styles.folioPlanName}>{plan.name}</h3>
                                    </div>
                                    <div className={styles.folioTopActions}>
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(plan)}
                                            className={styles.btnFolioAction}
                                            title="Edit Rate Plan"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteRatePlan(plan.id)}
                                            className={`${styles.btnFolioAction} ${styles.btnFolioDelete}`}
                                            title="Delete Rate Plan"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Price Row */}
                                <div className={styles.folioPriceBox}>
                                    <div className={styles.folioPriceLeft}>
                                        <span className={styles.folioPriceLabel}>Net Base Tariff</span>
                                        <div className={styles.folioPriceAmount}>
                                            {isRange ? (
                                                `${formatPlanRate(minRate, plan.currency)} - ${formatPlanRate(maxRate, plan.currency)}`
                                            ) : (
                                                formatPlanRate(Number(plan.baseRate || minRate || 0), plan.currency)
                                            )}
                                        </div>
                                    </div>
                                    <span className={styles.folioPriceSub}>
                                        /night · PMS Net
                                    </span>
                                </div>

                                {/* Specs 2x2 Grid */}
                                <div className={styles.folioSpecsGrid}>
                                    <div className={styles.folioSpecItem}>
                                        <span className={styles.folioSpecLabel}>
                                            <Coffee size={10} /> Meal:
                                        </span>
                                        <span className={styles.folioSpecValue}>
                                            {plan.mealsIncluded ? "Bed & Breakfast" : "Room Only"}
                                        </span>
                                    </div>

                                    <div className={styles.folioSpecItem}>
                                        <span className={styles.folioSpecLabel}>Policy:</span>
                                        <span className={styles.folioSpecValue}>
                                            {plan.cancellationPolicy === "NON_REFUNDABLE"
                                                ? "Non-Ref."
                                                : plan.cancellationPolicy === "MODERATE"
                                                ? "Moderate"
                                                : "Free Canc."}
                                        </span>
                                    </div>

                                    <div className={styles.folioSpecItem}>
                                        <span className={styles.folioSpecLabel}>Min Stay:</span>
                                        <span className={styles.folioSpecValue}>
                                            {plan.minStay || 1} Night(s)
                                        </span>
                                    </div>

                                    <div className={styles.folioSpecItem}>
                                        <span className={styles.folioSpecLabel}>Status:</span>
                                        <span className={styles.folioSpecValue} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                            <span className={plan.stopSell ? styles.dotGray : styles.dotBlack} />
                                            {plan.stopSell ? "Stop Sell" : "Open"}
                                        </span>
                                    </div>
                                </div>

                                {/* Linked Rooms Row */}
                                <div className={styles.folioRoomsRow}>
                                    <span style={{ fontSize: "10px", color: "#71717a" }}>Rooms Linked:</span>
                                    <div className={styles.folioRoomsBadge} title={ids.map(id => roomTypes.find(r => r.id === id)?.name || id).join(", ")}>
                                        <BedDouble size={10} />
                                        <span>
                                            {ids.length === 0
                                                ? "All Rooms"
                                                : ids.length === roomTypes.length && roomTypes.length > 1
                                                ? `All Categories (${ids.length})`
                                                : `${ids.length} Room Type(s)`}
                                        </span>
                                    </div>
                                </div>

                                {/* Rate Plan Channel Manager UUIDs (Full display with 1-click copy) */}
                                <div className={styles.folioUuidList}>
                                    {plan.channexRatePlanIds && Object.keys(plan.channexRatePlanIds).length > 0 ? (
                                        Object.entries(plan.channexRatePlanIds).map(([rtId, cUuid]) => {
                                            const rt = roomTypes.find(r => r.id === rtId);
                                            const roomLabel = rt?.name || "Room";
                                            return (
                                                <div
                                                    key={rtId}
                                                    className={styles.uuidRowPill}
                                                    onClick={() => copyToClipboard(cUuid as string, `UUID (${roomLabel})`)}
                                                    title={`Klik untuk menyalin UUID ${roomLabel}: ${cUuid}`}
                                                >
                                                    <div className={styles.uuidLeft}>
                                                        <Copy size={9} className={styles.uuidCopyIcon} />
                                                        <span className={styles.uuidTag}>{roomLabel}:</span>
                                                    </div>
                                                    <code className={styles.uuidVal}>{cUuid as string}</code>
                                                </div>
                                            );
                                        })
                                    ) : plan.channexRatePlanId ? (
                                        <div
                                            className={styles.uuidRowPill}
                                            onClick={() => copyToClipboard(plan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                            title={`Klik untuk menyalin UUID: ${plan.channexRatePlanId}`}
                                        >
                                            <div className={styles.uuidLeft}>
                                                <Copy size={9} className={styles.uuidCopyIcon} />
                                                <span className={styles.uuidTag}>UUID Channex:</span>
                                            </div>
                                            <code className={styles.uuidVal}>{plan.channexRatePlanId}</code>
                                        </div>
                                    ) : (
                                        <div className={styles.uuidRowUnsynced}>
                                            <span className={styles.uuidUnsyncedDot} />
                                            <span>Belum Terhubung ke Channel Manager</span>
                                        </div>
                                    )}
                                </div>

                                {/* Compact Footer */}
                                <div className={styles.folioCardFooter}>
                                    <div className={styles.folioSyncPill}>
                                        <span className={isChannelSynced ? styles.dotBlack : styles.dotGray} />
                                        <span>{isChannelSynced ? "Synced" : "PMS Direct"}</span>
                                    </div>

                                    <div className={styles.folioFooterRight}>
                                        <span
                                            className={styles.idPill}
                                            onClick={() => copyToClipboard(plan.id, "PMS Plan ID")}
                                            title={`Click to copy PMS Plan ID: ${plan.id}`}
                                        >
                                            <Copy size={9} /> PMS: <b>{plan.id}</b>
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handlePingRatePlan(plan)}
                                            disabled={pingingId === plan.id}
                                            className={styles.btnFolioPing}
                                            title="Ping test ARI sync with Channel Manager"
                                        >
                                            <Activity size={9} className={pingingId === plan.id ? "animate-spin" : ""} />
                                            <span>Ping</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* High-Density Ledger View (Table) */
                <div className={styles.ledgerContainer}>
                    <div className={styles.ledgerResponsive}>
                        <table className={styles.ledgerTable}>
                            <thead>
                                <tr>
                                    <th>Rate Plan</th>
                                    <th>Assigned Rooms</th>
                                    <th>Base Net Rate</th>
                                    <th>Meal Plan</th>
                                    <th>Policy</th>
                                    <th>Min. Stay</th>
                                    <th>Status</th>
                                    <th>Sync &amp; Channel Manager UUID</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlans.map(plan => {
                                    const rates = plan.roomRates && Object.keys(plan.roomRates).length > 0
                                        ? Object.values(plan.roomRates)
                                        : [Number(plan.baseRate || 0)];
                                    const minRate = Math.min(...rates);
                                    const maxRate = Math.max(...rates);
                                    const isRange = minRate !== maxRate && isFinite(minRate) && isFinite(maxRate);

                                    const ids = (plan.roomTypeIds && plan.roomTypeIds.length > 0)
                                        ? plan.roomTypeIds
                                        : (plan.roomTypeId ? [plan.roomTypeId] : []);

                                    return (
                                        <React.Fragment key={plan.id}>
                                            <tr>
                                                <td>
                                                    <div className={styles.ledgerPlanCell}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <span className={styles.ledgerPlanName}>{plan.name}</span>
                                                            <span className={styles.folioCodeBadge}>
                                                                {plan.code || "STD"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandRow(plan.id)}
                                                            className={`${styles.btnIdToggle} ${expandedIdRows.includes(plan.id) ? styles.btnIdToggleActive : ""}`}
                                                            title="Inspect PMS & Channel Manager UUIDs"
                                                        >
                                                            <Copy size={9} />
                                                            <span>{expandedIdRows.includes(plan.id) ? "Hide IDs" : "Inspect IDs"}</span>
                                                            {expandedIdRows.includes(plan.id) ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span style={{ fontSize: 11, color: "#18181b" }}>
                                                        {ids.length === roomTypes.length
                                                            ? `All Rooms (${ids.length})`
                                                            : `${ids.length} Room(s)`}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div className={styles.ledgerRateCell}>
                                                        {isRange ? (
                                                            `${formatPlanRate(minRate, plan.currency)} - ${formatPlanRate(maxRate, plan.currency)}`
                                                        ) : (
                                                            formatPlanRate(Number(plan.baseRate || minRate || 0), plan.currency)
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    {plan.mealsIncluded ? (
                                                        <span className={styles.badgeMonochrome}>
                                                            <Coffee size={10} /> Bed &amp; Breakfast
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#71717a", fontSize: 11 }}>
                                                            Room Only
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span className={styles.badgeMonochrome}>
                                                        {plan.cancellationPolicy || "FREE"}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span style={{ fontFamily: "var(--font-geist-mono, monospace)", fontVariantNumeric: "tabular-nums" }}>
                                                        {plan.minStay || 1} Night(s)
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <span className={`${styles.badgeMonochrome} ${plan.stopSell ? styles.badgeStopSell : ""}`}>
                                                        <span className={plan.stopSell ? styles.dotGray : styles.dotBlack} />
                                                        {plan.stopSell ? "Stop Sell" : "Open"}
                                                    </span>
                                                </td>
                                                <td style={{ minWidth: 260 }}>
                                                    <div className={styles.ledgerSyncCol}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                                                            <span className={styles.folioSyncPill}>
                                                                <span className={isChannelSynced ? styles.dotBlack : styles.dotGray} />
                                                                <span>{isChannelSynced ? "Synced" : "PMS Direct"}</span>
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePingRatePlan(plan)}
                                                                disabled={pingingId === plan.id}
                                                                className={styles.btnFolioPing}
                                                                title="Ping ARI"
                                                            >
                                                                <Activity size={9} className={pingingId === plan.id ? "animate-spin" : ""} />
                                                            </button>
                                                        </div>

                                                        {/* Full UUID listing in Ledger table */}
                                                        {plan.channexRatePlanIds && Object.keys(plan.channexRatePlanIds).length > 0 ? (
                                                            <div className={styles.ledgerUuidWrap}>
                                                                {Object.entries(plan.channexRatePlanIds).map(([rtId, cUuid]) => {
                                                                    const rt = roomTypes.find(r => r.id === rtId);
                                                                    const roomLabel = rt?.name || "Room";
                                                                    return (
                                                                        <div
                                                                            key={rtId}
                                                                            className={styles.ledgerUuidPill}
                                                                            onClick={() => copyToClipboard(cUuid as string, `UUID (${roomLabel})`)}
                                                                            title={`Klik untuk menyalin UUID ${roomLabel}: ${cUuid}`}
                                                                        >
                                                                            <Copy size={9} className={styles.uuidCopyIcon} />
                                                                            <span className={styles.ledgerUuidRoomLabel}>{roomLabel}:</span>
                                                                            <code className={styles.ledgerUuidCode}>{cUuid as string}</code>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : plan.channexRatePlanId ? (
                                                            <div
                                                                className={styles.ledgerUuidPill}
                                                                onClick={() => copyToClipboard(plan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                                                title={`Klik untuk menyalin UUID: ${plan.channexRatePlanId}`}
                                                            >
                                                                <Copy size={9} className={styles.uuidCopyIcon} />
                                                                <span className={styles.ledgerUuidRoomLabel}>UUID:</span>
                                                                <code className={styles.ledgerUuidCode}>{plan.channexRatePlanId}</code>
                                                            </div>
                                                        ) : (
                                                            <span className={styles.ledgerNotSyncedText}>Belum Terhubung</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(plan)}
                                                            className={styles.btnFolioAction}
                                                            title="Edit Plan"
                                                        >
                                                            <Edit2 size={11} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteRatePlan(plan.id)}
                                                            className={`${styles.btnFolioAction} ${styles.btnFolioDelete}`}
                                                            title="Delete Plan"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedIdRows.includes(plan.id) && (
                                                <tr className={styles.ledgerIdTrayRow}>
                                                    <td colSpan={9} className={styles.ledgerIdTrayCell}>
                                                        <div className={styles.ledgerIdTrayInner}>
                                                            <span className={styles.ledgerIdTrayTitle}>Rate Plan IDs:</span>
                                                            <span
                                                                className={styles.ledgerIdTrayPill}
                                                                onClick={() => copyToClipboard(plan.id, "PMS Plan ID")}
                                                                title="Click to copy PMS Rate Plan ID"
                                                            >
                                                                <Copy size={9} /> PMS ID: <b>{plan.id}</b>
                                                            </span>
                                                            {plan.channexRatePlanIds && Object.keys(plan.channexRatePlanIds).length > 0 ? (
                                                                Object.entries(plan.channexRatePlanIds).map(([rtId, cUuid]) => {
                                                                    const rt = roomTypes.find(r => r.id === rtId);
                                                                    const roomLabel = rt?.name || "Room";
                                                                    return (
                                                                        <span
                                                                            key={rtId}
                                                                            className={styles.ledgerIdTrayPill}
                                                                            onClick={() => copyToClipboard(cUuid, `${roomLabel} Channel Manager UUID`)}
                                                                            title={`Click to copy UUID: ${cUuid}`}
                                                                        >
                                                                            <Copy size={9} /> Channel Manager ({roomLabel}): <b>{cUuid}</b>
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : plan.channexRatePlanId ? (
                                                                <span
                                                                    className={styles.ledgerIdTrayPill}
                                                                    onClick={() => copyToClipboard(plan.channexRatePlanId!, "Channel Manager Rate UUID")}
                                                                    title={`Click to copy UUID: ${plan.channexRatePlanId}`}
                                                                >
                                                                    <Copy size={9} /> Channel Manager: <b>{plan.channexRatePlanId}</b>
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
