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
                
                {/* Professional Operations Center Mockup */}
                <div className="pro-dashboard-preview">
                    <div className="preview-header">
                        <div className="status-indicator">
                            <span className="pulse-dot"></span>
                            <span>Live Control Center</span>
                        </div>
                        <span className="preview-date">Analytics Overview</span>
                    </div>

                    {/* Stats Summary Strip */}
                    <div className="preview-stats-row">
                        <div className="stat-item">
                            <span className="stat-label">Net Revenue</span>
                            <span className="stat-value">Rp 248.89M</span>
                            <span className="stat-trend trend-up">↑ 12.4%</span>
                        </div>
                        <div className="stat-item border-l">
                            <span className="stat-label">Occupancy</span>
                            <span className="stat-value">92.4%</span>
                            <span className="stat-trend trend-up">↑ 4.2%</span>
                        </div>
                    </div>

                    {/* Interactive Chart Section */}
                    <div className="preview-section">
                        <span className="section-title">Revenue Performance Trend</span>
                        <div className="svg-chart-container">
                            <svg viewBox="0 0 320 100" className="pro-chart-svg">
                                <defs>
                                    <linearGradient id="pro-chart-grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#C5A880" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#C5A880" stopOpacity="0.0" />
                                    </linearGradient>
                                    <linearGradient id="grid-grad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="rgba(255,255,255,0.01)" />
                                        <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                                        <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
                                    </linearGradient>
                                </defs>
                                {/* Grid Lines */}
                                <line x1="0" y1="20" x2="320" y2="20" stroke="url(#grid-grad)" strokeWidth="1" />
                                <line x1="0" y1="50" x2="320" y2="50" stroke="url(#grid-grad)" strokeWidth="1" />
                                <line x1="0" y1="80" x2="320" y2="80" stroke="url(#grid-grad)" strokeWidth="1" />
                                
                                {/* Area Path */}
                                <path
                                    d="M0,85 L20,78 L50,82 L90,45 L130,55 L170,25 L210,38 L250,15 L290,22 L320,10 L320,95 L0,95 Z"
                                    fill="url(#pro-chart-grad)"
                                />
                                {/* Line Path */}
                                <path
                                    d="M0,85 L20,78 L50,82 L90,45 L130,55 L170,25 L210,38 L250,15 L290,22 L320,10"
                                    fill="none"
                                    stroke="#C5A880"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                {/* Data Points */}
                                <circle cx="90" cy="45" r="3" fill="#C5A880" stroke="#1A1C14" strokeWidth="1" />
                                <circle cx="170" cy="25" r="3" fill="#C5A880" stroke="#1A1C14" strokeWidth="1" />
                                <circle cx="250" cy="15" r="3" fill="#C5A880" stroke="#1A1C14" strokeWidth="1" />
                                <circle cx="320" cy="10" r="3" fill="#C5A880" stroke="#1A1C14" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="preview-section border-t">
                        <span className="section-title">Recent Reservation Stream</span>
                        <div className="preview-table">
                            <div className="table-header-row">
                                <span className="col-guest">Guest</span>
                                <span className="col-room">Room</span>
                                <span className="col-status">Status</span>
                                <span className="col-amount text-right">Amount</span>
                            </div>
                            <div className="table-data-row">
                                <span className="col-guest text-white">Clara Oswald</span>
                                <span className="col-room">Suite 402</span>
                                <span className="col-status badge-gold">Confirmed</span>
                                <span className="col-amount text-gold text-right">Rp 4.5M</span>
                            </div>
                            <div className="table-data-row">
                                <span className="col-guest text-white">David Tennant</span>
                                <span className="col-room">Deluxe 108</span>
                                <span className="col-status badge-sage">Checked In</span>
                                <span className="col-amount text-gold text-right">Rp 2.8M</span>
                            </div>
                            <div className="table-data-row">
                                <span className="col-guest text-white">Sarah Smith</span>
                                <span className="col-room">Exec 301</span>
                                <span className="col-status badge-muted">Completed</span>
                                <span className="col-amount text-gold text-right">Rp 6.2M</span>
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
