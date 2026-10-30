/**
 * Helper to manage trusted devices for 2FA in Tara CRS.
 * Binds trust token to persistent device ID + deterministic signature so plain JSON injection in localStorage is rejected.
 */

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let deviceId = localStorage.getItem("tara_device_id");
    if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8) {
      deviceId = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("tara_device_id", deviceId);
    }
    return deviceId;
  } catch {
    return "fallback_device";
  }
}

function computeDeviceSignature(email: string, expiresAt: number, setAt: number, deviceId: string): string {
  const raw = `${email.toLowerCase().trim()}|${expiresAt}|${setAt}|${deviceId}|tara_2fa_v3_salt`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val1 = (h1 >>> 0).toString(36);
  const val2 = (h2 >>> 0).toString(36);
  return `${val1}_${val2}`;
}

function normalizeKey(email: string): string {
  return `tara_trusted_device_${email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_")}`;
}

export function isDeviceTrusted(email: string): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const key = normalizeKey(cleanEmail);
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const maxAllowedWindow = 31 * 24 * 60 * 60 * 1000;
    const deviceId = parsed.deviceId || getOrCreateDeviceId();
    if (
      parsed &&
      parsed.trusted === true &&
      typeof parsed.expiresAt === "number" &&
      typeof parsed.setAt === "number" &&
      parsed.email === cleanEmail &&
      Date.now() < parsed.expiresAt &&
      parsed.expiresAt - parsed.setAt <= maxAllowedWindow &&
      typeof parsed.sig === "string" &&
      parsed.sig === computeDeviceSignature(cleanEmail, parsed.expiresAt, parsed.setAt, deviceId)
    ) {
      return true;
    }
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
    const key = normalizeKey(cleanEmail);
    const setAt = Date.now();
    const expiresAt = setAt + safeDays * 24 * 60 * 60 * 1000;
    const deviceId = getOrCreateDeviceId();
    const sig = computeDeviceSignature(cleanEmail, expiresAt, setAt, deviceId);
    localStorage.setItem(
      key,
      JSON.stringify({
        trusted: true,
        expiresAt,
        setAt,
        email: cleanEmail,
        deviceId,
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
    const key = normalizeKey(email);
    localStorage.removeItem(key);
  } catch {}
}
