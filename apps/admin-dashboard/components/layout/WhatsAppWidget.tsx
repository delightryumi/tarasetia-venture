"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

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
    const phoneNumber = "628112719990"; 
    const waUrl = `https://wa.me/${phoneNumber}?text=Halo%20Admin%20Bumi%20Anyom,%20saya%20butuh%20bantuan.`;

    return (
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999, fontFamily: "var(--font-geist-sans), sans-serif" }}>
            {isOpen && (
                <div
                    style={{
                        width: "220px",
                        borderRadius: "10px",
                        backgroundColor: "#ffffff",
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        boxShadow: "0 12px 36px -8px rgba(24, 29, 38, 0.12)",
                        marginBottom: "10px",
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                    }}
                >
                    {/* Upper Info Row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ position: "relative", width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)", flexShrink: 0 }}>
                                <img 
                                    src="/avatar/memo_9.png" 
                                    alt="CS Avatar" 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div style={{ position: "absolute", bottom: "0", right: "0", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981", border: "1px solid #ffffff" }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#181d26", lineHeight: 1.1 }}>CS Admin</span>
                                <span style={{ fontSize: "8px", color: "#10b981", fontWeight: 600 }}>Ready to chat</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            style={{ background: "transparent", border: "none", color: "#8c8c8c", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                        >
                            <X size={12} />
                        </button>
                    </div>

                    {/* Direct WA Action Link */}
                    <a 
                        href={waUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            height: "30px",
                            backgroundColor: "#00a884", 
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 700,
                            borderRadius: "6px",
                            textDecoration: "none",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            boxShadow: "0 4px 10px rgba(0, 168, 132, 0.15)",
                            transition: "background 150ms ease"
                        }}
                    >
                        <WhatsAppIcon size={12} />
                        <span>Chat Sekarang</span>
                    </a>
                </div>
            )}

            {/* Toggle Button: Compact Circle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#00a884", 
                    color: "#ffffff",
                    border: "none",
                    boxShadow: "0 6px 20px rgba(0, 168, 132, 0.2)",
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
                            width: "8px", 
                            height: "8px", 
                            borderRadius: "50%", 
                            backgroundColor: "#ef4444", 
                            border: "1.5px solid #ffffff",
                            animation: "pulse 2s infinite" 
                        }} 
                    />
                )}
            </button>
        </div>
    );
}
