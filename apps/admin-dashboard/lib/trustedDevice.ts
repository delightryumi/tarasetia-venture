/**
 * Helper to manage trusted devices for 2FA in Tara CRS.
 * Allows users who have verified 2FA on a trusted personal computer/phone
 * to bypass repetitive 6-digit prompts for 30 days while keeping foreign devices secure.
 */

export function isDeviceTrusted(email: string): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    const key = `tara_trusted_device_${email.toLowerCase().trim().replace(/[@.]/g, "_")}`;
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
      return true;
    }
    // Token expired, clear it
    localStorage.removeItem(key);
    return false;
  } catch {
    return false;
  }
}

export function setDeviceTrusted(email: string, days: number = 30): void {
  if (typeof window === "undefined" || !email) return;
  try {
    const key = `tara_trusted_device_${email.toLowerCase().trim().replace(/[@.]/g, "_")}`;
    const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      key,
      JSON.stringify({
        trusted: true,
        expiresAt,
        setAt: Date.now(),
        email: email.toLowerCase().trim(),
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
