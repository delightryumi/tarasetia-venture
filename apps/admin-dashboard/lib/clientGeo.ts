/**
 * Client-side Geolocation Helper
 * Fetches the user's specific city & country directly from their browser
 */

export async function detectClientCity(): Promise<string> {
    if (typeof window === "undefined") return "Indonesia";

    try {
        const cached = sessionStorage.getItem("tara_client_city");
        if (cached) return cached;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        const res = await fetch("https://ipwho.is/", { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.city) {
                const cityStr = `${data.city}, ${data.country || "Indonesia"}`;
                sessionStorage.setItem("tara_client_city", cityStr);
                return cityStr;
            }
        }
    } catch {
        // Fallback to timezone
    }

    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        if (tz) {
            const clean = tz.replace("Asia/", "").replace("_", " ");
            return `${clean}, Indonesia`;
        }
    } catch {}

    return "Indonesia";
}
