
interface SendEmailParams {
  toEmail: string;
  hotelCode: string;
  hotelName: string;
  defaultPassword: string;
}

export async function sendWelcomeEmail({ toEmail, hotelCode, hotelName, defaultPassword }: SendEmailParams) {
  const pass = process.env.SMTP_PASS; // Brevo API/SMTP Key
  const fromEmail = process.env.SMTP_FROM_EMAIL || "delightryumi@gmail.com";

  console.log("DEBUG emailHelper.ts (Brevo REST API) - sendWelcomeEmail dipanggil:");
  console.log("- From:", fromEmail);
  console.log("- To:", toEmail);
  console.log("- API Key length:", pass ? pass.length : 0);

  if (!pass) {
    console.warn("SMTP_PASS (Brevo API Key) tidak dikonfigurasi di file .env. Pengiriman email diabaikan.");
    return false;
  }

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Selamat Datang di Nexura CRS</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #faf8f4;
          color: #333840;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 650px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #e6dfd8;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 25px rgba(141, 122, 82, 0.05);
        }
        .header {
          background-color: #181d26;
          padding: 32px;
          text-align: center;
          border-bottom: 4px solid #c5a880;
        }
        .logo {
          height: 40px;
          width: auto;
        }
        .content {
          padding: 40px;
        }
        h1 {
          font-size: 22px;
          font-weight: 500;
          color: #181d26;
          margin-top: 0;
          margin-bottom: 24px;
          font-family: Georgia, serif;
        }
        p {
          font-size: 14px;
          line-height: 1.6;
          color: #41454d;
          margin-bottom: 20px;
        }
        .credentials-box {
          background-color: #faf8f4;
          border: 1px solid #e6dfd8;
          border-radius: 12px;
          padding: 24px;
          margin: 28px 0;
        }
        .cred-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(141, 122, 82, 0.08);
          font-size: 13.5px;
        }
        .cred-item:last-child {
          border-bottom: none;
        }
        .cred-label {
          color: #8d7a52;
          font-weight: 500;
        }
        .cred-value {
          font-family: monospace;
          font-weight: 600;
          color: #181d26;
        }
        .btn {
          display: inline-block;
          background-color: #181d26;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          margin-top: 10px;
          box-shadow: 0 4px 12px rgba(24, 29, 38, 0.1);
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #a1a1aa;
          border-top: 1px solid #e6dfd8;
        }
        .footer a {
          color: #8d7a52;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://firebasestorage.googleapis.com/v0/b/crs-nexura.appspot.com/o/public%2Fnexura-logo.png?alt=media" alt="Nexura Logo" class="logo">
        </div>
        <div class="content">
          <h1>Selamat Datang di Nexura Global Hospitality</h1>
          <p>Halo,</p>
          <p>
            Sistem Central Reservation System (CRS) untuk properti hotel Anda, <strong>${hotelName}</strong>, telah berhasil diregistrasikan di platform Nexura.
          </p>
          <p>Berikut adalah rincian kredensial akun administrator Anda untuk masuk ke sistem:</p>
          
          <div class="credentials-box">
            <div class="cred-item">
              <span class="cred-label">Link Dashboard:</span>
              <span class="cred-value">${dashboardUrl}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Kode Hotel (Hotel Code):</span>
              <span class="cred-value">${hotelCode}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Email Login:</span>
              <span class="cred-value">${toEmail}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Password Sementara:</span>
              <span class="cred-value" style="color: #b91c1c;">${defaultPassword}</span>
            </div>
          </div>
          
          <p>
            Demi keamanan data operasional hotel Anda, harap segera mengganti password sementara ini di halaman pengaturan akun setelah Anda berhasil melakukan login pertama kali.
          </p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${dashboardUrl}/login" class="btn">Masuk Ke Dashboard CRS</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Nexura Global Hospitality. All rights reserved.</p>
          <p>Butuh bantuan? Hubungi kami di <a href="mailto:nexura.management@gmail.com">nexura.management@gmail.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log("Mengirim email via Brevo REST API...");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": pass,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: "Nexura Global Hospitality",
        email: fromEmail
      },
      to: [
        {
          email: toEmail
        }
      ],
      subject: `[Nexura CRS] Akun Administrator CRS - ${hotelName}`,
      htmlContent: emailHtml
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    console.error("Gagal mengirim email via Brevo API:", errData);
    throw new Error(errData.message || "Gagal mengirim email via Brevo REST API");
  }

  const resData = await response.json();
  console.log("Email sukses terkirim via Brevo REST API! Message ID:", resData.messageId);
  return true;
}
