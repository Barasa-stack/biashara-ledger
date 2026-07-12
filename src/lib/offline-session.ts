import crypto from 'crypto';
import { adminGet, adminRun, adminQuery } from './db';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const RENEWAL_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const SESSION_SECRET = (() => {
  const s = process.env.ENCRYPTION_KEY;
  if (!s) throw new Error('ENCRYPTION_KEY environment variable is required for session tokens');
  return s;
})();

export function generateSessionToken(): string {
  const raw = crypto.randomBytes(32);
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(raw);
  return hmac.digest('hex') + raw.toString('hex');
}

export async function createOfflineSession(params: {
  clientId?: string;
  licenseKey: string;
  hardwareFingerprint: string;
  userEmail: string;
  ipAddress?: string;
}): Promise<{
  success: boolean;
  sessionToken?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const existing = await adminGet(
      'SELECT id, status, expires_at, session_token FROM offline_sessions WHERE license_key = $1 AND status = $2',
      [params.licenseKey, 'active']
    );

    if (existing) {
      const e = existing as any;
      const expDate = new Date(e.expires_at);
      if (expDate > new Date()) {
        return {
          success: true,
          sessionToken: e.session_token,
          expiresAt: e.expires_at,
        };
      }
      await adminRun(
        'UPDATE offline_sessions SET status = $1 WHERE id = $2',
        ['expired', e.id]
      );
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    await adminRun(
      `INSERT INTO offline_sessions (client_id, license_key, session_token, hardware_fingerprint, user_email, status, expires_at, last_ip)
       VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)`,
      [
        params.clientId || null,
        params.licenseKey,
        sessionToken,
        params.hardwareFingerprint,
        params.userEmail,
        expiresAt,
        params.ipAddress || '',
      ]
    );

    return { success: true, sessionToken, expiresAt };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function validateOfflineSession(sessionToken: string): Promise<{
  valid: boolean;
  session?: any;
  daysRemaining?: number;
  reason?: string;
}> {
  if (!sessionToken || sessionToken.length < 64) {
    return { valid: false, reason: 'Invalid session token' };
  }

  const session = await adminGet(
    `SELECT os.*, c.company_name, c.database_name
     FROM offline_sessions os
     LEFT JOIN admin_clients c ON os.client_id = c.id
     WHERE os.session_token = $1`,
    [sessionToken]
  );

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  const s = session as any;
  if (s.status !== 'active') {
    return { valid: false, reason: `Session is ${s.status}` };
  }

  const now = new Date();
  const expiresAt = new Date(s.expires_at);
  if (expiresAt <= now) {
    await adminRun(
      'UPDATE offline_sessions SET status = $1 WHERE id = $2',
      ['expired', s.id]
    );
    return { valid: false, reason: 'Session expired' };
  }

  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000);
  return { valid: true, session: s, daysRemaining };
}

export async function renewOfflineSession(sessionToken: string): Promise<{
  success: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const session = await adminGet(
      'SELECT id, status, expires_at FROM offline_sessions WHERE session_token = $1',
      [sessionToken]
    );

    if (!session) return { success: false, error: 'Session not found' };
    const s = session as any;
    if (s.status !== 'active') return { success: false, error: `Session is ${s.status}` };

    const now = Date.now();
    const expiresAt = new Date(s.expires_at).getTime();
    if (expiresAt <= now) return { success: false, error: 'Session already expired' };

    const timeLeft = expiresAt - now;
    const newExpires = new Date(now + Math.max(timeLeft, SESSION_DURATION_MS)).toISOString();

    await adminRun(
      'UPDATE offline_sessions SET expires_at = $1 WHERE id = $2',
      [newExpires, s.id]
    );

    return { success: true, expiresAt: newExpires };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function heartbeatOfflineSession(sessionToken: string, ipAddress?: string): Promise<{
  success: boolean;
  valid: boolean;
  daysRemaining?: number;
  needsRenewal?: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const validation = await validateOfflineSession(sessionToken);
    if (!validation.valid) {
      return { success: false, valid: false, error: validation.reason };
    }

    const now = new Date().toISOString();
    await adminRun(
      'UPDATE offline_sessions SET last_heartbeat = $1, last_ip = $2 WHERE session_token = $3',
      [now, ipAddress || '', sessionToken]
    );

    const daysRemaining = validation.daysRemaining || 0;
    const needsRenewal = daysRemaining <= 1;

    return {
      success: true,
      valid: true,
      daysRemaining,
      needsRenewal,
      expiresAt: validation.session?.expires_at,
    };
  } catch (err: any) {
    return { success: false, valid: false, error: err.message };
  }
}

export async function endOfflineSession(sessionToken: string): Promise<{ success: boolean }> {
  await adminRun(
    "UPDATE offline_sessions SET status = 'ended' WHERE session_token = $1",
    [sessionToken]
  );
  return { success: true };
}

export async function getOfflineSessionsForLicense(licenseKey: string) {
  return adminQuery(
    'SELECT * FROM offline_sessions WHERE license_key = $1 ORDER BY created_at DESC',
    [licenseKey]
  );
}

export async function getActiveOfflineClients() {
  return adminQuery(
    `SELECT os.*, c.company_name, c.email, c.database_name, c.is_active as client_active
     FROM offline_sessions os
     LEFT JOIN admin_clients c ON os.client_id = c.id
     WHERE os.status = 'active'
     ORDER BY os.last_heartbeat DESC NULLS LAST`
  );
}
