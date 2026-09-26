"use client";

import React, { useEffect, useState } from "react";
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
    Headphones
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./login.module.css";

export const LoginSection = () => {
    const { 
        email, 
        setEmail, 
        password, 
        setPassword, 
        hotelCode, 
        setHotelCode, 
        error, 
        loading, 
        handleLogin 
    } = useLogin();

    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'reset-password'>('login');
    const [resetEmail, setResetEmail] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    // Header State
    const [language, setLanguage] = useState<'EN' | 'ID'>('EN');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('dark');
        }
    }, []);

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
                    {mode === 'login' ? (
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

                            {error && (
                                <div className={styles.alertError} role="alert">
                                    {error}
                                </div>
                            )}

                            <form className={styles.authForm} onSubmit={handleLogin}>
                                {/* Username Input */}
                                <div className={styles.fieldGroup}>
                                    <label htmlFor="tara-username" className={styles.fieldLabel}>
                                        {language === 'EN' ? "Username" : "Username"}
                                    </label>
                                    <div className={styles.inputContainer}>
                                        <span className={styles.inputIcon}>
                                            <User size={16} />
                                        </span>
                                        <input 
                                            id="tara-username"
                                            type="text"
                                            name="username"
                                            className={styles.textInput}
                                            placeholder={language === 'EN' ? "Enter username" : "Masukkan username"}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
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
                                            placeholder={language === 'EN' ? "Enter password" : "Masukkan password"}
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

                                {/* Property Code Input */}
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
                                            placeholder={language === 'EN' ? "Enter property code" : "Masukkan property code"}
                                            value={hotelCode}
                                            onChange={(e) => setHotelCode(e.target.value)}
                                            disabled={loading}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Primary Sign In Button */}
                                <button 
                                    type="submit" 
                                    className={styles.primaryLoginBtn}
                                    disabled={loading}
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
