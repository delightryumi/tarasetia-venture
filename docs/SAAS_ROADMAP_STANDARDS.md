# 🚀 Tara CRS & POS: Roadmap Pengembangan Standar SaaS Internasional

Dokumen ini merangkum pencapaian arsitektur keamanan enterprise yang telah diselesaikan serta peta jalan (*roadmap*) fitur standar SaaS internasional untuk pengembangan berkelanjutan Tara CRS & POS.

---

## 🛡️ Bagian 1: Pencapaian Arsitektur Keamanan & Pemantauan (Telah Selesai)

### 1. Keamanan Autentikasi 2FA (Google Authenticator / TOTP RFC 6238)
* **Kriptografi Murni Tanpa Biaya**: Menggunakan native HMAC-SHA1 dan Base32 tanpa dependensi pihak ketiga berbayar.
* **Pendaftaran Wajib (Mandatory Enrollment)**: Pengguna yang belum memiliki 2FA diarahkan secara mulus untuk melakukan scan QR saat pertama kali login.
* **Trusted Device**: Fitur token kepercayaan perangkat 30 hari untuk kenyamanan staf tanpa mengurangi standar keamanan.
* **Pro UI Modal**: Antarmuka modular CSS responsif tanpa tombol terpotong pada semua resolusi layar.
* **Aksesibilitas Global**: Menu 2FA terpasang di Header `/select-module`, Widget Status Global, dan Mobile Navigation Drawer.

### 2. Global Audit Log & Security Ledger
* **Pencatatan Aktivitas Bisnis**: Merekam transaksi POS/PMS, void kasir, modifikasi harga kamar, dan event keamanan 2FA.
* **Modular UI**: Halaman visual mandiri di `/audit-logs?module=cpanel` dengan filter properti, tanggal, dan pencarian.
* **Immutabilitas Database**: Dilindungi aturan `firestore.rules` agar riwayat audit log tidak dapat diubah atau dihapus oleh pihak mana pun.

### 3. Sentry.io Crash Monitoring ($0 Free Forever)
* **Integrasi Next.js 15**: Dikonfigurasi penuh di client, server API, edge middleware, dan `instrumentation.ts`.
* **Zero Firebase Cost**: Seluruh telemetri error dikirim ke cloud Sentry tanpa membebani kuota write/read Firestore database Anda.
* **Visual Source Maps & Breadcrumbs**: Pelacakan baris kode asli dan histori interaksi pengguna sebelum terjadinya error.

### 4. Notifikasi Real-time ke Discord
* **Discord Alert Engine**: Modul internal pengirim embed kartu notifikasi langsung ke channel Discord teknis.
* **Error Boundary Global**: Otomatis menangkap crash render halaman di browser dan mengirimkannya ke Sentry & Discord dalam hitungan detik.
* **Halaman Diagnostik**: Tersedia di `/sentry-debug` untuk pengujian 1-klik.

---

## 🌐 Bagian 2: Rencana Fitur Standar SaaS Internasional (Next Milestones)

Diadaptasi dari standar produk SaaS enterprise global (*Mews, Cloudbeds, Toast POS, Stripe, dan Vercel*):

### Fase 1: Efisiensi Biaya & Performa Database (Cost Optimization)
1. **Public Caching Layer (Landing Page Port 3001)**:
   * Mengimplementasikan ISR (*Incremental Static Regeneration*) atau Stale-While-Revalidate untuk data tipe kamar, fasilitas, dan galeri.
   * **Target**: Menjamin kuota Firebase Spark Plan tetap 100% aman (Rp 0) meskipun trafik tamu mencapai 50.000+ kunjungan/bulan.
2. **Optimasi Real-time Listener POS (Port 3002)**:
   * Pembatasan rentang waktu (`where("createdAt", ">=", startOfDay)`) dan batas dokumen (`limit(50)`) pada query KDS dan Kasir.

### Fase 2: Tata Kelola Sesi & Kepatuhan Keamanan (Session & Access Control)
1. **Active Sessions Manager (Daftar Perangkat Aktif)**:
   * Menampilkan daftar perangkat staf yang sedang login (Tipe browser, IP address, waktu login).
   * Tombol darurat: *"Logout dari semua perangkat lain"* untuk memutus sesi staf dari jarak jauh.
2. **Matriks Hak Akses Kustom (Custom Granular RBAC)**:
   * Memungkinkan pemilik hotel membuat peran khusus (misal: *Supervisor F&B*, *Night Auditor*) dengan izin checklist granular (batasan diskon kasir, izin void, visibilitas laporan omset).

### Fase 3: Integrasi Eksternal & Portabilitas Data (Developer & Data Portability)
1. **Developer API Keys & Outbound Webhooks**:
   * Fasilitas bagi hotel untuk membuat API Key mereka sendiri guna menghubungkan data reservasi ke software akuntansi eksternal (*Xero*, *Jurnal.id*, atau sistem ERP kustom).
2. **1-Click Universal Backup & Excel Export**:
   * Ekspor otomatis dan instan untuk seluruh Laporan Keuangan, Reservasi Tamu, Rekap Kasir, dan Audit Log ke dalam format Excel (.xlsx) dan CSV.

### Fase 4: Monetisasi & Multi-Tenancy SaaS (Subscription Management)
1. **Tenant Subscription & Invoicing Engine**:
   * Manajemen paket langganan hotel (*Starter*, *Pro*, *Enterprise*) dengan sistem penagihan otomatis via Payment Gateway (*Midtrans / Xendit Recurring*).
