import React from "react";

export type PermissionCategory = "menu" | "action" | "roadmap";

export interface PermissionItem {
    id: string;
    label: string;
    description: string;
    isDangerous?: boolean; // Sensitif / Otoritas Supervisor: void, cancel, refund, stopsell, delete
    isAction?: boolean; // Otoritas Tombol / Fitur Tombol Aksi
    isComingSoon?: boolean; // Fitur Roadmap / Segera Hadir
    isAddon?: boolean; // Fitur Add-on Opsional (memerlukan aktivasi di billing hotel)
    addonKey?: string;
    addonLabel?: string;
    badgeText?: string;
    category?: PermissionCategory;
}

export function isPermissionAddon(permId: string): { isAddon: boolean; addonKey: string; addonName: string } {
    if (permId === "food-beverage-realtime") {
        return { isAddon: true, addonKey: "food-beverage-realtime", addonName: "Kitchen View / KDS" };
    }
    if (permId === "pos_self_order") {
        return { isAddon: true, addonKey: "pos-self-order", addonName: "Self-Ordering" };
    }
    return { isAddon: false, addonKey: "", addonName: "" };
}

export function isAddonActiveForHotel(permId: string, activeModules: string[] | null | undefined): boolean {
    if (!activeModules || activeModules.length === 0) return false;
    if (permId === "food-beverage-realtime") {
        return activeModules.includes("food-beverage-realtime") || activeModules.includes("pos-realtime");
    }
    if (permId === "pos_self_order") {
        return activeModules.includes("pos-self-order");
    }
    return true;
}

export interface PermissionGroup {
    id: string;
    moduleKey: string;
    label: string;
    shortLabel: string;
    description: string;
    icon: string; // Identifier for icon rendering
    badgeText?: string;
    isSuperadminOnly?: boolean;
    permissions: PermissionItem[];
}

