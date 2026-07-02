import crypto from 'crypto';
import { get, run, adminGet, adminRun, adminQuery } from './db';

const SECRET = (() => {
  const s = process.env.LICENSE_SECRET_KEY || process.env.ENCRYPTION_KEY;
  if (!s) throw new Error('LICENSE_SECRET_KEY or ENCRYPTION_KEY environment variable is required');
  return s;
})();
const TRIAL_DAYS = 14;
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
  }>('SELECT trial_end_date, license_status, subscription_status, subscription_expiry FROM users WHERE tenant_id = current_tenant_id() AND id = $1', [userId]);

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
    `UPDATE license_keys SET status = 'used', activated_at = CURRENT_TIMESTAMP, hardware_fingerprint = $1 WHERE id = $2`,
    [hardwareFingerprint, lic.id]
  );
  await run(
    `UPDATE users SET license_key = $1, license_status = 'active', trial_used = true WHERE id = $2`,
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

export function generateTempPassword(length = 14): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

export function generateLicenseKeyNew(email: string, plan = 'standard'): string {
  const year = new Date().getFullYear();
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();
  const secret = process.env.LICENSE_SECRET || process.env.ENCRYPTION_KEY || 'default-secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(email + uuid + plan + year);
  const signature = hmac.digest('hex').substring(0, 8).toUpperCase();
  return `BL-${year}-${uuid}-${signature}`;
}

export async function checkLicenseExpiryStatus(clientId: string): Promise<{
  status: 'active' | 'expiring_soon' | 'expiring' | 'expired';
  daysRemaining: number | null;
  expiresAt: string | null;
}> {
  const license = await adminGet<{ expires_at: string; is_active: boolean }>(
    `SELECT expires_at, is_active FROM admin_license_keys WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clientId]
  );

  if (!license || !license.expires_at) {
    return { status: 'expired', daysRemaining: null, expiresAt: null };
  }

  if (!license.is_active) {
    return { status: 'expired', daysRemaining: 0, expiresAt: license.expires_at };
  }

  const expiresAt = new Date(license.expires_at);
  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'expired', daysRemaining: 0, expiresAt: license.expires_at };
  }
  if (daysRemaining <= 7) {
    return { status: 'expiring_soon', daysRemaining, expiresAt: license.expires_at };
  }
  if (daysRemaining <= 30) {
    return { status: 'expiring', daysRemaining, expiresAt: license.expires_at };
  }
  return { status: 'active', daysRemaining, expiresAt: license.expires_at };
}

export async function logLicenseHistory(params: {
  clientId?: string;
  licenseId?: string;
  action: 'created' | 'extended' | 'regenerated' | 'expired' | 'plan_changed' | 'revoked' | 'reactivated';
  oldPlanTier?: string;
  newPlanTier?: string;
  oldExpiresAt?: string;
  newExpiresAt?: string;
  performedBy?: string;
}) {
  await adminRun(
    `INSERT INTO license_history (client_id, license_id, action, old_plan_tier, new_plan_tier, old_expires_at, new_expires_at, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.clientId || null,
      params.licenseId || null,
      params.action,
      params.oldPlanTier || null,
      params.newPlanTier || null,
      params.oldExpiresAt || null,
      params.newExpiresAt || null,
      params.performedBy || null,
    ]
  );
}

export async function logEmailSent(params: {
  clientId?: string;
  userId?: string;
  emailType: 'welcome' | 'license_activation' | 'expiry_reminder' | 'password_reset' | 'license_extended' | 'license_regenerated';
  recipientEmail: string;
  subject: string;
  status?: 'sent' | 'failed';
  errorMessage?: string;
}) {
  await adminRun(
    `INSERT INTO email_logs (client_id, user_id, email_type, recipient_email, subject, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.clientId || null,
      params.userId || null,
      params.emailType,
      params.recipientEmail,
      params.subject,
      params.status || 'sent',
      params.errorMessage || null,
    ]
  );
}

export async function getExpiringLicenses(daysUntilExpiry: number) {
  return adminQuery(
    `SELECT l.*, c.company_name, c.email
     FROM admin_license_keys l
     JOIN admin_clients c ON l.client_id = c.id
     WHERE l.is_active = true
     AND l.expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + $1::interval
     AND l.expires_at > CURRENT_TIMESTAMP
     ORDER BY l.expires_at ASC`,
    [`${daysUntilExpiry} days`]
  );
}

export async function markReminderSent(licenseKey: string, reminderType: '30d' | '7d' | '1d') {
  const column = reminderType === '30d' ? 'reminder_sent_30d' : reminderType === '7d' ? 'reminder_sent_7d' : 'reminder_sent_1d';
  await adminRun(
    `UPDATE admin_license_keys SET ${column} = true WHERE license_key = $1`,
    [licenseKey]
  );
}

export async function getAdminLicenseByClientId(clientId: string) {
  return adminGet(
    `SELECT l.*, c.company_name, c.email, c.database_name
     FROM admin_license_keys l
     JOIN admin_clients c ON l.client_id = c.id
     WHERE l.client_id = $1
     ORDER BY l.created_at DESC LIMIT 1`,
    [clientId]
  );
}

export async function getAdminLicenseByKey(licenseKey: string) {
  return adminGet(
    `SELECT l.*, c.company_name, c.email
     FROM admin_license_keys l
     JOIN admin_clients c ON l.client_id = c.id
     WHERE l.license_key = $1`,
    [licenseKey]
  );
}
