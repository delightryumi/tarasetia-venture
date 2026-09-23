/**
 * Geo Location Helper
 * Resolves geographical location (City, Region, Country) from request IP & headers
 */

const locationCache = new Map<string, string>();

export async function resolveLocationFromReq(
    req: Request, 
    clientTimeZone?: string,
    explicitLocation?: string
): Promise<{ ip: string; location: string }> {
    if (explicitLocation && explicitLocation.trim()) {
        return { ip: "127.0.0.1", location: explicitLocation.trim() };
    }

    const headers = req.headers;
    const cfConnectingIp = headers.get("cf-connecting-ip");
    const realIp = headers.get("x-real-ip");
    const forwardedFor = headers.get("x-forwarded-for");

    let ip = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

    // Check Cloud Proxy Headers first (Firebase, App Engine, Cloudflare, Vercel)
    const headerCity = headers.get("x-appengine-city") || headers.get("cf-ipcity") || headers.get("x-vercel-ip-city");
    const headerCountry = headers.get("x-appengine-country") || headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");
    const headerRegion = headers.get("x-appengine-region") || headers.get("cf-region") || headers.get("x-vercel-ip-country-region");

    if (headerCity && (headerCountry || headerRegion)) {
        const loc = `${headerCity}, ${headerCountry || headerRegion}`;
        locationCache.set(ip, loc);
        return { ip, location: loc };
    }

    // Check private / localhost IP
    const isPrivate = 
        ip === "::1" || 
        ip === "127.0.0.1" || 
        ip.startsWith("192.168.") || 
        ip.startsWith("10.") || 
        ip.startsWith("172.16.");

    if (isPrivate) {
        if (clientTimeZone) {
            const cleanTz = clientTimeZone.replace("Asia/", "").replace("_", " ");
            return { ip, location: `Kantor / LAN (${cleanTz})` };
        }
        return { ip, location: "Jaringan Lokal (Kantor)" };
    }

    // Check cache
    if (locationCache.has(ip)) {
        return { ip, location: locationCache.get(ip)! };
    }

    // Lookup via fast public IP API with 1.2s timeout
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.status === "success" && (data.city || data.country)) {
                const loc = `${data.city || data.regionName}, ${data.country}`;
                locationCache.set(ip, loc);
                return { ip, location: loc };
            }
        }
    } catch {
        // Fallback gracefully on timeout or network error
    }

    // Fallback using timezone if available
    if (clientTimeZone) {
        const cleanTz = clientTimeZone.replace("Asia/", "").replace("_", " ");
        const loc = `Indonesia (${cleanTz})`;
        locationCache.set(ip, loc);
        return { ip, location: loc };
    }

    return { ip, location: "Indonesia (Online)" };
}