export const COMPREHENSIVE_PERMISSION_GROUPS: PermissionGroup[] = [
    {
        id: "module_front_office",
        moduleKey: "front-office",
        label: "Front Office & Reservasi (PMS)",
        shortLabel: "Front Office",
        description: "Matriks status kamar, check-in, check-out, room move, folio billing, dan alokasi reservasi tamu",
        icon: "Building2",
        permissions: [
            { id: "overview", label: "Front Desk & Room Status Matrix (Tape Chart)", description: "Melihat visualisasi status kamar real-time, daftar kedatangan tamu (Arrival), dan keberangkatan (Departure)" },
            { id: "digital-checkin", label: "Guest Registration Card (GRC) & E-Sign", description: "Mengakses formulir registrasi digital tamu, pemindaian identitas (KTP/Paspor), dan tanda tangan elektronik" },
            { id: "fo_walkin", label: "Walk-In Reservation & Quick Booking", description: "Menerima dan membuat reservasi kamar langsung di meja resepsionis untuk tamu walk-in tanpa pemesanan awal" },
            { id: "confirmation-letter", label: "Confirmation Letter (CL) & Booking Voucher", description: "Menerbitkan, mencetak, dan mengirimkan surat konfirmasi reservasi resmi berkop hotel kepada tamu" },
            { id: "forecast", label: "Room Occupancy & Availability Forecast", description: "Melihat prakiraan tingkat keterisian kamar harian, mingguan, dan proyeksi ketersediaan fisik kamar" },
            { id: "revenue-breakdown", label: "Revenue Breakdown & Department Income", description: "Melihat rincian pendapatan harian per tipe kamar, outlet makanan minuman, dan pos pendapatan lainnya" },
            { id: "rate-inventory", label: "Master Kalender Rate & Allotment Grid", description: "Mengakses kalender tarif harian (Daily Rates) dan alokasi kuota kamar yang tersedia untuk dijual" },
            { id: "inventory-control", label: "Kontrol Fisik Kamar & Room Blocking", description: "Mengatur pemblokiran fisik kamar untuk rombongan VIP atau keperluan perbaikan kamar berkala" },
            { id: "invoice", label: "Cetak & Terbitkan Invoice Tagihan Resmi", description: "Mencetak faktur tagihan resmi hotel untuk tamu korporat (Company Invoice) maupun tamu perseorangan" },
            { id: "purchase-order", label: "Permintaan Pembelian Departemen Front Desk", description: "Mengajukan kebutuhan perlengkapan operasional Front Desk (keycard, map GRC, perlengkapan resepsionis)" },

            // Button Authorities & Actions (Otoritas Tombol)
            { id: "fo_checkin", label: "Check-In & Room Assignment (Penetapan Kamar)", description: "Tombol memproses penetapan nomor kamar fisik dan check-in tamu individu maupun rombongan", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "fo_checkout", label: "Check-Out & Folio Settlement", description: "Tombol memproses check-out tamu, verifikasi tagihan akhir, dan penyelesaian pembayaran folio", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "fo_room_move", label: "Room Move & Room Upgrade (Pindah Kamar)", description: "Tombol memproses pemindahan kamar tamu yang sedang menginap dan upgrade tipe kamar", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "fo_discount", label: "Otoritas Diskon Khusus & Complimentary", description: "Tombol memberikan potongan harga manajerial, diskon promosi, atau kamar complimentary", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "fo_stopsell", label: "Buka / Tutup Jual Kamar (Stop Sell Control)", description: "Tombol menutup penjualan kamar sementara pada tanggal tertentu atau membuka kembali kuota", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "fo_rate_change", label: "Modifikasi Tarif Harian (Dynamic Pricing)", description: "Tombol mengubah harga jual kamar harian atau menerapkan penyesuaian tarif spesial", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "fo_inventory_change", label: "Ubah Kuota Allotment Kamar", description: "Tombol menambah atau mengurangi kuota alokasi kamar fisik yang dijual langsung/agen", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "fo_cancel", label: "Batalkan Reservasi Kamar (Cancel Booking)", description: "Tombol membatalkan pemesanan tamu yang telah terdaftar di sistem dengan pencatatan alasan", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "fo_void", label: "Void Check-In / Void Folio Transaksi", description: "Tombol membatalkan status check-in yang keliru atau membatalkan baris transaksi tagihan", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "fo_refund", label: "Eksekusi Refund Deposit & Paid Out", description: "Tombol mengembalikan sisa uang muka/deposit jaminan tamu atau memproses kas keluar", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
        ]
    },
    {
        id: "module_night_audit",
        moduleKey: "night-audit",
        label: "Night Audit & Tutup Hari Operasional",
        shortLabel: "Night Audit",
        description: "Proses penutupan hari sistem hotel, posting tarif kamar & pajak otomatis, audit shift kasir, dan rekonsiliasi DSR",
        icon: "Receipt",
        permissions: [
            { id: "dsr", label: "Daily Sales Report (DSR) & Manager Flash", description: "Merekapitulasi seluruh pendapatan gabungan kamar, restoran, banquet, laundry, dan operasional harian hotel" },
            { id: "na_run_audit", label: "Eksekusi Night Audit (Day-End Processing)", description: "Menjalankan proses penutupan hari sistem hotel, posting transaksi otomatis, dan pergantian tanggal kalender", isComingSoon: true, isDangerous: true, badgeText: "Segera Hadir" },
            { id: "na_rate_posting", label: "Room & Tax Auto-Posting Verification", description: "Memverifikasi dan memposting tarif sewa kamar harian beserta pajak daerah PB1/PPN ke seluruh folio aktif", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "na_noshow_process", label: "Proses No-Show & Cancellation Penalty", description: "Menetapkan status no-show pada reservasi tamu yang tidak hadir dan mengenakan penalti biaya pembatalan", isComingSoon: true, isDangerous: true, badgeText: "Segera Hadir" },
            { id: "na_cashier_audit", label: "Audit Shift Kasir & Cash Drop Safe", description: "Mencocokkan penerimaan uang fisik kasir dengan laporan sistem sebelum disetor ke safe deposit box hotel", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "na_trial_balance", label: "Trial Balance & Ledger Balancing Audit", description: "Memeriksa keseimbangan buku besar piutang tamu (Guest Ledger, City Ledger, dan Advance Deposit Ledger)", isComingSoon: true, badgeText: "Segera Hadir" },
        ]
    },
    {
        id: "module_channel_manager",
        moduleKey: "channel-manager",
        label: "Channel Manager & Distribusi CRS (Channex)",
        shortLabel: "Channel Manager",
        description: "Integrasi dua arah OTA (Traveloka, Booking.com, Agoda, Tiket.com), pemetaan kamar & rate plan, serta ARI push",
        icon: "Globe",
        isSuperadminOnly: true,
        permissions: [
            { id: "channel-manager", label: "Dashboard Channel Manager (Channex CRS)", description: "Mengakses dasbor integrasi distribusi OTA global dan memantau status konektivitas channel penjualan" },
            { id: "cm_ari_push", label: "Sync Real-Time ARI (Availability, Rates, Inventory)", description: "Melakukan pengiriman massal (push) perubahan harga, kuota kamar, dan pembatasan ke seluruh OTA mitra", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "cm_restrictions", label: "Aturan Pembatasan (Min Stay, CTA, CTD)", description: "Mengatur batas Minimum Length of Stay (MLOS), Closed to Arrival (CTA), dan Closed to Departure (CTD)", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "cm_mapping", label: "Room Type & Rate Plan Mapping", description: "Memetakan tipe kamar dan skema paket harga hotel dengan katalog di Traveloka, Booking.com, dan Agoda", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "cm_ota_logs", label: "Monitor Log Reservasi & Error Sync OTA", description: "Memeriksa riwayat transmisi data reservasi masuk dari OTA dan menganalisis kendala kegagalan sinkronisasi", isComingSoon: true, badgeText: "Segera Hadir" },
        ]
    },
    {
        id: "module_pos",
        moduleKey: "pos",
        label: "Point of Sales (POS / LexuPOS)",
        shortLabel: "Point of Sales",
        description: "Terminal kasir restoran, lounge, bar, kitchen order ticket (KOT), room charge, dan penutupan shift kasir",
        icon: "Banknote",
        permissions: [
            { id: "pos_home", label: "Dashboard Kasir POS & Ringkasan Penjualan", description: "Melihat ringkasan transaksi kasir harian, total omset outlet, dan rata-rata pengeluaran per tamu" },
            { id: "pos_lexupos", label: "Terminal Pemesanan LexuPOS Touchscreen", description: "Mengakses antarmuka kasir layar sentuh untuk input pesanan makanan, minuman, dan layanan hotel" },
            { id: "pos_cashier", label: "Kasir & Penerimaan Pembayaran (Cashiering)", description: "Menerima pembayaran tunai, mesin EDC perbankan, QRIS dinamis, dan transfer pembayaran outlet" },
            { id: "pos_product", label: "Manajemen Katalog Menu & Harga Jual", description: "Menambah, mengedit menu masakan, paket bundling makanan, dan memperbarui harga jual outlet" },
            { id: "pos_records", label: "Riwayat & Rekap Arsip Transaksi Kasir", description: "Melihat arsip struk pembayaran, rincian item terjual, dan laporan transaksi masa lalu secara detail" },
            { id: "pos_settings", label: "Pengaturan Outlet & Denah Meja Restoran", description: "Mengatur printer kasir thermal, printer dapur, serta tata letak denah penomoran meja restoran" },
            { id: "pos_self_order", label: "Akses Konfigurasi Self-Ordering QR Meja", description: "Mengaktifkan dan mengelola menu digital pemesanan mandiri tamu melalui scan barcode QR di meja", isAddon: true, addonKey: "pos-self-order", addonLabel: "Add-on Self-Ordering" },

            // Button Authorities & Actions (Otoritas Tombol POS)
            { id: "pos_room_charge", label: "Posting Tagihan ke Kamar (Charge to Room)", description: "Tombol membebankan tagihan pesanan restoran langsung ke folio kamar tamu yang terdaftar", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "pos_split_bill", label: "Pisah Tagihan (Split Bill) & Gabung Meja", description: "Tombol memisahkan satu pesanan jadi pembayaran terpisah atau menggabungkan tagihan multi-meja", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "pos_kot", label: "Kitchen Order Ticket (KOT) & Bartender Dispatch", description: "Tombol mengirim tiket pesanan ke printer dapur masakan dan stasiun bartender", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "pos_discount", label: "Diskon Kasir & Promosi Voucher Khusus", description: "Tombol menerapkan potongan harga persentase, voucher promo, atau potongan manajerial di kasir", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "pos_reprint", label: "Cetak Ulang Struk / Bill Kasir (Reprint)", description: "Tombol mencetak kembali salinan struk bukti transaksi pembayaran bagi tamu", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "pos_settlement", label: "Tutup Kasir & Laporan Shift (Z-Report)", description: "Tombol rekapitulasi modal kas awal, kas masuk, dan serah terima penutupan shift kasir", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "pos_cancel", label: "Batalkan Item Pesanan (Cancel Order)", description: "Tombol membatalkan item pesanan yang sudah terkirim ke dapur dengan catatan supervisor", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "pos_void", label: "Void Tagihan Terbayar (Void Settlement)", description: "Tombol membatalkan struk pembayaran yang sudah lunas dan mengembalikan status transaksi", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
        ]
    },
    {
        id: "module_housekeeping",
        moduleKey: "housekeeping",
        label: "Housekeeping & Tata Graha",
        shortLabel: "Housekeeping",
        description: "Matriks kebersihan kamar, status inspeksi, penugasan attendant, lost & found, par stock linen, dan tiket perbaikan",
        icon: "BedDouble",
        permissions: [
            { id: "hk_overview", label: "Housekeeping Room Grid & Matrix Status", description: "Melihat visualisasi status kebersihan seluruh kamar hotel secara grafis (Clean, Dirty, Inspected, OOO)" },
            { id: "hk_status_change", label: "Ubah Status Kamar (Clean / Dirty / Touch Up)", description: "Tombol memperbarui kondisi kebersihan fisik kamar setelah dibersihkan dan disanitasi", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "hk_inspection", label: "Inspeksi Kamar (Supervisor Room Inspection)", description: "Mengesahkan kamar siap huni (Inspected / Ready to Sell) oleh Housekeeping Supervisor", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "hk_ooo", label: "Kamar Out of Order (OOO) & Out of Service (OOS)", description: "Mematikan kamar dari inventori penjualan hotel karena perbaikan berat atau renovasi terencana", isComingSoon: true, isDangerous: true, badgeText: "Segera Hadir" },
            { id: "hk_attendant_assign", label: "Penugasan Harian Staf (Room Attendant Roster)", description: "Membagi daftar alokasi kamar tugas harian kepada masing-masing room attendant / room boy", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "hk_discrepancy", label: "Laporan Selisih Status Kamar (Discrepancy)", description: "Memeriksa selisih kondisi kamar antara catatan Front Desk dengan kenyataan fisik Housekeeping", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "hk_lost_found", label: "Buku Pencatatan Barang Temuan (Lost & Found)", description: "Mendata barang milik tamu yang tertinggal di kamar beserta lokasi temuan dan status serah terima", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "hk_amenities", label: "Kontrol Linen, Handuk & Amenities Kamar", description: "Memantau sirkulasi par stock sprei, sarung bantal, handuk mandi, dan perlengkapan amenitas tamu", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "hk_maintenance", label: "Penerbitan Tiket Perbaikan ke Divisi Engineering", description: "Melaporkan kerusakan fasilitas fisik kamar (AC bocor, lampu mati, pipa macet) ke maintenance", isComingSoon: true, badgeText: "Segera Hadir" },
        ]
    },
    {
        id: "module_food_beverage",
        moduleKey: "food-beverage",
        label: "Food & Beverage (F&B Management)",
        shortLabel: "Food & Beverage",
        description: "Buku besar penjualan restoran, kitchen display system (KDS), analisis resep HPP, spoilage, dan banquet BEO",
        icon: "Coffee",
        permissions: [
            { id: "food-beverage-ledger", label: "Buku Besar & Audit Penjualan Restoran", description: "Melihat laporan penjualan rinci restoran, room service, bar, dan outlet kuliner properti" },
            { id: "food-beverage-performance", label: "Analisis Kategori Menu & Best Seller", description: "Menganalisis margin keuntungan menu makanan dan minuman terlaris serta perputaran item menu" },
            { id: "food-beverage-realtime", label: "Kitchen Display System (KDS) Real-Time", description: "Menampilkan antrean tiket pesanan aktif secara langsung di layar dapur koki dan bartender", isAddon: true, addonKey: "food-beverage-realtime", addonLabel: "Add-on Kitchen View (KDS)" },
            { id: "fnb_menu_recipe", label: "Standar Resep & Recipe Costing (HPP)", description: "Mengelola takaran bahan baku gramasi dan mengkalkulasi Harga Pokok Penjualan (Food Cost %)", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "fnb_spoilage", label: "Pencatatan Makanan Rusak / Terbuang (Spoilage Log)", description: "Mendata bahan makanan kadaluarsa atau sisa yang tidak terpakai guna menekan pemborosan dapur", isComingSoon: true, isDangerous: true, badgeText: "Segera Hadir" },
            { id: "fnb_banquet", label: "Pemesanan Banquet & Meeting Room (BEO)", description: "Menyusun jadwal function sheet acara seminar, pernikahan, prasmanan, dan jamuan delegasi", isComingSoon: true, badgeText: "Segera Hadir" },
        ]
    },
    {
        id: "module_purchasing",
        moduleKey: "purchasing",
        label: "Purchasing & Inventory Gudang Hotel",
        shortLabel: "Purchasing",
        description: "Store requisition (SR), purchase order (PO), daily market list, penerimaan GRN, dan physical stock opname",
        icon: "ShoppingBag",
        permissions: [
            { id: "purchasing", label: "Dasbor Pengadaan & Logistik Gudang", description: "Melihat rekap belanja operasional hotel dan progres status permintaan barang antar departemen" },
            { id: "store-requisition", label: "Permintaan Barang Antar Departemen (SR)", description: "Membuat dan menyetujui permintaan pengeluaran barang persediaan dari gudang logistik sentral" },
            { id: "purchase-requisition", label: "Pengajuan Pembelian Barang Baru (PR)", description: "Mengajukan pengadaan barang inventaris baru yang harus dibeli ke rekanan pemasok vendor" },
            { id: "daily-market-list", label: "Daftar Belanja Harian Bahan Segar (DML)", description: "Membuat daftar belanja harian sayur segar, daging, bumbu dapur, dan buah untuk kebutuhan dapur" },
            { id: "purchase-order", label: "Penerbitan Purchase Order Resmi (PO)", description: "Menerbitkan lembar dokumen PO berkop resmi hotel untuk dikirimkan kepada pihak pemasok vendor", isDangerous: true },
            { id: "receiving_goods", label: "Penerimaan Barang Supplier (GRN)", description: "Tombol pemeriksaan fisik, kuantitas, dan kualitas barang masuk dari vendor sesuai surat jalan", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "stock-opname", label: "Physical Stock Opname & Penyesuaian Stok", description: "Melakukan perhitungan fisik stok gudang berkala dan mencatat jurnal selisih inventori barang", isDangerous: true },
            { id: "items", label: "Katalog Master Barang & Satuan Unit (UOM)", description: "Mengelola database barang habis pakai, inventaris operasional hotel, dan patokan harga standar" },
            { id: "suppliers", label: "Database Supplier & Kontak Vendor Rekanan", description: "Mengelola daftar rekanan pemasok resmi hotel beserta syarat dan termin pembayaran kredit" },
        ]
    },
    {
        id: "module_accounting",
        moduleKey: "accounting",
        label: "Finance & Accounting (Keuangan)",
        shortLabel: "Accounting",
        description: "Laporan laba rugi P&L, DSR, anggaran budgeting, piutang City Ledger (AR), hutang supplier (AP), dan pajak PB1",
        icon: "Calculator",
        permissions: [
            { id: "pnl", label: "Laporan Laba Rugi Operasional (P&L)", description: "Melihat laporan pendapatan kotor hotel, beban biaya operasional, dan laba bersih operasional (GOP)" },
            { id: "pnl-budget", label: "Analisis Realisasi Anggaran (P&L vs Budget)", description: "Membandingkan pencapaian target anggaran tahunan terhadap angka riil operasional properti" },
            { id: "budgeting", label: "Penyusunan Rencana Anggaran (Budgeting Matrix)", description: "Menyusun target pendapatan per departemen dan batas pagu pengeluaran belanja operasional hotel" },
            { id: "statements", label: "Laporan Neraca & Buku Besar Akuntansi (GL)", description: "Mengakses catatan akuntansi komprehensif, neraca keuangan, dan jurnal seluruh transaksi properti" },
            { id: "accounting_ar", label: "Piutang Usaha & Tagihan Korporat (City Ledger / AR)", description: "Memantau tagihan corporate, OTA piutang, nota kredit instansi, dan analisis umur piutang", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "accounting_ap", label: "Hutang Usaha & Pembayaran Supplier (AP Aging)", description: "Mengelola jadwal jatuh tempo pembayaran faktur pembelian barang dan verifikasi nota vendor", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "accounting_bank", label: "Rekonsiliasi Bank & Arus Kas Mutasi Rekening", description: "Mencocokkan mutasi kas rekening bank operasional hotel dengan catatan pembukuan internal", isComingSoon: true, badgeText: "Segera Hadir" },
            { id: "accounting_tax", label: "Rekapitulasi Pajak Daerah Hotel & Resto (PB1)", description: "Merekapitulasi kewajiban penyetoran pajak daerah hotel dan restoran untuk pelaporan dinas pendapatan", isComingSoon: true, badgeText: "Segera Hadir" },
        ]
    },
    {
        id: "module_innalytics",
        moduleKey: "innalytics",
        label: "Inalytics (Hotel Business Intelligence)",
        shortLabel: "Inalytics",
        description: "Tingkat hunian kamar (OCC %), ADR, RevPAR, kontribusi distribusi saluran penjualan, dan rate shopping kompetitor",
        icon: "TrendingUp",
        permissions: [
            { id: "innalytics", label: "Dashboard Eksekutif Inalytics BI", description: "Melihat KPI performa hotel secara menyeluruh dalam bentuk visualisasi grafik interaktif" },
            { id: "ina_reports", label: "Laporan & Statistik Produksi OTA", description: "Mengakses laporan bulanan OTA, channelwise booking, kontribusi ADR/RevPAR/OCC%, dan performa pasar" },
            { id: "ina_occupancy", label: "Analisis Tingkat Hunian (OCC %), ADR & RevPAR", description: "Mengevaluasi tren harga rata-rata kamar (ADR) dan pendapatan per kamar tersedia (RevPAR)", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "ina_channels", label: "Distribusi Saluran Penjualan (OTA vs Direct)", description: "Memantau kontribusi volume pemesanan dari Traveloka, Booking.com, Agoda vs direct booking web", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "ina_guest_market", label: "Segmentasi Demografi & Pasar Tamu Hotel", description: "Menganalisis asal negara/kota tamu, tujuan perjalanan (Leisure vs Business), dan lama tinggal", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "ina_competitor", label: "Intelijen Tarif Pesaing (Competitor Rate Shopping)", description: "Membandingkan harga kamar hotel kompetitor terdekat secara otomatis untuk strategi harga", isComingSoon: true, badgeText: "Segera Hadir" },
        ]
    },
    {
        id: "module_hrd",
        moduleKey: "hrd",
        label: "HRD & Manajemen Staf Karyawan",
        shortLabel: "HRD",
        description: "Direktori personil hotel, penyusunan jadwal piket shift roster, absensi biometrik GPS, cuti, dan service charge",
        icon: "ClipboardList",
        permissions: [
            { id: "hrd", label: "Portal HRD & Profil Karyawan Hotel", description: "Melihat direktori seluruh staf karyawan hotel, hierarki departemen, dan masa kerja aktif" },
            { id: "hrd_attendance", label: "Monitoring Presensi Biometrik & Geofence GPS", description: "Memantau kepatuhan jam kehadiran staf serta validasi titik lokasi koordinat GPS di area hotel" },
            { id: "hrd_shifts", label: "Master Konfigurasi Shift Kerja", description: "Mengatur jam mulai/selesai shift kerja, toleransi keterlambatan, dan kode penamaan shift" },
            { id: "hrd_scheduling", label: "Penjadwalan Roster & Shift Kerja Departemen", description: "Menyusun jadwal piket tugas shift pagi, siang, malam, dan libur dinas seluruh staf hotel" },
            { id: "hrd_leaves", label: "Persetujuan Cuti & Izin Sakit (Approvals)", description: "Menyetujui atau menolak permohonan libur tahunan dan izin sakit karyawan", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "hrd_overtime", label: "Verifikasi & Persetujuan Lembur Staf", description: "Menyetujui kompensasi dinas dan klaim jam lembur tugas karyawan", isAction: true, badgeText: "Otoritas Tombol" },
            { id: "hrd_reports", label: "Rekapitulasi Laporan Absensi Bulanan", description: "Melihat statistik kehadiran staf, rekap keterlambatan, dan rekap jam dinas per periode" },
            { id: "hrd_payroll", label: "Rekapitulasi Penggajian & Alokasi Service Charge", description: "Melihat rekap perhitungan absensi staf, lembur, dan pembagian porsi uang service charge hotel" },
            { id: "hrd_settings", label: "Konfigurasi Radius GPS Geofence & QR Code", description: "Mengatur titik koordinat lintang/bujur hotel, radius toleransi meter, dan QR code presensi" },
        ]
    },
    {
        id: "module_cpanel",
        moduleKey: "cpanel",
        label: "Website Portal CMS & Direct Booking Engine",
        shortLabel: "Website CMS",
        description: "Identitas brand visual, banner promosi hero, katalog tipe kamar online, kode voucher, dan SEO Google",
        icon: "Layers",
        permissions: [
            { id: "logo", label: "Identitas Visual Logo & Palet Warna Brand", description: "Mengatur logo resmi hotel (mode terang/gelap), favicon browser, dan identitas visual website" },
            { id: "hero", label: "Banner Hero Beranda & Tagline Promosi", description: "Mengubah gambar latar utama, tajuk sambutan hotel, dan tombol tindakan booking instan tamu" },
            { id: "room-type", label: "Katalog Tipe Kamar & Galeri Foto Online", description: "Mengatur deskripsi kamar, ukuran luas, fasilitas tempat tidur, dan galeri foto kamar di website" },
            { id: "promo", label: "Manajemen Kode Promo & Flash Sale Direct", description: "Membuat voucher kupon diskon eksklusif dan flash sale untuk pemesanan langsung di website hotel" },
            { id: "packages", label: "Paket Liburan Menginap & Layanan Tambahan", description: "Membuat paket bundling kamar dengan makan malam romantis, tur wisata, atau paket spa relaksasi" },
            { id: "about", label: "Profil Sejarah Hotel & Fasilitas Unggulan", description: "Memperbarui profil cerita hotel, fasilitas kolam renang, pusat kebugaran, dan lokasi properti" },
            { id: "gallery", label: "Galeri Dokumentasi Foto Properti & Event", description: "Mengunggah dokumentasi visual resolusi tinggi suasana hotel untuk menarik calon pengunjung" },
            { id: "attractions", label: "Rekomendasi Wisata & Kuliner Sekitar Hotel", description: "Menambahkan rekomendasi objek wisata pantai, pusat kuliner, dan pusat belanja terdekat" },
            { id: "seo", label: "SEO Meta Tags & Pelacakan Google Analytics", description: "Mengatur judul penelusuran Google, kata kunci pencarian, dan tag tracking konversi iklan hotel" },
            { id: "users", label: "Akses Halaman User Management Staf", description: "Mengakses portal konfigurasi akun staf hotel, penetapan password, dan kontrol hak akses" },
        ]
    },
    {
        id: "module_security",
        moduleKey: "security",
        label: "Keamanan Sistem & Hak Akses (CPanel Admin)",
        shortLabel: "Keamanan Sistem",
        description: "Manajemen personil pengguna, matriks perizinan role jabatan, pemantau perangkat aktif, dan audit trail",
        icon: "ShieldCheck",
        permissions: [
            { id: "sec_user_manage", label: "Kelola Akun Personil (Tambah / Edit / Kunci)", description: "Tombol membuat akun personil baru, mereset password staf, dan mengunci akun yang dinonaktifkan", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "sec_role_manage", label: "Konfigurasi Hak Akses Role & Privileges Matrix", description: "Tombol merubah matriks perizinan modul dan hak aksi sensitif untuk setiap jabatan", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "sec_device_activity", label: "Monitor Perangkat Aktif & Putus Sesi Login", description: "Tombol melihat perangkat yang sedang login dan memutuskan sesi yang tidak dikenal", isAction: true, isDangerous: true, badgeText: "Otoritas Tombol" },
            { id: "sec_user_activity", label: "Audit Trail & Log Jejak Aktivitas Sistem", description: "Melihat riwayat log aktivitas pengguna, login sesi, perubahan profil, dan tindakan operasional sistem" },
            { id: "sec_policies", label: "Pengaturan Kebijakan Password & Timeout Sesi", description: "Mengonfigurasi durasi timeout sesi login otomatis, masa kedaluwarsa kata sandi, dan standar autentikasi" },
        ]
    }
];

// Helper to get total permission count across all modules
export const TOTAL_PERMISSIONS_COUNT = COMPREHENSIVE_PERMISSION_GROUPS.reduce(
    (acc, group) => acc + group.permissions.length,
    0
);

// Preset defaults for standard Hotel PMS roles
export const getStandardRolePermissions = (roleName: string, activeModules?: string[] | null): Record<string, boolean> => {
    const roleLower = roleName.toLowerCase().trim();
    const result: Record<string, boolean> = {};

    const sanitizeResult = (perms: Record<string, boolean>) => {
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            g.permissions.forEach(p => {
                if (p.isComingSoon) {
                    perms[p.id] = false;
                }
            });
        });
        if (activeModules) {
            if (!isAddonActiveForHotel("food-beverage-realtime", activeModules)) {
                perms["food-beverage-realtime"] = false;
            }
            if (!isAddonActiveForHotel("pos_self_order", activeModules)) {
                perms["pos_self_order"] = false;
            }
        }
        return perms;
    };

    // Default: semua module dan seluruh izin sub-menu terkunci (false). Hanya izin yang eksplisit diizinkan untuk role yang bernilai true.
    COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
        result[g.id] = false;
        g.permissions.forEach(p => {
            result[p.id] = false;
        });
    });

    // 1. Administrator & Superadmin gets 100% of all privileges
    if (
        roleLower === "administrator" || 
        roleLower === "superadmin" || 
        roleLower === "super_admin" || 
        roleLower === "admin"
    ) {
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            result[g.id] = true;
            g.permissions.forEach(p => {
                result[p.id] = true;
            });
        });
        return sanitizeResult(result);
    }

    // 2. General Manager: Full operational, financial, reporting, audit, analytics, approvals
    if (roleLower === "general manager" || roleLower === "gm") {
        COMPREHENSIVE_PERMISSION_GROUPS.forEach(g => {
            result[g.id] = true;
            g.permissions.forEach(p => {
                result[p.id] = true;
            });
        });
        // Disallow deep technical CMS adjustments
        result["logo"] = false;
        result["seo"] = false;
        result["sec_policies"] = false;
        return sanitizeResult(result);
    }

    // 3. Front Office Manager: Full FO, Night Audit DSR, Channel Manager, HK overview, POS overview, Inalytics
    if (roleLower === "front office manager" || roleLower === "fom") {
        const allowed = [
            // FO
            "module_front_office", "overview", "digital-checkin", "fo_checkin", "fo_checkout", 
            "fo_room_move", "fo_walkin", "confirmation-letter", "forecast", "revenue-breakdown", 
            "rate-inventory", "fo_stopsell", "fo_rate_change", "fo_inventory_change", "fo_cancel", 
            "fo_void", "fo_discount", "fo_refund", "inventory-control", "invoice",
            // Night Audit
            "module_night_audit", "dsr", "na_cashier_audit",
            // POS
            "module_pos", "pos_home", "pos_records", "pos_cancel", "pos_void", "pos_discount", "pos_reprint",
            // Housekeeping
            "module_housekeeping", "hk_overview", "hk_status_change", "hk_inspection", "hk_discrepancy", "hk_lost_found",
            // Inalytics
            "module_innalytics", "innalytics", "ina_reports", "ina_occupancy", "ina_channels", "ina_competitor", "ina_guest_market",
            // Accounting
            "module_accounting", "dsr"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 4. Front Office Associate / Receptionist
    if (roleLower === "front office associate" || roleLower === "fo associate" || roleLower === "receptionist") {
        const allowed = [
            "module_front_office", "overview", "digital-checkin", "fo_checkin", "fo_checkout",
            "fo_room_move", "fo_walkin", "confirmation-letter", "rate-inventory", "invoice",
            "module_housekeeping", "hk_overview", "hk_lost_found"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 5. Reservation Associate: Bookings, CL, GRC, Rates, Inalytics, Channel Manager
    if (roleLower === "reservation associate" || roleLower === "reservasi" || roleLower === "reservation") {
        const allowed = [
            "module_front_office", "overview", "digital-checkin", "confirmation-letter",
            "fo_walkin", "forecast", "rate-inventory", "invoice",
            "module_innalytics", "innalytics", "ina_reports", "ina_occupancy", "ina_channels"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 6. Night Auditor: Day-end processing, room & tax audit, DSR, cashier settlement balancing
    if (roleLower === "night auditor" || roleLower === "night audit") {
        const allowed = [
            "module_front_office", "overview", "revenue-breakdown", "forecast", "invoice",
            "module_night_audit", "na_run_audit", "na_rate_posting", "na_noshow_process", "dsr", "na_cashier_audit", "na_trial_balance",
            "module_accounting", "dsr", "pnl", "pnl-budget", "statements",
            "module_pos", "pos_home", "pos_records", "pos_settlement"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 7. Housekeeping Manager: Full HK, lost and found, room attendant roster, maintenance
    if (roleLower === "housekeeping manager" || roleLower === "hk manager") {
        const allowed = [
            "module_housekeeping", "hk_overview", "hk_status_change", "hk_inspection", "hk_ooo",
            "hk_attendant_assign", "hk_discrepancy", "hk_lost_found", "hk_amenities", "hk_maintenance"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 8. Food & Beverage Manager: Full F&B, full POS, KDS, recipes, spoilage, banquet BEO
    if (roleLower === "food & beverage manager" || roleLower === "f&b manager" || roleLower === "fb manager") {
        const allowed = [
            "module_food_beverage", "food-beverage-ledger", "food-beverage-performance",
            "food-beverage-realtime", "fnb_menu_recipe", "fnb_spoilage", "fnb_banquet",
            "module_pos", "pos_home", "pos_lexupos", "pos_cashier", "pos_room_charge", "pos_split_bill", "pos_kot",
            "pos_product", "pos_records", "pos_cancel", "pos_void", "pos_discount", "pos_reprint", "pos_settlement", "pos_settings", "pos_self_order"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 9. Cashier (POS): Ordering, cashiering, bill settlement, reprint, shift handover
    if (roleLower === "cashier (pos)" || roleLower === "cashier" || roleLower === "kasir") {
        const allowed = [
            "module_pos", "pos_home", "pos_lexupos", "pos_cashier", "pos_room_charge", "pos_split_bill", "pos_kot",
            "pos_records", "pos_reprint", "pos_settlement"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 10. Revenue Manager: Rates, restrictions, stop sell, dynamic pricing, OTA sync, Inalytics
    if (roleLower === "revenue manager" || roleLower === "revenue") {
        const allowed = [
            "module_front_office", "overview", "forecast", "revenue-breakdown",
            "rate-inventory", "fo_stopsell", "fo_rate_change", "fo_inventory_change",
            "module_innalytics", "innalytics", "ina_reports", "ina_occupancy", "ina_channels", "ina_competitor", "ina_guest_market"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 11. Finance & Accounting: P&L, DSR, budgeting, General Ledger, City Ledger AR, AP Supplier, PB1 Tax
    if (roleLower === "finance & accounting" || roleLower === "finance" || roleLower === "accounting") {
        const allowed = [
            "module_accounting", "pnl", "pnl-budget", "dsr", "budgeting", "statements",
            "accounting_ar", "accounting_ap", "accounting_bank", "accounting_tax",
            "module_night_audit", "dsr", "na_trial_balance"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 12. Purchasing Officer: SR, PR, PO, Daily Market List, Goods Receiving, Stock Opname, Suppliers
    if (roleLower === "purchasing officer" || roleLower === "purchasing") {
        const allowed = [
            "module_purchasing", "purchasing", "store-requisition", "purchase-requisition",
            "daily-market-list", "purchase-order", "receiving_goods", "stock-opname", "items", "suppliers"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // 13. Human Resource / HR / HRD Manager: Full HRD portal, scheduling, attendance GPS, leaves & payroll
    if (
        roleLower === "human resource" || 
        roleLower === "human resources" || 
        roleLower === "hr" || 
        roleLower === "hrd" || 
        roleLower === "hrd manager" || 
        roleLower === "personalia"
    ) {
        const allowed = [
            "module_hrd", "hrd", "hrd_attendance", "hrd_shifts", "hrd_scheduling", 
            "hrd_leaves", "hrd_overtime", "hrd_reports", "hrd_payroll", "hrd_settings"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // Backward-compatibility fallbacks
    if (roleLower === "house keeping" || roleLower === "housekeeping") {
        const allowed = [
            "module_housekeeping", "hk_overview", "hk_status_change", "hk_lost_found"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    if (roleLower === "kitchen") {
        const allowed = [
            "module_food_beverage", "food-beverage-realtime", "fnb_menu_recipe", "fnb_spoilage"
        ];
        allowed.forEach(k => { result[k] = true; });
        return sanitizeResult(result);
    }

    // Default fallback: basic front desk view (keep other modules locked)
    result["module_front_office"] = true;
    result["overview"] = true;
    return sanitizeResult(result);
};
