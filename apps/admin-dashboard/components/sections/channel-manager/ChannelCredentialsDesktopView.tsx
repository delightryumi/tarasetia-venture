"use client";

import React from "react";
import {
    Key,
    Save,
    Copy,
    ExternalLink,
    RefreshCw,
    Eye,
    EyeOff,
    Unlink,
    CheckCircle2,
    AlertCircle,
    Activity,
    ShieldCheck
} from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import styles from "./ChannelCredentialsDesktopView.module.css";

export interface ReadinessCheckItem {
    id: string;
    label: string;
    desc: string;
    passed: boolean;
    badge: string;
}

export interface ChannelCredentialsViewProps {
    hotelCode: string;
    hotelName?: string;
    channexEnv: "staging" | "production";
    setChannexEnv: (env: "staging" | "production") => void;
    channexApiKey: string;
    setChannexApiKey: (key: string) => void;
    channexWebhookSecret: string;
    setChannexWebhookSecret: (secret: string) => void;
    channexPropertyId: string;
    setChannexPropertyId: (id: string) => void;
    hotelCurrency: string;
    setHotelCurrency: (curr: string) => void;
    savingSettings: boolean;
    onSave: () => Promise<void>;
    onSyncMasterToChannex?: () => Promise<void>;
    syncingMaster?: boolean;
    onUnlinkProperty?: () => void;
    onNavigateToTab?: (tab: string) => void;
    showApiKey: boolean;
    setShowApiKey: (show: boolean) => void;
    showWebhookSecret: boolean;
    setShowWebhookSecret: (show: boolean) => void;
    webhookRegistrationStatus: {
        isRegistered: boolean;
        webhookId?: string;
        webhookUrl?: string;
        webhookRegisteredAt?: string;
    } | null;
    registeringWebhook: boolean;
    checkingWebhookStatus: boolean;
    handleRegisterWebhook: () => Promise<void>;
    webhookEndpointUrl: string;
    copyText: (txt: string, label: string) => void;
    // Live connection test
    testingConnection: boolean;
    connectionStatus: {
        tested: boolean;
        success: boolean;
        latencyMs?: number;
        message?: string;
    };
    handleTestConnection: () => Promise<void>;
    // Readiness
    readinessChecks: ReadinessCheckItem[];
    readinessScore: number;
    passedCount: number;
}

