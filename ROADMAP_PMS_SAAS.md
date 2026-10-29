# Roadmap & Daftar Pengembangan Menuju Enterprise PMS SaaS (Tara / CRS Setara)

Dokumen ini mencatat daftar kesiapan produksi (*Pre-Flight Production Checklist*) serta daftar fitur lanjutan yang akan dikerjakan secara bertahap satu per satu untuk menyempurnakan ekosistem **Tara (PMS + Channel Manager + POS + Booking Engine + HRD + Accounting)**.

---

## Tahap 0: Pre-Flight Production Checklist (Infrastruktur & Keamanan Live)

- [x] **Audit & Remediasi 28 Celah Keamanan Aplikasi** (API Auth, Multi-Tenant Isolation, 2FA Rate-Limit, Channex Auth, POS Auth, Firestore & Storage Rules).
- [x] **Perbaikan Urutan Master Bookings Ledger (`/bookings`)** agar reservasi terbaru masuk selalu berada di urutan paling depan (`date_desc` berbasis `timestampMs`).
- [ ] **Deploy `firestore.rules` & `storage.rules` ke Firebase Production** (`firebase deploy --only firestore:rules,storage`).
- [ ] **Konfigurasi Environment Variables Produksi**:
  - Set `CHANNEX_WEBHOOK_SECRET`, `CRON_SECRET`, dan `VCC_SECURITY_PIN` di server produksi.
  - Pindahkan webhook Discord dari `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` ke variabel khusus server.
  - Rotasi kredensial/API key yang pernah digunakan di environment lokal.
- [ ] **Verifikasi Server-Side Cloudflare Turnstile** pada endpoint login sebelum autentikasi diproses.
- [ ] **Penjadwalan Cron Job Otomatis `/api/channex/pull-feed`** (setiap 5–10 menit) sebagai fallback apabila webhook OTA tertunda.
- [ ] **Aktivasi Automated Backup Firestore (PITR / Daily Cloud Storage Export)**.

---

## Tahap 1: Front Office & PMS Core (Prioritas Utama Operasional Hotel)

### 1.1 Smart Auto-Room Assignment (Alokasi Nomor Kamar Fisik Otomatis)
- **Status:** Selesai Diterapkan `[x]`
- **Implementasi:**
  - [x] **Audit Ketersediaan Kamar Fisik Real-time**: Saat booking baru masuk dari OTA via [syncService.ts](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/lib/channex/syncService.ts), sistem memeriksa okupansi seluruh tanggal menginap pada `daily_revenue` tanpa biaya read Firestore tambahan (*in-memory lookup*).
  - [x] **Alokasi Otomatis (First-Available)**: Reservasi otomatis ditempatkan pada nomor kamar fisik pertama yang benar-benar kosong untuk seluruh durasi menginap.
  - [x] **Deteksi Overbooking & Double Booking**: Jika kapasitas tipe kamar penuh, reservasi ditandai sebagai `UNASSIGNED / OVERBOOKING ALERT`, ketersediaan diizinkan bernilai negatif (misal `-1`, `-2`), dan badge peringatan kontras tinggi muncul di Master Bookings Ledger serta kalender.
  - [x] **Atomic Room Reassignment API**: Endpoint `/api/bookings/assign-room` memindahkan kamar tamu dengan satu operasi batch write yang konsisten di semua tanggal menginap.

### 1.2 Interactive Calendar Tape Chart (Room Rack Visual)
- **Status:** Fitur Inti Selesai Diterapkan `[x]` (Minor lanjutan: OOO/OOS)
- **Implementasi:**
  - [x] **Sub-baris Kamar Fisik (Desktop & Mobile)**: Menampilkan baris kamar fisik per nomor kamar (`Room 8`, `Room 9`) di bawah header tipe kamar pada `/rate-inventory?module=front-office`.
  - [x] **Merged Stay Span (`colSpan`)**: Reservasi berturut-turut (*multi-night stay* / *extend*) di kamar yang sama otomatis digabungkan membentang menjadi satu kartu dengan badge durasi menginap (`2 NIGHTS`, `3 NIGHTS`).
  - [x] **Diferensiasi Warna & Standar Terminologi PMS**: Warna kontras tinggi membedakan `Vacant` (Soft Mint Emerald `#f0fdf4`), `Occupied` (Royal Sapphire `#eff6ff`), dan `Conflict / Overbooked` (Alert Rose `#fff1f2`).
  - [x] **Logo Channel Mandiri & Anti-Truncate**: Logo resmi OTA (Traveloka, Booking.com, Agoda, Tiket.com, Walk-in) tampil bersih tanpa teks samping, kolom kiri diperlebar ke `285px`, dan nama tamu dapat membungkus utuh tanpa terpotong.
  - [x] **Modal Alokasi Kamar Cepat**: Klik pada slot kamar terisi langsung membuka dialog alokasi kamar (*Reassign Room*) dengan status ketersediaan kamar lain secara *live*.
  - [ ] **Blokir Kamar Sementara (OOO / OOS / House Use)**: Penandaan kamar dalam perbaikan (*Out of Order*) atau *Out of Service* yang otomatis mengurangi allotment ketersediaan ke Channex.

