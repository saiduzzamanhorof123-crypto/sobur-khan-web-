import crypto from 'crypto';

const TOKEN_SECRET = process.env.SESSION_SECRET || 'sobur-ali-khan-luxury-master-key-2026';
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Hash password securely using PBKDF2 with a unique random salt
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Verify a plaintext password against stored salt and hash
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  if (!password || !salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Generate a signed session token for authenticated admin
 */
export function generateToken(payload: { id: string; email: string; role: string }): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  });
  const encodedData = Buffer.from(data).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encodedData)
    .digest('base64url');
  return `${encodedData}.${signature}`;
}

/**
 * Verify and decode session token. Returns null if invalid or expired.
 */
export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedData, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encodedData)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(encodedData, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}
