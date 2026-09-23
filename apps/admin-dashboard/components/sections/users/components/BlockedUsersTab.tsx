import React from "react";
import { ShieldCheck, UserX, CheckCircle2 } from "lucide-react";

export const BlockedUsersTab: React.FC = () => {
    return (
        <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "64px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
            <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16a34a"
            }}>
                <CheckCircle2 size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#0f172a" }}>
                Tidak Ada Pengguna Terblokir
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b", maxWidth: "460px", lineHeight: 1.5 }}>
                Saat ini seluruh akun staf dan manajemen dalam kondisi normal. Akun yang terkunci otomatis akibat kesalahan input password berulang (brute-force protection) atau dinonaktifkan oleh administrator akan terdaftar di sini.
            </p>
        </div>
    );
};
