"use client";

import React from "react";
import {
    Save,
    Copy,
    RefreshCw,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Activity,
    Unlink
} from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currency-utils";
import styles from "./ChannelCredentialsMobileView.module.css";
import { ChannelCredentialsViewProps } from "./ChannelCredentialsDesktopView";

export const ChannelCredentialsMobileView: React.FC<ChannelCredentialsViewProps> = ({
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
    readinessScore
}) => {
    return (
        <div className={styles.container}>
            {/* 1. Mobile Status & Environment Switcher Card */}
            <div className={styles.gatewayHeaderMobile}>
                <div className={styles.statusRowMobile}>
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
                        <span>{channexEnv === "production" ? "Production Live" : "Sandbox Test"}</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || !channexPropertyId}
                        className={styles.btnTestMobile}
                    >
                        <Activity size={12} className={testingConnection ? "animate-spin" : ""} />
                        <span>{testingConnection ? "Pinging..." : "Test Ping"}</span>
                    </button>
                </div>

                {/* Mobile Environment Switcher */}
                <div className={styles.envToggleWrapMobile}>
                    <button
                        type="button"
                        onClick={() => setChannexEnv("staging")}
                        className={`${styles.envToggleBtnMobile} ${
                            channexEnv === "staging" ? styles.envToggleBtnActiveStaging : ""
                        }`}
                    >
                        <span className={channexEnv === "staging" ? styles.statusDotStaging : styles.dotMuted} />
                        <span>Sandbox</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChannexEnv("production")}
                        className={`${styles.envToggleBtnMobile} ${
                            channexEnv === "production" ? styles.envToggleBtnActiveProd : ""
                        }`}
                    >
                        <span className={channexEnv === "production" ? styles.statusDotProd : styles.dotMuted} />
                        <span>Production</span>
                    </button>
                </div>
            </div>

            {/* 2. Readiness Strip Mobile */}
            <div className={styles.readinessCardMobile}>
                <div className={styles.readinessTopMobile}>
                    <span className={styles.readinessTitleMobile}>Kesiapan Go-Live</span>
                    <span className={styles.readinessScoreMobile}>{readinessScore}%</span>
                </div>
                <div className={styles.progressBarContainer}>
                    <div
                        className={`${styles.progressBarFill} ${
                            readinessScore === 100 ? styles.progressBarFillComplete : ""
                        }`}
                        style={{ width: `${readinessScore}%` }}
                    />
                </div>
            </div>

            {/* 3. Mobile Form Card */}
            <div className={styles.formCardMobile}>
                {/* Field 1: User API Key */}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                        Channex API Key ({channexEnv.toUpperCase()})
                    </label>
                    <div className={styles.inputWrapper}>
                        <input
                            type={showApiKey ? "text" : "password"}
                            value={channexApiKey}
                            onChange={(e) => setChannexApiKey(e.target.value)}
                            placeholder="app_user_api_key_..."
                            className={`${styles.formInput} ${styles.formInputWithKeyActions}`}
                        />
                        <div className={styles.inputActionBtns}>
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className={styles.iconBtn}
                                title={showApiKey ? "Hide API Key" : "Show API Key"}
                            >
                                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                                type="button"
                                onClick={() => copyText(channexApiKey, "API Key")}
                                className={styles.iconBtn}
                                title="Copy API Key"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Field 2: Property ID / GUID */}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                        Channex Property ID (GUID)
                    </label>
                    <div className={styles.inputWrapper}>
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
                                    <Copy size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.propertyActionsRow}>
                        {onSyncMasterToChannex && (
                            <button
                                type="button"
                                onClick={onSyncMasterToChannex}
                                disabled={syncingMaster}
                                className={styles.btnActionOutlineMobile}
                            >
                                <RefreshCw size={11} className={syncingMaster ? "animate-spin" : ""} />
                                <span>{syncingMaster ? "Registering..." : "Auto-Register"}</span>
                            </button>
                        )}
                        {channexPropertyId && onUnlinkProperty && (
                            <button
                                type="button"
                                onClick={onUnlinkProperty}
                                className={styles.btnActionDangerMobile}
                            >
                                <Unlink size={11} />
                                <span>Unlink</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Field 3: Webhook Secret */}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                        Webhook Secret Key (HMAC-SHA256)
                    </label>
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
                                {showWebhookSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                                type="button"
                                onClick={() => copyText(channexWebhookSecret, "Webhook Secret")}
                                className={styles.iconBtn}
                                title="Copy Secret"
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Field 4: Callback Webhook URL */}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                        Callback Webhook URL (Public Endpoint)
                    </label>
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
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Webhook Status Box */}
                <div className={styles.webhookBoxMobile}>
                    <div className={styles.webhookStatusRow}>
                        <span
                            className={`${styles.statusDot} ${
                                webhookRegistrationStatus?.isRegistered
                                    ? styles.statusDotActive
                                    : styles.statusDotPending
                            }`}
                        />
                        <span>
                            Status: <b>{webhookRegistrationStatus?.isRegistered ? "Aktif di Channex" : "Belum Terdaftar"}</b>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleRegisterWebhook}
                        disabled={registeringWebhook}
                        className={styles.btnRegisterTouch}
                    >
                        <RefreshCw size={12} className={registeringWebhook ? "animate-spin" : ""} />
                        <span>{registeringWebhook ? "Mendaftarkan..." : "1-Click Register Webhook"}</span>
                    </button>
                </div>

                {/* Field 5: Base Currency */}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mata Uang Dasar Properti</label>
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

                {/* Save Button */}
                <button
                    type="button"
                    onClick={onSave}
                    disabled={savingSettings}
                    className={styles.btnSaveTouch}
                >
                    <Save size={13} className={savingSettings ? "animate-spin" : ""} />
                    <span>{savingSettings ? "Saving..." : "Save Configuration"}</span>
                </button>
            </div>

            {/* 4. Verification Matrix Mobile */}
            <div className={styles.verificationCardMobile}>
                <h4 className={styles.verificationTitleMobile}>Checklist Go-Live</h4>

                {readinessChecks.map(item => (
                    <div key={item.id} className={styles.verificationRowMobile}>
                        <div className={styles.verificationRowLeft}>
                            {item.passed ? (
                                <CheckCircle2 size={13} color="#059669" />
                            ) : (
                                <AlertCircle size={13} color="#d97706" />
                            )}
                            <span className={styles.verificationRowLabel}>{item.label}</span>
                        </div>
                        <span
                            className={`${styles.itemBadgeMobile} ${
                                item.passed ? styles.itemBadgePassed : styles.itemBadgePending
                            }`}
                        >
                            {item.badge}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
