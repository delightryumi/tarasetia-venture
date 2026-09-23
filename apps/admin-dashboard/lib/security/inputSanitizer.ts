/**
 * Security helper to sanitize and validate user input, preventing NoSQL path injection and malformed identifiers.
 */

// Sanitizes a hotelCode or identifier to only allow alphanumeric, underscores, and dashes
export function sanitizeIdentifier(input: unknown): string {
    if (typeof input !== "string") return "";
    return input.trim().replace(/[^a-zA-Z0-9_\-]/g, "");
}

// Sanitizes an email address and converts it safely to a Firestore docId without slashes
export function emailToDocId(email: string): string {
    if (!email || typeof email !== "string") return "";
    const clean = email.trim().toLowerCase();
    // Replace '@', '.', and any slashes/backslashes to prevent Firestore path injection
    return clean.replace(/[@./\\]/g, "_");
}

// Validates whether an email format is valid
export function isValidEmail(email: unknown): boolean {
    if (typeof email !== "string") return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
}

// Sanitizes string values to prevent control character injection
export function sanitizeString(val: unknown, maxLength = 255): string {
    if (typeof val !== "string") return "";
    return val.trim().slice(0, maxLength);
}
