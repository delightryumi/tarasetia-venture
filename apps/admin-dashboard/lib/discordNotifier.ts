/**
 * Discord Real-time Crash & Alert Dispatcher for Tara CRS
 * Sends rich formatted embed alerts directly to the configured Discord Webhook.
 */

interface DiscordAlertOptions {
  title: string;
  message: string;
  stack?: string;
  level?: "error" | "warning" | "info" | "critical";
  source?: "frontend" | "backend" | "api" | "pos" | "booking";
  url?: string;
  eventId?: string;
  userEmail?: string;
  hotelCode?: string;
}

export async function sendDiscordAlert(options: DiscordAlertOptions): Promise<boolean> {
  const webhookUrl =
    typeof process !== "undefined"
      ? process.env.DISCORD_WEBHOOK_URL || process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL
      : "";

  if (!webhookUrl) {
    return false;
  }

  const levelColors: Record<string, number> = {
    critical: 0xdc2626, // Red
    error: 0xe11d48, // Rose
    warning: 0xf59e0b, // Amber
    info: 0x3b82f6, // Blue
  };

  const levelEmojis: Record<string, string> = {
    critical: "🚨 [CRITICAL CRASH]",
    error: "🔴 [ERROR ALERT]",
    warning: "⚠️ [WARNING]",
    info: "ℹ️ [SYSTEM INFO]",
  };

  const color = levelColors[options.level || "error"] || 0xe11d48;
  const emoji = levelEmojis[options.level || "error"] || "🔴 [ERROR ALERT]";

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: "Sistem / App", value: "Tara CRS & POS", inline: true },
    { name: "Sumber", value: options.source?.toUpperCase() || "SYSTEM", inline: true },
    { name: "Environment", value: process.env.NODE_ENV || "development", inline: true },
  ];

  if (options.eventId) {
    fields.push({
      name: "Sentry Event ID",
      value: `\`${options.eventId}\``,
      inline: true,
    });
  }

  if (options.hotelCode) {
    fields.push({ name: "Hotel Code", value: options.hotelCode, inline: true });
  }

  if (options.userEmail) {
    fields.push({ name: "User", value: options.userEmail, inline: true });
  }

  if (options.url) {
    fields.push({ name: "Halaman / Endpoint", value: `\`${options.url}\``, inline: false });
  }

  let description = `**Pesan**: ${options.message}`;
  if (options.stack) {
    const cleanStack = options.stack.split("\n").slice(0, 5).join("\n");
    description += `\n\n**Stack Trace**:\n\`\`\`typescript\n${cleanStack.substring(0, 800)}\n\`\`\``;
  }

  const payload = {
    content: `${emoji} **${options.title}**`,
    embeds: [
      {
        title: options.title,
        description,
        color,
        fields,
        footer: {
          text: "Tara CRS & POS Automated Monitoring Engine",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn("Discord Webhook dispatch skipped:", err);
    return false;
  }
}
