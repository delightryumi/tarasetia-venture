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
            : encodeURIComponent("Halo Admin Bumi Anyom, saya butuh bantuan mengenai sistem.");
        const url = `https://wa.me/${phoneNumber}?text=${text}`;
        window.open(url, "_blank", "noopener,noreferrer");
        setMessage("");
        setIsOpen(false);
    };

    return (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, fontFamily: "var(--font-geist-sans), sans-serif" }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            width: "340px",
                            borderRadius: "16px",
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(0, 0, 0, 0.08)",
                            boxShadow: "0 24px 64px -16px rgba(24, 29, 38, 0.16)",
                            marginBottom: "16px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        {/* Header: Minimal & Editorial */}
                        <div style={{ padding: "20px 20px 16px 20px", borderBottom: "1px solid #f2f2f2", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#8c8c8c" }}>
                                    Live Support
                                </span>
                                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#181d26", margin: 0 }}>
                                    Bumi Anyom Concierge
                                </h4>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                style={{ 
                                    background: "rgba(0,0,0,0.03)", 
                                    border: "none", 
                                    color: "#5c5c5c", 
                                    cursor: "pointer", 
                                    padding: "6px", 
                                    borderRadius: "50%",
                                    display: "flex", 
                                    alignItems: "center" 
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Profile Card Section */}
                        <div style={{ padding: "20px", backgroundColor: "#faf9f6", display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ position: "relative", width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", border: "2px solid #ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", flexShrink: 0 }}>
                                <img 
                                    src="/avatar/memo_9.png" 
                                    alt="Admin Support" 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                <div style={{ position: "absolute", bottom: "1px", right: "1px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981", border: "2px solid #ffffff" }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#181d26" }}>Admin Support</span>
                                <span style={{ fontSize: "10px", color: "#78716c", lineHeight: 1.4 }}>
                                    Ada yang bisa kami bantu? Tulis pesan di bawah untuk chat langsung di WA.
                                </span>
                            </div>
                        </div>

                        {/* Input & Form Section */}
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#ffffff" }}>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ketik pesan Anda di sini..."
                                rows={2}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    fontSize: "12px",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e5e5",
                                    outline: "none",
                                    resize: "none",
                                    fontFamily: "inherit",
                                    color: "#333840",
                                    transition: "border-color 150ms ease"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#788069"}
                                onBlur={(e) => e.target.style.borderColor = "#e5e5e5"}
                            />

                            <button 
                                onClick={handleSend}
                                style={{
                                    width: "100%",
                                    height: "40px",
                                    borderRadius: "8px",
                                    backgroundColor: "#00a884", // Pure WhatsApp premium green
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "11px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    border: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(0, 168, 132, 0.2)",
                                    transition: "all 150ms ease"
                                }}
                            >
                                <WhatsAppIcon size={14} />
                                <span>Kirim via WhatsApp</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button: Minimal Round Floating Icon */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: "#00a884", // Official WA Green color
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 8px 24px rgba(0, 168, 132, 0.3)",
                    cursor: "pointer",
                    zIndex: 10000,
                    position: "relative"
                }}
            >
                <WhatsAppIcon size={24} />
                {!isOpen && (
                    <span 
                        style={{ 
                            position: "absolute", 
                            top: "2px", 
                            right: "2px", 
                            width: "10px", 
                            height: "10px", 
                            borderRadius: "50%", 
                            backgroundColor: "#ef4444", 
                            border: "2px solid #ffffff",
                            animation: "pulse 2s infinite" 
                        }} 
                    />
                )}
            </motion.button>
        </div>
    );
}
