"use client";

import React from "react";
import {
    ShieldCheck,
    Play,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Send,
    Terminal,
    Copy,
    Check,
    Sparkles,
    CalendarRange,
    Radio
} from "lucide-react";
import styles from "./ChannelSandboxDesktopView.module.css";
import { CertStage, AriCertStage } from "./ChannelSandboxTab";

export interface ChannelSandboxViewProps {
    hotelCode: string;
    roomTypes: any[];
    ratePlans: any[];
    availableRatePlans: any[];
    channexEnv: "staging" | "production";
    sandboxSection: "ari" | "compliance" | "simulator";
    setSandboxSection: (s: "ari" | "compliance" | "simulator") => void;
    certStages: CertStage[];
    ariCertStages: AriCertStage[];
    runningCertAll: boolean;
    runningAriCertAll: boolean;
    runAriCertStage: (idx: number) => Promise<any>;
    runAllAriCertStages: () => Promise<any>;
    runCertStage: (idx: number) => Promise<any>;
    runAllCertStages: () => Promise<any>;
    copiedTaskId: string | null;
    handleCopyTaskId: (id: string, e: React.MouseEvent) => void;
    passedAriCount: number;
    passedComplianceCount: number;
    totalPassed: number;
    totalScenarios: number;
    readinessPercent: number;
    simChannel: string;
    setSimChannel: (c: string) => void;
    simGuestName: string;
    setSimGuestName: (n: string) => void;
    simGuestEmail: string;
    setSimGuestEmail: (e: string) => void;
    simRoomTypeId: string;
    setSimRoomTypeId: (id: string) => void;
    simRatePlanId: string;
    setSimRatePlanId: (id: string) => void;
    simPrice: number;
    setSimPrice: (p: number) => void;
    simCheckin: string;
    setSimCheckin: (d: string) => void;
    simCheckout: string;
    setSimCheckout: (d: string) => void;
    simPaymentCollect: "channel" | "property";
    setSimPaymentCollect: (m: "channel" | "property") => void;
    simulating: boolean;
    simulatedResult: any;
    copiedJson: boolean;
    handleSimulateBooking: (action: string) => Promise<void>;
    handleCopyTerminal: () => void;
}

