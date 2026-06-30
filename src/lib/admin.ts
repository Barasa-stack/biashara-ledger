import crypto from 'crypto';
import { adminQuery, adminGet, adminRun } from './db';
import { getSessionFromCookies } from './auth-server';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'digitalbaroz@gmail.com';

export async function adminGuard() {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
    }
    if ((session as any).email !== ADMIN_EMAIL && (session as any).role !== 'super_admin') {
      return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null };
    }
    return { error: null, session: session as any };
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null };
  }
}

export async function createClientDatabase(email: string, companyName: string, maxUsers = 5) {
  const licenseKey = generateLicenseKey(email);
  const databaseName = `tenant_${crypto.randomUUID().replace(/-/g, '')}`;

  const result = await adminQuery(
    `INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, trial_start_date, trial_end_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days')
     RETURNING id, company_name, email, database_name, license_key, trial_end_date`,
    [companyName, email, databaseName, licenseKey, maxUsers]
  );

  const client = result[0];

  await adminRun(
    `INSERT INTO admin_license_keys (license_key, client_id, expires_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '1 year')
     ON CONFLICT (license_key) DO NOTHING`,
    [licenseKey, client.id]
  );

  return client;
}

export async function dropClientSchema(_schemaName: string) {
  // No-op: all data is in public schema
}

export function generateLicenseKey(email: string): string {
  const uuid = crypto.randomUUID();
  const hmac = crypto.createHmac('sha256', process.env.LICENSE_SECRET || 'biashara-ledger-secret');
  hmac.update(email + uuid);
  const signature = hmac.digest('hex').substring(0, 8);
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
