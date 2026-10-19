import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually for standalone script execution
const envFile = readFileSync(resolve("./apps/admin-dashboard/.env.local"), "utf8");
const envVars = {};
for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        envVars[key] = val;
    }
}

const BREVO_API_KEY = envVars.SMTP_PASS || "";
const SENDER_EMAIL = envVars.SMTP_FROM_EMAIL || "reservation@mytara.id";
const SENDER_NAME = "My Tara";
const TARGET_EMAIL = "ktnbgstrdp@gmail.com";

if (!BREVO_API_KEY) {
    console.error("Error: SMTP_PASS (Brevo API Key) not found in .env.local");
    process.exit(1);
}

function buildEmailHtml(payload) {
    const isCancel = payload.event === "booking_cancellation";
    const isModif = payload.event === "booking_modification";

    const formattedPrice = typeof payload.totalPrice === "number"
        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(payload.totalPrice)
        : (payload.totalPrice ? String(payload.totalPrice) : "Rp 0");

    let subject = `Konfirmasi Reservasi: #${payload.bookingRef} - ${payload.guestName} (${payload.channelName || "OTA"})`;
    let badgeBg = "#f0fdf4";
    let badgeBorder = "#bbf7d0";
    let badgeColor = "#166534";
    let badgeText = "RESERVASI TERKONFIRMASI";
    let headerTitle = "Reservasi Baru Diterima";
    let headerDesc = "Pemesanan kamar baru telah masuk dan slot inventori kalender telah berhasil dialokasikan.";

    if (isCancel) {
        subject = `Pembatalan Reservasi: #${payload.bookingRef} - ${payload.guestName} (${payload.channelName || "OTA"})`;
        badgeBg = "#fef2f2";
        badgeBorder = "#fecaca";
        badgeColor = "#991b1b";
        badgeText = "RESERVASI DIBATALKAN";
        headerTitle = "Pembatalan Reservasi";
        headerDesc = "Tamu telah membatalkan pemesanan melalui OTA. Kamar telah otomatis dirilis kembali ke ketersediaan sistem.";
    } else if (isModif) {
        subject = `Perubahan Jadwal: #${payload.bookingRef} - ${payload.guestName} (${payload.channelName || "OTA"})`;
        badgeBg = "#f1f5f9";
        badgeBorder = "#cbd5e1";
        badgeColor = "#334155";
        badgeText = "MODIFIKASI JADWAL";
        headerTitle = "Perubahan Jadwal Reservasi";
        headerDesc = "Tamu telah melakukan modifikasi tanggal menginap. Jadwal PMS dan ketersediaan OTA telah diperbarui otomatis.";
    }

    const mealLabel = payload.mealsIncluded !== undefined
        ? (payload.mealsIncluded ? "Termasuk Sarapan" : "Hanya Kamar (Room Only)")
        : "Sesuai Ketentuan Saluran";

    const hasRescheduleDiff = isModif && Boolean(payload.previousArrivalDate && payload.previousDepartureDate);

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f6f3;
      color: #292524;
      margin: 0;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    }
    .hotel-masthead {
      background: #231618;
      padding: 18px 24px;
      border-bottom: 2px solid #5c0f1e;
    }
    .masthead-tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #d6b4b8;
      margin-bottom: 4px;
    }
    .hotel-name {
      font-family: Georgia, 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .body-content {
      padding: 28px 28px 24px 28px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border-radius: 4px;
      background: ${badgeBg};
      border: 1px solid ${badgeBorder};
      color: ${badgeColor};
      margin-bottom: 12px;
    }
    .section-headline {
      font-size: 19px;
      font-weight: 700;
      color: #1c1917;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .section-subtext {
      font-size: 13px;
      color: #78716c;
      margin: 0 0 22px 0;
      line-height: 1.5;
    }
    .diff-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 22px;
    }
    .diff-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 8px;
    }
    .diff-grid {
      display: table;
      width: 100%;
    }
    .diff-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      font-size: 12.5px;
      line-height: 1.4;
    }
    .diff-col b {
      color: #0f172a;
    }
    .cancel-notice {
      background: #fef2f2;
      border-left: 3px solid #dc2626;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12.5px;
      color: #991b1b;
      line-height: 1.5;
      margin-bottom: 22px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      border: 1px solid #f0eee9;
      border-radius: 6px;
      overflow: hidden;
    }
    .data-row {
      border-bottom: 1px solid #f5f5f4;
    }
    .data-row:last-child {
      border-bottom: none;
    }
    .data-row:nth-child(even) {
      background: #fafaf9;
    }
    .data-cell-label {
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 500;
      color: #78716c;
      width: 38%;
      vertical-align: middle;
    }
    .data-cell-value {
      padding: 10px 14px;
      font-size: 12.5px;
      font-weight: 600;
      color: #1c1917;
      text-align: right;
      vertical-align: middle;
    }
    .mono-code {
      font-family: SFMono-Regular, Consolas, Monaco, monospace;
      font-size: 12px;
      background: #f5f5f4;
      padding: 2px 6px;
      border-radius: 3px;
      border: 1px solid #e7e5e4;
      color: #292524;
    }
    .price-value {
      font-size: 14.5px;
      font-weight: 700;
      color: ${isCancel ? '#991b1b' : '#166534'};
    }
    .guest-note-box {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 22px;
    }
    .guest-note-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #78716c;
      margin-bottom: 4px;
    }
    .guest-note-text {
      font-size: 12.5px;
      font-style: italic;
      color: #44403c;
      line-height: 1.45;
    }
    .operational-box {
      background: #f7f7f6;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 12px;
      color: #57534e;
      line-height: 1.55;
    }
    .operational-box b {
      color: #292524;
    }
    .footer-masthead {
      background: #fafaf9;
      border-top: 1px solid #e7e5e4;
      padding: 16px 28px;
      font-size: 11px;
      color: #a8a29e;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hotel-masthead">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <img src="https://live.mytara.id/channels/6.png" alt="Tara" height="26" style="height: 26px; width: auto; max-height: 26px; display: block; border: 0;" />
            <div style="font-size: 9.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #d6b4b8; margin-top: 4px;">
              Central Reservation System
            </div>
          </td>
          <td style="vertical-align: middle; text-align: right;">
            <div style="font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #d6b4b8; opacity: 0.85;">Properti Hotel:</div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; font-weight: 600; color: #ffffff; letter-spacing: -0.01em; margin-top: 2px;">
              Bumi Anyom Resort
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div class="body-content">
      <div class="status-badge">${badgeText}</div>
      <h2 class="section-headline">${headerTitle}</h2>
      <p class="section-subtext">${headerDesc}</p>

      ${hasRescheduleDiff ? `
      <div class="diff-container">
        <div class="diff-title">Perbandingan Perubahan Jadwal</div>
        <div class="diff-grid">
          <div class="diff-col" style="padding-right: 12px; border-right: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 11px;">JADWAL SEMULA:</span><br>
            <b>${payload.previousArrivalDate}</b> s/d <b>${payload.previousDepartureDate}</b>
          </div>
          <div class="diff-col" style="padding-left: 12px;">
            <span style="color: #0369a1; font-size: 11px;">JADWAL BARU:</span><br>
            <b>${payload.arrivalDate}</b> s/d <b>${payload.departureDate}</b> (${payload.nights || 1} Malam)
          </div>
        </div>
      </div>
      ` : ""}

      ${isCancel ? `
      <div class="cancel-notice">
        <strong>Pemberitahuan Pembatalan:</strong><br>
        Reservasi ini telah dibatalkan di sistem. Seluruh unit kamar telah otomatis dikembalikan ke inventori penjualan channel manager.
        ${payload.cancellationReason ? `<br><span style="margin-top: 4px; display: inline-block;">Catatan Saluran: <em>${payload.cancellationReason}</em></span>` : ""}
      </div>
      ` : ""}

      <table class="data-table" cellpadding="0" cellspacing="0">
        <tr class="data-row">
          <td class="data-cell-label">Saluran Pemesanan</td>
          <td class="data-cell-value">${payload.channelName || "OTA Channel"}</td>
        </tr>
        <tr class="data-row">
          <td class="data-cell-label">Nomor Reservasi</td>
          <td class="data-cell-value"><span class="mono-code">${payload.bookingRef}</span></td>
        </tr>
        ${payload.revisionId ? `
        <tr class="data-row">
          <td class="data-cell-label">ID Revisi OTA</td>
          <td class="data-cell-value"><span class="mono-code" style="font-size: 11px;">${payload.revisionId}</span></td>
        </tr>
        ` : ""}
        <tr class="data-row">
          <td class="data-cell-label">Nama Tamu</td>
          <td class="data-cell-value">${payload.guestName}</td>
        </tr>
        ${payload.guestPhone ? `
        <tr class="data-row">
          <td class="data-cell-label">Kontak Telepon</td>
          <td class="data-cell-value">${payload.guestPhone}</td>
        </tr>
        ` : ""}
        ${payload.guestEmail ? `
        <tr class="data-row">
          <td class="data-cell-label">Alamat Email</td>
          <td class="data-cell-value">${payload.guestEmail}</td>
        </tr>
        ` : ""}
        <tr class="data-row">
          <td class="data-cell-label">Tipe Kamar</td>
          <td class="data-cell-value">${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Kamar)` : ""}</td>
        </tr>
        ${payload.pax ? `
        <tr class="data-row">
          <td class="data-cell-label">Jumlah Tamu</td>
          <td class="data-cell-value">${payload.pax} Orang</td>
        </tr>
        ` : ""}
        <tr class="data-row">
          <td class="data-cell-label">Paket Sarapan</td>
          <td class="data-cell-value">${mealLabel}</td>
        </tr>
        <tr class="data-row">
          <td class="data-cell-label">Tanggal Kedatangan (Check-in)</td>
          <td class="data-cell-value">${payload.arrivalDate}</td>
        </tr>
        <tr class="data-row">
          <td class="data-cell-label">Tanggal Kepulangan (Check-out)</td>
          <td class="data-cell-value">${payload.departureDate} (${payload.nights || 1} Malam)</td>
        </tr>
        <tr class="data-row">
          <td class="data-cell-label">${isCancel ? "Nilai Pemesanan Asal" : "Total Tagihan Tamu"}</td>
          <td class="data-cell-value price-value">${formattedPrice}</td>
        </tr>
        <tr class="data-row">
          <td class="data-cell-label">Ketentuan Pembayaran</td>
          <td class="data-cell-value">${payload.paymentStatus || "Sesuai Kebijakan OTA"}</td>
        </tr>
      </table>

      ${(payload.customNote || payload.notes) ? `
      <div class="guest-note-box">
        <div class="guest-note-label">Permintaan Khusus Tamu</div>
        <div class="guest-note-text">"${payload.customNote || payload.notes}"</div>
      </div>
      ` : ""}

      <div class="operational-box">
        <b>Catatan Operasional Front Desk:</b><br>
        ${isCancel
          ? "Status reservasi pada PMS telah diperbarui menjadi DIBATALKAN. Tidak diperlukan persiapan kamar untuk kedatangan ini."
          : (isModif
            ? "Jadwal menginap telah berhasil disesuaikan pada kalender kamar PMS. Pastikan log catatan pemesanan telah sinkron dengan Front Desk."
            : "Alokasi kamar telah dikunci pada kalender PMS. Mohon siapkan pendaftaran kedatangan tamu sesuai tanggal check-in.")}
      </div>
    </div>

    <div class="footer-masthead">
      Notifikasi resmi dikirimkan secara otomatis oleh My Tara Central Reservation System.<br>
      Waktu Pemrosesan: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
    </div>
  </div>
</body>
</html>
`;
    return { subject, html };
}

