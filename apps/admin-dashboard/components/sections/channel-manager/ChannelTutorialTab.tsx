"use client";

import React, { useState } from "react";
import {
    Compass,
    CheckCircle2,
    ShieldCheck,
    Layers,
    Building2,
    HelpCircle,
    Check,
    Copy,
    AlertTriangle,
    Key,
    Lock,
    Terminal,
    ChevronDown,
    ChevronUp,
    Play
} from "lucide-react";
import styles from "./ChannelTutorialTab.module.css";
import { toast } from "sonner";

interface Props {
    onNavigateTab: (tabId: any) => void;
    activeHotelCode?: string;
    activeHotelName?: string;
}

export const ChannelTutorialTab: React.FC<Props> = ({
    onNavigateTab,
    activeHotelCode = "1",
    activeHotelName = "Setara Demo Partner"
}) => {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
        "1-1": true,
        "1-2": true,
        "2-1": true
    });
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleTask = (taskId: string) => {
        setCompletedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const STEPS = [
        {
            num: 1,
            title: "API Credentials & Webhook Activation",
            subtitle: "Retrieve API Key & register Webhooks",
            badge: "Stage 1: Account & Credentials",
            desc: "Configure Production API Key, Property ID, and register the CRS Webhook URL to receive incoming OTA reservations in real time."
        },
        {
            num: 2,
            title: "Pilot Rollout (1 Hotel, 6 Primary OTAs)",
            subtitle: "Select flagship property & connect extranets",
            badge: "Stage 2: Pilot Property Strategy",
            desc: "Focus on 1 flagship pilot hotel across 6 major global OTAs to map room categories and rate plans."
        },
        {
            num: 3,
            title: "End-to-End Live Testing Protocol",
            subtitle: "Test ARI push, refundable bookings, & cancellations",
            badge: "Stage 3: Live Production Testing",
            desc: "Execute 3 standard verification tests: update room rates, create a real booking with free cancellation, and cancel it to confirm instant inventory return."
        },
        {
            num: 4,
            title: "Stabilization & Monitoring (3-7 Days)",
            subtitle: "Monitor live transactions & audit logs",
            badge: "Stage 4: Initial Operations",
            desc: "Run live guest transactions on the pilot property. Monitor synchronization in Transmission Logs and confirm front desk staff handles billing accurately."
        },
        {
            num: 5,
            title: "Phased Multi-Property Expansion",
            subtitle: "Batch rollout of 5 hotels per phase",
            badge: "Stage 5: Full Scale-Up",
            desc: "Following a verified pilot phase, onboard remaining portfolio hotels in batches of 5 properties with zero business disruption."
        }
    ];

    const MAJOR_OTAS = [
        {
            name: "Booking.com",
            code: "BDC",
            commission: "15% (Property / VCC)",
            extranetName: "Booking.com Extranet",
            steps: [
                "Navigate to admin.booking.com > 'Account' > 'Channel Manager'.",
                "Select 'Connect your channel manager' and choose the authorized connectivity provider.",
                "Select 2-Way connection mode (Rates, Availability, & Bookings).",
                "Confirm connection activation."
            ]
        },
        {
            name: "Agoda",
            code: "AGD",
            commission: "17% (Agoda Collect / YCS)",
            extranetName: "Agoda YCS Extranet",
            steps: [
                "Navigate to ycs.agoda.com > 'Settings' > 'Channel Manager'.",
                "Select integrated Channel Manager connection.",
                "Choose Full ARI & Booking Retrieval mode.",
                "Save changes and verify Room Type ID mappings in Channel Mapping."
            ]
        },
        {
            name: "Traveloka",
            code: "TVL",
            commission: "18% (TERA Extranet)",
            extranetName: "TERA Traveloka",
            steps: [
                "Navigate to tera.traveloka.com > 'Property Profile' > 'Channel Manager'.",
                "Request Channel Manager activation via Market Coordinator or select authorized provider.",
                "Map Room IDs and Rate Plan IDs matching CRS codes.",
                "Connection activates upon Traveloka operational review."
            ]
        },
        {
            name: "Tiket.com",
            code: "TKT",
            commission: "15% (Tiket Extranet)",
            extranetName: "Tiket.com Extranet",
            steps: [
                "Navigate to extranet.tiket.com > 'Channel Manager'.",
                "Link your property to the 2-Way Channel Manager integration.",
                "Verify allotment and base rates synchronize via Full ARI Push.",
                "Activate incoming reservation feed."
            ]
        },
        {
            name: "Expedia Partner",
            code: "EXP",
            commission: "18% (Expedia Collect / Hotel Collect)",
            extranetName: "Expedia Partner Central",
            steps: [
                "Navigate to partnercentral.expedia.com > 'Rooms and Rates' > 'Expedia Connectivity'.",
                "Select 2-Way Channel Manager connectivity.",
                "Choose 2-way mode (Availability & Rates + Booking Retrieval).",
                "Confirm connection agreement."
            ]
        },
        {
            name: "Airbnb",
            code: "ABNB",
            commission: "14% - 15% (Host-Only)",
            extranetName: "Airbnb Host Console",
            steps: [
                "Authenticate directly via OAuth in Console SSO / Connected Channels.",
                "Log into Airbnb Host account and grant Channel Manager API permissions.",
                "Map listings to corresponding CRS room categories.",
                "Rates and availability calendars synchronize instantly in real time."
            ]
        }
    ];

    const FAQS = [
        {
            q: "How are booking amounts settled: does the guest pay Gross or Net?",
            a: "Settlement depends on the OTA business model: For 'Property Collect' (Pay at Hotel), the guest pays 100% Gross at the front desk, and the OTA bills monthly commission via Tax Invoice. For 'Channel Collect' (VCC / Agoda Collect), the guest pays Gross in the app, and the hotel charges the Virtual Credit Card for the 100% Net remittance. For Wholesalers (Hotelbeds), rates received are Net."
        },
        {
            q: "What is the expected latency for rate or inventory updates sent to OTAs?",
            a: "ARI synchronization operates via direct real-time push. Rate changes or stop-sells typically reflect on OTA extranets within 1 to 3 seconds following updates in the CRS."
        },
        {
            q: "How can we execute live test bookings without financial loss?",
            a: "Select a 'Free Cancellation' policy. Book a room 2 weeks ahead, confirm the incoming reservation webhook and WhatsApp notification, verify inventory deduction, then cancel the reservation before the free cancellation deadline for a full 100% refund."
        },
        {
            q: "Are incoming OTA reservations processed if hotel front desk computers are offline?",
            a: "Yes. The CRS architecture operates 24/7 on serverless cloud infrastructure. Channel webhooks are ingested continuously, and WhatsApp owner alerts dispatch even if front desk workstations are powered down."
        }
    ];

    const currentWebhookUrl = typeof window !== "undefined"
        ? `${window.location.origin}/api/channex/webhook`
        : "https://your-crs-domain.com/api/channex/webhook";

    return (
        <div className={styles.container}>
            {/* 1. Hero Header Banner */}
            <div className={styles.heroCard}>
                <div className={styles.heroBadge}>
                    <Compass size={13} />
                    <span>Production Go-Live &amp; Rollout Roadmap</span>
                </div>
                <h2 className={styles.heroTitle}>
                    Channel Manager Architecture &amp; Implementation Playbook
                </h2>
                <p className={styles.heroDesc}>
                    Follow the industry-standard <strong>5-Stage Phased Rollout</strong>. Begin with 1 flagship pilot hotel across 6 core OTAs, verify end-to-end reliability through refundable booking tests, and expand seamlessly across your entire property portfolio with zero downtime.
                </p>

                <div className={styles.heroMetrics}>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconBlue}`}>
                            <Building2 size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>1 Pilot Hotel</div>
                            <div className={styles.metricLbl}>Canary Rollout Stage</div>
                        </div>
                    </div>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconCyan}`}>
                            <Layers size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>6 Major OTAs</div>
                            <div className={styles.metricLbl}>Booking, Agoda, Traveloka, Tiket, Expedia, Airbnb</div>
                        </div>
                    </div>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconEmerald}`}>
                            <ShieldCheck size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>8 / 8 Passed</div>
                            <div className={styles.metricLbl}>Global Distribution &amp; OTA Standards</div>
                        </div>
                    </div>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconIndigo}`}>
                            <Layers size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>Multi-Property</div>
                            <div className={styles.metricLbl}>Enterprise Portfolio Target</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stepper Timeline Navigation (5 Steps) */}
            <div className={styles.stepperNav}>
                {STEPS.map((step) => {
                    const isActive = currentStep === step.num;
                    const isDone = currentStep > step.num;
                    return (
                        <div
                            key={step.num}
                            onClick={() => setCurrentStep(step.num)}
                            className={`${styles.stepTab} ${isActive ? styles.stepTabActive : ""}`}
                        >
                            <div className={styles.stepHeaderRow}>
                                <div className={`${styles.stepNumberCircle} ${isActive ? styles.stepNumberActive : isDone ? styles.stepNumberDone : ""}`}>
                                    {isDone ? <Check size={13} strokeWidth={3} /> : step.num}
                                </div>
                                <span className={styles.stepTabSubtitle}>Stage {step.num}</span>
                            </div>
                            <div className={styles.stepTabTitle}>{step.title}</div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Active Stage Content Details */}
            <div className={styles.stepDetailCard}>
                <div className={styles.stepDetailHeader}>
                    <div>
                        <span className={styles.stepBadgePill}>
                            <Layers size={12} />
                            <span>{STEPS[currentStep - 1].badge}</span>
                        </span>
                        <h3 className={styles.stepDetailTitle}>{STEPS[currentStep - 1].title}</h3>
                        <p className={styles.stepDetailDesc}>{STEPS[currentStep - 1].desc}</p>
                    </div>

                    <div className={styles.actionBtnsRow}>
                        {currentStep === 1 && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("golive")}
                                className={styles.btnActionPrimary}
                            >
                                <Lock size={14} />
                                <span>Open Credentials &amp; Go-Live &rarr;</span>
                            </button>
                        )}
                        {currentStep === 2 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("mapping")}
                                    className={styles.btnActionPrimary}
                                >
                                    <Key size={14} />
                                    <span>Open Channel Mapping &rarr;</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("catalog")}
                                    className={styles.btnActionSecondary}
                                >
                                    <Layers size={14} />
                                    <span>Browse 68+ OTA Catalog &rarr;</span>
                                </button>
                            </>
                        )}
                        {currentStep === 3 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("sandbox")}
                                    className={styles.btnActionPrimary}
                                >
                                    <Play size={14} />
                                    <span>Open Test Runner Sandbox &rarr;</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("logs")}
                                    className={styles.btnActionSecondary}
                                >
                                    <Terminal size={14} />
                                    <span>View Transmission Logs &rarr;</span>
                                </button>
                            </>
                        )}
                        {currentStep === 4 && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("logs")}
                                className={styles.btnActionPrimary}
                            >
                                <Terminal size={14} />
                                <span>Monitor Live Transmission Logs &rarr;</span>
                            </button>
                        )}
                        {currentStep === 5 && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("mapping")}
                                className={styles.btnActionPrimary}
                            >
                                <Building2 size={14} />
                                <span>Manage Next Properties &rarr;</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* STEP 1 DETAIL */}
                {currentStep === 1 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <CheckCircle2 size={16} className={styles.sectionIcon} />
                                <span>Stage 1 Action Checklist:</span>
                            </div>
                            <div className={styles.checklistGrid}>
                                <div
                                    onClick={() => toggleTask("1-1")}
                                    className={`${styles.checkItem} ${completedTasks["1-1"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-1"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-1"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-1"] ? styles.checkTitleDone : ""}`}>
                                            1. Credentials Activation &amp; Property Binding
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Ensure hotel connectivity accounts are provisioned. Bind Production API Key and Property GUID to establish 2-way data exchange.
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("1-2")}
                                    className={`${styles.checkItem} ${completedTasks["1-2"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-2"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-2"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-2"] ? styles.checkTitleDone : ""}`}>
                                            2. Configure Production API Key
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Under API credentials, enter your production API Key and hotel Property ID to link the ARI transmission pipeline.
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("1-3")}
                                    className={`${styles.checkItem} ${completedTasks["1-3"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-3"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-3"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-3"] ? styles.checkTitleDone : ""}`}>
                                            3. Register Webhook Callback URL
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Register the production CRS webhook endpoint below to ingest incoming OTA reservations into Front Office Folios in real time:
                                            <div className={styles.webhookRow}>
                                                <code className={styles.webhookCode}>
                                                    {currentWebhookUrl}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(currentWebhookUrl);
                                                        toast.success("Webhook URL copied to clipboard!");
                                                    }}
                                                    className={styles.btnCopy}
                                                >
                                                    <Copy size={12} />
                                                    <span>Copy</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("1-4")}
                                    className={`${styles.checkItem} ${completedTasks["1-4"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-4"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-4"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-4"] ? styles.checkTitleDone : ""}`}>
                                            4. Switch Server Mode to Production Live
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Navigate to <b>API Credentials &amp; Go-Live</b>, confirm your credentials, click <b>Switch to Production Live</b>, and save.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <AlertTriangle size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Distribution Standards:</strong> ARI transmission pipelines comply with enterprise protocols, incorporating exponential retry backoff to ensure zero missed reservation deliveries.
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 DETAIL */}
                {currentStep === 2 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Building2 size={16} className={styles.sectionIcon} />
                                <span>6 Major OTA Connection Setup (Pilot Property: {activeHotelName}):</span>
                            </div>
                            <p className={styles.stepSubDesc}>
                                Log into each channel extranet to designate your official Channel Manager connectivity provider:
                            </p>

                            <div className={styles.otaCardsGrid}>
                                {MAJOR_OTAS.map((ota, idx) => (
                                    <div key={idx} className={styles.otaCard}>
                                        <div className={styles.otaCardHeader}>
                                            <span style={{ fontSize: "12px", fontWeight: 700, padding: "2px 6px", background: "#f1f5f9", borderRadius: "4px", color: "#334155" }}>
                                                {ota.code}
                                            </span>
                                            <div>
                                                <div className={styles.otaName}>{ota.name}</div>
                                                <div className={styles.otaCommission}>Est. Commission: {ota.commission}</div>
                                            </div>
                                        </div>
                                        <div className={styles.otaPortal}>
                                            Portal: {ota.extranetName}
                                        </div>
                                        <ol className={styles.otaStepsList}>
                                            {ota.steps.map((st, sIdx) => (
                                                <li key={sIdx}>{st}</li>
                                            ))}
                                        </ol>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <CheckCircle2 size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Mapping Best Practice:</strong> In <b>Channel Mapping</b>, use <i>&quot;Scan Channels for Live IDs&quot;</i> to automatically link local room types with remote OTA inventory IDs.
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3 DETAIL */}
                {currentStep === 3 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Play size={16} className={styles.sectionIcon} />
                                <span>3 Mandatory End-to-End Field Verification Tests:</span>
                            </div>

                            <div className={styles.checklistGrid}>
                                <div
                                    onClick={() => toggleTask("3-1")}
                                    className={`${styles.checkItem} ${completedTasks["3-1"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["3-1"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["3-1"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["3-1"] ? styles.checkTitleDone : ""}`}>
                                            Test 1: Live ARI Push Verification (Rates &amp; Availability)
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Adjust a room rate in the CRS (e.g. increase by Rp 10,000 for the next 3 days). Search as a guest on Booking.com / Traveloka. Confirm the updated rate appears within 1-3 seconds.
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("3-2")}
                                    className={`${styles.checkItem} ${completedTasks["3-2"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["3-2"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["3-2"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["3-2"] ? styles.checkTitleDone : ""}`}>
                                            Test 2: Real Booking Ingestion (Free Cancellation)
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Book 1 room on Agoda or Booking.com 2 weeks in advance with <strong>Free Cancellation</strong>.
                                            <ul className={styles.testBulletList}>
                                                <li>Verify webhook arrival within seconds.</li>
                                                <li>Confirm PMS Front Office inventory automatically decrements by 1.</li>
                                                <li>Confirm Owner WhatsApp alert reflects Gross amount and Net payout.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("3-3")}
                                    className={`${styles.checkItem} ${completedTasks["3-3"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["3-3"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["3-3"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["3-3"] ? styles.checkTitleDone : ""}`}>
                                            Test 3: Cancellation &amp; Inventory Release Test
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Cancel the test reservation on the OTA platform (eligible for 100% refund).
                                            <ul className={styles.testBulletList}>
                                                <li>Verify cancellation webhook reception instantly.</li>
                                                <li>Confirm PMS inventory automatically increments by 1 (inventory release).</li>
                                                <li>Verify cancellation notification delivery to Owner.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <ShieldCheck size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Zero Financial Exposure:</strong> Utilizing reservations with <em>Free Cancellation</em> enables full validation of booking and inventory lifecycles with zero operational cost.
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4 DETAIL */}
                {currentStep === 4 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Terminal size={16} className={styles.sectionIcon} />
                                <span>Stabilization Phase Operations (3-7 Days):</span>
                            </div>

                            <div className={styles.checklistGrid}>
                                <div className={styles.checkItem}>
                                    <div className={styles.checkIconWrapper}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={styles.checkTitle}>1. Routine Transmission Log Auditing</div>
                                        <div className={styles.checkDesc}>
                                            Review <b>Transmission Logs</b> during morning and evening shifts. Ensure absence of red error states or unmapped room warnings.
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.checkItem}>
                                    <div className={styles.checkIconWrapper}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={styles.checkTitle}>2. Front Desk Folio &amp; Settlement Review</div>
                                        <div className={styles.checkDesc}>
                                            Confirm Front Office staff understands payment markers: &apos;Pending Hotel Collect&apos; vs. &apos;Paid via Channel VCC&apos; to prevent double billing.
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.checkItem}>
                                    <div className={styles.checkIconWrapper}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={styles.checkTitle}>3. Virtual Credit Card (VCC) Processing</div>
                                        <div className={styles.checkDesc}>
                                            Upon guest check-in for Agoda Collect or Booking.com Online Payments, cashier accesses the <b>PCI Card Vault</b> with PIN verification to charge the VCC via hotel POS terminals.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5 DETAIL */}
                {currentStep === 5 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Building2 size={16} className={styles.sectionIcon} />
                                <span>Portfolio Phased Expansion Pattern (Batch Rollout):</span>
                            </div>

                            <div className={styles.batchGrid}>
                                <div className={`${styles.batchCard} ${styles.batch1}`}>
                                    <div className={styles.batchTag1}>PHASE 1 (DAYS 1-3)</div>
                                    <div className={styles.batchTitle}>1 Flagship Pilot Hotel</div>
                                    <div className={styles.batchDesc}>Initial property live with 6 core OTAs verified</div>
                                </div>
                                <div className={`${styles.batchCard} ${styles.batch2}`}>
                                    <div className={styles.batchTag2}>PHASE 2 (DAYS 4-7)</div>
                                    <div className={styles.batchTitle}>+5 Properties</div>
                                    <div className={styles.batchDesc}>Expand to Tier 1 properties with standardized room structures</div>
                                </div>
                                <div className={`${styles.batchCard} ${styles.batch3}`}>
                                    <div className={styles.batchTag3}>PHASE 3 (WEEK 2)</div>
                                    <div className={styles.batchTitle}>+7 Properties</div>
                                    <div className={styles.batchDesc}>Onboard Tier 2 hotels and conduct front desk training</div>
                                </div>
                                <div className={`${styles.batchCard} ${styles.batch4}`}>
                                    <div className={styles.batchTag4}>PHASE 4 (WEEK 3)</div>
                                    <div className={styles.batchTitle}>Remaining Portfolio</div>
                                    <div className={styles.batchDesc}>Complete network fully synchronized across global distribution</div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <CheckCircle2 size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Native Multi-Tenancy:</strong> The CRS architecture features multi-tenant isolation. Each hotel property operates independent room allotments, pricing rules, and alert numbers without data collision risk.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Critical Pre-Production FAQ */}
            <div className={styles.faqSection}>
                <div className={styles.sectionHeading}>
                    <HelpCircle size={16} className={styles.sectionIcon} />
                    <span>Frequently Asked Questions (Pre-Production):</span>
                </div>

                <div className={styles.faqList}>
                    {FAQS.map((faq, idx) => (
                        <div key={idx} className={styles.faqItem}>
                            <div
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className={styles.faqQuestion}
                            >
                                <span>{faq.q}</span>
                                {openFaq === idx ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                            </div>
                            {openFaq === idx && (
                                <div className={styles.faqAnswer}>
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
