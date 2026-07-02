import crypto from 'crypto';
import { adminGet, adminRun, adminQuery } from './db';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = (() => {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error('ENCRYPTION_KEY environment variable is required for backup encryption');
  return k;
})();

function encryptBackupData(data: any): { encrypted: string; version: number } {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted: `${iv.toString('hex')}:${authTag}:${salt}:${encrypted}`, version: 1 };
}

function decryptBackupData(encrypted: string): any {
  try {
    const parts = encrypted.split(':');
    const ivHex = parts[0];
    const authTagHex = parts[1];
    const salt = parts.length > 3 ? parts[2] : 'backup-salt';
    const data = parts.length > 3 ? parts.slice(3).join(':') : parts.slice(2).join(':');
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export async function createBackup(params: {
  licenseKey: string;
  data: any;
  version?: number;
}): Promise<{ success: boolean; backupId?: number; error?: string }> {
  try {
    const { encrypted, version } = encryptBackupData(params.data);
    const dataSize = Buffer.byteLength(encrypted, 'utf8');

    const result = await adminRun(
      `INSERT INTO backups (license_key, data, file_size, version, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id`,
      [params.licenseKey, encrypted, dataSize, params.version || version]
    );

    return { success: true, backupId: result.rowCount > 0 && result.rows?.[0]?.id ? Number(result.rows[0].id) : undefined };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getBackups(licenseKey: string): Promise<any[]> {
  const rows = await adminQuery(
    `SELECT id, license_key, file_size, version, created_at
     FROM backups WHERE license_key = $1 ORDER BY created_at DESC LIMIT 20`,
    [licenseKey]
  );
  return rows.map((r: any) => ({
    id: r.id,
    licenseKey: r.license_key,
    fileSize: r.file_size,
    version: r.version,
    createdAt: r.created_at,
  }));
}

export async function getLatestBackup(licenseKey: string): Promise<any | null> {
  const row = await adminGet(
    'SELECT * FROM backups WHERE license_key = $1 ORDER BY created_at DESC LIMIT 1',
    [licenseKey]
  );
  if (!row) return null;
  const r = row as any;
  const decrypted = decryptBackupData(r.data);
  return {
    id: r.id,
    licenseKey: r.license_key,
    fileSize: r.file_size,
    version: r.version,
    data: decrypted,
    createdAt: r.created_at,
  };
}

export async function restoreBackup(backupId: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const row = await adminGet(
      'SELECT * FROM backups WHERE id = $1',
      [backupId]
    );
    if (!row) return { success: false, error: 'Backup not found' };

    const r = row as any;
    const decrypted = decryptBackupData(r.data);
    if (!decrypted) return { success: false, error: 'Failed to decrypt backup data' };

    return { success: true, data: decrypted };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBackup(backupId: number): Promise<{ success: boolean }> {
  await adminRun('DELETE FROM backups WHERE id = $1', [backupId]);
  return { success: true };
}

export async function deleteOldBackups(licenseKey: string, keepCount: number = 5) {
  const rows = await adminQuery(
    `SELECT id FROM backups WHERE license_key = $1 ORDER BY created_at DESC OFFSET $2`,
    [licenseKey, keepCount]
  );
  for (const row of rows) {
    await adminRun('DELETE FROM backups WHERE id = $1', [(row as any).id]);
  }
}
