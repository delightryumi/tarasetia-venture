/**
 * Geo Location Helper
 * Resolves specific city, region, and country from IP & request headers
 */

const locationCache = new Map<string, string>();

/**
 * Fetch specific city from public IP using secure HTTPS endpoints
 */
export async function lookupIpCity(ip: string): Promise<string | null> {
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")) {
        return null;
    }

    if (locationCache.has(ip)) {
        return locationCache.get(ip)!;
    }

    // Try 1: ipwho.is (fast, HTTPS, free, accurate city level for Indonesia)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.city) {
                const loc = `${data.city}, ${data.country || "Indonesia"}`;
                locationCache.set(ip, loc);
                return loc;
            }
        }
    } catch {
        // Continue to fallback
    }

    // Try 2: freeipapi.com (fallback HTTPS)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(`https://freeipapi.com/api/json/${ip}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.cityName) {
                const loc = `${data.cityName}, ${data.countryName || "Indonesia"}`;
                locationCache.set(ip, loc);
                return loc;
            }
        }
    } catch {
        // Fallback
    }

    return null;
}

export async function resolveLocationFromReq(
    req: Request, 
    clientTimeZone?: string,
    explicitLocation?: string
): Promise<{ ip: string; location: string }> {
    const headers = req.headers;
    const cfConnectingIp = headers.get("cf-connecting-ip");
    const realIp = headers.get("x-real-ip");
    const forwardedFor = headers.get("x-forwarded-for");

    let ip = cfConnectingIp || realIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

    // If client already passed an accurate city-level location (e.g. from browser lookup), use it directly
    if (explicitLocation && explicitLocation.trim() && explicitLocation !== "Indonesia" && explicitLocation !== "Indonesia (Online)") {
        locationCache.set(ip, explicitLocation.trim());
        return { ip, location: explicitLocation.trim() };
    }

    // Check Cloud Proxy Headers first (Firebase, App Engine, Cloudflare, Vercel)
    const headerCity = headers.get("x-appengine-city") || headers.get("cf-ipcity") || headers.get("x-vercel-ip-city");
    const headerCountry = headers.get("x-appengine-country") || headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country");
    const headerRegion = headers.get("x-appengine-region") || headers.get("cf-region") || headers.get("x-vercel-ip-country-region");

    if (headerCity) {
        const loc = `${headerCity}, ${headerCountry || headerRegion || "Indonesia"}`;
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

    // Check memory cache
    if (locationCache.has(ip)) {
        return { ip, location: locationCache.get(ip)! };
    }

    // Lookup specific city via public HTTPS API
    const cityResult = await lookupIpCity(ip);
    if (cityResult) {
        return { ip, location: cityResult };
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