export const ChannelSandboxDesktopView: React.FC<ChannelSandboxViewProps> = ({
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
    copiedTaskId,
    handleCopyTaskId,
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
    copiedJson,
    handleSimulateBooking,
    handleCopyTerminal
}) => {
    return (
        <div className={styles.container}>
            {/* 1. Readiness Summary Bar */}
            <div className={styles.readinessBar}>
                <div className={styles.readinessLeft}>
                    <div className={styles.readinessTitleRow}>
                        <img 
                            src="/images/icons-3d/icon-3d-16.webp" 
                            alt="Security Gateway" 
                            style={{ width: 24, height: 24, objectFit: 'contain' }} 
                        />
                        <h2 className={styles.readinessTitle}>Channex PMS Certification Suite</h2>
                        <span
                            className={`${styles.envBadge} ${
                                channexEnv === "production" ? styles.envBadgeProd : styles.envBadgeStaging
                            }`}
                        >
                            {channexEnv.toUpperCase()} GATEWAY
                        </span>
                    </div>
                    <p className={styles.readinessDesc}>
                        Official 2-Way Channel Manager verification testbed for global OTA distribution authorization.
                    </p>
                </div>

                <div className={styles.readinessRight}>
                    <div className={styles.readinessScoreBox}>
                        <span className={styles.readinessScoreLabel}>Certification Readiness</span>
                        <span className={styles.readinessScoreValue}>
                            {totalPassed} / {totalScenarios} Passed ({readinessPercent}%)
                        </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${readinessPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Sub-Navigation Tabs */}
            <div className={styles.tabNavRow}>
                <button
                    type="button"
                    onClick={() => setSandboxSection("ari")}
                    className={`${styles.tabNavBtn} ${sandboxSection === "ari" ? styles.tabNavBtnActive : ""}`}
                >
                    <Sparkles size={12} />
                    <span>10 Skenario Uji ARI Channex</span>
                    <span className={styles.tabCountBadge}>{passedAriCount}/10</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSandboxSection("compliance")}
                    className={`${styles.tabNavBtn} ${sandboxSection === "compliance" ? styles.tabNavBtnActive : ""}`}
                >
                    <ShieldCheck size={12} />
                    <span>8 Tahap Kepatuhan Webhook &amp; ACK</span>
                    <span className={styles.tabCountBadge}>{passedComplianceCount}/8</span>
                </button>

                <button
                    type="button"
                    onClick={() => setSandboxSection("simulator")}
                    className={`${styles.tabNavBtn} ${sandboxSection === "simulator" ? styles.tabNavBtnActive : ""}`}
                >
                    <Terminal size={12} />
                    <span>Simulator Reservasi OTA Inbound</span>
                </button>
            </div>

            {/* 3. Section 1: 10 Skenario Uji ARI Channex */}
            {sandboxSection === "ari" && (
                <div className={styles.suiteCard}>
                    <div className={styles.suiteHeader}>
                        <div className={styles.suiteTitleArea}>
                            <h3 className={styles.suiteTitle}>
                                <Sparkles size={14} />
                                <span>10 Skenario Uji ARI Sertifikasi Channex (Test 1 - Test 10)</span>
                            </h3>
                            <p className={styles.suiteDesc}>
                                Payload ARI validation (Availability, Rates &amp; Restrictions) per Channex official technical certification manual.
                            </p>
                        </div>
                        <div className={styles.suiteActions}>
                            <button
                                type="button"
                                onClick={runAllAriCertStages}
                                disabled={runningAriCertAll}
                                className={styles.btnActionPrimary}
                            >
                                <Play size={11} className={runningAriCertAll ? "animate-spin" : ""} />
                                <span>{runningAriCertAll ? "Running 10 Tests..." : "Run All 10 Scenarios"}</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.stageList}>
                        {ariCertStages.map((stage, idx) => (
                            <div key={stage.id} className={styles.stageRow}>
                                <div className={styles.stageLeft}>
                                    <span className={styles.stageNumberBadge}>{stage.num}</span>
                                    <div className={styles.stageInfo}>
                                        <div className={styles.stageTitleRow}>
                                            <span className={styles.stageTitle}>{stage.title}</span>
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
                                        {stage.taskIds && stage.taskIds.length > 0 && (
                                            <div className={styles.taskIdsRow}>
                                                <span>Task IDs:</span>
                                                {stage.taskIds.map((tId) => (
                                                    <span
                                                        key={tId}
                                                        className={styles.taskIdPill}
                                                        onClick={(e) => handleCopyTaskId(tId, e)}
                                                        title={`Click to copy Task ID: ${tId}`}
                                                    >
                                                        {copiedTaskId === tId ? (
                                                            <Check size={9} color="#059669" />
                                                        ) : (
                                                            <Copy size={9} />
                                                        )}
                                                        <span>{tId}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => runAriCertStage(idx)}
                                    disabled={stage.status === "running"}
                                    className={styles.btnRunSingle}
                                >
                                    <Play size={10} className={stage.status === "running" ? "animate-spin" : ""} />
                                    <span>{stage.status === "running" ? "Testing..." : "Test Scenario"}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Section 2: 8 Tahap Kepatuhan Webhook & ACK */}
            {sandboxSection === "compliance" && (
                <div className={styles.suiteCard}>
                    <div className={styles.suiteHeader}>
                        <div className={styles.suiteTitleArea}>
                            <h3 className={styles.suiteTitle}>
                                <ShieldCheck size={14} />
                                <span>8 Tahap Sertifikasi Kepatuhan Distribusi &amp; Webhook ACK</span>
                            </h3>
                            <p className={styles.suiteDesc}>
                                2-Call Bulk ARI, allotment lock, anti-ghost room, ACK loop SLA 30-minute validation, and fallback feed polling.
                            </p>
                        </div>
                        <div className={styles.suiteActions}>
                            <button
                                type="button"
                                onClick={runAllCertStages}
                                disabled={runningCertAll}
                                className={styles.btnActionPrimary}
                            >
                                <Play size={11} className={runningCertAll ? "animate-spin" : ""} />
                                <span>{runningCertAll ? "Running 8 Stages..." : "Run All 8 Stages"}</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.stageList}>
                        {certStages.map((stage, idx) => (
                            <div key={stage.id} className={styles.stageRow}>
                                <div className={styles.stageLeft}>
                                    <span className={styles.stageNumberBadge}>{stage.num}</span>
                                    <div className={styles.stageInfo}>
                                        <div className={styles.stageTitleRow}>
                                            <span className={styles.stageTitle}>{stage.title}</span>
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
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => runCertStage(idx)}
                                    disabled={stage.status === "running"}
                                    className={styles.btnRunSingle}
                                >
                                    <Play size={10} className={stage.status === "running" ? "animate-spin" : ""} />
                                    <span>{stage.status === "running" ? "Testing..." : "Test Stage"}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Section 3: Simulator Injeksi Reservasi OTA */}
            {sandboxSection === "simulator" && (
                <div className={styles.suiteCard}>
                    <div className={styles.suiteHeader}>
                        <div className={styles.suiteTitleArea}>
                            <h3 className={styles.suiteTitle}>
                                <Terminal size={14} />
                                <span>Simulator Injeksi Reservasi OTA Inbound &amp; Webhook Test</span>
                            </h3>
                            <p className={styles.suiteDesc}>
                                Simulate inbound booking, date modification, or cancellation from OTAs (Traveloka, Booking.com, Agoda) to verify PMS ingestion.
                            </p>
                        </div>
                    </div>

                    <div className={styles.simulatorGrid}>
                        {/* Left Column: Form Parameters */}
                        <div className={styles.simFormColumn}>
                            <div className={styles.simFormRow}>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Saluran OTA</label>
                                    <select
                                        value={simChannel}
                                        onChange={(e) => setSimChannel(e.target.value)}
                                        className={styles.simSelect}
                                    >
                                        <option value="Traveloka">Traveloka (18%)</option>
                                        <option value="Booking.com">Booking.com (15%)</option>
                                        <option value="Agoda">Agoda (17%)</option>
                                        <option value="Tiket.com">Tiket.com (15%)</option>
                                        <option value="Expedia">Expedia (18%)</option>
                                        <option value="Airbnb">Airbnb (14%)</option>
                                    </select>
                                </div>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Tipe Kamar</label>
                                    <select
                                        value={simRoomTypeId}
                                        onChange={(e) => setSimRoomTypeId(e.target.value)}
                                        className={styles.simSelect}
                                    >
                                        {roomTypes.map(rt => (
                                            <option key={rt.id} value={rt.id}>
                                                {rt.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.simFormRow}>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Rate Plan</label>
                                    <select
                                        value={simRatePlanId}
                                        onChange={(e) => setSimRatePlanId(e.target.value)}
                                        className={styles.simSelect}
                                    >
                                        {availableRatePlans.map(rp => (
                                            <option key={rp.id} value={rp.id}>
                                                {rp.name || rp.code || rp.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Nama Tamu</label>
                                    <input
                                        type="text"
                                        value={simGuestName}
                                        onChange={(e) => setSimGuestName(e.target.value)}
                                        className={styles.simInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.simFormRow}>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Check-in</label>
                                    <input
                                        type="date"
                                        value={simCheckin}
                                        onChange={(e) => setSimCheckin(e.target.value)}
                                        className={styles.simInput}
                                    />
                                </div>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Check-out</label>
                                    <input
                                        type="date"
                                        value={simCheckout}
                                        onChange={(e) => setSimCheckout(e.target.value)}
                                        className={styles.simInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.simFormRow}>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Total Harga (IDR)</label>
                                    <input
                                        type="number"
                                        value={simPrice}
                                        onChange={(e) => setSimPrice(Number(e.target.value))}
                                        className={styles.simInput}
                                        style={{ fontFamily: "var(--font-geist-mono, monospace)" }}
                                    />
                                </div>
                                <div className={styles.simFormGroup}>
                                    <label className={styles.simLabel}>Metode Pembayaran</label>
                                    <select
                                        value={simPaymentCollect}
                                        onChange={(e) => setSimPaymentCollect(e.target.value as any)}
                                        className={styles.simSelect}
                                    >
                                        <option value="channel">Channel Collect (VCC OTA)</option>
                                        <option value="property">Hotel Collect (Bayar di Hotel)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.simActionRow}>
                                <button
                                    type="button"
                                    onClick={() => handleSimulateBooking("create_booking")}
                                    disabled={simulating}
                                    className={styles.btnSimSubmit}
                                >
                                    <Send size={12} className={simulating ? "animate-spin" : ""} />
                                    <span>Inject Reservasi Baru</span>
                                </button>
                                {simulatedResult?.bookingId && (
                                    <button
                                        type="button"
                                        onClick={() => handleSimulateBooking("cancel_booking")}
                                        disabled={simulating}
                                        className={styles.btnSimCancel}
                                    >
                                        <RotateCcw size={12} />
                                        <span>Batalkan #{simulatedResult.bookingId}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Terminal Console */}
                        <div className={styles.terminalCard}>
                            <div className={styles.terminalHeader}>
                                <div className={styles.terminalTitle}>
                                    <Terminal size={12} color="#34d399" />
                                    <span>Response Telemetry Console</span>
                                </div>
                                <div className={styles.terminalHeaderActions}>
                                    {simulatedResult && (
                                        <>
                                            <span className={styles.statusOkPill}>200 OK</span>
                                            <button
                                                type="button"
                                                onClick={handleCopyTerminal}
                                                className={styles.btnCopyTerminal}
                                                title="Copy Output JSON"
                                            >
                                                {copiedJson ? <Check size={10} color="#34d399" /> : <Copy size={10} />}
                                                <span>{copiedJson ? "Copied" : "Copy JSON"}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <pre className={styles.terminalBody}>
                                {simulatedResult
                                    ? JSON.stringify(simulatedResult, null, 2)
                                    : "// No simulation executed yet.\n// Click 'Inject Reservasi Baru' to dispatch a test inbound reservation."}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
