import crypto from 'crypto';

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

/**
 * Hash a plain password using PBKDF2 with SHA-512 and a cryptographically secure random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return `$pbkdf2$${ITERATIONS}$${salt}$${derivedKey}`;
}

/**
 * Verify a plain password against a stored password or hash.
 * Supports backward-compatible plaintext checking with auto-upgrade flag.
 */
export function verifyPassword(
  password: string,
  stored: string
): { isValid: boolean; needsRehash: boolean } {
  if (!password || !stored) {
    return { isValid: false, needsRehash: false };
  }

  // 1. Check if stored password is in PBKDF2 hash format
  if (stored.startsWith('$pbkdf2$')) {
    const parts = stored.split('$');
    if (parts.length === 5) {
      const iterations = parseInt(parts[2], 10);
      const salt = parts[3];
      const originalHash = parts[4];

      const computedKey = crypto
        .pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST)
        .toString('hex');

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(computedKey, 'utf-8'),
        Buffer.from(originalHash, 'utf-8')
      );

      return { isValid: isMatch, needsRehash: false };
    }
  }

  // 2. Legacy plaintext fallback: use constant-time comparison to prevent timing attacks
  const bufA = Buffer.from(password, 'utf-8');
  const bufB = Buffer.from(stored, 'utf-8');

  let isMatch = false;
  if (bufA.length === bufB.length) {
    isMatch = crypto.timingSafeEqual(bufA, bufB);
  } else {
    isMatch = password === stored;
  }

  // If plaintext matched, flag that it needs re-hashing in the database!
  return { isValid: isMatch, needsRehash: isMatch };
}

/**
 * Generate a secure HMAC-SHA256 session signature token
 */
export function generateSessionSignature(payload: { id: string; username: string; role: string; restoId: string }): string {
  const secret = process.env.FIREBASE_PROJECT_ID || 'crs-pos-secure-salt';
  const data = `${payload.id}:${payload.username}:${payload.role}:${payload.restoId}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(JSON.stringify({ ...payload, sig, ts: Date.now() })).toString('base64');
}
