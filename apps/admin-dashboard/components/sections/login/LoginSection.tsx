import React, { useEffect, useState } from "react";
import { useLogin } from "./useLogin";
import { Mail, Lock, Building, Eye, EyeOff } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import "./login.css";

const LeftPanel = React.memo(() => {
    return (
        <div className="panels-container">
            <div className="panel left-panel">
                <img src="/channels/2.png" alt="Tarasetia Venture Logo" className="hero-logo" />
                <div className="panel-content">
                    <h3><span>Property</span> Management System</h3>
                    <p>
                        Access your hospitality dashboard to manage your point of sales, bookings, housekeeping, and corporate accounts.
                    </p>
                </div>
            </div>
        </div>
    );
});
LeftPanel.displayName = "LeftPanel";

export const LoginSection = () => {
    const { email, setEmail, password, setPassword, hotelCode, setHotelCode, error, loading, handleLogin } =
        useLogin();

    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'reset-password'>('login');
    const [resetEmail, setResetEmail] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('dark');
        }
        const scriptId = 'lottie-player-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError("");
        setResetSuccess("");
        setResetLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail.trim());
            setResetSuccess("Link reset password telah dikirim ke email Anda. Silakan periksa inbox atau spam folder.");
        } catch (err: any) {
            console.error(err);
            setResetError(
                err.code === "auth/user-not-found"
                    ? "Email tidak terdaftar."
                    : err.code === "auth/invalid-email"
                    ? "Format email tidak valid."
                    : err.message || "Gagal mengirim link reset password."
            );
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="forms-container">
                {/* Top Logo */}
                <div className="auth-header">
                </div>

                {/* Form in the center */}
                <div className="signin-signup">
                    {mode === 'login' ? (
                        /* ===== SIGN IN FORM ===== */
                        <form className="sign-in-form" onSubmit={handleLogin}>
                            <h2 className="auth-title">Sign In</h2>
                            <p className="auth-subtitle">Welcome back to Tara</p>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="input-field">
                                <span className="input-icon">
                                    <Building size={20} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Hotel Code (e.g. 87241)"
                                    value={hotelCode}
                                    onChange={(e) => setHotelCode(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-field">
                                <span className="input-icon">
                                    <Mail size={20} />
                                </span>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-field" style={{ position: "relative" }}>
                                <span className="input-icon">
                                    <Lock size={20} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    style={{ paddingRight: "44px" }}
                                />
                                <span 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#9DA68E',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </span>
                            </div>

                            <div className="forgot-password-link" style={{ textAlign: 'right', marginTop: '4px', width: '100%', maxWidth: '380px' }}>
                                <span 
                                    onClick={() => {
                                        setMode('reset-password');
                                        setResetError("");
                                        setResetSuccess("");
                                    }} 
                                    style={{ cursor: 'pointer', fontSize: '12px', color: '#8d7a52', fontWeight: 550 }}
                                >
                                    Forgot Password?
                                </span>
                            </div>

                            <button type="submit" className="auth-btn solid" disabled={loading} style={{ marginTop: '16px' }}>
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    ) : (
                        /* ===== RESET PASSWORD FORM ===== */
                        <form className="sign-in-form" onSubmit={handleResetPassword}>
                            <h2 className="auth-title">Reset Password</h2>
                            <p className="auth-subtitle">Enter your email address to receive a reset link</p>

                            {resetError && <div className="auth-error">{resetError}</div>}
                            {resetSuccess && (
                                <div 
                                    className="auth-error" 
                                    style={{ 
                                        backgroundColor: '#f0fdf4', 
                                        borderColor: 'rgba(34, 197, 94, 0.2)', 
                                        color: '#15803d',
                                        fontSize: '12px',
                                        lineHeight: '1.4'
                                    }}
                                >
                                    {resetSuccess}
                                </div>
                            )}

                            <div className="input-field">
                                <span className="input-icon">
                                    <Mail size={20} />
                                </span>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    disabled={resetLoading}
                                />
                            </div>

                            <button type="submit" className="auth-btn solid" disabled={resetLoading} style={{ marginTop: '16px' }}>
                                {resetLoading ? "Sending Link..." : "Send Reset Link"}
                            </button>

                            <span 
                                onClick={() => {
                                    setMode('login');
                                    setResetEmail("");
                                }} 
                                style={{ cursor: 'pointer', fontSize: '13px', color: '#181d26', marginTop: '20px', fontWeight: 600, textDecoration: 'underline' }}
                              >
                                Back to Sign In
                            </span>
                        </form>
                    )}
                </div>

                {/* Bottom Copyright */}
                <div className="auth-footer">
                    <p>© {new Date().getFullYear()} Tarasetia Venture. All rights reserved.</p>
                </div>
            </div>

            {/* ===== LEFT PANEL ===== */}
            <LeftPanel />
        </div>
    );
};
