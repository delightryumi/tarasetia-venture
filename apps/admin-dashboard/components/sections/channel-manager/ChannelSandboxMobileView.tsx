"use client";

import React from "react";
import {
    Play,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Send,
    Terminal,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import styles from "./ChannelSandboxMobileView.module.css";
import { ChannelSandboxViewProps } from "./ChannelSandboxDesktopView";

export const ChannelSandboxMobileView: React.FC<ChannelSandboxViewProps> = ({
    roomTypes,
    availableRatePlans,
    channexEnv,
    sandboxSection,
    setSandboxSection,
    certStages,
    ariCertStages,
    runningCertAll,
    runningAriCertAll,
    runAriCertStage,
    runAllAriCertStages,
    runCertStage,
    runAllCertStages,
    passedAriCount,
    passedComplianceCount,
    totalPassed,
    totalScenarios,
    readinessPercent,
    simChannel,
    setSimChannel,
    simGuestName,
    setSimGuestName,
    simGuestEmail,
    setSimGuestEmail,
    simRoomTypeId,
    setSimRoomTypeId,
    simRatePlanId,
    setSimRatePlanId,
    simPrice,
    setSimPrice,
    simCheckin,
    setSimCheckin,
    simCheckout,
    setSimCheckout,
    simPaymentCollect,
    setSimPaymentCollect,
    simulating,
    simulatedResult,
    handleSimulateBooking
}) => {
    return (
        <div className={styles.container}>
            {/* Mobile Readiness Bar */}
            <div className={styles.readinessBarMobile}>
                <div className={styles.readinessHeader}>
                    <h2 className={styles.readinessTitle}>Certification Suite</h2>
                    <span className={styles.envBadge}>{channexEnv.toUpperCase()}</span>
                </div>
                <div className={styles.progressBarTrack}>
                    <div
                        className={styles.progressBarFill}
                        style={{ width: `${readinessPercent}%` }}
                    />
                </div>
                <div className={styles.readinessScoreRow}>
                    <span>Readiness:</span>
                    <span className={styles.readinessScoreValue}>
                        {totalPassed}/{totalScenarios} Passed ({readinessPercent}%)
                    </span>
                </div>
            </div>

            {/* Scrollable Tabs */}
            <div className={styles.tabsScrollRow}>
                <button
                    type="button"
                    onClick={() => setSandboxSection("ari")}
                    className={`${styles.tabChip} ${sandboxSection === "ari" ? styles.tabChipActive : ""}`}
                >
                    <Sparkles size={12} />
                    <span>10 ARI Tests ({passedAriCount}/10)</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSandboxSection("compliance")}
                    className={`${styles.tabChip} ${sandboxSection === "compliance" ? styles.tabChipActive : ""}`}
                >
                    <ShieldCheck size={12} />
                    <span>8 Compliance ({passedComplianceCount}/8)</span>
                </button>
                <button
                    type="button"
                    onClick={() => setSandboxSection("simulator")}
                    className={`${styles.tabChip} ${sandboxSection === "simulator" ? styles.tabChipActive : ""}`}
                >
                    <Terminal size={12} />
                    <span>Simulator</span>
                </button>
            </div>

            {/* Section 1: 10 ARI Scenarios */}
            {sandboxSection === "ari" && (
                <>
                    <div className={styles.suiteActionRow}>
                        <button
                            type="button"
                            onClick={runAllAriCertStages}
                            disabled={runningAriCertAll}
                            className={styles.btnActionTouch}
                        >
                            <Play size={12} className={runningAriCertAll ? "animate-spin" : ""} />
                            <span>{runningAriCertAll ? "Running 10 Tests..." : "Run All 10 Tests"}</span>
                        </button>
                    </div>

                    <div className={styles.stageCardList}>
                        {ariCertStages.map((stage, idx) => (
                            <div key={stage.id} className={styles.stageCard}>
                                <div className={styles.stageCardHeader}>
                                    <div className={styles.stageCardTitleArea}>
                                        <span className={styles.stageNumberBadge}>{stage.num}</span>
                                        <h4 className={styles.stageTitle}>{stage.title}</h4>
                                    </div>
                                    <span
                                        className={`${styles.stageStatusPill} ${
                                            stage.status === "passed"
                                                ? styles.statusPassed
                                                : stage.status === "failed"
                                                ? styles.statusFailed
                                                : stage.status === "running"
                                                ? styles.statusRunning
                                                : styles.statusPending
                                        }`}
                                    >
                                        {stage.status === "passed" ? (
                                            <CheckCircle2 size={10} />
                                        ) : stage.status === "failed" ? (
                                            <XCircle size={10} />
                                        ) : null}
                                        <span>{stage.status}</span>
                                    </span>
                                </div>

                                <p className={styles.stageDesc}>{stage.desc}</p>
                                {stage.detail && (
                                    <p
                                        className={`${styles.stageDetail} ${
                                            stage.status === "passed"
                                                ? styles.stageDetailSuccess
                                                : styles.stageDetailError
                                        }`}
                                    >
                                        {stage.detail}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={() => runAriCertStage(idx)}
                                    disabled={stage.status === "running"}
                                    className={styles.btnRunSingleTouch}
                                >
                                    <Play size={11} className={stage.status === "running" ? "animate-spin" : ""} />
                                    <span>{stage.status === "running" ? "Testing..." : "Test Scenario"}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Section 2: 8 Compliance Stages */}
            {sandboxSection === "compliance" && (
                <>
                    <div className={styles.suiteActionRow}>
                        <button
                            type="button"
                            onClick={runAllCertStages}
                            disabled={runningCertAll}
                            className={styles.btnActionTouch}
                        >
                            <Play size={12} className={runningCertAll ? "animate-spin" : ""} />
                            <span>{runningCertAll ? "Running 8 Stages..." : "Run All 8 Stages"}</span>
                        </button>
                    </div>

                    <div className={styles.stageCardList}>
                        {certStages.map((stage, idx) => (
                            <div key={stage.id} className={styles.stageCard}>
                                <div className={styles.stageCardHeader}>
                                    <div className={styles.stageCardTitleArea}>
                                        <span className={styles.stageNumberBadge}>{stage.num}</span>
                                        <h4 className={styles.stageTitle}>{stage.title}</h4>
                                    </div>
                                    <span
                                        className={`${styles.stageStatusPill} ${
                                            stage.status === "passed"
                                                ? styles.statusPassed
                                                : stage.status === "failed"
                                                ? styles.statusFailed
                                                : stage.status === "running"
                                                ? styles.statusRunning
                                                : styles.statusPending
                                        }`}
                                    >
                                        {stage.status === "passed" ? (
                                            <CheckCircle2 size={10} />
                                        ) : stage.status === "failed" ? (
                                            <XCircle size={10} />
                                        ) : null}
                                        <span>{stage.status}</span>
                                    </span>
                                </div>

                                <p className={styles.stageDesc}>{stage.desc}</p>
                                {stage.detail && (
                                    <p
                                        className={`${styles.stageDetail} ${
                                            stage.status === "passed"
                                                ? styles.stageDetailSuccess
                                                : styles.stageDetailError
                                        }`}
                                    >
                                        {stage.detail}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={() => runCertStage(idx)}
                                    disabled={stage.status === "running"}
                                    className={styles.btnRunSingleTouch}
                                >
                                    <Play size={11} className={stage.status === "running" ? "animate-spin" : ""} />
                                    <span>{stage.status === "running" ? "Testing..." : "Test Stage"}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Section 3: Simulator Inbound */}
            {sandboxSection === "simulator" && (
                <div className={styles.simMobileCard}>
                    <div className={styles.simFormGroup}>
                        <label className={styles.simLabel}>Channel OTA</label>
                        <select
                            value={simChannel}
                            onChange={(e) => setSimChannel(e.target.value)}
                            className={styles.simSelect}
                        >
                            <option value="Traveloka">Traveloka</option>
                            <option value="Booking.com">Booking.com</option>
                            <option value="Agoda">Agoda</option>
                            <option value="Tiket.com">Tiket.com</option>
                            <option value="Expedia">Expedia</option>
                        </select>
                    </div>

                    <div className={styles.simFormGroup}>
                        <label className={styles.simLabel}>Room Type</label>
                        <select
                            value={simRoomTypeId}
                            onChange={(e) => setSimRoomTypeId(e.target.value)}
                            className={styles.simSelect}
                        >
                            {roomTypes.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.simFormGroup}>
                        <label className={styles.simLabel}>Rate Plan</label>
                        <select
                            value={simRatePlanId}
                            onChange={(e) => setSimRatePlanId(e.target.value)}
                            className={styles.simSelect}
                        >
                            {availableRatePlans.map(rp => (
                                <option key={rp.id} value={rp.id}>{rp.name || rp.code || rp.id}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.simFormGroup}>
                        <label className={styles.simLabel}>Guest Name</label>
                        <input
                            type="text"
                            value={simGuestName}
                            onChange={(e) => setSimGuestName(e.target.value)}
                            className={styles.simInput}
                        />
                    </div>

                    <div className={styles.simFormGroup}>
                        <label className={styles.simLabel}>Total Price (IDR)</label>
                        <input
                            type="number"
                            value={simPrice}
                            onChange={(e) => setSimPrice(Number(e.target.value))}
                            className={styles.simInput}
                            style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSimulateBooking("create_booking")}
                        disabled={simulating}
                        className={styles.btnSimSubmitTouch}
                    >
                        <Send size={12} className={simulating ? "animate-spin" : ""} />
                        <span>Inject New Booking</span>
                    </button>

                    {simulatedResult?.bookingId && (
                        <button
                            type="button"
                            onClick={() => handleSimulateBooking("cancel_booking")}
                            disabled={simulating}
                            style={{
                                width: "100%",
                                minHeight: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                background: "#ffffff",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            <RotateCcw size={12} />
                            <span>Cancel Booking #{simulatedResult.bookingId.slice(0, 8)}</span>
                        </button>
                    )}

                    <div className={styles.terminalCardMobile}>
                        <div className={styles.terminalHeader}>
                            <span>Terminal Output</span>
                            {simulatedResult && <span style={{ color: "#34d399" }}>200 OK</span>}
                        </div>
                        <pre className={styles.terminalBody}>
                            {simulatedResult
                                ? JSON.stringify(simulatedResult, null, 2)
                                : "// No simulation executed yet."}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
