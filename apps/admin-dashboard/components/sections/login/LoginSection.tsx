"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLogin } from "./useLogin";
import { 
    User, 
    Lock, 
    Store, 
    Eye, 
    EyeOff, 
    Mail, 
    Loader2, 
    Globe, 
    HelpCircle, 
    X,
    Phone,
    Headphones,
    ShieldCheck,
    Check,
    Copy,
    Download,
    Key
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { CloudflareTurnstile } from "@/components/shared/CloudflareTurnstile";
import styles from "./login.module.css";

export const LoginSection = () => {
    const { 
        email, 
        setEmail, 
        password, 
        setPassword, 
        hotelCode, 
        setHotelCode, 
        twoFactorCode, 
        setTwoFactorCode, 
        requires2Fa, 
        requires2FaSetup, 
        setupStep, 
        setupSecret, 
        setupQrUrl, 
        setupRecoveryCodes, 
        trustDevice, 
        setTrustDevice, 
        handleConfirmSetup, 
        handleFinishSetupAndLogin, 
        cancel2Fa, 
        error, 
        loading, 
        handleLogin 
    } = useLogin();

    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    const handleCopySecret = () => {
        if (!setupSecret) return;
        navigator.clipboard.writeText(setupSecret);
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
    };

    const handleCopyCodes = () => {
        if (!setupRecoveryCodes.length) return;
        navigator.clipboard.writeText(setupRecoveryCodes.join("\n"));
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
    };

    const handleDownloadRecoveryCodes = () => {
        const text = `TARA CRS - EMERGENCY RECOVERY CODES\nAccount: ${email}\nGenerated: ${new Date().toISOString()}\n\n` +
            setupRecoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n") +
            `\n\nKEEP THESE CODES SECURE. Each code can be used once if you lose access to Google Authenticator.`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tara-recovery-codes-${email.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'reset-password'>('login');
    const [resetEmail, setResetEmail] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    // Cloudflare Turnstile Security State
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [turnstileError, setTurnstileError] = useState("");

    // Header State
    const [language, setLanguage] = useState<'EN' | 'ID'>('EN');

    const handleTurnstileVerify = useCallback((token: string) => {
        setTurnstileToken(token);
        setTurnstileError("");
    }, []);

    const handleTurnstileExpire = useCallback(() => {
        setTurnstileToken(null);
    }, []);

    const handleTurnstileError = useCallback(() => {
        setTurnstileToken(null);
        setTurnstileError(
            language === 'EN'
                ? "Security check failed. Please refresh or retry."
                : "Verifikasi keamanan gagal. Silakan coba lagi."
        );
    }, [language]);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const [inactivityNotice, setInactivityNotice] = useState("");

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('dark');
            const reason = sessionStorage.getItem("logout_reason");
            if (reason === "inactivity_timeout") {
                setInactivityNotice(
                    language === 'EN'
                        ? "Your session expired automatically after 1 hour of inactivity for security reasons. Please sign in again."
                        : "Sesi Anda telah berakhir secara otomatis demi keamanan karena tidak ada aktivitas selama 1 jam. Silakan masuk kembali."
                );
                sessionStorage.removeItem("logout_reason");
            }
        }
    }, [language]);

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!turnstileToken) {
            setTurnstileError(
                language === 'EN'
                    ? "Please complete the Cloudflare security verification before signing in."
                    : "Silakan selesaikan centang verifikasi keamanan Cloudflare terlebih dahulu."
            );
            return;
        }
        setTurnstileError("");
        handleLogin(e);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError("");
        setResetSuccess("");
        setResetLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail.trim());
            setResetSuccess(
                language === 'EN'
                    ? "Password reset link sent! Check your inbox or spam folder."
                    : "Link reset password telah dikirim ke email Anda. Silakan periksa inbox atau spam folder."
            );
        } catch (err: any) {
            console.error(err);
            setResetError(
                err.code === "auth/user-not-found"
                    ? (language === 'EN' ? "Email address not registered." : "Email tidak terdaftar.")
                    : err.code === "auth/invalid-email"
                    ? (language === 'EN' ? "Invalid email address." : "Format email tidak valid.")
                    : err.message || (language === 'EN' ? "Failed to send reset link." : "Gagal mengirim link reset password.")
            );
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            
            {/* Top Right Utility Bar */}
            <header className={styles.topbar}>
                <button 
                    type="button" 
                    className={styles.topbarBtn}
                    onClick={() => setShowHelpModal(true)}
                >
                    <HelpCircle size={15} />
                    <span>{language === 'EN' ? "Need Help?" : "Bantuan"}</span>
                </button>

                <div className={styles.langWrapper}>
                    <button 
                        type="button" 
                        className={styles.topbarBtn}
                        onClick={() => setShowLangMenu(!showLangMenu)}
                    >
                        <Globe size={15} />
                        <span>{language === 'EN' ? "EN" : "ID"}</span>
                    </button>

                    {showLangMenu && (
                        <div className={styles.langPopover}>
                            <button 
                                type="button" 
                                className={`${styles.langItem} ${language === 'EN' ? styles.langItemActive : ''}`}
                                onClick={() => {
                                    setLanguage('EN');
                                    setShowLangMenu(false);
                                }}
                            >
                                🇬🇧 English
                            </button>
                            <button 
                                type="button" 
                                className={`${styles.langItem} ${language === 'ID' ? styles.langItemActive : ''}`}
                                onClick={() => {
                                    setLanguage('ID');
                                    setShowLangMenu(false);
                                }}
                            >
                                🇮🇩 Bahasa Indonesia
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Centered Clean Card Area */}
            <main className={styles.centerStage}>
                <div className={styles.cleanCard}>
                    {requires2FaSetup ? (
                        setupStep === "codes" ? (
                            <>
                                <div className={styles.cardHeader}>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <h1 className={styles.cardTitle}>
                                        {language === 'EN' ? "Backup Recovery Codes" : "Simpan Kode Cadangan"}
                                    </h1>
                                    <p className={styles.cardSubtitle}>
                                        {language === 'EN' 
                                            ? "Save these 8 recovery codes in a secure place. Each code can be used once if you lose your authenticator device." 
                                            : "Simpan 8 kode cadangan ini di tempat aman. Berguna jika Anda kehilangan akses ke Google Authenticator."}
                                    </p>
                                </div>

                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                        {setupRecoveryCodes.map((code, idx) => (
                                            <div 
                                                key={idx} 
                                                style={{ 
                                                    fontFamily: 'monospace', 
                                                    fontSize: '12.5px', 
                                                    fontWeight: 600, 
                                                    background: '#ffffff', 
                                                    padding: '6px 8px', 
                                                    borderRadius: '6px', 
                                                    border: '1px solid #cbd5e1', 
                                                    textAlign: 'center',
                                                    color: '#0f172a'
                                                }}
                                            >
                                                {code}
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button 
                                            type="button" 
                                            onClick={handleCopyCodes}
                                            className={styles.topbarBtn}
                                            style={{ fontSize: '11px', padding: '5px 10px' }}
                                        >
                                            {copiedCodes ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                            <span>{copiedCodes ? (language === 'EN' ? "Copied!" : "Tersalin!") : (language === 'EN' ? "Copy Codes" : "Salin Semua")}</span>
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleDownloadRecoveryCodes}
                                            className={styles.topbarBtn}
                                            style={{ fontSize: '11px', padding: '5px 10px' }}
                                        >
                                            <Download size={13} />
                                            <span>{language === 'EN' ? "Download .txt" : "Unduh File .txt"}</span>
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="button" 
                                    onClick={handleFinishSetupAndLogin}
                                    className={styles.primaryLoginBtn}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{language === 'EN' ? "ENTERING DASHBOARD..." : "MASUK KE DASHBOARD..."}</span>
                                        </>
                                    ) : (
                                        <span>{language === 'EN' ? "CONTINUE TO DASHBOARD" : "SELESAI & MASUK KE DASHBOARD"}</span>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className={styles.cardHeader}>
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <h1 className={styles.cardTitle}>
                                        {language === 'EN' ? "Mandatory 2FA Setup" : "Aktivasi Wajib 2FA"}
                                    </h1>
                                    <p className={styles.cardSubtitle}>
                                        {language === 'EN' 
                                            ? "Scan the QR code with Google Authenticator once to protect your account." 
                                            : "Scan kode QR dengan Google Authenticator satu kali saja untuk mengamankan akun."}
                                    </p>
                                </div>

                                {error && (
                                    <div className={styles.alertError} role="alert">
                                        {error}
                                    </div>
                                )}

                                {setupQrUrl && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ padding: '8px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <img 
                                                src={setupQrUrl} 
                                                alt="Google Authenticator QR Code" 
                                                style={{ width: '150px', height: '150px', display: 'block' }}
                                            />
                                        </div>
                                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                                            <span>{language === 'EN' ? "Key:" : "Kode rahasia:"}</span>
                                            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                                                {setupSecret}
                                            </code>
                                            <button 
                                                type="button" 
                                                onClick={handleCopySecret}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '2px', display: 'inline-flex', alignItems: 'center' }}
                                                title="Salin kode"
                                            >
                                                {copiedSecret ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <form className={styles.authForm} onSubmit={handleConfirmSetup}>
                                    <div className={styles.fieldGroup}>
                                        <label htmlFor="totp-setup-input" className={styles.fieldLabel}>
                                            {language === 'EN' ? "6-Digit Verification Code" : "6 Digit Kode Verifikasi"}
                                        </label>
                                        <div className={styles.inputContainer}>
                                            <input 
                                                id="totp-setup-input"
                                                type="text"
                                                inputMode="numeric"
                                                autoFocus
                                                placeholder="000000"
                                                maxLength={6}
                                                className={styles.textInput}
                                                style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.25rem', fontWeight: 'bold' }}
                                                value={twoFactorCode}
                                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <input 
                                            type="checkbox" 
                                            id="setup-remember-device" 
                                            checked={trustDevice} 
                                            onChange={(e) => setTrustDevice(e.target.checked)} 
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="setup-remember-device" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                                            {language === 'EN' ? "Remember this device for 30 days" : "Ingat perangkat ini selama 30 hari"}
                                        </label>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className={styles.primaryLoginBtn}
                                        disabled={loading || twoFactorCode.length < 6}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>{language === 'EN' ? "VERIFYING..." : "MEMVERIFIKASI..."}</span>
                                            </>
                                        ) : (
                                            <span>{language === 'EN' ? "ACTIVATE & CONTINUE" : "AKTIFKAN & LANJUTKAN"}</span>
                                        )}
                                    </button>

                                    <div className={styles.forgotPassRow}>
                                        <button 
                                            type="button" 
                                            className={styles.forgotPassLink}
                                            onClick={cancel2Fa}
                                        >
                                            {language === 'EN' ? "Back to Sign In" : "Kembali ke Login"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )
                    ) : requires2Fa ? (
                        <>
                            <div className={styles.cardHeader}>
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                                    <ShieldCheck size={28} />
                                </div>
                                <h1 className={styles.cardTitle}>
                                    {language === 'EN' ? "Two-Factor Verification" : "Verifikasi Dua Langkah"}
                                </h1>
                                <p className={styles.cardSubtitle}>
                                    {language === 'EN' 
                                        ? "Enter the 6-digit verification code from Google Authenticator." 
                                        : "Masukkan 6 digit kode verifikasi dari Google Authenticator."}
                                </p>
                            </div>

                            {error && (
                                <div className={styles.alertError} role="alert">
                                    {error}
                                </div>
                            )}

                            <form className={styles.authForm} onSubmit={handleLogin}>
                                <div className={styles.fieldGroup}>
                                    <label htmlFor="totp-input" className={styles.fieldLabel}>
                                        {language === 'EN' ? "Verification Code" : "Kode Verifikasi"}
                                    </label>
                                    <div className={styles.inputContainer}>
                                        <input 
                                            id="totp-input"
                                            type="text"
                                            inputMode="numeric"
                                            autoFocus
                                            placeholder="000000"
                                            maxLength={10}
                                            className={styles.textInput}
                                            style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.25rem', fontWeight: 'bold' }}
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="login-remember-device" 
                                        checked={trustDevice} 
                                        onChange={(e) => setTrustDevice(e.target.checked)} 
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="login-remember-device" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                                        {language === 'EN' ? "Remember this device for 30 days" : "Ingat perangkat ini selama 30 hari"}
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    className={styles.primaryLoginBtn}
                                    disabled={loading || !twoFactorCode.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{language === 'EN' ? "VERIFYING..." : "MEMVERIFIKASI..."}</span>
                                        </>
                                    ) : (
                                        <span>{language === 'EN' ? "VERIFY & SIGN IN" : "VERIFIKASI & MASUK"}</span>
                                    )}
                                </button>

                                <div className={styles.forgotPassRow}>
                                    <button 
                                        type="button" 
                                        className={styles.forgotPassLink}
                                        onClick={cancel2Fa}
                                    >
                                        {language === 'EN' ? "Back to Sign In" : "Kembali ke Login"}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : mode === 'login' ? (
                        <>
                            <div className={styles.cardHeader}>
                                <h1 className={styles.cardTitle}>
                                    {language === 'EN' ? "Sign In" : "Masuk"}
                                </h1>
                                <p className={styles.cardSubtitle}>
                                    {language === 'EN' 
                                        ? "Please sign in to your account to continue." 
                                        : "Silakan masuk ke akun Anda untuk melanjutkan."}
                                </p>
                            </div>

                            {inactivityNotice && (
                                <div 
                                    className={styles.alertError} 
                                    style={{ 
                                        backgroundColor: "#fef3c7", 
                                        borderColor: "#f59e0b", 
                                        color: "#92400e",
                                        marginBottom: "12px"
                                    }} 
                                    role="alert"
                                >
                                    {inactivityNotice}
                                </div>
                            )}

                            {(error || turnstileError) && (
                                <div className={styles.alertError} role="alert">
                                    {turnstileError || error}
                                </div>
                            )}

                            <form className={styles.authForm} onSubmit={onFormSubmit}>
                                {/* 1. Email Input */}
                                <div className={styles.fieldGroup}>
                                    <label htmlFor="tara-email" className={styles.fieldLabel}>
                                        {language === 'EN' ? "Email" : "Email"}
                                    </label>
                                    <div className={styles.inputContainer}>
                                        <span className={styles.inputIcon}>
                                            <Mail size={16} />
                                        </span>
                                        <input 
                                            id="tara-email"
                                            type="text"
                                            name="email"
                                            className={styles.textInput}
                                            placeholder={language === 'EN' ? "Enter your email" : "Masukkan email"}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* 2. Property Code Input */}
                                <div className={styles.fieldGroup}>
                                    <label htmlFor="tara-property-code" className={styles.fieldLabel}>
                                        {language === 'EN' ? "Property Code" : "Property Code"}
                                    </label>
                                    <div className={styles.inputContainer}>
                                        <span className={styles.inputIcon}>
                                            <Store size={16} />
                                        </span>
                                        <input 
                                            id="tara-property-code"
                                            type="text"
                                            name="propertyCode"
                                            className={styles.textInput}
                                            placeholder={language === 'EN' ? "Enter property code (e.g. 14034)" : "Masukkan property code (contoh: 14034)"}
                                            value={hotelCode}
                                            onChange={(e) => setHotelCode(e.target.value)}
                                            disabled={loading}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* 3. Password Input */}
                                <div className={styles.fieldGroup}>
                                    <label htmlFor="tara-password" className={styles.fieldLabel}>
                                        {language === 'EN' ? "Password" : "Password"}
                                    </label>
                                    <div className={styles.inputContainer}>
                                        <span className={styles.inputIcon}>
                                            <Lock size={16} />
                                        </span>
                                        <input 
                                            id="tara-password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            className={styles.textInput}
                                            placeholder={language === 'EN' ? "Enter your password" : "Masukkan password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className={styles.passVisibilityToggle}
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Cloudflare Turnstile Security Verification */}
                                <div className="w-full flex flex-col items-center justify-center my-1.5">
                                    <CloudflareTurnstile 
                                        onVerify={handleTurnstileVerify}
                                        onExpire={handleTurnstileExpire}
                                        onError={handleTurnstileError}
                                        theme="light"
                                    />
                                </div>

                                {/* Primary Sign In Button */}
                                <button 
                                    type="submit" 
                                    className={styles.primaryLoginBtn}
                                    disabled={loading || !turnstileToken}
                                    style={{
                                        opacity: (!turnstileToken && !loading) ? 0.65 : 1,
                                        cursor: (!turnstileToken && !loading) ? 'not-allowed' : 'pointer'
                                    }}
                                    title={!turnstileToken ? (language === 'EN' ? "Please complete the security check above" : "Selesaikan verifikasi keamanan di atas") : undefined}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{language === 'EN' ? "SIGNING IN..." : "MEMPROSES..."}</span>
                                        </>
                                    ) : (
                                        <span>{language === 'EN' ? "SIGN IN" : "MASUK"}</span>
                                    )}
                                </button>

                                {/* Forgot Password Link on Right */}
                                <div className={styles.forgotPassRow}>
                                    <button 
                                        type="button" 
                                        className={styles.forgotPassLink}
                                        onClick={() => {
                                            setMode('reset-password');
                                            setResetError("");
                                            setResetSuccess("");
                                        }}
                                    >
                                        {language === 'EN' ? "Forgot Password?" : "Lupa Kata Sandi?"}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* Reset Password Flow */
                        <>
                            <div className={styles.cardHeader}>
                                <h1 className={styles.cardTitle}>
                                    {language === 'EN' ? "Reset Password" : "Atur Ulang Sandi"}
                                </h1>
                                <p className={styles.cardSubtitle}>
                                    {language === 'EN' 
                                        ? "Please enter your registered email to continue." 
                                        : "Masukkan email terdaftar Anda untuk melanjutkan."}
                                </p>
                            </div>

                            {resetError && <div className={styles.alertError}>{resetError}</div>}
                            {resetSuccess && <div className={styles.alertSuccess}>{resetSuccess}</div>}

                            <form className={styles.authForm} onSubmit={handleResetPassword}>
                                <div className={styles.fieldGroup}>
                                    <label htmlFor="tara-reset-email" className={styles.fieldLabel}>
                                        {language === 'EN' ? "Email Address" : "Alamat Email"}
                                    </label>
                                    <div className={styles.inputContainer}>
                                        <span className={styles.inputIcon}>
                                            <Mail size={16} />
                                        </span>
                                        <input 
                                            id="tara-reset-email"
                                            type="email"
                                            name="email"
                                            className={styles.textInput}
                                            placeholder={language === 'EN' ? "Enter your email" : "Masukkan email Anda"}
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required
                                            disabled={resetLoading}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className={styles.primaryLoginBtn}
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{language === 'EN' ? "SENDING..." : "MENGIRIM..."}</span>
                                        </>
                                    ) : (
                                        <span>{language === 'EN' ? "SEND RECOVERY LINK" : "KIRIM TAUTAN"}</span>
                                    )}
                                </button>

                                <div className={styles.forgotPassRow} style={{ justifyContent: "center" }}>
                                    <button 
                                        type="button" 
                                        className={styles.forgotPassLink}
                                        onClick={() => {
                                            setMode('login');
                                            setResetEmail("");
                                            setResetError("");
                                            setResetSuccess("");
                                        }}
                                    >
                                        {language === 'EN' ? "← Return to Sign In" : "← Kembali ke Sign In"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Centered Footer: Powered by (Logo Only) */}
                <footer className={styles.footerRow}>
                    <span className={styles.poweredText}>Powered by</span>
                    <img src="/channels/1.png" alt="Tara" className={styles.footerLogo} />
                </footer>
            </main>

            {/* ========================================================
               NATURE MOUNTAIN ESCAPE SILHOUETTE ACCENT (SVG)
               Serene rolling mountain ridges, misty highland peaks & nature trees
               (Pure landscape, zero dummy text)
               ======================================================== */}
            <div className={styles.skylineBackdrop} aria-hidden="true">
                <svg 
                    viewBox="0 0 1440 280" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className={styles.skylineSvg}
                    preserveAspectRatio="none"
                >
                    {/* Background Distant Majestic Mountain Peaks */}
                    <g fill="#d8dde3" opacity="0.45">
                        <path d="M0 280V170L75 140L145 105L210 65L265 95L330 45L410 115L480 80L560 145L640 180L720 195L800 175L890 130L975 60L1050 100L1120 40L1190 90L1265 55L1345 125L1440 160V280H0Z" />
                        {/* Peak highlights / ridge shadows */}
                        <polygon points="330,45 265,95 330,120" fill="#d2d7de" opacity="0.6" />
                        <polygon points="1120,40 1050,100 1120,115" fill="#d2d7de" opacity="0.6" />
                    </g>

                    {/* Midground Rolling Hills & Highland Mountain Ridges */}
                    <g fill="#ccd4dc" opacity="0.65">
                        <path d="M0 280V205L90 185L170 150L240 120L310 145L380 110L460 160L540 195L630 215L720 220L810 210L900 185L980 140L1060 115L1140 150L1220 125L1310 170L1390 195L1440 210V280H0Z" />
                        {/* Secondary soft ridge contours */}
                        <path d="M120 280L240 120L310 145L400 280H120Z" fill="#c3cbd4" opacity="0.4" />
                        <path d="M920 280L1060 115L1140 150L1240 280H920Z" fill="#c3cbd4" opacity="0.4" />
                    </g>

                    {/* Foreground Nature Escape: Gentle Foothills & Forest Conifer/Tree Silhouettes */}
                    <g fill="#b8c2cc" opacity="0.85">
                        {/* Low rolling foreground slopes */}
                        <path d="M0 280V235Q80 220 160 210Q250 200 340 220Q430 240 520 230Q610 220 720 225Q830 230 920 220Q1010 210 1100 230Q1190 250 1280 235Q1360 220 1440 230V280H0Z" />

                        {/* Left Nature Tree Line Accents */}
                        <polygon points="40,240 45,215 50,240" />
                        <polygon points="52,242 58,210 64,242" />
                        <polygon points="68,245 74,218 80,245" />
                        <polygon points="95,238 102,205 109,238" />
                        <polygon points="112,240 118,212 124,240" />
                        <polygon points="150,230 156,198 162,230" />
                        <polygon points="165,232 172,192 179,232" />
                        <polygon points="183,235 190,202 197,235" />
                        <polygon points="230,225 237,185 244,225" />
                        <polygon points="248,228 254,195 260,228" />
                        <polygon points="310,230 318,190 326,230" />
                        <polygon points="330,235 337,200 344,235" />

                        {/* Right Nature Tree Line Accents */}
                        <polygon points="1080,235 1087,195 1094,235" />
                        <polygon points="1100,238 1107,202 1114,238" />
                        <polygon points="1140,242 1148,198 1156,242" />
                        <polygon points="1160,244 1167,208 1174,244" />
                        <polygon points="1210,245 1217,200 1224,245" />
                        <polygon points="1228,246 1235,190 1242,246" />
                        <polygon points="1246,248 1253,205 1260,248" />
                        <polygon points="1320,240 1327,202 1334,240" />
                        <polygon points="1340,242 1347,210 1354,242" />
                        <polygon points="1380,244 1387,208 1394,244" />
                        <polygon points="1400,245 1407,215 1414,245" />

                        {/* Base Horizon Baseline */}
                        <rect x="0" y="255" width="1440" height="25" fill="#adb8c4" />
                    </g>
                </svg>
            </div>

            {/* Interactive Help Modal */}
            {showHelpModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowHelpModal(false)}>
                    <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{language === 'EN' ? "Tara Support" : "Bantuan Tara"}</h3>
                            <button 
                                type="button" 
                                className={styles.modalClose}
                                onClick={() => setShowHelpModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalDesc}>
                                {language === 'EN' 
                                    ? "Need assistance with your accommodation credentials or front desk setup?" 
                                    : "Butuh bantuan mengenai akun properti atau konfigurasi front office?"}
                            </p>
                            <div className={styles.contactItem}>
                                <Headphones size={20} color="#475569" />
                                <div>
                                    <div className={styles.contactLabel}>Technical Operations</div>
                                    <div className={styles.contactValue}>support@setara.co.id</div>
                                </div>
                            </div>
                            <div className={styles.contactItem}>
                                <Phone size={20} color="#475569" />
                                <div>
                                    <div className={styles.contactLabel}>{language === 'EN' ? "Customer Support / WhatsApp" : "Customer Support / WhatsApp"}</div>
                                    <a href="https://wa.me/628888396598" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                                        +62 888-8396-598
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button 
                                type="button" 
                                className={styles.modalBtn}
                                onClick={() => setShowHelpModal(false)}
                            >
                                {language === 'EN' ? "Close" : "Tutup"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