### 1.3 Integrated Guest Folio ("Post to Room" dari POS ke Tagihan Kamar)
- **Masalah Saat Ini:** Tagihan restoran (POS Port 3001) dan tagihan kamar (FO Port 3000) belum tergabung dalam satu akun tagihan tamu (*Master Guest Folio*).
- **Target Implementasi:**
  - Menambahkan metode pembayaran **"Charge to Room / Masuk Kamar"** di kasir POS dan Guest Self-Order dengan memilih nomor kamar tamu yang sedang *In-House*.
  - Menampilkan rincian tagihan tambahan (F&B, Laundry, Minibar, Early Check-in/Late Check-out fee, Deposit) di modal detail booking FO.
  - Cetak **Single Master Invoice / Folio Checkout** gabungan saat tamu *Check-Out*.

### 1.4 Night Audit & End-of-Day Financial Lock (Tutup Buku Harian)
- **Masalah Saat Ini:** Transaksi pada tanggal yang sudah lewat masih bisa diedit oleh staf FO biasa.
- **Target Implementasi:**
  - Proses **Night Audit** harian yang memverifikasi seluruh kamar *Arrivals*, *Departures*, dan *In-House*, lalu mengunci tanggal bisnis tersebut.
  - Perubahan pada tanggal yang sudah melewati *Night Audit* wajib menggunakan otorisasi Finance/GM (*Adjustment Entry*).

---

## Tahap 2: Booking Engine & Guest Self-Ordering (Peningkatan Konversi & Pembayaran)

### 2.1 Integrasi Payment Gateway Otomatis (Midtrans / Xendit)
- **Masalah Saat Ini:** Pembayaran di Landing Page (Port 3002) dan Guest Self-Order (`/self-order/[hotelCode]`) masih menggunakan transfer manual + unggah foto bukti bayar.
- **Target Implementasi:**
  - Integrasi pembayaran instan **QRIS Dinamis, Virtual Account (BCA, Mandiri, BNI, BRI), E-Wallet, dan Kartu Kredit**.
  - Webhook pembayaran otomatis mengubah status reservasi/pesanan menjadi `LUNAS`, mengirim e-Voucher resmi ke WhatsApp & Email tamu, serta memotong allotment kamar di Channex.

### 2.2 Promo Engine, Kode Voucher & Strike-Through Pricing
- **Target Implementasi:**
  - Pembuatan kode voucher diskon (misal `DIRECT15`, `WEEKENDDEAL`), paket *early bird*, dan *last-minute deal* di CPanel.
  - Menampilkan perbandingan harga OTA vs harga Direct Website (*Best Rate Guarantee*) untuk mendorong pemesanan langsung tanpa komisi OTA.

---

## Tahap 3: POS, F&B & Inventory Management (Kontrol HPP Akurat)

### 3.1 Resep Menu (Bill of Materials / BOM) & Auto-Deduct Stok Gudang
- **Masalah Saat Ini:** Penjualan menu di POS belum secara otomatis memotong stok bahan baku di modul Purchasing/Inventory berdasarkan takaran resep.
- **Target Implementasi:**
  - Menghubungkan setiap produk POS dengan komposisi bahan baku (`items` gudang/dapur) beserta takarannya (gram/ml/pcs).
  - Otomatis memotong stok saat pesanan POS selesai dan menghitung HPP (*Food & Beverage Cost*) aktual secara *real-time* ke modul P&L.

### 3.2 Split Bill, Pindah/Gabung Meja & Void PIN Otorisasi
- **Target Implementasi:**
  - Fitur *Split Bill* (pisah bayar per item atau bagi rata nominal) di layar kasir LexuPOS.
  - Fitur pindah meja (*Move Table*) dan gabung meja (*Merge Table*) untuk pesanan aktif (`pos_held_orders`).

---

## Tahap 4: Otomasi SaaS B2B & Multi-Property (Superadmin)

### 4.1 Self-Service Subscription Renewal (Auto-Billing & Auto-Unsuspend)
- **Masalah Saat Ini:** Saat langganan hotel jatuh tempo dan terkunci oleh `<BillingSuspendedModal />`, perpanjangan masih dikonfirmasi manual oleh Superadmin.
- **Target Implementasi:**
  - Tombol **"Bayar Perpanjangan Langganan (QRIS / Virtual Account)"** langsung di dalam `<BillingSuspendedModal />` dan halaman Billing Partner.
  - Aktivasi ulang instan (`active: true` & perpanjangan `nextDueDate` otomatis) beserta penerbitan faktur lunas otomatis begitu webhook pembayaran diterima.

