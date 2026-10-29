/**
 * Helper to manage trusted devices for 2FA in Tara CRS.
 * Binds trust token to browser fingerprint + deterministic signature so plain JSON injection in localStorage is rejected.
 */

function computeDeviceSignature(email: string, expiresAt: number, setAt: number): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const lang = typeof navigator !== "undefined" ? navigator.language : "id";
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Jakarta";
  const raw = `${email.toLowerCase().trim()}|${expiresAt}|${setAt}|${ua}|${lang}|${tz}|tara_2fa_v2_salt`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function isDeviceTrusted(email: string): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const key = `tara_trusted_device_${cleanEmail.replace(/[@.]/g, "_")}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const maxAllowedWindow = 31 * 24 * 60 * 60 * 1000;
    if (
      parsed &&
      parsed.trusted === true &&
      typeof parsed.expiresAt === "number" &&
      typeof parsed.setAt === "number" &&
      parsed.email === cleanEmail &&
      Date.now() < parsed.expiresAt &&
      parsed.expiresAt - parsed.setAt <= maxAllowedWindow &&
      typeof parsed.sig === "string" &&
      parsed.sig === computeDeviceSignature(cleanEmail, parsed.expiresAt, parsed.setAt)
    ) {
      return true;
    }
    localStorage.removeItem(key);
    return false;
  } catch {
    return false;
  }
}

export function setDeviceTrusted(email: string, days: number = 30): void {
  if (typeof window === "undefined" || !email) return;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const safeDays = Math.min(Math.max(days, 1), 30);
    const key = `tara_trusted_device_${cleanEmail.replace(/[@.]/g, "_")}`;
    const setAt = Date.now();
    const expiresAt = setAt + safeDays * 24 * 60 * 60 * 1000;
    const sig = computeDeviceSignature(cleanEmail, expiresAt, setAt);
    localStorage.setItem(
      key,
      JSON.stringify({
        trusted: true,
        expiresAt,
        setAt,
        email: cleanEmail,
        sig,
      })
    );
  } catch (e) {
    console.warn("Failed to save trusted device:", e);
  }
}

export function revokeDeviceTrust(email: string): void {
  if (typeof window === "undefined" || !email) return;
  try {
    const key = `tara_trusted_device_${email.toLowerCase().trim().replace(/[@.]/g, "_")}`;
    localStorage.removeItem(key);
  } catch {}
}
