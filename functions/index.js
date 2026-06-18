const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// Hardcoded or use environment variables for Brevo API Key
// Here we use the key retrieved from your .env.local
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = "delightryumi@gmail.com";
const SENDER_NAME = "Setara Venture";

/**
 * Returns a formatted date string (YYYY-MM-DD) for Asia/Jakarta
 * @param {number} offsetDays Number of days to add/subtract
 */
function getJakartaDateString(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  // 'sv-SE' correctly formats as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Sends an email using Brevo's REST API
 */
async function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`[Email Sent] Successfully sent warning to ${toEmail}. MessageID: ${response.data.messageId}`);
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${toEmail}:`, error?.response?.data || error.message);
  }
}

/**
 * Core business logic to process billing status
 */
async function processBilling() {
  const todayStr = getJakartaDateString(0);
  const h3DateStr = getJakartaDateString(3); // 3 Days ahead from today
  
  const db = admin.firestore();
  // Fetch active hotels
  const hotelsSnapshot = await db.collection("hotels").where("active", "==", true).get();
  
  if (hotelsSnapshot.empty) {
    console.log("No active hotels found.");
    return { processed: 0, suspended: 0, warned: 0 };
  }

  const batch = db.batch();
  let suspendCount = 0;
  let warnCount = 0;

  for (const doc of hotelsSnapshot.docs) {
    const hotelData = doc.data();
    const billing = hotelData.billing;
    
    if (!billing || !billing.nextDueDate) continue;

    // e.g., "2026-06-18"
    const dueDateStr = billing.nextDueDate.substring(0, 10);
    const hotelName = hotelData.name || "Partner";
    
    // Find email in various possible schema fields
    const hotelEmail = hotelData.email || hotelData.contactEmail || hotelData.pic_contact || "";

    if (dueDateStr < todayStr) {
      // EXPIRED -> Auto Suspend
      batch.update(doc.ref, { 
        active: false,
        "billing.status": "suspended",
        "billing.showBillingAlert": true
      });
      suspendCount++;
      console.log(`[Suspended] Tenant ${doc.id} (${hotelName}) - Due Date: ${dueDateStr}`);
    } else if (dueDateStr === h3DateStr && hotelEmail) {
      // WARNING H-3
      warnCount++;
      console.log(`[Warning H-3] Tenant ${doc.id} (${hotelName}) - Due in 3 days (${dueDateStr}). Sending email...`);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #1E3932; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Setara Venture</h1>
          </div>
          <div style="padding: 32px; background-color: #FAF8F4; color: #333;">
            <h2 style="margin-top: 0; color: #1E3932;">Peringatan Jatuh Tempo Tagihan</h2>
            <p>Halo <strong>${hotelName}</strong>,</p>
            <p>Ini adalah pengingat otomatis bahwa masa berlangganan sistem Setara CRS Anda akan berakhir dalam <strong>3 Hari</strong> pada tanggal <strong>${dueDateStr}</strong>.</p>
            <p>Mohon segera selesaikan pembayaran perpanjangan layanan untuk menghindari pemblokiran (*suspend*) akses ke sistem secara otomatis pada pukul 00:00 setelah tanggal jatuh tempo.</p>
            <p>Jika Anda telah melakukan pembayaran, abaikan email ini atau hubungi tim Admin Setara Venture untuk konfirmasi.</p>
            <br/>
            <p>Terima kasih,<br/><strong>Tim Setara Venture</strong></p>
          </div>
        </div>
      `;
      
      // We don't await sequentially if there are many to prevent timeouts, but for a few it's fine.
      await sendBrevoEmail(hotelEmail, hotelName, `[Peringatan] Tagihan Jatuh Tempo H-3 - ${hotelName}`, emailHtml);
    }
  }

  if (suspendCount > 0) {
    await batch.commit();
    console.log(`Successfully suspended ${suspendCount} tenants.`);
  }
  
  return { processed: hotelsSnapshot.size, suspended: suspendCount, warned: warnCount };
}

// 1. Cron Job: Runs daily at 00:00 Asia/Jakarta
exports.centralBillingWorker = onSchedule({
  schedule: "0 0 * * *",
  timeZone: "Asia/Jakarta",
  retryCount: 3,
  memory: "256MiB"
}, async (event) => {
  console.log("Starting daily central billing worker (Cron Job)...");
  await processBilling();
});

// 2. HTTP Endpoint for Manual Testing
exports.testBillingWorker = onRequest(async (req, res) => {
  try {
    const result = await processBilling();
    res.status(200).json({ success: true, message: "Worker executed successfully", result });
  } catch (error) {
    console.error("Manual test error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
