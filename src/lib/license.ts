import crypto from 'crypto';
import { get, run, adminGet, adminRun, adminQuery } from './db';

const SECRET = process.env.LICENSE_SECRET_KEY || process.env.ENCRYPTION_KEY || 'biashara-ledger-license-secret';
const TRIAL_DAYS = 3;
const MAX_OFFLINE_DAYS = 7;

export function generateLicenseKey(email: string, plan = 'standard'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(email + timestamp + random + plan);
  const hash = hmac.digest('hex').substring(0, 8).toUpperCase();
  return `BL-${timestamp}-${random}-${hash}`;
}

export function validateLicenseKeyStructure(key: string): { valid: boolean; reason?: string } {
  try {
    const parts = key.split('-');
    if (parts.length !== 4) return { valid: false, reason: 'Invalid key format' };
    if (parts[0] !== 'BL') return { valid: false, reason: 'Invalid key prefix' };
    if (parts[1].length < 4) return { valid: false, reason: 'Invalid timestamp' };
    if (parts[2].length < 4) return { valid: false, reason: 'Invalid random segment' };
    if (parts[3].length < 4) return { valid: false, reason: 'Invalid hash segment' };
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid key format' };
  }
}

export function getHardwareFingerprint(): string {
  try {
    const os = require('os');
    const { execSync } = require('child_process');
    const comps = [os.cpus()[0]?.model || 'unknown', os.hostname(), os.platform(), os.arch()];
    try {
      const r = execSync('wmic bios get serialnumber 2>nul').toString().trim().split('\n').pop()?.trim();
      if (r && r !== 'SerialNumber') comps.push(r);
    } catch {}
    try {
      const r = execSync('wmic baseboard get serialnumber 2>nul').toString().trim().split('\n').pop()?.trim();
      if (r && r !== 'SerialNumber') comps.push(r);
    } catch {}
    try {
      const r = execSync('system_profiler SPHardwareDataType 2>/dev/null | grep "Serial Number" | awk \'{print $4}\'').toString().trim();
      if (r) comps.push(r);
    } catch {}
    try {
      const r = execSync('cat /sys/class/dmi/id/product_serial 2>/dev/null').toString().trim();
      if (r && r !== '0') comps.push(r);
    } catch {}
    return crypto.createHash('sha256').update(comps.join('|')).digest('hex');
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

export function getTrialDates() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + TRIAL_DAYS);
  return { trialStartDate: start.toISOString(), trialEndDate: end.toISOString() };
}

export async function checkUserTrialStatus(userId: string): Promise<{
  status: 'trial' | 'active' | 'expired';
  daysRemaining?: number;
  message: string;
}> {
  const user = await get<{
    trial_end_date: string;
    license_status: string;
    subscription_status: string;
    subscription_expiry: string;
  }>('SELECT trial_end_date, license_status, subscription_status, subscription_expiry FROM users WHERE id = $1', [userId]);

  if (!user) return { status: 'expired', message: 'User not found' };

  if (user.license_status === 'active') {
    return { status: 'active', message: 'License active' };
  }

  if (user.subscription_status === 'active' && user.subscription_expiry) {
    const expiry = new Date(user.subscription_expiry);
    if (expiry > new Date()) {
      const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
      return { status: 'active', message: `Subscription active — ${days} days remaining`, daysRemaining: days };
    }
  }

  const trialEnd = user.trial_end_date ? new Date(user.trial_end_date) : null;
  if (trialEnd && trialEnd > new Date()) {
    const days = Math.ceil((trialEnd.getTime() - Date.now()) / 86400000);
    return { status: 'trial', daysRemaining: days, message: `${days} day(s) remaining in trial` };
  }

  return { status: 'expired', message: 'Trial expired. Please activate a license key.' };
}

export async function storeLicenseKey(licenseKey: string, email: string, plan: string, userId: string) {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  await run(
    `INSERT INTO license_keys (license_key, email, license_type, status, expires_at, user_id)
     VALUES ($1, $2, $3, 'active', $4, $5)`,
    [licenseKey, email, plan, expiry.toISOString(), userId]
  );
}

export async function activateLicenseForUser(licenseKey: string, email: string, hardwareFingerprint: string) {
  const lic = await get<{ id: string; user_id: string; status: string; expires_at: string }>(
    'SELECT * FROM license_keys WHERE license_key = $1 AND email = $2',
    [licenseKey, email]
  );
  if (!lic) return { success: false, error: 'License key not found or email mismatch' };
  if (lic.status === 'used') return { success: false, error: 'License key already used' };
  if (lic.expires_at && new Date(lic.expires_at) < new Date()) return { success: false, error: 'License key expired' };

  await run(
    `UPDATE license_keys SET status = 'used', activated_at = CURRENT_TIMESTAMP, hardware_fingerprint = $1,
     activation_count = COALESCE(activation_count, 0) + 1 WHERE id = $2`,
    [hardwareFingerprint, lic.id]
  );
  await run(
    `UPDATE users SET license_key = $1, license_status = 'active', trial_used = true, is_active = true WHERE id = $2`,
    [licenseKey, lic.user_id]
  );
  return { success: true, message: 'License activated successfully' };
}

export async function logLicenseActivation(params: {
  licenseKey: string;
  userEmail: string;
  hardwareFingerprint?: string;
  ipAddress?: string;
  deviceInfo?: string;
  status: string;
  errorReason?: string;
}) {
  await adminRun(
    `INSERT INTO license_activations (license_key, user_email, hardware_fingerprint, ip_address, device_info, status, error_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.licenseKey,
      params.userEmail,
      params.hardwareFingerprint || '',
      params.ipAddress || '',
      params.deviceInfo || '',
      params.status,
      params.errorReason || '',
    ]
  );
}

export async function getLicenseActivations(licenseKey: string) {
  return adminQuery(
    'SELECT * FROM license_activations WHERE license_key = $1 ORDER BY created_at DESC LIMIT 50',
    [licenseKey]
  );
}
