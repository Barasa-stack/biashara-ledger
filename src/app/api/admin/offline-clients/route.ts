import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const clients = await adminQuery(`
      SELECT
        os.id, os.license_key, os.session_token, os.hardware_fingerprint,
        os.user_email, os.status, os.activated_at, os.expires_at,
        os.last_heartbeat, os.last_ip, os.last_sync,
        c.company_name, c.email as client_email, c.database_name,
        CASE
          WHEN os.expires_at <= NOW() THEN 'expired'
          WHEN os.expires_at <= NOW() + INTERVAL '24 hours' THEN 'expiring'
          ELSE 'active'
        END as session_status,
        CASE
          WHEN os.last_heartbeat IS NULL THEN 'never'
          WHEN os.last_heartbeat >= NOW() - INTERVAL '30 minutes' THEN 'online'
          WHEN os.last_heartbeat >= NOW() - INTERVAL '2 hours' THEN 'recent'
          ELSE 'offline'
        END as online_status,
        EXTRACT(EPOCH FROM (os.expires_at - NOW()))/86400 as days_remaining
      FROM offline_sessions os
      LEFT JOIN admin_clients c ON os.client_id = c.id
      ORDER BY os.last_heartbeat DESC NULLS LAST
    `);
    return NextResponse.json(clients);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch offline clients' }, { status: 500 });
  }
}
