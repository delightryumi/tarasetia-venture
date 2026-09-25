# Antislop AI Coding Standards & UI Filter

Setiap kali menghasilkan kode, komponen antarmuka (UI), penulisan teks (copy), layout responsif, atau komentar kode di proyek ini, filter **antislop** wajib diterapkan secara ketat.

## 1. Skills Tersedia di Workspace
- **Core Filter (Selalu Aktif)**: `.agents/skills/antislop/SKILL.md`
- **UI / Visual Craft**: `.agents/skills/antislop-ui/SKILL.md`
- **Aksesibilitas & Kontras Manusia**: `.agents/skills/antislop-human/SKILL.md`
- **Copywriting & Nada Alami**: `.agents/skills/antislop-copywriting/SKILL.md`
- **Mobile & Layout Responsif**: `.agents/skills/antislop-layoutmobile/SKILL.md`
- **Code Comments Hygiene**: `.agents/skills/antislop-code/SKILL.md`

## 2. Aturan Utama (Hard Gates & Purpose Gates)
1. **Bebas AI Slop & Buzzwords**:
   - Dilarang menggunakan em dash (`—`) pada copy UI. Gunakan koma, titik, tanda titik dua, atau tanda kurung.
   - Dilarang menggunakan kata klise AI: "Revolutionary", "Seamless", "Cutting Edge", "AI Powered", "Ultimate", dll.
2. **Desain Berkarakter & Bertujuan (Purpose-Driven)**:
   - Dilarang menumpuk tren tanpa tujuan (gradient ungu-biru generik, glassmorphism berlebih, efek glow di semua tempat, border radius pil di semua elemen).
   - Setiap elemen visual harus memiliki alasan hierarki atau identitas yang jelas.
3. **Aksesibilitas & Manusia (WCAG AA)**:
   - Kontras warna teks minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar.
   - Navigasi keyboard penuh (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape` untuk modal).
   - Indikator fokus yang jelas (`focus-visible`).
4. **Kelengkapan Fungsional & State**:
   - Setiap tombol, dropdown, form, dan navigasi harus berfungsi nyata. Dilarang membuat tombol mati/dummy tanpa tujuan.
   - Komponen data wajib memiliki 3 state: **Loading**, **Empty**, dan **Error**.
5. **Mobile Responsiveness**:
   - Bebas horizontal overflow di mobile.
   - Target sentuh minimal 44x44px.
6. **Verifikasi Sebelum Selesai**:
   - Selalu uji/validasi kode dan interaksi sebelum menandai tugas selesai.
