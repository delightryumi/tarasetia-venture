# DESIGN.md

> **Direction & Visual Soul:** Midday & Linear Executive Minimalist Architecture for Hotel CRS, PMS, and Financial Distribution.
> **Dial:** `ENERGY 1 / RHYTHM 2 / MOTION 1`

---

## 1. Identity & Mood

- **Product Identity:** High-Density Enterprise Hotel Distribution CRS (Central Reservation System), Channel Manager, and PMS Management Dashboard.
- **Design Persona:** Midday & Linear style: calm, hyper-focused, mathematically precise, zero visual noise. Designed for professional hoteliers, revenue managers, and front-desk operators who handle high-volume reservations and financial metrics daily.
- **Craft Philosophy:** "Every pixel must serve a purpose." No decorative trend-stacking, no rainbow gradients, no oversized floating shadows. Crisp hairline borders, tabular numeric alignments, and instant feedback.

---

## 2. Antislop Dials

| Dial | Level | Implementation |
| :--- | :---: | :--- |
| **ENERGY** | **1 (Calm)** | Deep zinc and monochrome surfaces with subtle status accents. No glowing borders, no neon buttons, no decorative blobs. High-contrast readability. |
| **RHYTHM** | **2 (Balanced)** | Structured two-tier navigation, segmented sub-tabs, master-detail dual panels, high-density data tables, and card grids with clear contextual rhythm. |
| **MOTION** | **1 (Subtle)** | Instant, snappy transitions (`all 0.15s ease`). Dialog animations with fast ease-out (`0.2s cubic-bezier(0.16, 1, 0.3, 1)`). Zero bouncing, hovering loops, or parallax. |

---

## 3. Color System & Palette

### Core Palette (Zinc Monochrome)
- **Base Canvas:** `#ffffff` (Pure white) or light executive gray `#fbfbfb`.
- **Card / Surface:** `#ffffff` with 1px solid border `#e4e4e7`.
- **Sub-surfaces & Headers:** `#fafafa` (Card headers, modal top bars, summary strips).
- **Segmented / Inactive Controls:** `#f4f4f5` with border `#e4e4e7`.
- **Primary Text:** `#09090b` (Deep zinc, 21:1 contrast on white).
- **Secondary / Muted Text:** `#71717a` (Labels, metadata, subtitles, 4.6:1 WCAG AA).
- **Border / Divider:** `#e4e4e7` (Hairline zinc-200), hover state `#d4d4d8`.

### Status & Accents (Used with strict purpose only)
- **Active / Verified / Live:** Emerald (`#059669` text, `#ecfdf5` background, `#a7f3d0` border, `#10b981` dot indicator).
- **Pending / Warning / Alert:** Amber (`#92400e` text, `#fffbeb` background, `#fde68a` border, `#f59e0b` dot indicator).
- **Error / Denied / Cancelled:** Rose/Red (`#991b1b` text, `#fef2f2` background, `#fecaca` border, `#ef4444` dot indicator).
- **Gateway / Meta Info:** Royal Blue (`#2563eb` text, `#eff6ff` background, `#bfdbfe` border).

### Dark Mode Parity (`:global(.dark)` / `.dark`)
- **Canvas:** `#09090b`
- **Surface / Cards:** `#18181b` with border `#27272a`
- **Sub-surfaces:** `#27272a`
- **Primary Text:** `#f4f4f5`
- **Secondary Text:** `#a1a1aa`

---

## 4. Typography Standards

- **Headings & Page Titles:** `'Plus Jakarta Sans'`, sans-serif. Weights: `600` (Semi-bold) or `700` (Bold). Letter spacing: `-0.02em`.
- **UI Body, Buttons & Labels:** `'Inter'`, sans-serif. Weights: `400` (Regular), `500` (Medium), `600` (Semi-bold). Letter spacing: `-0.01em`.
- **Numbers, Currencies, Dates, IDs & UUIDs:** `'Geist Mono'`, monospace. Always declare `font-variant-numeric: tabular-nums` to guarantee perfect column alignment in financial tables, rate parity matrices, and reservation logs.

---

## 5. Component Patterns (Midday & Linear Standard)

