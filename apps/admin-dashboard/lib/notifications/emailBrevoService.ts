import { adminDb } from "@/lib/firebaseAdmin";
import { WhatsAppNotificationPayload as NotificationPayload } from "@/lib/notifications/whatsappMetaService";

export type EmailNotificationPayload = NotificationPayload;

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || "reservation@mytara.id";
const DEFAULT_SENDER_NAME = "My Tara";

/**
 * Normalizes and validates raw email inputs into an array of clean email addresses.
 * Supports comma, semicolon, space, or newline-separated values.
 * e.g., "owner@hotel.com, gm@hotel.com; fo@hotel.com" -> ["owner@hotel.com", "gm@hotel.com", "fo@hotel.com"]
 */
export function parseEmailRecipients(rawEmails: string | string[]): string[] {
    if (!rawEmails) return [];
    const list = Array.isArray(rawEmails) ? rawEmails : String(rawEmails).split(/[,;\s\n\r]+/);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalized = list
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 5 && emailRegex.test(e));
    return Array.from(new Set(normalized));
}

/**
 * Generates an elegant, high-conversion, responsive HTML email for booking notifications.
 * Strictly omits internal hotel net revenue and OTA commission percentages.
 */
export function buildEmailNotificationHtml(
    hotelName: string,
    payload: EmailNotificationPayload
): { subject: string; html: string } {
    const isCancel = payload.event === "booking_cancellation";
    const isModif = payload.event === "booking_modification";
    const isTest = payload.event === "test";

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
    } else if (isTest) {
        subject = `Uji Coba Sistem Notifikasi: ${hotelName}`;
        badgeBg = "#f5f5f4";
        badgeBorder = "#d6d3d1";
        badgeColor = "#44403c";
        badgeText = "UJI COBA SISTEM";
        headerTitle = "Uji Coba Pengiriman Notifikasi";
        headerDesc = "Email ini merupakan verifikasi fungsionalitas pengiriman resmi dari sistem My Tara ke manajemen hotel.";
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
      -moz-osx-font-smoothing: grayscale;
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
              ${hotelName}
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

/**
 * Dispatches Email Notification to hotel owner/GM using Brevo REST API.
 * Multi-recipient capable, tenant-safe.
 */
export async function sendEmailNotificationToOwner(
    hotelCode: string,
    payload: EmailNotificationPayload
): Promise<{ success: boolean; messageId?: string; deliveredCount?: number; totalRecipients?: number; error?: string; reason?: string }> {
    if (!hotelCode) return { success: false, reason: "hotelCode is required" };

    try {
        const hotelDoc = await adminDb.collection("hotels").doc(hotelCode).get();
        if (!hotelDoc.exists) {
            return { success: false, reason: `Hotel [${hotelCode}] tidak ditemukan.` };
        }

        const hotelData = hotelDoc.data() || {};
        const emailConfig = hotelData.emailNotification || {};

        // Check if email notification is enabled for this hotel
        const isEnabled = emailConfig.enabled !== false;
        if (!isEnabled && payload.event !== "test") {
            return { success: false, reason: `Notifikasi email dinonaktifkan untuk hotel ${hotelCode}.` };
        }

        // Check event toggle
        if (payload.event === "booking_cancellation" && emailConfig.notifyOnCancellation === false) {
            return { success: false, reason: "Notifikasi pembatalan via email dimatikan oleh owner." };
        }
        if (payload.event === "booking_new" && emailConfig.notifyOnNewBooking === false) {
            return { success: false, reason: "Notifikasi booking baru via email dimatikan oleh owner." };
        }
        if (payload.event === "booking_modification" && emailConfig.notifyOnModification === false) {
            return { success: false, reason: "Notifikasi perubahan reservasi via email dimatikan oleh owner." };
        }

        const rawTargets = payload.customRecipient || emailConfig.ownerEmail || hotelData.email || "";
        const targetEmails = parseEmailRecipients(rawTargets);

        if (targetEmails.length === 0) {
            return { success: false, reason: `Alamat email penerima belum diatur untuk hotel ${hotelCode}.` };
        }

        const apiKey = process.env.SMTP_PASS || process.env.BREVO_API_KEY;
        if (!apiKey) {
            return { success: false, error: "Brevo API Key (SMTP_PASS) belum dikonfigurasi di server (.env)." };
        }

        const hotelName = hotelData.name || hotelData.propertyName || `Hotel #${hotelCode}`;
        const senderEmail = emailConfig.senderEmail || DEFAULT_SENDER_EMAIL;
        const senderName = emailConfig.senderName || DEFAULT_SENDER_NAME;

        const { subject, html } = buildEmailNotificationHtml(hotelName, payload);

        // Call Brevo REST API
        const response = await fetch(BREVO_API_URL, {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                to: targetEmails.map(email => ({ email })),
                subject,
                htmlContent: html
            })
        });

        const data = await response.json();

        if (response.ok && data.messageId) {
            // Log audit trail to Firestore
            await adminDb.collection("hotels").doc(hotelCode).collection("email_logs").add({
                timestamp: new Date().toISOString(),
                event: payload.event,
                recipients: targetEmails,
                bookingRef: payload.bookingRef,
                guestName: payload.guestName,
                channelName: payload.channelName,
                status: "DELIVERED",
                messageId: data.messageId
            }).catch(() => {});

            return {
                success: true,
                messageId: data.messageId,
                deliveredCount: targetEmails.length,
                totalRecipients: targetEmails.length
            };
        } else {
            const errorMsg = data.message || JSON.stringify(data);
            console.error(`[Brevo Email Error for Hotel ${hotelCode}]:`, errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        }
    } catch (err: any) {
        console.error(`[Brevo Email Network/Runtime Error for Hotel ${hotelCode}]:`, err);
        return {
            success: false,
            error: err.message || "Gagal mengirim email notifikasi via Brevo."
        };
    }
}
