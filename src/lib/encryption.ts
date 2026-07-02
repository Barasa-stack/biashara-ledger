import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(salt?: string): { key: Buffer; salt: string } {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  const s = salt || crypto.randomBytes(16).toString('hex');
  return { key: crypto.scryptSync(encryptionKey, s, 32), salt: s };
}

export function encryptField(userId: string, value: string): string {
  const { key, salt } = getKey();
  const userKey = crypto.createHash('sha256').update(String(userId)).update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${salt}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptField(userId: string, encrypted: string): string {
  const parts = encrypted.split(':');
  let salt: string, ivHex: string, authTagHex: string, data: string;
  if (parts.length === 3) {
    salt = 'salt';
    ivHex = parts[0];
    authTagHex = parts[1];
    data = parts[2];
  } else {
    salt = parts[0];
    ivHex = parts[1];
    authTagHex = parts[2];
    data = parts.slice(3).join(':');
  }
  const { key } = getKey(salt);
  const userKey = crypto.createHash('sha256').update(String(userId)).update(key).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
