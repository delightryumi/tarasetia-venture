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
                {/* Live Dashboard Teaser (Opsi 1) */}
                <div className="teaser-dashboard">
                    <div className="teaser-header">
                        <span className="teaser-badge">
                            <span className="pulse-dot"></span>
                            Live System Status
                        </span>
                        <span className="teaser-time">Today</span>
                    </div>

                    <div className="teaser-grid">
                        {/* Card 1: Occupancy */}
                        <div className="teaser-card">
                            <div className="card-header">
                                <span className="card-label">Occupancy</span>
                                <span className="card-percent">+4.2%</span>
                            </div>
                            <div className="card-body">
                                <h4 className="card-value">88%</h4>
                                <div className="progress-track">
                                    <div className="progress-bar" style={{ width: '88%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Revenue */}
                        <div className="teaser-card">
                            <div className="card-header">
                                <span className="card-label">Revenue</span>
                                <span className="card-trend text-gold">↑ 12.4%</span>
                            </div>
                            <div className="card-body">
                                <h4 className="card-value">Rp 14.8M</h4>
                                <div className="mini-chart">
                                    <svg viewBox="0 0 100 30" className="chart-svg">
                                        <defs>
                                            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#C5A880" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#C5A880" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d="M0,25 Q15,10 30,18 T60,5 T90,8 L100,2"
                                            fill="none"
                                            stroke="#C5A880"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M0,25 Q15,10 30,18 T60,5 T90,8 L100,2 L100,30 L0,30 Z"
                                            fill="url(#chart-grad)"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Active Terminals */}
                        <div className="teaser-card col-span-2">
                            <div className="card-header">
                                <span className="card-label">POS Terminals</span>
                                <span className="terminal-badge">Active</span>
                            </div>
                            <div className="card-terminal-body">
                                <div className="terminal-item">
                                    <span className="dot online"></span>
                                    <span>Main cashier</span>
                                </div>
                                <div className="terminal-item">
                                    <span className="dot online"></span>
                                    <span>Restaurant POS</span>
                                </div>
                                <div className="terminal-item">
                                    <span className="dot online"></span>
                                    <span>Bar Terminal</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
