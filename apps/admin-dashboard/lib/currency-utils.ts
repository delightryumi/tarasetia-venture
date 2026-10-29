/**
 * Multi-Currency Configuration & Utilities for My Tara Multi-Hotel CRS
 * Supports full international distribution & OTA Channel Manager compliance
 */

export interface CurrencyConfig {
    code: string;
    symbol: string;
    name: string;
    decimals: number;
    flag: string;
    step: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", decimals: 0, flag: "🇮🇩", step: "1" },
    { code: "USD", symbol: "$", name: "US Dollar", decimals: 2, flag: "🇺🇸", step: "0.01" },
    { code: "EUR", symbol: "€", name: "Euro", decimals: 2, flag: "🇪🇺", step: "0.01" },
    { code: "GBP", symbol: "£", name: "British Pound", decimals: 2, flag: "🇬🇧", step: "0.01" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar", decimals: 2, flag: "🇸🇬", step: "0.01" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar", decimals: 2, flag: "🇦🇺", step: "0.01" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", decimals: 2, flag: "🇲🇾", step: "0.01" },
    { code: "THB", symbol: "฿", name: "Thai Baht", decimals: 2, flag: "🇹🇭", step: "0.01" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen", decimals: 0, flag: "🇯🇵", step: "1" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan", decimals: 2, flag: "🇨🇳", step: "0.01" },
    { code: "AED", symbol: "AED", name: "UAE Dirham", decimals: 2, flag: "🇦🇪", step: "0.01" },
    { code: "SAR", symbol: "SAR", name: "Saudi Riyal", decimals: 2, flag: "🇸🇦", step: "0.01" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong", decimals: 0, flag: "🇻🇳", step: "1" },
    { code: "KRW", symbol: "₩", name: "South Korean Won", decimals: 0, flag: "🇰🇷", step: "1" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso", decimals: 2, flag: "🇵🇭", step: "0.01" },
    { code: "INR", symbol: "₹", name: "Indian Rupee", decimals: 2, flag: "🇮🇳", step: "0.01" },
    { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2, flag: "🇨🇭", step: "0.01" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar", decimals: 2, flag: "🇨🇦", step: "0.01" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", decimals: 2, flag: "🇳🇿", step: "0.01" },
    { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", decimals: 2, flag: "🇭🇰", step: "0.01" }
];

const CURRENCY_MAP: Record<string, CurrencyConfig> = SUPPORTED_CURRENCIES.reduce((acc, c) => {
    acc[c.code] = c;
    return acc;
}, {} as Record<string, CurrencyConfig>);

export const DEFAULT_CURRENCY = "IDR";

/**
 * Returns configuration for a currency code (defaults to IDR if unrecognized)
 */
export function getCurrencyConfig(code?: string): CurrencyConfig {
    if (!code) return CURRENCY_MAP[DEFAULT_CURRENCY];
    const upper = code.toUpperCase().trim();
    return CURRENCY_MAP[upper] || {
        code: upper,
        symbol: upper,
        name: upper,
        decimals: 2,
        flag: "🌐",
        step: "0.01"
    };
}

/**
 * Checks if a currency does not use cents/decimals (e.g. IDR, JPY, VND, KRW)
 */
export function isZeroDecimalCurrency(code?: string): boolean {
    const config = getCurrencyConfig(code);
    return config.decimals === 0;
}

/**
 * Parses user input for rates, supporting cents/decimals for currencies like USD
 */
export function parseCurrencyInput(value: string | number, currencyCode?: string): number {
    const config = getCurrencyConfig(currencyCode);
    if (typeof value === "number") {
        return isNaN(value) ? 0 : roundCurrencyRate(value, currencyCode);
    }
    const sanitized = String(value).replace(/[^0-9.-]/g, "");
    if (!sanitized) return 0;
    
    if (config.decimals === 0) {
        return Math.max(0, parseInt(sanitized, 10) || 0);
    }
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : Math.max(0, roundCurrencyRate(parsed, currencyCode));
}

/**
 * Rounds rate to correct decimal places for API payloads and storage
 */
export function roundCurrencyRate(amount: number, currencyCode?: string): number {
    const config = getCurrencyConfig(currencyCode);
    if (config.decimals === 0) {
        return Math.round(amount);
    }
    // Round to 2 decimal places (cents)
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formats monetary amount according to currency rules
 */
export function formatCurrencyAmount(
    amount: number | null | undefined, 
    currencyCode?: string,
    options?: { showCode?: boolean }
): string {
    const num = Number(amount) || 0;
    const config = getCurrencyConfig(currencyCode);

    try {
        const formatted = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: config.decimals,
            maximumFractionDigits: config.decimals
        }).format(num);

        const prefix = config.symbol ? `${config.symbol} ` : "";
        const suffix = options?.showCode ? ` ${config.code}` : "";
        return `${prefix}${formatted}${suffix}`;
    } catch {
        return `${config.symbol} ${num.toFixed(config.decimals)}`;
    }
}

/**
 * Formats rate for Channex API payload (/restrictions, /rate_plans).
 * Channex Standard: Decimal value converted into a string (e.g. "100.00" for USD, "1000000" for IDR).
 * This prevents Channex from treating integer numbers as minor currency units (cents).
 */
export function formatRateForChannex(rate: number, currencyCode?: string): string {
    const config = getCurrencyConfig(currencyCode);
    const num = Number(rate) || 0;
    if (config.decimals === 0) {
        if (num % 1 !== 0) {
            return num.toFixed(2);
        }
        return Math.round(num).toString();
    }
    return num.toFixed(config.decimals);
}
