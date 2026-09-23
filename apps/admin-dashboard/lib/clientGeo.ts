/**
 * Client-side Geolocation Helper
 * Fetches the user's specific city & country directly from their browser
 */

export async function detectClientCity(): Promise<string> {
    if (typeof window === "undefined") return "Indonesia";

    try {
        const cached = sessionStorage.getItem("tara_client_city");
        // Only return cache if it already has a specific city (contains comma and is not generic Indonesia)
        if (cached && cached !== "Indonesia" && cached !== "Indonesia (Online)" && cached.includes(",")) {
            return cached;
        }

        // Try 1: ipwho.is (fast, accurate down to Indonesian cities)
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);

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
            // Next fallback
        }

        // Try 2: freeipapi.com (reliable backup)
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);

            const res = await fetch("https://freeipapi.com/api/json", { signal: controller.signal });
            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (data.cityName) {
                    const cityStr = `${data.cityName}, ${data.countryName || "Indonesia"}`;
                    sessionStorage.setItem("tara_client_city", cityStr);
                    return cityStr;
                }
            }
        } catch {
            // Next fallback
        }
    } catch {
        // Fallback to timezone
    }

    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        if (tz && tz.includes("/")) {
            const clean = tz.split("/")[1].replace(/_/g, " ");
            return `${clean}, Indonesia`;
        }
    } catch {}

    return "Indonesia";
}
