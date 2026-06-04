"use client";

import React, { useState } from "react";
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
    <svg 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        fill="currentColor"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

export function WhatsAppWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    
    const phoneNumber = "628112719990"; 
    
    const handleSend = () => {
        const text = message.trim() 
            ? encodeURIComponent(message.trim())
            : encodeURIComponent("Halo Admin Bumi Anyom, saya butuh bantuan.");
        const url = `https://wa.me/${phoneNumber}?text=${text}`;
        window.open(url, "_blank", "noopener,noreferrer");
        setMessage("");
        setIsOpen(false);
    };

    return (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999, fontFamily: "var(--font-geist-sans), sans-serif" }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width: "290px",
                            borderRadius: "12px",
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(0, 0, 0, 0.08)",
                            boxShadow: "0 16px 48px -12px rgba(24, 29, 38, 0.12)",
                            marginBottom: "12px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        {/* Header: Compact Support Brand */}
                        <div style={{ padding: "12px 14px", backgroundColor: "#788069", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ position: "relative", width: "28px", height: "28px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255, 255, 255, 0.6)", flexShrink: 0 }}>
                                    <img 
                                        src="/avatar/memo_9.png" 
                                        alt="CS Avatar" 
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                    <div style={{ position: "absolute", bottom: "0", right: "0", width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981", border: "1.5px solid #788069" }} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", lineHeight: 1.1 }}>Bumi Anyom Concierge</span>
                                    <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>Online & Ready</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", opacity: 0.85 }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Body Chat Bubble & Input (Unified & Compact) */}
                        <div style={{ padding: "14px", backgroundColor: "#faf9f6", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ alignSelf: "flex-start", backgroundColor: "#ffffff", border: "1px solid rgba(120, 128, 105, 0.1)", padding: "10px", borderRadius: "0 8px 8px 8px", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.01)" }}>
                                <p style={{ fontSize: "10px", color: "#44403c", margin: 0, lineHeight: 1.4 }}>
                                    Halo! Butuh bantuan atau informasi? Ketik pesan Anda di bawah untuk chat langsung via WhatsApp.
                                </p>
                            </div>

                            {/* Minimalist Input Bar */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSend();
                                    }}
                                    placeholder="Tulis pesan..."
                                    style={{
                                        flex: 1,
                                        height: "34px",
                                        padding: "0 12px",
                                        fontSize: "11px",
                                        borderRadius: "17px",
                                        border: "1px solid #e5e5e5",
                                        outline: "none",
                                        fontFamily: "inherit",
                                        color: "#333840",
                                        backgroundColor: "#ffffff",
                                        transition: "border-color 150ms ease"
                                    }}
                                />
                                <button 
                                    onClick={handleSend}
                                    style={{
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "50%",
                                        backgroundColor: "#00a884", // Pure WA green
                                        color: "#ffffff",
                                        border: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 10px rgba(0, 168, 132, 0.15)",
                                        flexShrink: 0,
                                        transition: "transform 150ms ease"
                                    }}
                                >
                                    <Send size={11} style={{ marginLeft: "1px" }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button: Compact & Sleek Circle */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    backgroundColor: "#00a884", // WA Green
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 6px 20px rgba(0, 168, 132, 0.25)",
                    cursor: "pointer",
                    zIndex: 10000,
                    position: "relative"
                }}
            >
                <WhatsAppIcon size={20} />
                {!isOpen && (
                    <span 
                        style={{ 
                            position: "absolute", 
                            top: "1px", 
                            right: "1px", 
                            width: "9px", 
                            height: "9px", 
                            borderRadius: "50%", 
                            backgroundColor: "#ef4444", 
                            border: "1.5px solid #ffffff",
                            animation: "pulse 2s infinite" 
                        }} 
                    />
                )}
            </motion.button>
        </div>
    );
}