export const ChannelCredentialsDesktopView: React.FC<ChannelCredentialsViewProps> = ({
    channexEnv,
    setChannexEnv,
    channexApiKey,
    setChannexApiKey,
    channexWebhookSecret,
    setChannexWebhookSecret,
    channexPropertyId,
    setChannexPropertyId,
    hotelCurrency,
    setHotelCurrency,
    savingSettings,
    onSave,
    onSyncMasterToChannex,
    syncingMaster,
    onUnlinkProperty,
    onNavigateToTab,
    showApiKey,
    setShowApiKey,
    showWebhookSecret,
    setShowWebhookSecret,
    webhookRegistrationStatus,
    registeringWebhook,
    handleRegisterWebhook,
    webhookEndpointUrl,
    copyText,
    testingConnection,
    connectionStatus,
    handleTestConnection,
    readinessChecks,
    readinessScore,
    passedCount
}) => {
    return (
        <div className={styles.container}>
            {/* 1. Executive Top Bar & Actions */}
            <div className={styles.gatewayHeaderStrip}>
                <div className={styles.gatewayStatusGroup}>
                    <div
                        className={`${styles.envStatusPill} ${
                            channexEnv === "production"
                                ? styles.envStatusPillProd
                                : styles.envStatusPillStaging
                        }`}
                    >
                        <span
                            className={`${styles.statusDot} ${
                                channexEnv === "production"
                                    ? styles.statusDotProd
                                    : styles.statusDotStaging
                            }`}
                        />
                        <span>{channexEnv === "production" ? "Production Gateway" : "Sandbox Gateway"}</span>
                    </div>

                    {connectionStatus.tested && (
                        <span
                            className={`${styles.connectionResultChip} ${
                                connectionStatus.success
                                    ? styles.connectionResultChipSuccess
                                    : styles.connectionResultChipError
                            }`}
                        >
                            <Activity size={11} />
                            <span>
                                {connectionStatus.success
                                    ? `Live Connected (${connectionStatus.latencyMs}ms)`
                                    : "Connection Offline"}
                            </span>
                        </span>
                    )}
                </div>

                <div className={styles.headerActionsGroup}>
                    {/* Environment Switcher */}
                    <div className={styles.envToggleWrap}>
                        <button
                            type="button"
                            onClick={() => setChannexEnv("staging")}
                            className={`${styles.envToggleBtn} ${
                                channexEnv === "staging" ? styles.envToggleBtnActiveStaging : ""
                            }`}
                        >
                            <span className={channexEnv === "staging" ? styles.statusDotStaging : styles.statusDotPending} />
                            <span>Sandbox</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setChannexEnv("production")}
                            className={`${styles.envToggleBtn} ${
                                channexEnv === "production" ? styles.envToggleBtnActiveProd : ""
                            }`}
                        >
                            <span className={channexEnv === "production" ? styles.statusDotProd : styles.statusDotPending} />
                            <span>Production</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || !channexPropertyId}
                        className={styles.btnActionOutline}
                        title="Ping server Channex untuk menguji respon API Key dan Property ID"
                    >
                        <RefreshCw size={11} className={testingConnection ? "animate-spin" : ""} />
                        <span>{testingConnection ? "Pinging..." : "Test Connection"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={savingSettings}
                        className={styles.btnPrimarySave}
                    >
                        <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                        <span>{savingSettings ? "Saving..." : "Save Configuration"}</span>
                    </button>
                </div>
            </div>

            {/* 2. Readiness Pre-Flight Progress Card */}
            <div className={styles.readinessCard}>
                <div className={styles.readinessLeft}>
                    <div className={styles.readinessScoreBox}>
                        <span className={styles.readinessScoreNumber}>{readinessScore}%</span>
                        <span className={styles.readinessScoreLabel}>Kesiapan</span>
                    </div>

                    <div className={styles.readinessInfo}>
                        <div className={styles.readinessTitleRow}>
                            <h3 className={styles.readinessTitle}>Audit Kesiapan Go-Live Gateway</h3>
                            <span
                                className={`${styles.readinessPill} ${
                                    readinessScore === 100
                                        ? styles.readinessPillReady
                                        : styles.readinessPillIncomplete
                                }`}
                            >
                                {readinessScore === 100
                                    ? "100% Siap Produksi"
                                    : `${passedCount} dari ${readinessChecks.length} Parameter Siap`}
                            </span>
                        </div>
                        <p className={styles.readinessDesc}>
                            {readinessScore === 100
                                ? "Semua kredensial terhubung, webhook aktif, dan saluran siap untuk transmisi live ARI 500 hari."
                                : "Lengkapi parameter bertanda kuning di bawah sebelum mengalihkan server ke Production."}
                        </p>
                        <div className={styles.progressBarContainer}>
                            <div
                                className={`${styles.progressBarFill} ${
                                    readinessScore === 100 ? styles.progressBarFillComplete : ""
                                }`}
                                style={{ width: `${readinessScore}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.readinessChipsList}>
                    {readinessChecks.map(chk => (
                        <span
                            key={chk.id}
                            className={`${styles.readinessCheckChip} ${
                                chk.passed ? styles.readinessCheckChipPassed : ""
                            }`}
                        >
                            {chk.passed ? (
                                <CheckCircle2 size={11} />
                            ) : (
                                <AlertCircle size={11} />
                            )}
                            <span>{chk.label}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* 3. Main Credentials Form Card */}
            <div className={styles.credentialsCard}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                        <Key size={14} />
                        <span>Parameter Koneksi Gateway API</span>
                    </div>
                    <span className={styles.cardDesc}>
                        Target Gateway: <b>{channexEnv.toUpperCase()}</b>
                    </span>
                </div>

                <div className={styles.cardBody}>
                    <div className={styles.formGrid}>
                        {/* Field 1: User API Key */}
                        <div className={styles.formGroup}>
                            <div className={styles.formLabelRow}>
                                <label className={styles.formLabel}>
                                    Channex API Key ({channexEnv.toUpperCase()})
                                </label>
                                <span className={styles.formHelp}>
                                    Settings &rarr; API Keys di konsol Channex
                                </span>
                            </div>
                            <div className={styles.inputWrapper}>
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={channexApiKey}
                                    onChange={(e) => setChannexApiKey(e.target.value)}
                                    placeholder="e.g. app_user_api_key_..."
                                    className={`${styles.formInput} ${styles.formInputWithKeyActions}`}
                                />
                                <div className={styles.inputActionBtns}>
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className={styles.iconBtn}
                                        title={showApiKey ? "Hide API Key" : "Show API Key"}
                                    >
                                        {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => copyText(channexApiKey, "API Key")}
                                        className={styles.iconBtn}
                                        title="Copy API Key"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Field 2: Property ID / GUID */}
                        <div className={styles.formGroup}>
                            <div className={styles.formLabelRow}>
                                <label className={styles.formLabel}>
                                    Channex Property ID (GUID)
                                </label>
                                <span className={styles.formHelp}>
                                    UUID properti di server Channex
                                </span>
                            </div>
                            <div className={styles.propertyInputRow}>
                                <div className={`${styles.inputWrapper} ${styles.propertyInputWrapper}`}>
                                    <input
                                        type="text"
                                        value={channexPropertyId}
                                        onChange={(e) => setChannexPropertyId(e.target.value)}
                                        placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                                        className={`${styles.formInput} ${styles.formInputWithCopyAction}`}
                                    />
                                    {channexPropertyId && (
                                        <div className={styles.inputActionBtns}>
                                            <button
                                                type="button"
                                                onClick={() => copyText(channexPropertyId, "Property ID")}
                                                className={styles.iconBtn}
                                                title="Copy Property ID"
                                            >
                                                <Copy size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {onSyncMasterToChannex && (
                                    <button
                                        type="button"
                                        onClick={onSyncMasterToChannex}
                                        disabled={syncingMaster}
                                        className={styles.btnActionOutline}
                                        title="Buat profil properti otomatis di Channex dan tautkan ID"
                                    >
                                        <RefreshCw size={11} className={syncingMaster ? "animate-spin" : ""} />
                                        <span>{syncingMaster ? "Registering..." : "Auto-Register"}</span>
                                    </button>
                                )}

                                {channexPropertyId && onUnlinkProperty && (
                                    <button
                                        type="button"
                                        onClick={onUnlinkProperty}
                                        className={styles.btnActionDanger}
                                        title="Putus kaitan UUID properti"
                                    >
                                        <Unlink size={11} />
                                        <span>Unlink</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Field 3: Webhook Secret */}
                        <div className={styles.formGroup}>
                            <div className={styles.formLabelRow}>
                                <label className={styles.formLabel}>
                                    Webhook Secret Key (HMAC-SHA256)
                                </label>
                                <span className={styles.formHelp}>
                                    Validasi integritas payload reservasi OTA
                                </span>
                            </div>
                            <div className={styles.inputWrapper}>
                                <input
                                    type={showWebhookSecret ? "text" : "password"}
                                    value={channexWebhookSecret}
                                    onChange={(e) => setChannexWebhookSecret(e.target.value)}
                                    placeholder="Secret key payload webhook..."
                                    className={`${styles.formInput} ${styles.formInputWithKeyActions}`}
                                />
                                <div className={styles.inputActionBtns}>
                                    <button
                                        type="button"
                                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                        className={styles.iconBtn}
                                        title={showWebhookSecret ? "Hide Secret" : "Show Secret"}
                                    >
                                        {showWebhookSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => copyText(channexWebhookSecret, "Webhook Secret")}
                                        className={styles.iconBtn}
                                        title="Copy Secret"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Field 4: Callback Webhook URL */}
                        <div className={styles.formGroup}>
                            <div className={styles.formLabelRow}>
                                <label className={styles.formLabel}>
                                    Callback Webhook URL (Public Endpoint)
                                </label>
                                <span className={styles.formHelp}>
                                    Menerima reservasi OTA inbound 24/7
                                </span>
                            </div>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    readOnly
                                    value={webhookEndpointUrl}
                                    className={`${styles.formInput} ${styles.formInputReadOnly} ${styles.formInputWithCopyAction}`}
                                />
                                <div className={styles.inputActionBtns}>
                                    <button
                                        type="button"
                                        onClick={() => copyText(webhookEndpointUrl, "Webhook URL")}
                                        className={styles.iconBtn}
                                        title="Copy Webhook URL"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Webhook Status Callout Box */}
                    <div className={styles.webhookStatusBox}>
                        <div className={styles.webhookStatusLeft}>
                            <span
                                className={`${styles.statusDot} ${
                                    webhookRegistrationStatus?.isRegistered
                                        ? styles.statusDotActive
                                        : styles.statusDotPending
                                }`}
                            />
                            <span>
                                Status Webhook:{" "}
                                <b>
                                    {webhookRegistrationStatus?.isRegistered
                                        ? "Aktif & Terdaftar di Channex"
                                        : "Belum Terdaftar"}
                                </b>
                            </span>
                            {webhookRegistrationStatus?.webhookId && (
                                <span className={styles.webhookIdText}>
                                    (ID: {webhookRegistrationStatus.webhookId.slice(0, 8)}...)
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleRegisterWebhook}
                            disabled={registeringWebhook}
                            className={styles.btnActionOutline}
                        >
                            <RefreshCw size={11} className={registeringWebhook ? "animate-spin" : ""} />
                            <span>{registeringWebhook ? "Mendaftarkan..." : "1-Click Register Webhook"}</span>
                        </button>
                    </div>

                    {/* Field 5: Base Currency */}
                    <div className={styles.formGroup}>
                        <div className={styles.formLabelRow}>
                            <label className={styles.formLabel}>
                                Mata Uang Dasar Properti (Base Currency)
                            </label>
                            <span className={styles.formHelp}>
                                Standar tarif dasar rate plan PMS &amp; CRS
                            </span>
                        </div>
                        <select
                            value={hotelCurrency}
                            onChange={(e) => setHotelCurrency(e.target.value)}
                            className={styles.formSelect}
                        >
                            {SUPPORTED_CURRENCIES.map(curr => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.code} - {curr.name} ({curr.symbol})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    <span>Mata uang dasar digunakan sebagai acuan tarif net properti di seluruh integrasi PMS.</span>
                    <div className={styles.footerActions}>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={savingSettings}
                            className={styles.btnPrimarySave}
                        >
                            <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                            <span>{savingSettings ? "Saving..." : "Save Configuration"}</span>
                        </button>
                        {onNavigateToTab && (
                            <button
                                type="button"
                                onClick={() => onNavigateToTab("mapping")}
                                className={styles.btnActionOutline}
                            >
                                <ExternalLink size={12} />
                                <span>Buka Pemetaan Saluran &rarr;</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Go-Live Verification Matrix */}
            <div className={styles.verificationCard}>
                <div className={styles.verificationHeader}>
                    <div className={styles.verificationTitleGroup}>
                        <h4 className={styles.verificationTitle}>
                            Matriks Verifikasi Go-Live &amp; Sertifikasi
                        </h4>
                        <p className={styles.verificationDesc}>
                            Status kelayakan distribusi kamar dan penerimaan reservasi otomatis dua arah (2-Way ARI).
                        </p>
                    </div>
                    <span className={styles.cardDesc}>
                        Standard Operasional Prosedur CRS Setara
                    </span>
                </div>

                <div className={styles.verificationList}>
                    {readinessChecks.map(item => (
                        <div key={item.id} className={styles.verificationItem}>
                            <div className={styles.verificationItemLeft}>
                                <div
                                    className={`${styles.checkIconBox} ${
                                        item.passed
                                            ? styles.checkIconBoxPassed
                                            : styles.checkIconBoxPending
                                    }`}
                                >
                                    {item.passed ? (
                                        <CheckCircle2 size={13} />
                                    ) : (
                                        <AlertCircle size={13} />
                                    )}
                                </div>
                                <div className={styles.verificationItemMeta}>
                                    <span className={styles.verificationItemLabel}>{item.label}</span>
                                    <p className={styles.verificationItemDesc}>{item.desc}</p>
                                </div>
                            </div>

                            <div className={styles.verificationItemRight}>
                                <span
                                    className={`${styles.itemBadge} ${
                                        item.passed
                                            ? styles.itemBadgePassed
                                            : styles.itemBadgePending
                                    }`}
                                >
                                    {item.badge}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
