import { NextResponse } from 'next/server';
import { adminQuery, adminGet, adminRun } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const licenses = await adminQuery(`
      SELECT
        l.id, l.license_key, l.client_id, l.plan, l.is_used, l.is_active,
        l.hardware_fingerprint,
        l.activated_at, l.expires_at, l.created_at,
        c.company_name, c.email, c.database_name,
        COALESCE(a.activation_count, 0) as activation_count,
        (SELECT COUNT(*) FROM offline_sessions os WHERE os.license_key = l.license_key AND os.status = 'active') as active_sessions,
        (SELECT created_at FROM offline_sessions os WHERE os.license_key = l.license_key ORDER BY os.last_heartbeat DESC NULLS LAST LIMIT 1) as last_seen
      FROM admin_license_keys l
      LEFT JOIN admin_clients c ON l.client_id = c.id
      LEFT JOIN (SELECT license_key, COUNT(*) as activation_count FROM license_activations GROUP BY license_key) a ON l.license_key = a.license_key
      UNION ALL
      SELECT
        NULL as id, c.license_key as license_key, c.id as client_id, NULL::varchar as plan, NULL::boolean as is_used, true as is_active,
        NULL as hardware_fingerprint,
        c.expires_at as activated_at, c.expires_at as expires_at, c.created_at as created_at,
        c.company_name, c.email, c.database_name,
        0 as activation_count, 0 as active_sessions, NULL as last_seen
      FROM admin_clients c
      WHERE c.license_key IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM admin_license_keys lk WHERE lk.license_key = c.license_key)
    `);
    return NextResponse.json(licenses);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const { licenseKey, clientId, action } = await request.json();

    if (!licenseKey || !action) {
      return NextResponse.json({ error: 'License key and action are required' }, { status: 400 });
    }

    if (action === 'revoke') {
      await adminRun(
        'UPDATE admin_license_keys SET is_active = false WHERE license_key = $1',
        [licenseKey]
      );
      await adminRun(
        "UPDATE offline_sessions SET status = 'revoked' WHERE license_key = $1 AND status = 'active'",
        [licenseKey]
      );
      return NextResponse.json({ success: true, message: 'License revoked' });
    }

    if (action === 'reactivate') {
      await adminRun(
        'UPDATE admin_license_keys SET is_active = true WHERE license_key = $1',
        [licenseKey]
      );
      return NextResponse.json({ success: true, message: 'License reactivated' });
    }

    if (action === 'extend') {
      const { days } = await request.json();
      const daysNum = Math.min(Math.max(parseInt(days) || 365, 1), 3650);
      await adminRun(
        'UPDATE admin_license_keys SET expires_at = COALESCE(expires_at, CURRENT_TIMESTAMP) + $1::interval WHERE license_key = $2',
        [`${daysNum} days`, licenseKey]
      );
      return NextResponse.json({ success: true, message: `License extended by ${daysNum} days` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'License action failed' }, { status: 500 });
  }
}
