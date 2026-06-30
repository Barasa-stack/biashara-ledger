import { NextResponse } from 'next/server';
import { adminQuery } from '@/lib/db';
import { adminGuard } from '@/lib/admin';

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  try {
    const users = await adminQuery(`
      SELECT
        c.id, c.company_name, c.email, c.is_active,
        c.trial_start_date, c.trial_end_date, c.created_at,
        l.license_key, l.is_active as license_active,
        l.activated_at, l.expires_at,
        COALESCE(ea.activity_count, 0) as activity_count,
        ea.last_active
      FROM admin_clients c
      LEFT JOIN admin_license_keys l ON l.client_id = c.id
      LEFT JOIN (
        SELECT license_key, COUNT(*) as activity_count, MAX(created_at) as last_active
        FROM electron_activity GROUP BY license_key
      ) ea ON ea.license_key = l.license_key
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
