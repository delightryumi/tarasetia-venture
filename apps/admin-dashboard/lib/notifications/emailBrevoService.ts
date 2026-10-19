import { adminDb } from "@/lib/firebaseAdmin";
import { WhatsAppNotificationPayload as NotificationPayload } from "@/lib/notifications/whatsappMetaService";

export type EmailNotificationPayload = NotificationPayload;

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER_EMAIL = process.env.SMTP_FROM_EMAIL || "delightryumi@gmail.com";
const DEFAULT_SENDER_NAME = "Tara Hotel System";

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

    let subject = `🛎️ [RESERVASI BARU] ${payload.bookingRef} - ${payload.guestName} (${payload.channelName || "OTA"})`;
    let badgeBg = "#ecfdf5";
    let badgeColor = "#065f46";
    let badgeText = "RESERVASI BARU";
    let headerTitle = "Reservasi Baru Masuk";
    let headerDesc = "Pemesanan baru telah berhasil diterima dan dikonfirmasi ke kalender kamar.";

    if (isCancel) {
        subject = `🚨 [PEMBATALAN OTA] ${payload.bookingRef} - ${payload.guestName} (${payload.channelName || "OTA"})`;
        badgeBg = "#fef2f2";
        badgeColor = "#991b1b";
        badgeText = "DIBATALKAN (CANCELLED)";
        headerTitle = "Pembatalan Reservasi OTA";
        headerDesc = "Tamu telah membatalkan pemesanan. Slot kamar telah otomatis dirilis kembali ke seluruh OTA.";
    } else if (isModif) {
        subject = `✏️ [RESCHEDULE OTA] ${payload.bookingRef} - ${payload.guestName} (${payload.channelName || "OTA"})`;
        badgeBg = "#eff6ff";
        badgeColor = "#1e40af";
        badgeText = "MODIFIKASI JADWAL (RESCHEDULE)";
        headerTitle = "Perubahan Jadwal Reservasi";
        headerDesc = "Jadwal menginap telah diubah oleh tamu/OTA. Kalender PMS dan ketersediaan telah disesuaikan otomatis.";
    } else if (isTest) {
        subject = `🧪 [UJI COBA EMAIL] Notifikasi Resmi Brevo Cloud Relay - ${hotelName}`;
        badgeBg = "#f3e8ff";
        badgeColor = "#6b21a8";
        badgeText = "SYSTEM TEST";
        headerTitle = "Uji Coba Pengiriman Email";
        headerDesc = "Ini adalah email uji coba untuk memverifikasi integrasi Brevo Cloud Relay dengan My Tara CRS.";
    }

    const mealLabel = payload.mealsIncluded !== undefined
        ? (payload.mealsIncluded ? "Termasuk Sarapan (With Breakfast)" : "Hanya Kamar (Room Only)")
        : "Sesuai Paket OTA";

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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f5;
      color: #18181b;
      margin: 0;
      padding: 24px 12px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e4e4e7;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header-bar {
      background: #5c0f1e;
      color: #ffffff;
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-bar h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header-bar span {
      font-size: 12px;
      opacity: 0.85;
    }
    .content {
      padding: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: ${badgeBg};
      color: ${badgeColor};
      margin-bottom: 12px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #09090b;
      margin: 0 0 6px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #71717a;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }
    .info-card {
      background: #fafafa;
      border: 1px solid #f4f4f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f4f4f5;
      font-size: 13px;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #71717a;
      font-weight: 500;
    }
    .info-value {
      color: #18181b;
      font-weight: 600;
      text-align: right;
    }
    .highlight-box {
      background: ${isCancel ? "#fff1f2" : (isModif ? "#eff6ff" : "#fdf2f4")};
      border-left: 4px solid ${isCancel ? "#e11d48" : (isModif ? "#2563eb" : "#5c0f1e")};
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #27272a;
      margin-bottom: 20px;
    }
    .action-summary {
      background: #f4f4f5;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 12px;
      color: #52525b;
      line-height: 1.6;
    }
    .action-summary b {
      color: #18181b;
    }
    .footer {
      background: #fafafa;
      padding: 18px 24px;
      text-align: center;
      font-size: 11px;
      color: #a1a1aa;
      border-top: 1px solid #f4f4f5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header-bar">
      <div>
        <h2>${hotelName}</h2>
        <span>My Tara Central Reservation System</span>
      </div>
    </div>
    <div class="content">
      <div class="badge">${badgeText}</div>
      <h1 class="title">${headerTitle}</h1>
      <p class="subtitle">${headerDesc}</p>

      ${hasRescheduleDiff ? `
      <div class="highlight-box">
        <strong>Perubahan Jadwal Ditemukan:</strong><br>
        📅 <b>Jadwal Baru:</b> ${payload.arrivalDate} s/d ${payload.departureDate} (${payload.nights || 1} Malam)<br>
        ⏳ <b>Jadwal Lama:</b> ${payload.previousArrivalDate} s/d ${payload.previousDepartureDate}
      </div>
      ` : ""}

      ${isCancel ? `
      <div class="highlight-box">
        <strong>Status Pembatalan:</strong><br>
        Kamar telah dilepas dari sistem dan dikembalikan otomatis ke inventori seluruh saluran OTA.
        ${payload.cancellationReason ? `<br><em>Alasan: ${payload.cancellationReason}</em>` : ""}
      </div>
      ` : ""}

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Saluran Pemesanan</span>
          <span class="info-value">${payload.channelName || "OTA Channel"}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor Reservasi OTA</span>
          <span class="info-value" style="font-family: monospace; font-size: 13.5px;">${payload.bookingRef}</span>
        </div>
        ${payload.revisionId ? `
        <div class="info-row">
          <span class="info-label">ID Revisi Sistem</span>
          <span class="info-value" style="font-family: monospace; font-size: 11.5px; color: #71717a;">${payload.revisionId}</span>
        </div>
        ` : ""}
        <div class="info-row">
          <span class="info-label">Nama Tamu</span>
          <span class="info-value">${payload.guestName}</span>
        </div>
        ${payload.guestPhone ? `
        <div class="info-row">
          <span class="info-label">No. Telepon Tamu</span>
          <span class="info-value">${payload.guestPhone}</span>
        </div>
        ` : ""}
        ${payload.guestEmail ? `
        <div class="info-row">
          <span class="info-label">Email Tamu</span>
          <span class="info-value">${payload.guestEmail}</span>
        </div>
        ` : ""}
        <div class="info-row">
          <span class="info-label">Tipe Kamar</span>
          <span class="info-value">${payload.roomName}${payload.roomCount && payload.roomCount > 1 ? ` (${payload.roomCount} Kamar)` : ""}</span>
        </div>
        ${payload.pax ? `
        <div class="info-row">
          <span class="info-label">Jumlah Tamu</span>
          <span class="info-value">${payload.pax} Tamu</span>
        </div>
        ` : ""}
        <div class="info-row">
          <span class="info-label">Paket Sarapan</span>
          <span class="info-value">${mealLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Check-in</span>
          <span class="info-value">${payload.arrivalDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tanggal Check-out</span>
          <span class="info-value">${payload.departureDate} ${payload.nights ? `(${payload.nights} Malam)` : ""}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${isCancel ? "Tarif Asal (Dibatalkan)" : "Total Tarif Tamu"}</span>
          <span class="info-value" style="font-size: 15px; color: ${isCancel ? '#991b1b' : '#047857'};">${formattedPrice}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Metode Pembayaran</span>
          <span class="info-value">${payload.paymentStatus || "Sesuai OTA"}</span>
        </div>
      </div>

      ${(payload.customNote || payload.notes) ? `
      <div style="margin-bottom: 20px;">
        <span style="font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase;">Catatan / Permintaan Khusus Tamu:</span>
        <div style="background: #fafafa; border: 1px solid #e4e4e7; padding: 12px; border-radius: 6px; font-size: 13px; color: #27272a; margin-top: 6px;">
          "${payload.customNote || payload.notes}"
        </div>
      </div>
      ` : ""}

      <div class="action-summary">
        ⚡ <b>Tindakan Otomatis Sistem:</b><br>
        ${isCancel
          ? "• Status reservasi di Front Desk telah ditandai sebagai DIBATALKAN.<br>• Ketersediaan kamar telah dipulihkan dan disinkronkan ke seluruh OTA."
          : (isModif
            ? "• Jadwal lama telah dilepas & kamar pada tanggal baru berhasil diblokir.<br>• Kalender inventori PMS & Channex telah diperbarui secara otomatis."
            : "• Kamar telah diblokir di kalender PMS untuk tanggal kedatangan di atas.<br>• Pembaruan ketersediaan telah diteruskan ke Channex Channel Manager.")}
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">Notifikasi Resmi Otomatis dikirim oleh <b>My Tara Central Reservation System</b> via Brevo Cloud Relay.</p>
      <p style="margin: 0;">Waktu pengiriman: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</p>
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

        const senderEmail = emailConfig.senderEmail || DEFAULT_SENDER_EMAIL;
        const senderName = emailConfig.senderName || `${hotelData.name || "Tara PMS"} via Setara`;
        const hotelName = hotelData.name || hotelData.propertyName || `Hotel #${hotelCode}`;

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