1. **Two-Tier Navigation:**
   - Tier 1: Category groups (Distribusi Saluran, Yield & Revenue, Finansial, Log & Audit).
   - Tier 2: Contextual sub-tabs using segmented pill switchers (`.navTabBar` and `.navTabBtn`).
2. **Master-Detail Split Layout:**
   - Left panel (Master): High-density channel or room list with search filter and status badge.
   - Right panel (Detail): Deep configuration, parity matrix, and sync actions.
3. **Executive Dialog Modals:**
   - Overlay: `rgba(9, 9, 11, 0.55)` with subtle `backdrop-filter: blur(4px)`.
   - Container: Max-width 880px-900px, border-radius 16px, solid `#ffffff`, subtle shadow `0 25px 50px -12px rgba(0,0,0,0.15)`.
   - Header: Category uppercase tag (10px, 700 weight, letter spacing 0.08em), clear title, subtitle, and close button (`X`).
   - Body: Scrollable area with padding `20px 24px`.
   - Footer: Sticky summary on left, dismiss button on right.
   - Accessibility: Must close on `Escape` key and outside backdrop click with `e.stopPropagation()`.
4. **Trigger Cards (Replace Raw Checkboxes):**
   - Interactive 3-column cards with icons, event titles, and short descriptions for notification triggers or room features.
5. **Button Hierarchy:**
   - **Primary Action:** Solid `#09090b`, text `#ffffff`, border `#09090b`, hover `#27272a`.
   - **Secondary Action:** Background `#ffffff`, text `#18181b`, border `#e4e4e7`, hover `#f4f4f5`.
   - **Danger / Destructive:** Background `#ffffff`, text `#991b1b`, border `#fecaca`, hover `#fef2f2`.
   - Border radius: consistent 8px (`rounded-lg`). Tap targets minimum 36px to 44px.

---

## 6. Architecture: Full Modular CSS & Dual Mobile/Desktop Split

1. **Wajib Full Modular CSS (`*.module.css`):**
   - Setiap komponen, modul, tab, dan pop-up dialog harus memiliki file CSS Module terisolasi (`[ComponentName].module.css`).
   - Dilarang keras menumpuk inline styles panjang atau mencampur styling global tanpa scoping.
   - Menjamin isolasi penuh (zero selector collision) antara modul Channel Manager, Front Office, dan POS.

2. **Pemisahan Modul Terpisah untuk Web (Desktop) dan HP (Mobile):**
   - Untuk setiap fitur utama atau tampilan tabel/matriks yang kompleks, **selalu buat 2 modul terpisah**:
     - **Tampilan Web (Desktop):** `[Feature]DesktopView.tsx` + `[Feature]DesktopView.module.css` (dioptimalkan untuk keyboard shortcuts, multi-column data grid, master-detail side-by-side, dan high-density ledger).
     - **Tampilan HP (Mobile):** `[Feature]MobileView.tsx` + `[Feature]MobileView.module.css` (dioptimalkan untuk layar sentuh, card-based tabular views, bottom-sheet drawers, swipeable date carousels, dan tap targets minimal 44px).
   - Modul induk (container) bertugas me-render secara terpisah (menggunakan media query atau conditional rendering breakpoint), sehingga kode tetap terstruktur, performa rendering optimal, dan kode tidak membengkak menjadi file monolitik.

---

## 7. Copywriting & Content Rules

- **Zero Em Dashes:** Karakter `—` dilarang keras dalam teks UI. Gunakan koma (`,`), titik dua (`:`), titik (`.`), atau tanda kurung `()`.
- **Honest Copy:** Tidak ada klaim palsu atau buzzword pemasaran kosong ("revolutionary", "next-level", "cutting-edge"). Gunakan terminologi perhotelan yang presisi dan deskriptif ("Sinkronisasi ARI", "Paritas Tarif", "Pusat Notifikasi Channel & OTA").
- **Multi-Tenant Attribution:** Selalu tampilkan identitas properti hotel aktif (misal: `Properti: Hotel [14034]`) agar staf selalu yakin konteks data yang sedang dikonfigurasi.
