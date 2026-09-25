import React, { useState } from "react";
import { KeyRound, Clock, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import styles from "./SecurityPreferences.module.css";

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
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Section 1: Password Policy */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.iconBox}>
                            <KeyRound size={18} color="#0f172a" />
                        </div>
                        <div>
                            <h4 className={styles.sectionTitle}>Kebijakan Kata Sandi (Password Policy)</h4>
                            <p className={styles.sectionSubtitle}>Standar keamanan kredensial akun pengguna dan staf properti.</p>
                        </div>
                    </div>

                    <div className={styles.contentRow}>
                        <div className={styles.gridTwoCol}>
                            <div>
                                <label className={styles.fieldLabel}>
                                    Masa Berlaku Password (Hari)
                                </label>
                                <select 
                                    className={styles.selectInput}
                                    value={preferences.passwordExpiryDays}
                                    onChange={(e) => setPreferences({ ...preferences, passwordExpiryDays: e.target.value })}
                                >
                                    <option value="30">30 Hari (Sangat Ketat)</option>
                                    <option value="60">60 Hari</option>
                                    <option value="90">90 Hari (Standar Hotel)</option>
                                    <option value="180">180 Hari</option>
                                    <option value="0">Tidak Pernah Kedaluwarsa</option>
                                </select>
                            </div>

                            <div>
                                <label className={styles.fieldLabel}>
                                    Batas Percobaan Login Gagal
                                </label>
                                <select 
                                    className={styles.selectInput}
                                    value={preferences.lockoutAttempts}
                                    onChange={(e) => setPreferences({ ...preferences, lockoutAttempts: e.target.value })}
                                >
                                    <option value="3">3 Kali Percobaan</option>
                                    <option value="5">5 Kali Percobaan (Rekomendasi)</option>
                                    <option value="10">10 Kali Percobaan</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Section 2: Session & Authentication */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.iconBox}>
                            <Clock size={18} color="#0f172a" />
                        </div>
                        <div>
                            <h4 className={styles.sectionTitle}>Batas Waktu Sesi (Session Idle Timeout)</h4>
                            <p className={styles.sectionSubtitle}>Otomatis logout saat terminal atau browser ditinggalkan tidak aktif.</p>
                        </div>
                    </div>

                    <div className={styles.contentRow}>
                        <select 
                            className={styles.selectInput}
                            style={{ maxWidth: "320px" }}
                            value={preferences.idleTimeoutMinutes}
                            onChange={(e) => setPreferences({ ...preferences, idleTimeoutMinutes: e.target.value })}
                        >
                            <option value="15">15 Menit (Terminal Publik / Kasir)</option>
                            <option value="30">30 Menit (Standar Back-Office)</option>
                            <option value="60">60 Menit</option>
                            <option value="120">2 Jam</option>
                        </select>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Section 3: Geolocation Tracking & Security */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.iconBox}>
                            <MapPin size={18} color="#0f172a" />
                        </div>
                        <div>
                            <h4 className={styles.sectionTitle}>Pelacakan Geografis & Anomali Kota</h4>
                            <p className={styles.sectionSubtitle}>Peringatan otomatis saat akun staf diakses dari kota atau negara yang tidak wajar.</p>
                        </div>
                    </div>

                    <div className={styles.contentRow}>
                        <label className={styles.checkboxLabel}>
                            <input 
                                type="checkbox"
                                className={styles.checkboxInput}
                                checked={preferences.geoAnomalyAlert}
                                onChange={(e) => setPreferences({ ...preferences, geoAnomalyAlert: e.target.checked })}
                            />
                            <span>Aktifkan audit IP & nama kota real-time pada setiap login perangkat</span>
                        </label>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Action button */}
                <div className={styles.footerRow}>
                    <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save size={15} />
                        {isSaving ? "Menyimpan..." : "Simpan Preferensi Keamanan"}
                    </button>
                </div>
            </div>
        </div>
    );
};
