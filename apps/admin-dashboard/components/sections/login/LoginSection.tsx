"use client";

import React, { useEffect, useState } from "react";
import { useLogin } from "./useLogin";
import { Mail, Lock } from "lucide-react";
import "./login.css";

const LeftPanel = React.memo(() => {
    return (
        <div className="panels-container">
            <div className="panel left-panel">
                <img src="/channels/nexura-logo.png" alt="Nexura Logo" className="hero-logo" />
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
    const { email, setEmail, password, setPassword, error, loading, handleLogin } =
        useLogin();

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

    return (
        <div className="auth-container">
            <div className="forms-container">
                {/* Top Logo */}
                <div className="auth-header">
                </div>

                {/* Form in the center */}
                <div className="signin-signup">
                    {/* ===== SIGN IN FORM ONLY ===== */}
                    <form className="sign-in-form" onSubmit={handleLogin}>
                        <h2 className="auth-title">Sign In</h2>
                        <p className="auth-subtitle">Welcome back to Nexura Global Hospitality</p>

                        {error && <div className="auth-error">{error}</div>}

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
                        <div className="input-field">
                            <span className="input-icon">
                                <Lock size={20} />
                            </span>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="auth-btn solid" disabled={loading}>
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>

                {/* Bottom Copyright */}
                <div className="auth-footer">
                    <p>© {new Date().getFullYear()} Nexura Global Hospitality. All rights reserved.</p>
                </div>
            </div>

            {/* ===== LEFT PANEL (Lottie Animation & Info) ===== */}
            <LeftPanel />
        </div>
    );
};
