import crypto from 'crypto';
import { adminQuery, adminGet, adminRun, withoutTenantContext } from './db';
import { getSessionFromCookies } from './auth-server';
import { NextResponse } from 'next/server';

export async function adminGuard() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
    }
    if (session.role !== 'super_admin') {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
    }
    return { error: null, session };
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
}

export async function createClientDatabase(email: string, companyName: string, maxUsers = 5, plan = 'premium', passwordHash?: string) {
  return withoutTenantContext(async () => {
    const licenseKey = generateLicenseKey(email);
    const databaseName = `tenant_${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const clientResult = await adminQuery(
      `INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, trial_start_date, trial_end_date, expires_at, is_active, is_trial)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days', $6::timestamptz, true, false)
       RETURNING id, company_name, email, license_key`,
      [companyName, email, databaseName, licenseKey, maxUsers, expiresAt]
    );
    const client = clientResult[0];

    await adminRun(
      `INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [client.id, companyName]
    );

    await adminRun(
      `INSERT INTO users (tenant_id, email, password_hash, role, verified, subscription_plan, subscription_status, subscription_expiry, license_status, trial_used)
       VALUES ($1, $2, $3, 'admin', 1, $4, 'active', $5, 'active', 1)
       ON CONFLICT (tenant_id, email) DO UPDATE SET
         subscription_plan = EXCLUDED.subscription_plan,
         subscription_status = EXCLUDED.subscription_status,
         subscription_expiry = EXCLUDED.subscription_expiry,
         license_status = EXCLUDED.license_status,
         password_hash = EXCLUDED.password_hash`,
      [client.id, email, passwordHash, plan, expiresAt]
    );

    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, expires_at, is_active)
       VALUES ($1, $2, $3::timestamptz, true)
       ON CONFLICT (license_key) DO NOTHING`,
      [licenseKey, client.id, expiresAt]
    );

    return client;
  });
}

export async function dropClientSchema(_schemaName: string) {
  // No-op: all data is in public schema
}

export function generateLicenseKey(email: string): string {
  const uuid = crypto.randomUUID();
  const secret = process.env.LICENSE_SECRET;
  if (!secret) throw new Error('LICENSE_SECRET environment variable is not set');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(email + uuid);
  const signature = hmac.digest('hex').substring(0, 16);
  const year = new Date().getFullYear();
  return `BL-${year}-${uuid.substring(0, 8)}-${signature}`;
}

export async function validateLicenseKey(licenseKey: string) {
  const result = await adminQuery(
    `SELECT l.*, c.company_name, c.email, c.max_users
     FROM admin_license_keys l
     JOIN admin_clients c ON l.client_id = c.id
     WHERE l.license_key = $1 AND l.is_used = false AND l.expires_at > CURRENT_TIMESTAMP AND c.is_active = true`,
    [licenseKey]
  );

  if (result.length === 0) {
    return { valid: false, error: 'Invalid or expired license key' };
  }

  return { valid: true, client: result[0] };
}

export async function activateSelfRegisteredUser(userId: string, maxUsers = 5) {
  return withoutTenantContext(async () => {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const user = await adminGet(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (!user) return { error: 'User not found' };

    const licenseKey = generateLicenseKey(user.email);

    await adminRun(
      `UPDATE users SET subscription_plan = 'premium', subscription_status = 'active', subscription_expiry = $1, license_status = 'active'
       WHERE id = $2`,
      [expiresAt, userId]
    );

    await adminRun(
      `INSERT INTO admin_license_keys (license_key, client_id, expires_at, is_active)
       VALUES ($1, $2, $3::timestamptz, true)
       ON CONFLICT (license_key) DO NOTHING`,
      [licenseKey, user.tenant_id, expiresAt]
    );

    const updated = await adminGet(
      `SELECT u.*, t.name as company_name FROM users u JOIN tenants t ON t.id = u.tenant_id WHERE u.id = $1`,
      [userId]
    );

    return { client: updated, licenseKey };
  });
}
