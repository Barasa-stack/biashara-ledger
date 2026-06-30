import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required. Set it in .env.local');
}
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

export function encryptField(userId: string, value: string): string {
  const userKey = crypto.createHash('sha256').update(String(userId)).update(KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptField(userId: string, encrypted: string): string {
  const [ivHex, authTagHex, data] = encrypted.split(':');
  const userKey = crypto.createHash('sha256').update(String(userId)).update(KEY).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