async function sendEmail(payload) {
    const { subject, html } = buildEmailHtml(payload);
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": BREVO_API_KEY,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: SENDER_NAME,
                email: SENDER_EMAIL
            },
            to: [{ email: TARGET_EMAIL }],
            subject,
            htmlContent: html
        })
    });

    const data = await res.json();
    if (res.ok && data.messageId) {
        console.log(`[SUCCESS] Sent [${payload.event}] -> MessageId: ${data.messageId}`);
    } else {
        console.error(`[FAILED] [${payload.event}]:`, JSON.stringify(data));
    }
}

async function main() {
    console.log(`Starting delivery of 3 sample emails to ${TARGET_EMAIL}...`);
    console.log(`Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`);

    // 1. Reservasi Baru
    await sendEmail({
        event: "booking_new",
        channelName: "Traveloka",
        bookingRef: "TRV-882190",
        guestName: "Bpk. Hendra Pratama",
        guestPhone: "+62 812-9876-5432",
        guestEmail: "hendra.pratama@example.com",
        roomName: "Deluxe Executive Garden View",
        roomCount: 1,
        pax: 2,
        mealsIncluded: true,
        arrivalDate: "2026-10-24",
        departureDate: "2026-10-26",
        nights: 2,
        totalPrice: 2450000,
        paymentStatus: "Prabayar Saluran (Paid via Traveloka)",
        notes: "Mohon disiapkan kamar bebas asap rokok dan di lantai atas jika memungkinkan. Terima kasih."
    });

    // 2. Perubahan Jadwal (Reschedule)
    await sendEmail({
        event: "booking_modification",
        channelName: "Agoda",
        bookingRef: "AGD-441029",
        revisionId: "REV-AGD-2",
        guestName: "Ibu Clarissa Anggraeni",
        guestPhone: "+62 813-1122-3344",
        guestEmail: "clarissa.anggraeni@example.com",
        roomName: "Grand Suite Pool Terrace",
        roomCount: 1,
        pax: 2,
        mealsIncluded: true,
        previousArrivalDate: "2026-10-25",
        previousDepartureDate: "2026-10-27",
        arrivalDate: "2026-10-28",
        departureDate: "2026-10-31",
        nights: 3,
        totalPrice: 4850000,
        paymentStatus: "Prabayar Saluran (Agoda Guaranteed)",
        notes: "Pengunduran jadwal penerbangan 3 hari ke depan. Mohon konfirmasi ketersediaan kamar yang sama."
    });

    // 3. Pembatalan Reservasi
    await sendEmail({
        event: "booking_cancellation",
        channelName: "Booking.com",
        bookingRef: "BKC-319802",
        guestName: "Bpk. Rahmat Wicaksono",
        guestPhone: "+62 811-5566-7788",
        guestEmail: "rahmat.wicaksono@example.com",
        roomName: "Superior Twin Room",
        roomCount: 1,
        pax: 2,
        mealsIncluded: false,
        arrivalDate: "2026-10-24",
        departureDate: "2026-10-25",
        nights: 1,
        totalPrice: 1150000,
        paymentStatus: "Batal Tanpa Biaya (Free Cancellation Policy)",
        cancellationReason: "Perubahan rencana dinas kerja luar kota."
    });

    console.log("All 3 emails have been processed!");
}

main().catch(console.error);
