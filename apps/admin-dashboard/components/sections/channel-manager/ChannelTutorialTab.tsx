"use client";

import React, { useState } from "react";
import {
    Compass,
    CheckCircle2,
    ShieldCheck,
    Layers,
    Building2,
    HelpCircle,
    Check,
    Copy,
    Sparkles,
    AlertTriangle,
    Key,
    Lock,
    Terminal,
    Zap,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import styles from "./ChannelTutorialTab.module.css";
import { toast } from "sonner";

interface Props {
    onNavigateTab: (tabId: any) => void;
    activeHotelCode?: string;
    activeHotelName?: string;
}

export const ChannelTutorialTab: React.FC<Props> = ({
    onNavigateTab,
    activeHotelCode = "1",
    activeHotelName = "Setara Demo Partner"
}) => {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
        "1-1": true,
        "1-2": true,
        "2-1": true
    });
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleTask = (taskId: string) => {
        setCompletedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const STEPS = [
        {
            num: 1,
            title: "Aktivasi Kredensial & Webhook Distribusi",
            subtitle: "Dapatkan API Key & daftarkan Webhook",
            badge: "Langkah 1: Akun & Kredensial",
            desc: "Konfigurasikan Production API Key, Property ID, dan daftarkan Webhook URL My Tara untuk menerima reservasi OTA otomatis secara instan."
        },
        {
            num: 2,
            title: "Pilot Rollout (1 Hotel, 6 OTA Utama)",
            subtitle: "Pilih hotel unggulan & hubungkan extranet",
            badge: "Langkah 2: Strategi Pilot Hotel",
            desc: "Fokuskan pada 1 hotel pilot flagship dengan 6 OTA terbesar di Indonesia untuk memetakan kategori kamar & struktur tarif (Rate Plans)."
        },
        {
            num: 3,
            title: "Protokol Pengujian Live (End-to-End)",
            subtitle: "Uji ARI, Booking Refundable, & Batal",
            badge: "Langkah 3: Uji Produksi Live",
            desc: "Eksekusi 3 tes langsung di lapangan: Ubah harga kamar (cek di aplikasi OTA), buat 1 booking asli (Free Cancellation), lalu batalkan untuk memverifikasi auto-refund & stok kembali."
        },
        {
            num: 4,
            title: "Masa Stabilisasi & Monitoring (3-7 Hari)",
            subtitle: "Pantau transaksi riil & audit logs",
            badge: "Langkah 4: Operasional Awal",
            desc: "Biarkan hotel pilot melayani tamu OTA nyata selama beberapa hari. Pantau log sinkronisasi di tab Transmission Logs dan pastikan kasir Front Office lancar membaca tagihan."
        },
        {
            num: 5,
            title: "Ekspansi Bertahap ke Seluruh Properti",
            subtitle: "Rollout bertahap 5 hotel per batch",
            badge: "Langkah 5: Skala Penuh (Scale-Up)",
            desc: "Setelah hotel pilot terbukti 100% tanpa kendala, tambahkan hotel lainnya secara bertahap (5 hotel per batch) dengan aman dan terukur."
        }
    ];

    const MAJOR_OTAS = [
        {
            name: "Booking.com",
            icon: "🅱️",
            commission: "15% (Property / VCC)",
            extranetName: "Booking.com Extranet",
            steps: [
                "Masuk ke admin.booking.com > menu 'Account' > 'Channel Manager'.",
                "Klik 'Connect your channel manager' dan hubungkan penyedia Channel Manager resmi.",
                "Pilih opsi koneksi 2-arah (Rates, Availability, & Bookings).",
                "Konfirmasi aktivasi koneksi saluran."
            ]
        },
        {
            name: "Agoda",
            icon: "🅰️",
            commission: "17% (Agoda Collect / YCS)",
            extranetName: "Agoda YCS Extranet",
            steps: [
                "Masuk ke ycs.agoda.com > menu 'Settings' > 'Channel Manager'.",
                "Pilih opsi koneksi Channel Manager terintegrasi.",
                "Pilih tipe integrasi Full ARI & Booking Retrieval.",
                "Simpan perubahan dan petakan Room Type ID di tab Pemetaan Saluran My Tara."
            ]
        },
        {
            name: "Traveloka",
            icon: "🕊️",
            commission: "18% (TERA Extranet)",
            extranetName: "TERA Traveloka",
            steps: [
                "Masuk ke tera.traveloka.com > menu 'Property Profile' > 'Channel Manager'.",
                "Ajukan aktivasi Channel Manager ke Market Coordinator (MC) atau pilih di daftar penyedia.",
                "Petakan Room ID dan Rate Plan ID sesuai kode di My Tara.",
                "Status akan aktif setelah diverifikasi oleh tim Traveloka."
            ]
        },
        {
            name: "Tiket.com",
            icon: "🎫",
            commission: "15% (Tiket Extranet)",
            extranetName: "Tiket.com Extranet",
            steps: [
                "Masuk ke extranet.tiket.com > menu 'Channel Manager'.",
                "Hubungkan properti hotel Anda ke integrasi Channel Manager 2-Arah.",
                "Pastikan allotment dan base price sudah tersinkronisasi via Full ARI Sync.",
                "Aktifkan koneksi reservasi masuk."
            ]
        },
        {
            name: "Expedia Partner",
            icon: "✈️",
            commission: "18% (Expedia Collect / Hotel Collect)",
            extranetName: "Expedia Partner Central",
            steps: [
                "Masuk ke partnercentral.expedia.com > 'Rooms and Rates' > 'Expedia Connectivity'.",
                "Pilih sistem koneksi 2-Way Channel Manager.",
                "Pilih koneksi 2-arah (Availability & Rates + Booking Retrieval).",
                "Konfirmasi perjanjian koneksi."
            ]
        },
        {
            name: "Airbnb",
            icon: "🏠",
            commission: "14% - 15% (Host-Only)",
            extranetName: "Airbnb Host Console",
            steps: [
                "Otentikasi langsung via OAuth di tab Console SSO / Saluran Terhubung.",
                "Login akun Airbnb Host dan berikan izin integrasi Channel Manager.",
                "Petakan listing kamar ke kategori tipe kamar My Tara.",
                "Harga dan kalender ketersediaan akan langsung terhubung real-time."
            ]
        }
    ];

    const FAQS = [
        {
            q: "Bagaimana cara membaca nominal booking: apakah tamu bayar Gross atau Net?",
            a: "Tergantung model transaksi OTA: Untuk 'Property Collect' (Bayar di Hotel), tamu membayar 100% GROSS di kasir hotel, lalu OTA menagih komisi bulanan via Tax Invoice. Untuk 'Channel Collect' (VCC/Agoda Collect), tamu sudah bayar Gross di aplikasi, dan hotel menggesek Virtual Card yang saldonya sudah 100% NET TO HOTEL. Untuk Wholesaler (Hotelbeds), harga yang masuk sudah NET."
        },
        {
            q: "Berapa lama jeda waktu pembaruan harga atau ketersediaan dari My Tara sampai ke OTA?",
            a: "Sinkronisasi ARI bersifat instant push melalui koneksi 2-Way Real-time. Biasanya perubahan harga atau stop-sell sudah aktif di extranet OTA dalam waktu 1 hingga 3 detik setelah Anda menekan tombol simpan atau mengubah ketersediaan di PMS."
        },
        {
            q: "Bagaimana cara melakukan tes booking asli tanpa merugi?",
            a: "Gunakan opsi 'Free Cancellation' (Gratis Pembatalan). Buat reservasi untuk tanggal 2 minggu ke depan, bayar normal, tunggu hingga booking masuk ke My Tara dan WA berdering, verifikasi kamar terpotong, lalu batalkan pesanan tersebut di aplikasi OTA sebelum batas waktu pembatalan gratis berakhir. Uang Anda akan di-refund 100% oleh OTA."
        },
        {
            q: "Apakah saat komputer hotel mati atau internet mati, booking OTA tetap bisa masuk?",
            a: "Ya! Sistem My Tara berbasis cloud (serverless Next.js & Google Firestore). Webhook dari saluran distribusi diterima langsung oleh cloud server 24/7. Notifikasi WhatsApp juga otomatis terkirim langsung ke HP Owner/GM meskipun komputer kasir hotel sedang offline."
        }
    ];

    const currentWebhookUrl = typeof window !== "undefined"
        ? `${window.location.origin}/api/channex/webhook`
        : "https://your-crs-domain.com/api/channex/webhook";

    return (
        <div className={styles.container}>
            {/* 1. Hero Header Banner (Soft Light Modern Aesthetic) */}
            <div className={styles.heroCard}>
                <div className={styles.heroBadge}>
                    <Compass size={13} />
                    <span>Peta Alur &amp; Tutorial Go-Live Produksi</span>
                </div>
                <h2 className={styles.heroTitle}>
                    Panduan Lengkap Implementasi &amp; Distribusi Channel Manager
                </h2>
                <p className={styles.heroDesc}>
                    Ikuti strategi <strong>Pilot Rollout 5 Tahap</strong> yang telah terbukti di industri perhotelan. Mulai dari aktivasi 1 hotel pilot dengan 6 OTA utama, verifikasi end-to-end dengan tes booking refundable, hingga peluncuran massal ke seluruh hotel jaringan Anda dengan risiko nol.
                </p>

                <div className={styles.heroMetrics}>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconBlue}`}>
                            <Building2 size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>1 Hotel Pilot</div>
                            <div className={styles.metricLbl}>Fase Uji Awal (Canary Release)</div>
                        </div>
                    </div>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconCyan}`}>
                            <Layers size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>6 OTA Utama</div>
                            <div className={styles.metricLbl}>Booking, Agoda, Traveloka, Tiket, Expedia, Airbnb</div>
                        </div>
                    </div>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconEmerald}`}>
                            <ShieldCheck size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>8 / 8 Lulus</div>
                            <div className={styles.metricLbl}>Standar Sertifikasi Distribusi Global &amp; OTA</div>
                        </div>
                    </div>
                    <div className={styles.metricItem}>
                        <div className={`${styles.metricIconCircle} ${styles.iconIndigo}`}>
                            <Sparkles size={19} />
                        </div>
                        <div>
                            <div className={styles.metricVal}>Multi-Hotel</div>
                            <div className={styles.metricLbl}>Target Ekspansi Skala Penuh</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Stepper Timeline Navigation (5 Steps) */}
            <div className={styles.stepperNav}>
                {STEPS.map((step) => {
                    const isActive = currentStep === step.num;
                    const isDone = currentStep > step.num;
                    return (
                        <div
                            key={step.num}
                            onClick={() => setCurrentStep(step.num)}
                            className={`${styles.stepTab} ${isActive ? styles.stepTabActive : ""}`}
                        >
                            <div className={styles.stepHeaderRow}>
                                <div className={`${styles.stepNumberCircle} ${isActive ? styles.stepNumberActive : isDone ? styles.stepNumberDone : ""}`}>
                                    {isDone ? <Check size={13} strokeWidth={3} /> : step.num}
                                </div>
                                <span className={styles.stepTabSubtitle}>Tahap {step.num}</span>
                            </div>
                            <div className={styles.stepTabTitle}>{step.title}</div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Detail Konten Tahap Aktif */}
            <div className={styles.stepDetailCard}>
                <div className={styles.stepDetailHeader}>
                    <div>
                        <span className={styles.stepBadgePill}>
                            <Sparkles size={12} />
                            <span>{STEPS[currentStep - 1].badge}</span>
                        </span>
                        <h3 className={styles.stepDetailTitle}>{STEPS[currentStep - 1].title}</h3>
                        <p className={styles.stepDetailDesc}>{STEPS[currentStep - 1].desc}</p>
                    </div>

                    <div className={styles.actionBtnsRow}>
                        {currentStep === 1 && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("golive")}
                                className={styles.btnActionPrimary}
                            >
                                <Lock size={14} />
                                <span>Buka Tab Kredensial &amp; Go-Live &rarr;</span>
                            </button>
                        )}
                        {currentStep === 2 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("mapping")}
                                    className={styles.btnActionPrimary}
                                >
                                    <Key size={14} />
                                    <span>Buka Pemetaan Saluran &rarr;</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("catalog")}
                                    className={styles.btnActionSecondary}
                                >
                                    <Layers size={14} />
                                    <span>Katalog 68+ OTA &rarr;</span>
                                </button>
                            </>
                        )}
                        {currentStep === 3 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("sandbox")}
                                    className={styles.btnActionPrimary}
                                >
                                    <Zap size={14} />
                                    <span>Buka Test Runner Sandbox &rarr;</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onNavigateTab("logs")}
                                    className={styles.btnActionSecondary}
                                >
                                    <Terminal size={14} />
                                    <span>Cek Transmission Logs &rarr;</span>
                                </button>
                            </>
                        )}
                        {currentStep === 4 && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("logs")}
                                className={styles.btnActionPrimary}
                            >
                                <Terminal size={14} />
                                <span>Pantau Live Transmission Logs &rarr;</span>
                            </button>
                        )}
                        {currentStep === 5 && (
                            <button
                                type="button"
                                onClick={() => onNavigateTab("mapping")}
                                className={styles.btnActionPrimary}
                            >
                                <Building2 size={14} />
                                <span>Kelola Hotel Berikutnya &rarr;</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* STEP 1 DETAIL */}
                {currentStep === 1 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <CheckCircle2 size={16} className={styles.sectionIcon} />
                                <span>Daftar Checklist Tindakan Tahap 1:</span>
                            </div>
                            <div className={styles.checklistGrid}>
                                <div
                                    onClick={() => toggleTask("1-1")}
                                    className={`${styles.checkItem} ${completedTasks["1-1"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-1"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-1"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-1"] ? styles.checkTitleDone : ""}`}>
                                            1. Aktivasi Kredensial &amp; Property Binding
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Pastikan akun integrasi hotel Anda telah disiapkan. Salin Production API Key dan Property GUID untuk mengaktifkan sinkronisasi 2-arah.
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("1-2")}
                                    className={`${styles.checkItem} ${completedTasks["1-2"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-2"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-2"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-2"] ? styles.checkTitleDone : ""}`}>
                                            2. Konfigurasikan Production API Key
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Di menu kredensial, masukkan API Key produksi dan Property ID hotel Anda untuk menghubungkan jalur transmisi ARI.
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("1-3")}
                                    className={`${styles.checkItem} ${completedTasks["1-3"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-3"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-3"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-3"] ? styles.checkTitleDone : ""}`}>
                                            3. Daftarkan Webhook Callback URL
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Daftarkan URL webhook produksi My Tara di bawah ini agar semua reservasi dari OTA otomatis masuk ke Front Office secara instan:
                                            <div className={styles.webhookRow}>
                                                <code className={styles.webhookCode}>
                                                    {currentWebhookUrl}
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(currentWebhookUrl);
                                                        toast.success("Webhook URL berhasil disalin!");
                                                    }}
                                                    className={styles.btnCopy}
                                                >
                                                    <Copy size={12} />
                                                    <span>Salin</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("1-4")}
                                    className={`${styles.checkItem} ${completedTasks["1-4"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["1-4"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["1-4"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["1-4"] ? styles.checkTitleDone : ""}`}>
                                            4. Alihkan Mode Server ke Production Live
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Buka tab <b>Kredensial API &amp; Go-Live</b> di My Tara, pastikan API Key terpasang, lalu klik tombol <b>Alihkan ke Mode Production Live</b> dan simpan.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <AlertTriangle size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Standar Distribusi:</strong> Saluran transmisi ARI My Tara telah terintegrasi dengan protokol resmi enterprise dan dilengkapi retry backoff cerdas agar transaksi reservasi masuk tidak pernah terlewat.
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 DETAIL */}
                {currentStep === 2 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Building2 size={16} className={styles.sectionIcon} />
                                <span>Panduan Menghubungkan 6 OTA Terbesar di Indonesia (Hotel Pilot: {activeHotelName}):</span>
                            </div>
                            <p className={styles.stepSubDesc}>
                                Masuk ke masing-masing extranet OTA berikut untuk menghubungkan penyedia koneksi Channel Manager:
                            </p>

                            <div className={styles.otaCardsGrid}>
                                {MAJOR_OTAS.map((ota, idx) => (
                                    <div key={idx} className={styles.otaCard}>
                                        <div className={styles.otaCardHeader}>
                                            <span className={styles.otaLogoIcon}>{ota.icon}</span>
                                            <div>
                                                <div className={styles.otaName}>{ota.name}</div>
                                                <div className={styles.otaCommission}>Est. Komisi: {ota.commission}</div>
                                            </div>
                                        </div>
                                        <div className={styles.otaPortal}>
                                            📍 Portal: {ota.extranetName}
                                        </div>
                                        <ol className={styles.otaStepsList}>
                                            {ota.steps.map((st, sIdx) => (
                                                <li key={sIdx}>{st}</li>
                                            ))}
                                        </ol>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <Sparkles size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Tips Sukses Pemetaan:</strong> Buka tab <b>Pemetaan Saluran (Mapping)</b> di My Tara. Klik <i>'Pindai Kamar &amp; Rate dari OTA'</i> untuk mengaitkan tipe kamar lokal dengan ID kamar OTA secara otomatis tanpa input manual.
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3 DETAIL */}
                {currentStep === 3 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Zap size={16} className={styles.sectionIcon} />
                                <span>3 Pengujian Lapangan Wajib (<em>End-to-End Test</em>):</span>
                            </div>

                            <div className={styles.checklistGrid}>
                                <div
                                    onClick={() => toggleTask("3-1")}
                                    className={`${styles.checkItem} ${completedTasks["3-1"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["3-1"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["3-1"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["3-1"] ? styles.checkTitleDone : ""}`}>
                                            Tes 1: Uji Live ARI Push (Perubahan Harga &amp; Kamar)
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Ubah harga kamar di My Tara (misal naikkan Rp 10.000 untuk 3 hari ke depan). Buka aplikasi Traveloka / Booking.com sebagai tamu. Pastikan dalam waktu 1–3 detik harga di aplikasi OTA sudah berubah sesuai tarif baru.
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("3-2")}
                                    className={`${styles.checkItem} ${completedTasks["3-2"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["3-2"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["3-2"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["3-2"] ? styles.checkTitleDone : ""}`}>
                                            Tes 2: Uji Pesanan Masuk Nyata (<em>Real Booking Test - Free Cancellation</em>)
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Pesan 1 kamar lewat aplikasi Agoda atau Booking.com untuk tanggal 2 minggu ke depan dengan opsi <strong>Gratis Pembatalan (Free Cancellation)</strong>.
                                            <ul className={styles.testBulletList}>
                                                <li>Pastikan webhook diterima dalam hitungan detik.</li>
                                                <li>Pastikan stok kamar di Front Office PMS otomatis berkurang 1.</li>
                                                <li>Pastikan WhatsApp Owner berdering menampilkan nominal Gross dan estimasi Net Payout.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    onClick={() => toggleTask("3-3")}
                                    className={`${styles.checkItem} ${completedTasks["3-3"] ? styles.checkItemDone : ""}`}
                                >
                                    <div className={`${styles.checkIconWrapper} ${completedTasks["3-3"] ? styles.checkIconDone : ""}`}>
                                        {completedTasks["3-3"] && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={`${styles.checkTitle} ${completedTasks["3-3"] ? styles.checkTitleDone : ""}`}>
                                            Tes 3: Uji Pembatalan Pesanan (<em>Real Cancellation Test</em>)
                                        </div>
                                        <div className={styles.checkDesc}>
                                            Batalkan pesanan uji coba tadi langsung di aplikasi OTA (uang Anda dikembalikan penuh 100% oleh OTA).
                                            <ul className={styles.testBulletList}>
                                                <li>Pastikan webhook pembatalan masuk seketika.</li>
                                                <li>Pastikan stok kamar di PMS otomatis bertambah kembali 1 (stok rilis).</li>
                                                <li>Pastikan WhatsApp pembatalan masuk ke Owner.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <ShieldCheck size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Nol Kerugian Finansial:</strong> Dengan memesan kamar berstatus <em>Free Cancellation</em>, Anda menguji sirkulasi booking &amp; pembatalan riil tanpa mengeluarkan biaya sepeser pun.
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 4 DETAIL */}
                {currentStep === 4 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Terminal size={16} className={styles.sectionIcon} />
                                <span>Aktivitas Selama Masa Stabilisasi (3 – 7 Hari):</span>
                            </div>

                            <div className={styles.checklistGrid}>
                                <div className={styles.checkItem}>
                                    <div className={styles.checkIconWrapper}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={styles.checkTitle}>1. Monitoring Rutin Transmission Logs</div>
                                        <div className={styles.checkDesc}>
                                            Buka tab <b>Transmission Logs</b> setiap pagi &amp; sore. Pastikan tidak ada pesan error merah atau peringatan <i>ACTION_REQUIRED (Unmapped Room)</i>.
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.checkItem}>
                                    <div className={styles.checkIconWrapper}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={styles.checkTitle}>2. Evaluasi Kasir &amp; Front Office Folio</div>
                                        <div className={styles.checkDesc}>
                                            Tanyakan kepada staf Front Office: Apakah status pembayaran 'Belum Bayar' (untuk Property Collect) dan 'Lunas VCC' (untuk Channel Collect) mudah dipahami dan tidak ada tamu yang tertagih dua kali.
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.checkItem}>
                                    <div className={styles.checkIconWrapper}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <div className={styles.checkContent}>
                                        <div className={styles.checkTitle}>3. Uji Coba Gesek Virtual Card (VCC)</div>
                                        <div className={styles.checkDesc}>
                                            Saat ada tamu Agoda Collect atau Booking.com Online Payment yang check-in, staf kasir membuka tab <b>PCI Card Vault</b> dengan PIN keamanan untuk menggesek saldo VCC di mesin EDC hotel.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 5 DETAIL */}
                {currentStep === 5 && (
                    <div>
                        <div className={styles.checklistSection}>
                            <div className={styles.sectionHeading}>
                                <Building2 size={16} className={styles.sectionIcon} />
                                <span>Pola Ekspansi Bertahap ke 20 Hotel Jaringan (Batch Rollout):</span>
                            </div>

                            <div className={styles.batchGrid}>
                                <div className={`${styles.batchCard} ${styles.batch1}`}>
                                    <div className={styles.batchTag1}>BATCH 1 (HARI KE 1-3)</div>
                                    <div className={styles.batchTitle}>1 Hotel Pilot Flagship</div>
                                    <div className={styles.batchDesc}>Bumi Anyom Resort (6 OTA terhubung live &amp; divalidasi)</div>
                                </div>
                                <div className={`${styles.batchCard} ${styles.batch2}`}>
                                    <div className={styles.batchTag2}>BATCH 2 (HARI KE 4-7)</div>
                                    <div className={styles.batchTitle}>+5 Hotel Tambahan</div>
                                    <div className={styles.batchDesc}>Ekspansi hotel tier 1 dengan tipe kamar sejenis</div>
                                </div>
                                <div className={`${styles.batchCard} ${styles.batch3}`}>
                                    <div className={styles.batchTag3}>BATCH 3 (MINGGU KE-2)</div>
                                    <div className={styles.batchTitle}>+7 Hotel Tambahan</div>
                                    <div className={styles.batchDesc}>Ekspansi hotel tier 2 &amp; pelatihan staf FO</div>
                                </div>
                                <div className={`${styles.batchCard} ${styles.batch4}`}>
                                    <div className={styles.batchTag4}>BATCH 4 (MINGGU KE-3)</div>
                                    <div className={styles.batchTitle}>Sisa 7 Hotel (Total 20)</div>
                                    <div className={styles.batchDesc}>Seluruh 20 hotel terhubung penuh ke 68+ OTA</div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.alertCallout}>
                            <CheckCircle2 size={18} className={styles.alertIcon} />
                            <div className={styles.alertText}>
                                <strong>Multi-Tenant Otomatis:</strong> My Tara CRS sudah dirancang multi-tenant secara murni. Setiap hotel memiliki alokasi kamar fisik, tarif dinamis, dan nomor WhatsApp Owner sendiri-sendiri tanpa risiko data bercampur.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. FAQ Tanya Jawab Kritis */}
            <div className={styles.faqSection}>
                <div className={styles.sectionHeading}>
                    <HelpCircle size={16} className={styles.sectionIcon} />
                    <span>Tanya Jawab Kritis (FAQ) Sebelum Masuk Produksi:</span>
                </div>

                <div className={styles.faqList}>
                    {FAQS.map((faq, idx) => (
                        <div key={idx} className={styles.faqItem}>
                            <div
                                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                className={styles.faqQuestion}
                            >
                                <span>{faq.q}</span>
                                {openFaq === idx ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                            </div>
                            {openFaq === idx && (
                                <div className={styles.faqAnswer}>
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
