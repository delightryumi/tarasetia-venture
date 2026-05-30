"use client";

import React, { useEffect } from "react";
import { useLogin } from "./useLogin";
import { Mail, Lock } from "lucide-react";
import "./login.css";

export const LoginSection = () => {
    const { email, setEmail, password, setPassword, error, loading, handleLogin } =
        useLogin();

    return (
        <div className="auth-container">
            <div className="forms-container">
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
            </div>

            {/* ===== LEFT PANEL (Lottie Animation & Info) ===== */}
            <div className="panels-container">
                <div className="panel left-panel">
                    <div className="panel-content">
                        <h3>Nexura Global Hospitality</h3>
                        <p>
                            Access your hospitality dashboard to manage your point of sales, bookings, housekeeping, and corporate accounts.
                        </p>
                    </div>
                    {/* Lottie Animation replacing the static image */}
                    <div 
                        className="panel-image"
                        style={{ 
                            minHeight: '260px', 
                            width: '100%', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}
                        dangerouslySetInnerHTML={{ 
                            __html: `<lottie-player src="/animated/DATA SECURITY.json" background="transparent" speed="1.2" style="width: 100%; height: 100%; max-width: 400px;" loop autoplay></lottie-player>` 
                        }} 
                    />
                </div>
            </div>
        </div>
    );
};
