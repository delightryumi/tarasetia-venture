"use client";

import React from "react";
import { useLogo } from "./useLogo";
import { ImageUpload } from "../../ui/ImageUpload/ImageUpload";
import { ShieldCheck, Sun, Moon, Link2 } from "lucide-react";
import "./logo.css";

export const LogoSection = () => {
    const {
        lightLogo,
        setLightLogo,
        darkLogo,
        setDarkLogo,
        bookingEngineUrl,
        setBookingEngineUrl,
        loading,
        saving,
        message,
        handleSave,
    } = useLogo();

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-[#788069] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="logo-section-container animate-fade-in">
            {/* Editorial Header */}
            <header className="airtable-header">
                <div className="airtable-title-row">
                    <div className="airtable-header-icon">
                        <ShieldCheck size={20} />
                    </div>
                    <h1 className="airtable-title">Branding & Links</h1>
                </div>
                <p className="airtable-subtitle">Maintain your brand identity and set your booking engine destination.</p>
            </header>

            {message && (
                <div className="airtable-toast-success">
                    <span>{message}</span>
                </div>
            )}

            {/* Logo Grid Section */}
            <div className="airtable-grid-2col">
                {/* Light Theme Logo Card */}
                <div className="airtable-card">
                    <div className="airtable-card-header">
                        <Sun className="airtable-card-icon-sun" size={18} />
                        <h3 className="airtable-card-title">Light Theme Logo</h3>
                    </div>
                    <p className="airtable-card-desc">This logo appears when the background is light (e.g., standard page content).</p>

                    {/* Logo visual placement box */}
                    <div className="logo-preview-box-light">
                        {lightLogo ? (
                            <img src={lightLogo} alt="Light Logo Preview" className="logo-preview-img-el" />
                        ) : (
                            <span className="logo-preview-empty-text">No logo uploaded</span>
                        )}
                    </div>

                    <ImageUpload
                        path="branding/logo-light.png"
                        currentUrl={lightLogo}
                        onUploadComplete={(url, path) => {
                            setLightLogo(url);
                            handleSave({ light: url });
                        }}
                    />
                </div>

                {/* Dark Theme Logo Card */}
                <div className="airtable-card">
                    <div className="airtable-card-header">
                        <Moon className="airtable-card-icon-moon" size={18} />
                        <h3 className="airtable-card-title">Dark Theme Logo</h3>
                    </div>
                    <p className="airtable-card-desc">This logo appears when the background is dark (e.g., transparent hero header).</p>

                    {/* Logo visual placement box */}
                    <div className="logo-preview-box-dark">
                        {darkLogo ? (
                            <img src={darkLogo} alt="Dark Logo Preview" className="logo-preview-img-el" />
                        ) : (
                            <span className="logo-preview-empty-text">No logo uploaded</span>
                        )}
                    </div>

                    <ImageUpload
                        path="branding/logo-dark.png"
                        currentUrl={darkLogo}
                        onUploadComplete={(url, path) => {
                            setDarkLogo(url);
                            handleSave({ dark: url });
                        }}
                    />
                </div>
            </div>

            {/* Booking Links Section */}
            <div className="airtable-grid-1col mt-6">
                <div className="airtable-card">
                    <div className="airtable-card-header">
                        <Link2 className="airtable-card-icon-link" size={18} />
                        <h3 className="airtable-card-title">Booking Engine URL</h3>
                    </div>
                    <p className="airtable-card-desc">Set the destination link for all "Book Now" and "Reserve" buttons across the landing page.</p>

                    <div className="airtable-form-group">
                        <label className="airtable-label">Direct Booking Link</label>
                        <input
                            type="url"
                            value={bookingEngineUrl}
                            onChange={(e) => setBookingEngineUrl(e.target.value)}
                            className="airtable-text-input"
                            placeholder="https://booking.com/bumi-anyom-resort"
                        />
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="airtable-footer-actions">
                <button
                    className="airtable-btn-primary"
                    onClick={() => handleSave()}
                    disabled={saving}
                >
                    {saving ? "Saving..." : "Update Branding"}
                </button>
            </div>
        </div>
    );
};
