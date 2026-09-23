import React, { useState } from "react";
import { ShieldCheck, KeyRound, Clock, Smartphone, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

export const SecurityPreferencesTab: React.FC = () => {
    const [preferences, setPreferences] = useState({
        passwordExpiryDays: "90",
        idleTimeoutMinutes: "30",
        requireSpecialChars: true,
        enforceMfaAdmin: true,
        geoAnomalyAlert: true,
        lockoutAttempts: "5"
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Kebijakan keamanan sistem berhasil diperbarui.");
        }, 500);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}>
                {/* Section 1: Password Policy */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ padding: "6px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <KeyRound size={18} color="#0f172a" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Kebijakan Kata Sandi (Password Policy)</h4>
                            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Standar keamanan kredensial akun pengguna dan staf properti.</p>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", paddingLeft: "36px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                                Masa Berlaku Password (Hari)
                            </label>
                            <select 
                                value={preferences.passwordExpiryDays}
                                onChange={(e) => setPreferences({ ...preferences, passwordExpiryDays: e.target.value })}
                                style={{ width: "100%", height: "36px", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 10px", fontSize: "13px", background: "#ffffff" }}
                            >
                                <option value="30">30 Hari (Sangat Ketat)</option>
                                <option value="60">60 Hari</option>
                                <option value="90">90 Hari (Standar Hotel)</option>
                                <option value="180">180 Hari</option>
                                <option value="0">Tidak Pernah Kedaluwarsa</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                                Batas Percobaan Login Gagal
                            </label>
                            <select 
                                value={preferences.lockoutAttempts}
                                onChange={(e) => setPreferences({ ...preferences, lockoutAttempts: e.target.value })}
                                style={{ width: "100%", height: "36px", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 10px", fontSize: "13px", background: "#ffffff" }}
                            >
                                <option value="3">3 Kali Percobaan</option>
                                <option value="5">5 Kali Percobaan (Rekomendasi)</option>
                                <option value="10">10 Kali Percobaan</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ height: "1px", background: "#f1f5f9" }} />

                {/* Section 2: Session & Authentication */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ padding: "6px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <Clock size={18} color="#0f172a" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Batas Waktu Sesi (Session Idle Timeout)</h4>
                            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Otomatis logout saat terminal atau browser ditinggalkan tidak aktif.</p>
                        </div>
                    </div>

                    <div style={{ paddingLeft: "36px" }}>
                        <select 
                            value={preferences.idleTimeoutMinutes}
                            onChange={(e) => setPreferences({ ...preferences, idleTimeoutMinutes: e.target.value })}
                            style={{ maxWidth: "320px", width: "100%", height: "36px", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 10px", fontSize: "13px", background: "#ffffff" }}
                        >
                            <option value="15">15 Menit (Terminal Publik / Kasir)</option>
                            <option value="30">30 Menit (Standar Back-Office)</option>
                            <option value="60">60 Menit</option>
                            <option value="120">2 Jam</option>
                        </select>
                    </div>
                </div>

                <div style={{ height: "1px", background: "#f1f5f9" }} />

                {/* Section 3: Geolocation Tracking & Security */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ padding: "6px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <MapPin size={18} color="#0f172a" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Pelacakan Geografis & Anomali Kota</h4>
                            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Peringatan otomatis saat akun staf diakses dari kota atau negara yang tidak wajar.</p>
                        </div>
                    </div>

                    <div style={{ paddingLeft: "36px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#1e293b", cursor: "pointer" }}>
                            <input 
                                type="checkbox"
                                checked={preferences.geoAnomalyAlert}
                                onChange={(e) => setPreferences({ ...preferences, geoAnomalyAlert: e.target.checked })}
                                style={{ width: "16px", height: "16px", accentColor: "#0f172a", cursor: "pointer" }}
                            />
                            <span>Aktifkan audit IP & nama kota real-time pada setiap login perangkat</span>
                        </label>
                    </div>
                </div>

                <div style={{ height: "1px", background: "#f1f5f9" }} />

                {/* Action button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            height: "38px",
                            padding: "0 20px",
                            borderRadius: "6px",
                            background: "#0f172a",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <Save size={15} />
                        {isSaving ? "Menyimpan..." : "Simpan Preferensi Keamanan"}
                    </button>
                </div>
            </div>
        </div>
    );
};
