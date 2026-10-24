# CHANNEL_MANAGER_REDESIGN.md

> **Status:** Analisis, Rencana Arsitektur & Pelaksanaan Redesign Channel Manager Berdasarkan `DESIGN.md`  
> **Tema & Filosofi:** Midday & Linear Executive Minimalist Architecture (`ENERGY 1 / RHYTHM 2 / MOTION 1`)  
> **Target:** Bebas looping text, tabel rapi dan presisi, pop-up konsisten, Full Modular CSS, dan terpisah modul Desktop & Mobile.

---

## 1. Ringkasan Kebutuhan & Temuan Audit

Sesuai instruksi pengguna dan aturan arsitektur dalam [AGENTS.md](file:///f:/WEB-SERVER/WEB/crs-setara/AGENTS.md) serta [DESIGN.md](file:///f:/WEB-SERVER/WEB/crs-setara/DESIGN.md), seluruh halaman Channel Manager (`apps/admin-dashboard/components/sections/channel-manager/`) ditata ulang agar memenuhi standar eksekutif Midday & Linear.

### Masalah Utama yang Ditemukan pada Kondisi Eksisting:
1. **Looping & Overflow Text pada Tabel:**
   - Sel tabel pada beberapa tab (seperti Matriks Paritas, Pemetaan Kamar/Rate Plan, dan Riwayat Sinkronisasi) belum menerapkan aturan ketat `white-space: nowrap`, `text-overflow: ellipsis`, dan `overflow: hidden`.
   - Angka mata uang (IDR, USD) dan kode tarif mengalami pembungkusan teks (line-wrap) saat layar menyempit, menyebabkan tinggi baris melonjak tidak seragam (*height jitter*).
   - Nilai angka belum secara konsisten menggunakan font mono tabular (`font-variant-numeric: tabular-nums`), sehingga kolom angka bergeser secara visual.

2. **Pop-up Dialog Belum Terstandarisasi:**
   - Hanya modal Pusat Notifikasi yang telah dilengkapi event listener `Escape` dan styling penuh Midday.
   - Pop-up lainnya (Modal Tambah Saluran OTA, Konfirmasi Putus/Reset Saluran, Putus Kaitan Properti Channex, Hasil Full Sync ARI, VCC Viewer, dan Modal Pajak Distribusi) masih memiliki inkonsistensi:
     - Belum semuanya menutup saat tombol `Escape` ditekan.
     - Kontainer belum menerapkan batas tinggi terisolasi (`max-height: min(92vh, 860px)`) dengan scrollbar internal yang rapi.
     - Beberapa dialog masih memiliki potensi teks berulang atau terpotong pada layar ponsel.

3. **Arsitektur Komponen Masih Monolitik (Belum Pemisahan Desktop & Mobile):**
   - Komponen tab saat ini menyatukan tampilan desktop dan mobile dalam satu file besar, menyebabkan CSS media query menumpuk dan rentan merusak layout tabel desktop ketika dibuka di perangkat mobile.
   - Wajib dipisahkan menjadi dua modul terisolasi: `*DesktopView.tsx` + `*DesktopView.module.css` untuk desktop, dan `*MobileView.tsx` + `*MobileView.module.css` untuk mobile.

---

## 2. Standar Desain Anti-Looping & Anti-Slop (Midday & Linear)

### A. Standar Tabel Anti-Looping & Tabular Ledger
Setiap tabel data dan matriks tarif wajib mematuhi aturan styling berikut:
```css
/* Aturan Universal Sel Tabel */
.tableCellText {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    line-height: 1.4;
    color: #09090b;
}

/* Sel Angka & Mata Uang */
.tableCellNumeric {
    font-family: var(--font-geist-mono, monospace);
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
    letter-spacing: -0.01em;
}

/* Kontainer Scroll Horisontal */
.tableContainer {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid #e4e4e7;
    border-radius: 10px;
    background: #ffffff;
}
```

### B. Standar Universal Pop-Up Modal
Seluruh dialog pop-up di Channel Manager wajib memiliki spesifikasi seragam:
1. **Backdrop:** Warna latar `rgba(9, 9, 11, 0.55)` dengan efek `backdrop-filter: blur(4px)`.
2. **Accessibility & Keyboard:** Event listener global untuk tombol `Escape`, klik di luar modal otomatis menutup (dengan `e.stopPropagation()` pada kartu dialog), serta atribut `role="dialog"` dan `aria-modal="true"`.
3. **Struktur Header & Tag:** Label kategori uppercase (10px, font-weight 700, letter spacing 0.08em), judul utama 16px font semi-bold, dan deskripsi ringkas 12px warna `#71717a`.
4. **Scroll Area Terisolasi:** Bagian isi (body) memiliki `overflow-y: auto` dan `flex: 1`, mencegah dialog melebihi tinggi layar (`max-height: min(90vh, 850px)`).
5. **Sticky Footer:** Informasi status properti hotel di sebelah kiri dan tombol aksi (Batal/Simpan/Tutup) di sebelah kanan.

### C. Pemisahan Modular Desktop dan Mobile
Setiap tab dan dialog dibagi menjadi:
- **Desktop View:** Master-detail split layout, tabel berdensitas tinggi, navigasi keyboard, sticky table headers.
- **Mobile View:** Card-based list, swipeable horizontally segmented pills, collapsible drawer, dan tap targets minimum 44px.

---

## 3. Inventaris 23 Tab & 7 Pop-Up Modal Channel Manager

| No | Modul / Tab | Kategori | Prioritas Batch | Rencana Pemisahan Modul |
| :--- | :--- | :--- | :---: | :--- |
| 1 | **Mapping (Saluran & Pemetaan)** | Distribusi Saluran | **Batch 1** | `ChannelMappingDesktopView` & `ChannelMappingMobileView` |
| 2 | **Matrix (Matriks Paritas Tarif)** | Distribusi Saluran | **Batch 1** | `RateParityMatrixDesktopView` & `RateParityMatrixMobileView` |
| 3 | **Catalog (Katalog Saluran OTA)** | Distribusi Saluran | **Batch 1** | Standardisasi Grid & Dialog Tambah Saluran |
| 4 | **Travel Agents (B2B Travel Agent)** | Distribusi Saluran | **Batch 2** | `TravelAgentDesktopView` & `TravelAgentMobileView` |
| 5 | **Rules (Aturan Ketersediaan & Min Stay)** | Yield & Revenue | **Batch 2** | `ChannelAvailabilityDesktopView` & `MobileView` |
| 6 | **Dynamic Pricing (Pricing Otomatis)** | Yield & Revenue | **Batch 2** | `ChannelDynamicPricingDesktopView` & `MobileView` |
| 7 | **Promotions (Flash Sale & Promo OTA)** | Yield & Revenue | **Batch 2** | `ChannelPromotionsDesktopView` & `MobileView` |
| 8 | **Google Hotels (Google Hotel Center)** | Yield & Revenue | **Batch 2** | Standardisasi Feed & Card Google Ads |
| 9 | **Content Push (Deskripsi & Foto Kamar)** | Yield & Revenue | **Batch 3** | Content Push Desktop & Mobile Views |
| 10 | **Messages (Pesan Tamu OTA)** | Komunikasi Tamu | **Batch 3** | Chat Ledger Desktop & Mobile Views |
| 11 | **Reviews (Ulasan & Reputasi OTA)** | Komunikasi Tamu | **Batch 3** | Review Card Grid Desktop & Mobile Views |
| 12 | **Payments (VCC & Settlement)** | Finansial & Booking | **Batch 3** | Financial Ledger Desktop & Mobile Views |
| 13 | **Payment Gateway (PG Midtrans/Xendit)**| Finansial & Booking | **Batch 3** | PG Desktop & Mobile Views |
| 14 | **Ekstranet Visual Channex SSO (`tab=iframe`)** | Distribusi Saluran | **Batch 3 / Prioritas User** | Selesai (100%): `ChannelExtranetDesktopView` & `ChannelExtranetMobileView` |
| 15 | **Rooms (Master Tipe Kamar PMS)** | Master Data Properti | **Batch 4** | Integrasi Room Section Desktop & Mobile |
| 16 | **Rate Plans (Master Paket Harga)** | Master Data Properti | **Selesai (100%)** | `RatePlanDesktopView` & `RatePlanMobileView` |
| 17 | **Groups (Multi-Property & Cluster)** | Master Data Properti | **Batch 4** | Multi-Property Cluster Views |
| 18 | **Tutorial (Panduan & Standar Operasional)**| Master Data Properti | **Batch 4** | SOP Guide Desktop & Mobile |
| 19 | **Sync (Live ARI Transmission Feed)** | Log & Audit | **Selesai (100%)** | `ChannelAriSyncFeedDesktopView` & `MobileView` |
| 20 | **Logs (Audit Trail & Activity Log)** | Log & Audit | **Selesai (100%)** | `ChannelActionLogsDesktopView` & `MobileView` |
| 21 | **Sandbox (API Tester & Simulator)** | Log & Audit | **Selesai (100%)** | `ChannelSandboxDesktopView` & `MobileView` |
| 22 | **Go Live & Kredensial Gateway (`tab=golive`)** | Log & Audit | **Selesai (100%)** | `ChannelCredentialsDesktopView` & `MobileView` |
| 23 | **Extranet Credentials (Kredensial OTA)** | Konfigurasi | **Selesai (100%)** | Terintegrasi dalam Kredensial Gateway & Katalog Saluran |

---

## 4. Inventaris & Status Standardisasi 7 Pop-Up Dialog

| No | Nama Pop-Up Modal | Lokasi Komponen | Status Standar Midday | Catatan Perbaikan |
| :--- | :--- | :--- | :---: | :--- |
| 1 | **Pusat Notifikasi Channel & OTA** | `ChannelNotificationWidget.tsx` | Selesai (100%) | Dark mode, Escape key, light executive theme, 0 em-dash. |
| 2 | **Tambah Saluran OTA (Catalog Modal)** | `ChannelManagerSection.tsx` | Selesai (100%) | Global Escape key handler, backdrop click dismiss, responsive card grid. |
| 3 | **Konfirmasi Putus Saluran & Reset** | `ChannelManagerSection.tsx` | Selesai (100%) | Global Escape key handler, role dialog, tombol presisi, tanpa looping text. |
| 4 | **Putus Kaitan Channex Property** | `ChannelManagerSection.tsx` | Selesai (100%) | Global Escape key handler, role dialog, hairline border, clean alert. |
| 5 | **Hasil Full Sync ARI 500 Hari** | `ChannelManagerSection.tsx` | Selesai (100%) | Global Escape key handler, modular CSS class, tabular monospace task ID. |
| 6 | **Virtual CC Viewer (PCI-DSS)** | `ChannelVccViewerModal.tsx` | Selesai (100%) | Global Escape key handler, backdrop click dismiss, tabular monospace, zero em-dash. |
| 7 | **Kebijakan Pajak & Service Charge** | `ChannelTaxesModal.tsx` | Selesai (100%) | Global Escape key handler, backdrop click dismiss, modular CSS, dark mode parity. |

---

## 5. Status Eksekusi Batch 1 (Selesai 100%)

Berdasarkan konfirmasi arahan pengguna:
1. **Seluruh 7 Pop-Up Modal Telah Distandarisasi:**
   - Semua modal menutup otomatis saat tombol `Escape` ditekan atau area latar belakang (backdrop) diklik.
   - Menggunakan role="dialog", aria-modal="true", dan aria-labelledby.
   - Bebas dari looping text dan terisolasi dalam modular CSS.
2. **Matriks Paritas Tarif (`RateParityMatrixTab`):**
   - **Desktop View:** [RateParityMatrixDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RateParityMatrixDesktopView.tsx) + [RateParityMatrixDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RateParityMatrixDesktopView.module.css) menerapkan tabel multi-kolom dengan sticky freeze column, `white-space: nowrap`, dan font tabular mono untuk nominal mata uang.
   - **Mobile View:** [RateParityMatrixMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RateParityMatrixMobileView.tsx) + [RateParityMatrixMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RateParityMatrixMobileView.module.css) menerapkan arsitektur Card-Reflow bertingkat tanpa scroll horisontal.
3. **Saluran & Pemetaan (`ChannelMappingTab`):**
   - **Desktop View:** [ChannelMappingDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelMappingDesktopView.tsx) + [ChannelMappingDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelMappingDesktopView.module.css) menerapkan master-detail split layout berdensitas tinggi.
   - **Mobile View:** [ChannelMappingMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelMappingMobileView.tsx) + [ChannelMappingMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelMappingMobileView.module.css) menerapkan swipeable channel selector pills, card-reflow untuk pemetaan kamar & rate, serta sticky bottom save bar.

---

## 6. Status Eksekusi Batch 2 (Selesai 100%)

Seluruh 4 modul dalam kelompok **Yield & Revenue** telah selesai direfaktor dengan pemisahan penuh Desktop & Mobile serta Full Modular CSS:

1. **Aturan Ketersediaan & Min Stay (`ChannelAvailabilityRulesTab`):**
   - **Desktop View:** [ChannelAvailabilityRulesDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAvailabilityRulesDesktopView.tsx) + [ChannelAvailabilityRulesDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAvailabilityRulesDesktopView.module.css) menerapkan tabel multi-kolom berdensitas tinggi, filter saluran OTA, dan dialog modal dengan event listener `Escape`.
   - **Mobile View:** [ChannelAvailabilityRulesMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAvailabilityRulesMobileView.tsx) + [ChannelAvailabilityRulesMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAvailabilityRulesMobileView.module.css) menerapkan Card-Reflow per aturan yield, tap targets minimal 44px, dan bottom sheet dialog.
   - **Wrapper:** [ChannelAvailabilityRulesTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAvailabilityRulesTab.tsx) + [ChannelAvailabilityRules.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAvailabilityRules.module.css).

2. **Harga Dinamis & Yield Otomatis (`ChannelDynamicPricingTab`):**
   - **Desktop View:** [ChannelDynamicPricingDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelDynamicPricingDesktopView.tsx) + [ChannelDynamicPricingDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelDynamicPricingDesktopView.module.css) menampilkan strip metrik eksekutif, preview simulator interaktif, dan tabel konfigurasi yield.
   - **Mobile View:** [ChannelDynamicPricingMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelDynamicPricingMobileView.tsx) + [ChannelDynamicPricingMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelDynamicPricingMobileView.module.css) menampilkan kartu reflow per tier okupansi dengan tombol toggle aktif/nonaktif yang mudah disentuh.
   - **Wrapper:** [ChannelDynamicPricingTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelDynamicPricingTab.tsx) + [ChannelDynamicPricing.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelDynamicPricing.module.css).

3. **Promosi & Flash Sale Saluran OTA (`ChannelPromotionsTab`):**
   - **Desktop View:** [ChannelPromotionsDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelPromotionsDesktopView.tsx) + [ChannelPromotionsDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelPromotionsDesktopView.module.css) menerapkan tabel berdensitas tinggi, format angka diskon tabular, rentang tanggal validitas, dan modal dialog standardisasi dengan penanganan `Escape`.
   - **Mobile View:** [ChannelPromotionsMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelPromotionsMobileView.tsx) + [ChannelPromotionsMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelPromotionsMobileView.module.css) menerapkan Card-Reflow per promosi aktif, tag status, dan bottom sheet form.
   - **Wrapper:** [ChannelPromotionsTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelPromotionsTab.tsx) + [ChannelPromotions.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelPromotions.module.css).

4. **Integrasi Google Hotel Search & Free Booking Links (`ChannelGoogleHotelsTab`):**
   - **Desktop View:** [ChannelGoogleHotelsDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelGoogleHotelsDesktopView.tsx) + [ChannelGoogleHotelsDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelGoogleHotelsDesktopView.module.css) menyajikan 4 metrik kinerja, audit kesiapan konten 10 poin dengan progress bar, dan formulir integrasi Google Hotel Center.
   - **Mobile View:** [ChannelGoogleHotelsMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelGoogleHotelsMobileView.tsx) + [ChannelGoogleHotelsMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelGoogleHotelsMobileView.module.css) menyajikan kartu metrik 2x2, checklist vertikal, dan sticky bottom save bar.
   - **Wrapper:** [ChannelGoogleHotelsTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelGoogleHotelsTab.tsx) + [ChannelGoogleHotels.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelGoogleHotels.module.css).

5. **Ekstranet Visual Channex SSO (`ChannelExtranetTab`, `tab=iframe`):**
   - **Desktop View:** [ChannelExtranetDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelExtranetDesktopView.tsx) + [ChannelExtranetDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelExtranetDesktopView.module.css) menerapkan frame viewport eksekutif terisolasi, strip status SSO dengan security pulse dot, tombol aksi cepat "Buka di Tab Baru" & "Reload Frame", serta status error dan empty state yang rapi.
   - **Mobile View:** [ChannelExtranetMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelExtranetMobileView.tsx) + [ChannelExtranetMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelExtranetMobileView.module.css) menyajikan tombol aksi utama minimum 48px untuk membuka konsol Channex di tab penuh, preview frame lipat (collapsible toggle), serta kartu navigasi cepat ke pemetaan lokal Setara dan kredensial API.
   - **Wrapper:** [ChannelExtranetTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelExtranetTab.tsx) + [ChannelExtranet.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelExtranet.module.css).

6. **Redesign Sidebar & Hover Flyout Submenu (`ChannelManagerSidebar.tsx` + `.module.css`):**
   - **Koreksi Dimensi & Padding:** Lebar expanded diturunkan dari 260px menjadi 224px, dan lebar collapsed diturunkan dari 100px menjadi 64px dock. Padding dinormalisasi sehingga tidak ada lagi celah vertikal janggal 20px atau scrolling glitch akibat margin negatif.
   - **Hover Flyout Submenu Cerdas Saat Menu Tertutup:** Menu popover terapung di sisi kanan aktif saat menu dalam kondisi tertutup (saat sidebar dalam mode ringkas dock 64px di `left: 70px`, atau saat grup accordion sidebar ditutup di `left: 230px`). Ketika grup menu sedang terbuka (expanded), popover di sisi kanan dinonaktifkan agar tidak tumpang tindih dengan daftar item internal yang sudah terbuka. Dilengkapi jembatan hover tak kasat mata (`::before` bridge) dan toleransi delay keluar agar navigasi kursor stabil dan mulus.
   - **Pemisahan Submenu Log & Sertifikasi:** Memisahkan grup menu menjadi "Log & Audit Sistem" (Audit Log dan Live ARI Sync Feed) serta "Sertifikasi & Gateway" (Skenario Sertifikasi dan Kredensial & Webhook) agar menu log fokus dan mandiri.
   - **Penghapusan Subtitle/Tooltip Hitam Browser:** Menghapus seluruh atribut HTML `title` pada tombol grup header, item menu navigasi, dock icon, dan tombol notifikasi footer sehingga browser tidak lagi memunculkan kotak hitam tooltip native saat cursor menyentuh elemen sidebar. Aksesibilitas tetap terjaga menggunakan `aria-label`.

7. **Redesign Master Rate Plan Folio (`RatePlanSection.tsx` + `DesktopView` + `MobileView`):**
   - **Koreksi Dimensi Kartu (Ukuran Terlalu Besar):**
     - Grid diperkecil dari `minmax(360px, 1fr)` menjadi `minmax(290px, 1fr)` dengan gap rapat 12px, sehingga memuat 3-4 kartu per baris pada layar desktop standar (menghemat ruang vertikal lebih dari 50%).
     - Padding kartu dipangkas dari `24px` menjadi `13px 15px`, dan tinggi judul diturunkan dari `21px` menjadi `13.5px` semi-bold.
     - Kotak harga net base tariff didesain ulang menjadi strip baris horizontal yang ringkas dengan angka mono tabular `font-size: 15.5px`.
     - Spesifikasi (Meal, Policy, Min Stay, Status) diringkas ke dalam 2x2 grid mini yang rapi.
     - Tampilan UUID Channel Manager yang sebelumnya membengkak (mencetak string 36-karakter per kamar berkali-kali) dirampingkan menjadi pill salin ringkas dengan penghitung kamar tertaut (`UUID (3)` / `PMS: #BAR-01`), serta tombol Ping ARI berukuran 22px yang presisi.
   - **Pemisahan Modul Desktop & Mobile:**
     - [RatePlanDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RatePlanDesktopView.tsx) + [RatePlanDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RatePlanDesktopView.module.css) untuk tampilan kartu folio eksekutif dan ledger tabel berdensitas tinggi.
     - [RatePlanMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RatePlanMobileView.tsx) + [RatePlanMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RatePlanMobileView.module.css) untuk tampilan layar sentuh ponsel dengan target sentuh minimal 40-44px.
     - [RatePlanSection.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/RatePlanSection.tsx) sebagai container orchestrator yang dilengkapi dialog modal standar Linear dengan event listener `Escape`.

8. **Redesign Live ARI Transmission Feed (`ChannelAriSyncFeedTab.tsx`, `tab=sync`):**
   - **Koreksi Tampilan & Layout Kacau:**
     - Menghapus styling Tailwind / shadcn yang tidak terstruktur dan menggantinya dengan arsitektur **Full Modular CSS** sesuai Midday & Linear standard.
     - **Masthead & Strip Metrik Eksekutif:** 4 metrik terpadu (Sync Scope 500 Hari Maju, Tingkat Keberhasilan Push, Rata-rata Latensi Transmisi, dan Status Live Engine dengan indikator pulsing dot).
     - **Toolbar Terintegrasi:** Kotak pencarian task ID/saluran/pesan, segmented button status filter (All, Success, Failed), tombol aksi cepat (Refresh Feed, Force Push Full Sync 500 Days, Audit Log).
     - **Transmission Ledger Table:** Tabel feed transmisi berdensitas tinggi dengan `white-space: nowrap`, pill status berkode warna (sukses/gagal/pending), badge saluran OTA, Task ID dengan tombol salin interaktif, latensi `Geist Mono` tabular, dan timestamp rapi.
   - **Pemisahan Modul Desktop & Mobile:**
     - [ChannelAriSyncFeedDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAriSyncFeedDesktopView.tsx) + [ChannelAriSyncFeedDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAriSyncFeedDesktopView.module.css) untuk tampilan desktop multi-kolom berdensitas tinggi.
     - [ChannelAriSyncFeedMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAriSyncFeedMobileView.tsx) + [ChannelAriSyncFeedMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAriSyncFeedMobileView.module.css) untuk tampilan layar sentuh HP dengan kartu reflow dan tombol aksi sentuh minimal 44px.
     - [ChannelAriSyncFeedTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAriSyncFeedTab.tsx) + [ChannelAriSyncFeed.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelAriSyncFeed.module.css) sebagai container orchestrator.

9. **Redesign Sandbox API Tester & Certification Suite (`ChannelSandboxTab.tsx`, `tab=sandbox`):**
   - **Koreksi Tampilan & Layout Kacau:**
     - Menghapus styling Tailwind / shadcn yang tumpang tindih dan menggantinya dengan arsitektur **Full Modular CSS** sesuai standar Midday & Linear.
     - **Bar Ringkasan Kesiapan Sertifikasi:** Indikator progress sertifikasi eksekutif dengan persentase `Geist Mono` tabular, badge environment (`STAGING GATEWAY` / `PRODUCTION GATEWAY`), dan progress bar bergaris halus.
     - **Sub-Navigasi 3 Skenario:** Tab segmented yang jelas antara 10 Skenario Uji ARI Channex, 8 Tahap Kepatuhan Webhook & ACK, dan Simulator Injeksi Reservasi OTA Inbound.
     - **Daftar Skenario Terstruktur:** Kartu pengujian dengan badge nomor urut, status pill (Passed, Failed, Running, Pending), detail error/sukses terisolasi, Task ID dengan tombol salin interaktif, serta tombol uji coba sekali klik.
     - **Simulator Form & Terminal Responsif:** Formulir pemesanan dengan kontrol input bersih, tombol aksi sentuh 44px, dan konsol terminal bertema gelap eksekutif (`#09090b` dengan teks `#34d399`) dilengkapi tombol salin JSON.
   - **Pemisahan Modul Desktop & Mobile:**
     - [ChannelSandboxDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelSandboxDesktopView.tsx) + [ChannelSandboxDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelSandboxDesktopView.module.css) untuk tampilan desktop master-detail side-by-side.
     - [ChannelSandboxMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelSandboxMobileView.tsx) + [ChannelSandboxMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelSandboxMobileView.module.css) untuk tampilan layar sentuh HP dengan kartu reflow dan tombol aksi sentuh minimal 44px.
     - [ChannelSandboxTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelSandboxTab.tsx) + [ChannelSandbox.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelSandbox.module.css) sebagai container orchestrator penengah state & API simulation.

---

10. **Redesign Kredensial API Gateway & Go-Live (`ChannelCredentialsTab.tsx`, `tab=golive`):**
   - **Koreksi Tampilan & Layout Kacau:**
     - Mengeliminasi seluruh penumpukan inline styling (`style={{ ... }}`) dan merombaknya ke arsitektur **Full Modular CSS** sesuai standar Midday & Linear.
     - **Strip Status Gateway & Environment Switcher:** Kontrol segmented Staging (Sandbox) vs Production (Live), pill status live connection, dan tombol **Test Connection** interaktif yang mem-ping langsung server Channex (`/api/channex/ping`) dengan pembacaan latensi tabular mono.
     - **Audit Kesiapan Go-Live (Pre-Flight Readiness Matrix):** Scorecard kesiapan otomatis (0-100%) dengan progress bar bertema elegan, memeriksa 5 parameter krusial secara dinamis: API Key terkonfigurasi, Property GUID tertaut, HMAC Webhook Secret aktif, Webhook terdaftar, dan Mata Uang Dasar CRS.
     - **Formulir Kredensial Terisolasi:** Kontrol input aman untuk User API Key dan Webhook Secret dengan toggle intip (Eye/EyeOff) dan tombol salin cepat, Property ID dengan tombol Auto-Register dan Unlink, serta Callback URL publik readonly.
     - **Pendaftaran Webhook 1-Klik:** Terhubung langsung ke endpoint valid `/api/channex/register-webhook` (GET untuk status audit, POST untuk self-registration otomatis), menghilangkan error 404 dari versi lama.
   - **Pemisahan Modul Desktop & Mobile:**
     - [ChannelCredentialsDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelCredentialsDesktopView.tsx) + [ChannelCredentialsDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelCredentialsDesktopView.module.css) untuk tampilan desktop berdensitas tinggi dengan matriks verifikasi terstruktur.
     - [ChannelCredentialsMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelCredentialsMobileView.tsx) + [ChannelCredentialsMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelCredentialsMobileView.module.css) untuk tampilan layar sentuh HP dengan target sentuh minimal 44px, kartu reflow, dan tombol simpan yang mudah dijangkau.
     - [ChannelCredentialsTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelCredentialsTab.tsx) + [ChannelCredentials.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelCredentials.module.css) sebagai container orchestrator.

---

11. **Redesign Audit Log (`ChannelActionLogsTab.tsx`, `tab=logs`) & Pemisahan Menu Sidebar:**
   - **Pemisahan Menu Sidebar Eksklusif (Sesuai Permintaan User):**
     - Memisahkan kategori lama `Log & Sertifikasi` menjadi 2 kelompok independen di [ChannelManagerSidebar.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/layout/ChannelManagerSidebar.tsx):
       1. **Log & Audit Sistem:** Berisi 3 sub-menu murni:
          - `Audit Log` (`tab=logs`): Dikhususkan murni untuk riwayat mutasi sistem, retensi, dan payload perbaikan tanpa mencampur judul webhook.
          - `Webhook Traces` (`tab=webhooks`): Dikhususkan untuk pemantauan real-time transmisi webhook dari OTA/Channex, payload reservasi masuk, dan verifikasi status ACK.
          - `Live ARI Sync Feed` (`tab=sync`): Pemantauan transmisi ARI 500 hari.
       2. **Sertifikasi & Gateway:** Berisi `Skenario Sertifikasi` (`tab=sandbox`) dan `Kredensial & Webhook` (`tab=golive`).
     - Menyinkronkan pemetaan kategori pada `TAB_GROUP_MAP` di [ChannelManagerSection.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelManagerSection.tsx).
   - **Koreksi Tampilan & Layout Monolitik Tab Logs:**
     - Mengeliminasi file monolitik 1289 baris dan memecahnya ke arsitektur **Full Modular CSS** tanpa inline style.
     - **Strip Telemetri Eksekutif (4 KPI Cards):** Total Logs, Tingkat Keberhasilan (%), Rata-rata Latensi (ms), dan Kebijakan Retensi (30/60/90 hari).
     - **Bar Kebijakan Retensi & Purge:** Dropdown batas umur penyimpanan log database dan dialog konfirmasi pembersihan aman (*safe purge*).
     - **Toolbar Filter Terpadu:** Filter tipe aksi event, filter status hasil (All, Success, Failed, Warning), filter saluran OTA, date range picker, dan tombol refresh dengan animasi rotasi.
     - **Ledger Audit Presisi:** Indikator status berkode warna, nama aksi event, Task ID pills (dengan tombol salin 1-klik untuk single task dan multi-call task), badge nama saluran, user/operator, timestamp `Geist Mono` tabular, dan latensi eksekusi.
     - **Drawer Detail Event Terstandarisasi:** Modal dialog bertaraf Linear dengan event listener `Escape`, segmented tabs (Git Diff syntax highlighter, Webhook Payload JSON, OTA responses, dan raw response), serta tombol Live Task Sync dari Channex API.
   - **Pemisahan Modul Desktop & Mobile:**
     - [ChannelActionLogsDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelActionLogsDesktopView.tsx) + [ChannelActionLogsDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelActionLogsDesktopView.module.css) untuk tampilan desktop berdensitas tinggi dengan tabel ledger multi-kolom.
     - [ChannelActionLogsMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelActionLogsMobileView.tsx) + [ChannelActionLogsMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelActionLogsMobileView.module.css) untuk tampilan layar sentuh HP dengan kartu reflow, drawer modal ringkas, dan kontrol sentuh 44px.
     - [ChannelActionLogsTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelActionLogsTab.tsx) + [ChannelActionLogs.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelActionLogs.module.css) sebagai container orchestrator.

12. **Pembuatan Sub-Menu Khusus Webhook Traces (`ChannelWebhooksTab.tsx`, `tab=webhooks`):**
    - **Pemisahan Dedicated Tab:** Sesuai permintaan user untuk memisahkan webhook ke menu tersendiri di dalam "Log & Audit Sistem".
    - **Fitur Utama:**
      - **Banner Endpoint Inbound:** Menampilkan URL endpoint publik `/api/channex/webhook`, status verifikasi Channex, indikator signature secret, tombol salin 1-klik, dan tombol "Test Inbound Webhook" interaktif.
      - **KPI Telemetri Real-Time:** Total Webhook Masuk, Tingkat Keberhasilan ACK (%), Rata-rata Latensi Masuk (ms), dan Saluran OTA Aktif.
      - **Tabel Webhook Traces Berdensitas Tinggi:** Filter event type, saluran, dan status respon dengan tabel rapi, pill status berkode warna, dan tombol inspect detail.
      - **Drawer Inspector Payload:** Drawer geser standar Linear dengan tab Payload JSON, Headers & Signature, dan ACK Response.
    - **Pemisahan Modul Desktop & Mobile:**
      - [ChannelWebhooksDesktopView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelWebhooksDesktopView.tsx) + [ChannelWebhooksDesktopView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelWebhooksDesktopView.module.css)
      - [ChannelWebhooksMobileView.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelWebhooksMobileView.tsx) + [ChannelWebhooksMobileView.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelWebhooksMobileView.module.css)
      - [ChannelWebhooksTab.tsx](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelWebhooksTab.tsx) + [ChannelWebhooks.module.css](file:///f:/WEB-SERVER/WEB/crs-setara/apps/admin-dashboard/components/sections/channel-manager/ChannelWebhooks.module.css)

---

## 13. Rencana Batch Selanjutnya (Batch 3: Finansial & Booking)
- **Batch 3 (Finansial & Booking):**
  1. `PaymentGatewayTab` (Midtrans, Xendit, Stripe, Manual Bank Transfer, QRIS)
  2. `ChannelPaymentTokenizationTab` (PCI-DSS Tokenization & Settlement)
  3. `ChannelCatalogTab` (Katalog 40+ Saluran OTA & Modal Aktivasi Kredensial)
  4. `TravelAgentTab` (B2B Travel Agent Contracts & Allotment)
- **Batch 4 (Master Data Properti):**
  1. `RoomTypeSection` / `rooms` (Master Tipe Kamar PMS)
  2. `ChannelGroupsTab` / `groups` (Multi-Property & Cluster)
  3. `ChannelTutorialTab` / `tutorial` (SOP Guide & Roadmap Integrasi)
