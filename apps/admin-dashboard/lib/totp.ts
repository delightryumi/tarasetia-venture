import crypto from "crypto";
import QRCode from "qrcode";

// Base32 character set (RFC 4648)
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into Base32 string
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a buffer
 */
export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure Base32 secret for TOTP
 */
export function generateTotpSecret(byteLength = 20): string {
  const randomBytes = crypto.randomBytes(byteLength);
  return base32Encode(randomBytes);
}

/**
 * Generates the otpauth:// URI recognized by Google Authenticator
 */
export function generateTotpUri(
  secretOrOpts: string | { secret: string; accountName: string; issuer?: string },
  accountName?: string,
  issuer = "Tara CRS"
): string {
  let sec = "";
  let acc = "";
  let iss = issuer;

  if (typeof secretOrOpts === "object" && secretOrOpts !== null) {
    sec = secretOrOpts.secret;
    acc = secretOrOpts.accountName;
    iss = secretOrOpts.issuer || issuer;
  } else {
    sec = secretOrOpts;
    acc = accountName || "";
    iss = issuer;
  }

  const encodedIssuer = encodeURIComponent(iss);
  const encodedAccount = encodeURIComponent(acc);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${sec}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Renders the otpauth URI as a base64 Data URL QR Code
 */
export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 240,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

/**
 * Calculates standard RFC 6238 TOTP 6-digit code for a given timestamp
 */
export function computeTotp(secret: string, timeStep = Math.floor(Date.now() / 1000 / 30)): string {
  const key = base32Decode(secret);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(timeBuffer);
  const hmacResult = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const binaryCode =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  const code = (binaryCode % 1000000).toString().padStart(6, "0");
  return code;
}

/**
 * Verifies a 6-digit code against secret with +/- window tolerance (drift protection)
 */
export function verifyTotpToken(
  tokenOrOpts: string | { token: string; secret: string; window?: number },
  secretParam?: string,
  windowParam = 1
): boolean {
  let tok = "";
  let sec = "";
  let win = 1;

  if (typeof tokenOrOpts === "object" && tokenOrOpts !== null) {
    tok = tokenOrOpts.token;
    sec = tokenOrOpts.secret;
    win = tokenOrOpts.window ?? 1;
  } else {
    tok = tokenOrOpts;
    sec = secretParam || "";
    win = windowParam ?? 1;
  }

  if (!tok || !sec) return false;
  const cleanToken = tok.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let offset = -win; offset <= win; offset++) {
    const expected = computeTotp(sec, currentStep + offset);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates emergency backup recovery codes
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}
